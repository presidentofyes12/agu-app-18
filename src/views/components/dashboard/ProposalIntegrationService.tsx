// src/views/components/dashboard/ProposalIntegrationService.tsx

import React, { useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { 
    Address,
    Proposal,
    ProposalData,
    ContractInstances,
    IStateConstituent,
    IDAOToken,
    ILogicConstituent,
    IViewConstituent,
    ProposalState
} from 'types/contracts';
import { ContractService, StateContractFunctions, DAOTokenFunctions } from './contractService';

// Interface for the legacy Raven service
interface RavenService {
  fetchAllProposal(): Promise<LegacyProposal[]>;
  createChannel(proposal: LegacyProposalInput): Promise<any>;
  findChannel(id: string): Promise<Channel>;
  sendDirectMessage(channelId: string, content: string): Promise<void>;
  getChannelMessages(channelId: string): Promise<Message[]>;
}

// Legacy types that need to be maintained for backwards compatibility
interface LegacyProposal {
    id: string;
    content: string;
    created_at: number;
    category?: number;
    isPermanent?: boolean;  // New field to track permanent proposals
}

interface LegacyProposalInput {
    name: string;
    about: string;
    picture: string;
    isPermanent?: boolean;  // New field to track permanent proposals
}

interface Channel {
    id: string;
    name: string;
}

interface Message {
    id: string;
    content: string;
    timestamp: number;
}

// Extend ContractService to include Raven
interface ContractServiceWithRaven extends Omit<ContractService, 'contracts' | 'raven'> {
    raven?: RavenService & { updateReadMarkMap: () => void };
    contracts: {
        stateConstituent: ethers.Contract & IStateConstituent;
        daoToken: ethers.Contract & IDAOToken;
        logicConstituent: ethers.Contract & ILogicConstituent;
        viewConstituent?: ethers.Contract & IViewConstituent;
    };
}

interface ProposalBasicInfo {
  startEpoch: BigNumber;
  endEpoch: BigNumber;
  isCanceled: boolean;
  executed: boolean;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  stage: number;
  proposerReputation: BigNumber;
}

export class ProposalIntegrationService {
    private contractService: ContractServiceWithRaven;
    private stateConstituent: IStateConstituent;

    constructor(contractService: ContractService) {
        // Verify that the contract service has all required constituents
        if (!this.verifyContractService(contractService)) {
            throw new Error('Contract service missing required constituents');
        }

        // Now we can safely cast
        this.contractService = contractService as ContractServiceWithRaven;
        this.stateConstituent = this.contractService.contracts.stateConstituent;
    }

    private verifyContractService(service: ContractService): boolean {
        const contracts = service.contracts;
        if (!contracts) return false;

        return !!(
            contracts.stateConstituent &&
            contracts.daoToken &&
            contracts.logicConstituent
        );
    }

    // Enhanced conversion to handle permanent proposals
    private convertLegacyProposal(legacy: LegacyProposal): Proposal {
        try {
            const parsedContent = JSON.parse(legacy.content);
            const about = JSON.parse(parsedContent.about);

            // Determine voting period based on permanent status
            const votingPeriod = legacy.isPermanent ? 
                BigNumber.from(365 * 24 * 60 * 60) :  // 1 year for permanent
                BigNumber.from(7 * 24 * 60 * 60);     // 1 week for regular

            return {
                id: legacy.id,
                creator: about.proposalID || legacy.id,
                title: parsedContent.name,
                description: about.problem || '',
                category: legacy.category || 0,
                createdAt: legacy.created_at,
                startEpoch: BigNumber.from(legacy.created_at),
                endEpoch: BigNumber.from(legacy.created_at).add(votingPeriod),
                executionDelay: BigNumber.from(0),
                currentState: ProposalState.ACTIVE,
                forVotes: BigNumber.from(0),
                againstVotes: BigNumber.from(0),
                quorum: BigNumber.from(0),
                isPermanent: legacy.isPermanent || false
            };
        } catch (error) {
            console.error('Error converting legacy proposal:', error);
            throw error;
        }
    }

private async getOnChainProposal(id: string): Promise<Proposal> {
    try {
        // Get the basic info from the contract - this returns a struct, not a tuple
        const proposalData: ProposalBasicInfo = await this.stateConstituent.getProposalBasicInfo(id);
        
        // Initialize default title and description
        let title = `Proposal ${id}`;
        let description = '';
        
        // Try to get metadata from Raven
        if (this.contractService.raven) {
            try {
                const channel = await this.contractService.raven.findChannel(id);
                if (channel) {
                    const content = JSON.parse(channel.name);
                    const about = JSON.parse(content.about);
                    title = content.name || title;
                    description = about.problem || description;
                }
            } catch (error) {
                console.warn(`Could not fetch metadata for proposal ${id}:`, error);
            }
        }

        // Create the proposal object using the struct fields directly
        return {
            id,
            creator: '', // We don't get this in basic info
            title,
            description,
            category: 0, // Not included in basic info
            createdAt: proposalData.startEpoch.toNumber(),
            startEpoch: proposalData.startEpoch,
            endEpoch: proposalData.endEpoch,
            executionDelay: BigNumber.from(0),
            currentState: this.determineState({
                isCanceled: proposalData.isCanceled,
                executed: proposalData.executed,
                startEpoch: proposalData.startEpoch,
                endEpoch: proposalData.endEpoch
            }),
            forVotes: proposalData.forVotes,
            againstVotes: proposalData.againstVotes,
            quorum: BigNumber.from(0)
        };
    } catch (error) {
        console.error(`Error getting proposal ${id}:`, error);
        // Log the full error for debugging
        /*console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });*/
        console.error('Detailed error:', error);
        throw error;
    }
}

private determineState(data: {
    isCanceled: boolean;
    executed: boolean;
    startEpoch: ethers.BigNumber;
    endEpoch: ethers.BigNumber;
}): ProposalState {
    if (data.isCanceled) return ProposalState.CANCELED;
    if (data.executed) return ProposalState.EXECUTED;
    
    const now = Math.floor(Date.now() / 1000);
    const start = data.startEpoch.toNumber();
    const end = data.endEpoch.toNumber();

    if (now < start) return ProposalState.PENDING;
    if (now > end) return ProposalState.SUCCEEDED;
    return ProposalState.ACTIVE;
}

  /*private convertProposalData(data: ProposalData, id: string): Proposal {
    return {
      id,
      creator: data.creator,
      title: data.title,
      description: data.description,
      category: data.category,
      createdAt: data.createdAt.toNumber(),
      startEpoch: data.startEpoch,
      endEpoch: data.endEpoch,
      executionDelay: data.executionDelay,
      currentState: data.currentState,
      forVotes: data.forVotes,
      againstVotes: data.againstVotes,
      quorum: data.quorum
    };
  }*/

/*private convertProposalData(data: ProposalBasicInfo, id: string): Proposal {
  return {
    id,
    creator: '', // We don't have this in BasicInfo
    title: '', // We don't have this in BasicInfo
    description: '', // We don't have this in BasicInfo
    category: 0, // We don't have this in BasicInfo
    createdAt: data.startEpoch.toNumber(), // Use startEpoch as creation time
    startEpoch: data.startEpoch,
    endEpoch: data.endEpoch,
    executionDelay: BigNumber.from(0), // Default since not in BasicInfo
    currentState: this.determineState(data),
    forVotes: data.forVotes,
    againstVotes: data.againstVotes,
    quorum: BigNumber.from(0) // Default since not in BasicInfo
  };
}

// Helper function to determine proposal state
private determineState(data: ProposalBasicInfo): ProposalState {
  if (data.isCanceled) return ProposalState.CANCELED;
  if (data.executed) return ProposalState.EXECUTED;
  // Add more state determination logic as needed
  return ProposalState.ACTIVE;
}*/

private convertProposalData(data: any, id: string, title: string, description: string): Proposal {
    // Let's first log what we're receiving to understand the structure
    console.log('Raw proposal data:', data);

    // If data is an array (tuple), destructure it properly
    const [
        startEpoch,
        endEpoch,
        isCanceled,
        executed,
        forVotes,
        againstVotes,
        stage,
        proposerReputation
    ] = Array.isArray(data) ? data : [
        data.startEpoch,
        data.endEpoch,
        data.isCanceled,
        data.executed,
        data.forVotes,
        data.againstVotes,
        data.stage,
        data.proposerReputation
    ];

    return {
        id,
        creator: '', // We can't get this from basic info
        title,
        description,
        category: 0, // This could also be stored in Nostr
        createdAt: Number(startEpoch) || 0,
        startEpoch: BigNumber.from(startEpoch || 0),
        endEpoch: BigNumber.from(endEpoch || 0),
        executionDelay: BigNumber.from(0),
        currentState: this.determineState({
            isCanceled,
            executed,
            startEpoch,
            endEpoch
        }),
        forVotes: BigNumber.from(forVotes || 0),
        againstVotes: BigNumber.from(againstVotes || 0),
        quorum: BigNumber.from(0)
    };
}

/*private determineState(data: {
    isCanceled: boolean,
    executed: boolean,
    startEpoch: any,
    endEpoch: any
}): ProposalState {
    if (data.isCanceled) return ProposalState.CANCELED;
    if (data.executed) return ProposalState.EXECUTED;
    
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const start = Number(data.startEpoch) || 0;
    const end = Number(data.endEpoch) || 0;

    if (now < start) return ProposalState.PENDING;
    if (now > end) return ProposalState.SUCCEEDED;
    return ProposalState.ACTIVE;
}*/

    // Enhanced method to get all proposals
    async getAllProposals(): Promise<Proposal[]> {
        try {
            if (!this.contractService || !this.stateConstituent) {
                throw new Error('Contract service not properly initialized');
            }

            // Get legacy proposals
            const legacyProposals = await this.contractService.raven?.fetchAllProposal() || [];
            
            // Try to get on-chain count, default to 0 if it fails
            let onChainCount = BigNumber.from(0);
            try {
                onChainCount = await this.stateConstituent.proposalCount();
            } catch (error) {
                console.warn('Failed to get on-chain proposal count:', error);
            }

            // Convert legacy proposals with permanent status check
            const convertedLegacyProposals = legacyProposals.map(p => {
                // Check if this is a permanent proposal by name
                const parsedContent = JSON.parse(p.content);
                const isPermanent = this.isPermanentProposal(parsedContent.name);
                return this.convertLegacyProposal({
                    ...p,
                    isPermanent
                });
            });

            // Get on-chain proposals
            const onChainProposals = await Promise.all(
                Array.from({ length: onChainCount.toNumber() }, 
                    (_, i) => this.getOnChainProposal(i.toString())
                )
            );

            // Combine and deduplicate proposals
            return [...convertedLegacyProposals, ...onChainProposals]
                .filter((proposal, index, self) => 
                    index === self.findIndex(p => p.id === proposal.id)
                );

        } catch (error) {
            console.error('Error fetching proposals:', error);
            throw error;
        }
    }

    // Helper to identify permanent proposals
    private isPermanentProposal(name: string): boolean {
        const permanentProposals = [
            'Mostr',
            'Ephemeral Relays',
            'Public and private AI profiles for version control',
            'Marketplace',
            'Smart contract',
            'NewLaw/Everyone is right/Force for peace',
            'Withdrawal Rights/Disclaimer/ Privacy standards',
            'Embedded application',
            'Multi ID system',
            "If you don't rate, you can't be rated",
            'Privacy, scalability, security, transparency, decentralization, and identification',
            'Autotranslate'
        ];
        return permanentProposals.includes(name);
    }

    // Enhanced create proposal method
    async createProposal(proposal: {
        title: string;
        description: string;
        category: number;
        votingPeriod: number;
        isPermanent?: boolean;
    }): Promise<string> {
        try {
            // Create proposal in DAO system
            const tx = await this.stateConstituent.createProposal(
                proposal.title,
                proposal.description,
                proposal.category
            );
            const receipt = await tx.wait();
            
            const event = receipt.events?.find(e => e.event === 'ProposalCreated');
            const proposalId = event?.args?.proposalId.toString();

            if (!proposalId) {
                throw new Error('Failed to get proposal ID from transaction');
            }

            // Create in legacy system if available
            if (this.contractService.raven) {
                const legacyProposal: LegacyProposalInput = {
                    name: proposal.title,
                    about: JSON.stringify({
                        problem: proposal.description,
                        proposalID: proposalId,
                        solution: '',
                        targetAudience: '',
                        qualifications: '',
                        purpose: proposal.description,
                        approach: '',
                        outcome: '',
                        timeline: proposal.isPermanent ? 'Permanent' : `${proposal.votingPeriod} days`,
                        budget: '',
                        callToAction: '',
                        voting: [],
                        category: proposal.category
                    }),
                    picture: '',
                    isPermanent: proposal.isPermanent
                };

                await this.contractService.raven.createChannel(legacyProposal);
            }

            return proposalId;

        } catch (error) {
            console.error('Error creating proposal:', error);
            throw error;
        }
    }

  async updateProposalNostrHash(proposalId: string, nostrHash: string): Promise<void> {
    try {
      // Update the proposal's Nostr hash in the contract
      const tx = await this.stateConstituent.updateProposalNostrHash(proposalId, nostrHash);
      await tx.wait();

      // Update in legacy system if available
      if (this.contractService.raven) {
        const channel = await this.contractService.raven.findChannel(proposalId);
        if (channel) {
          await this.contractService.raven.sendDirectMessage(
            channel.id,
            `NOSTR_HASH:${nostrHash}`
          );
        }
      }
    } catch (error) {
      console.error('Error updating Nostr hash:', error);
      throw error;
    }
  }

  async castVote(
    proposalId: string,
    support: boolean,
    votingPower: BigNumber
  ): Promise<void> {
    try {
      // Cast vote in DAO system
      await this.stateConstituent.castVote(proposalId, support);

      // Cast vote in legacy system if available
      if (this.contractService.raven) {
        const channel = await this.contractService.raven.findChannel(proposalId);
        if (channel) {
          await this.contractService.raven.sendDirectMessage(
            channel.id,
            support ? 'VOTE_FOR' : 'VOTE_AGAINST'
          );
        }
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  async getProposalVotes(proposalId: string): Promise<{
    forVotes: BigNumber;
    againstVotes: BigNumber;
  }> {
    try {
      // Get votes from both systems in parallel
      const [onChainProposal, legacyVotes] = await Promise.all([
        this.stateConstituent.getProposalBasicInfo(proposalId)
          .catch(() => ({ 
            forVotes: BigNumber.from(0), 
            againstVotes: BigNumber.from(0) 
          })),
        this.getLegacyVotes(proposalId)
      ]);

      return {
        forVotes: onChainProposal.forVotes.add(legacyVotes.forVotes),
        againstVotes: onChainProposal.againstVotes.add(legacyVotes.againstVotes)
      };
    } catch (error) {
      console.error('Error getting proposal votes:', error);
      return {
        forVotes: BigNumber.from(0),
        againstVotes: BigNumber.from(0)
      };
    }
  }

  private async getLegacyVotes(proposalId: string): Promise<{
    forVotes: BigNumber;
    againstVotes: BigNumber;
  }> {
    if (!this.contractService.raven) {
      return {
        forVotes: BigNumber.from(0),
        againstVotes: BigNumber.from(0)
      };
    }

    try {
      const messages = await this.contractService.raven.getChannelMessages(proposalId);
      
      let forVotes = BigNumber.from(0);
      let againstVotes = BigNumber.from(0);

      messages.forEach((msg: Message) => {
        if (msg.content === 'VOTE_FOR') {
          forVotes = forVotes.add(1);
        } else if (msg.content === 'VOTE_AGAINST') {
          againstVotes = againstVotes.add(1);
        }
      });

      return { forVotes, againstVotes };
    } catch (error) {
      console.error('Error getting legacy votes:', error);
      return {
        forVotes: BigNumber.from(0),
        againstVotes: BigNumber.from(0)
      };
    }
  }
}
