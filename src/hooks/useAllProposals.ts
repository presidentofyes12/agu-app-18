import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { ravenAtom } from 'atoms';
import { ethers } from 'ethers';
import { PROPOSAL_TYPES, permVotingPeriod, votingPeriod } from 'util/constant';
import { isTimeRemaining } from 'util/function';

import { ContractService } from '../views/components/dashboard/contractService';
import { ProposalIntegrationService } from '../views/components/dashboard/ProposalIntegrationService';
import { Proposal, ProposalState } from '../types/contracts';


// List of permanent proposals
const permanentProposals = [
  {
    name: 'Mostr',
    about: '{"problem":"Lack of connection between Fediverse and Nostr","solution":"","targetAudience":"","qualifications":"","purpose":"A platform feature enabling dynamic and flexible presentation of content.","approach":"A platform feature enabling dynamic and flexible presentation of content.","outcome":"A platform feature enabling dynamic and flexible presentation of content.","timeline":"","budget":"","callToAction":"","voting":[],"proposalID":""}',
    picture: ''
  },
  // ... other permanent proposals
];

const isPermanentProposal = (name: string) => {
  return permanentProposals.some(p => p.name === name);
};

const proposalExists = (proposals: any[] | undefined, name: string) => {
  return proposals?.some((proposal) => {
    try {
      return JSON.parse(proposal.content).name === name;
    } catch (e) {
      console.error('Failed to parse proposal content:', e);
      return false;
    }
  }) || false;
};

export const useAllProposals = (contractService: ContractService | null) => {
  const [raven] = useAtom(ravenAtom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filterType, setFilterType] = useState(PROPOSAL_TYPES.all);

  useEffect(() => {
    const fetchAllProposals = async () => {
      try {
        setLoading(true);

        // 1. Fetch on-chain proposals
        let onChainProposals: Proposal[] = [];
        if (contractService) {
          const integrationService = new ProposalIntegrationService(contractService);
          onChainProposals = await integrationService.getAllProposals();
        }

        // 2. Fetch Raven proposals
        const ravenProposals = await raven?.fetchAllProposal() || [];
        
        // 3. Create permanent proposals if they don't exist
        const permanentProposalsArray = [];
        for (const proposal of permanentProposals) {
          if (!proposalExists(ravenProposals, proposal.name)) {
            const newProposal = await raven?.createChannel(proposal);
            if (newProposal) permanentProposalsArray.push(newProposal);
          } else {
            const existingProposal = ravenProposals?.find((p) => {
              try {
                return JSON.parse(p.content).name === proposal.name;
              } catch (e) {
                console.error('Failed to parse proposal content:', e);
                return false;
              }
            });
            if (existingProposal) {
              permanentProposalsArray.push(existingProposal);
            }
          }
        }

        // Convert Raven proposals to our Proposal format
        const convertedRavenProposals = ravenProposals.map(p => {
          try {
            const content = JSON.parse(p.content);
            const about = JSON.parse(content.about);
            const isPerm = isPermanentProposal(content.name);
            const votingPeriodLength = isPerm ? permVotingPeriod : votingPeriod;
            const isActive = !isTimeRemaining(p.created_at, votingPeriodLength);

            return {
              id: p.id,
              creator: about.proposalID || p.id,
              title: content.name,
              description: about.problem || '',
              category: (p as any).category || 0,
              createdAt: p.created_at,
              startEpoch: ethers.BigNumber.from(p.created_at),
              endEpoch: ethers.BigNumber.from(p.created_at + votingPeriodLength),
              executionDelay: ethers.BigNumber.from(0),
              currentState: isActive ? ProposalState.ACTIVE : ProposalState.EXPIRED,
              forVotes: ethers.BigNumber.from(0),
              againstVotes: ethers.BigNumber.from(0),
              quorum: ethers.BigNumber.from(0),
              isPermanent: isPerm
            } as Proposal;
          } catch (e) {
            console.error('Error converting Raven proposal:', e);
            return null;
          }
        }).filter((p): p is Proposal => p !== null);

        // Combine all proposals
        const allProposals = [...onChainProposals, ...convertedRavenProposals];

        // Filter based on type
        let filteredProposals = allProposals;
        if (filterType === PROPOSAL_TYPES.active) {
          filteredProposals = allProposals.filter(p => p.currentState === ProposalState.ACTIVE);
        } else if (filterType === PROPOSAL_TYPES.expired) {
          filteredProposals = allProposals.filter(p => p.currentState === ProposalState.EXPIRED);
        }

        setProposals(filteredProposals);
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchAllProposals();
  }, [contractService, raven, filterType]);

  return {
    proposals,
    loading,
    error,
    filterType,
    setFilterType
  };
};
