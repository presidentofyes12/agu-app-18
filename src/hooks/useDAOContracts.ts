// src/hooks/useDAOContracts.ts

import { useEffect, useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { ethers } from 'ethers';
import {
  contractInstancesAtom,
  providerAtom,
  signerAtom,
  contractConnectionAtom,
  proposalCacheAtom,
  memberCacheAtom,
  activeProposalsAtom,
  activeMembersAtom,
  tokenDistributionAtom,
  syncStatusAtom,
  loadingStatesAtom,
  contractErrorsAtom
} from '../state/contractState';

import { ContractReceipt, BigNumber } from 'ethers'; // ContractTransaction
import { ContractTransaction } from '@ethersproject/contracts';

import {
  Proposal,
  Member,
  Vote,
  TokenDistribution,
  ProposalState,
  ContractInstances,
  Address,
  IDAOToken,
  ILogicConstituent,
  IStateConstituent,
  IViewConstituent
} from '../types/contracts';

// Import contract ABIs
import DAOTokenABI from '../abi/DAOToken.json';
import LogicConstituentABI from '../abi/LogicConstituent.json';
import StateConstituentABI from '../abi/StateConstituent.json';
import ViewConstituentABI from '../abi/ViewConstituent.json';

// Define contract addresses
const CONTRACT_ADDRESSES = {
  DAO_TOKEN: '0x972Dc127cD4bbAfC87f885a554d8208113d768C6',
  LOGIC_CONSTITUENT: '0x5215bcD28f7A54E11F5A0ca3A687a679Ff69FeCC',
  STATE_CONSTITUENT: '0x98f345C539f67e8D6D5B7ceD4048b4Ee99307910',
  VIEW_CONSTITUENT: '0x8A2F613a31d6FdB9EEA3b6e6DD45959d832224FD'
};

export function useDAOContracts() {
  // Get atoms for state management
  const [contractInstances, setContractInstances] = useAtom(contractInstancesAtom);
  const [provider] = useAtom(providerAtom);
  const [signer] = useAtom(signerAtom);
  const [connectionState, setConnectionState] = useAtom(contractConnectionAtom);
  const [proposalCache, setProposalCache] = useAtom(proposalCacheAtom);
  const [memberCache, setMemberCache] = useAtom(memberCacheAtom);
  const [activeProposals, setActiveProposals] = useAtom(activeProposalsAtom);
  const [activeMembers, setActiveMembers] = useAtom(activeMembersAtom);
  const [tokenDistribution, setTokenDistribution] = useAtom(tokenDistributionAtom);
  const [syncStatus, setSyncStatus] = useAtom(syncStatusAtom);
  const [loadingStates, setLoadingStates] = useAtom(loadingStatesAtom);
  const [errors, setErrors] = useAtom(contractErrorsAtom);

  // Initialize contract instances
const initializeContracts = useCallback(async () => {
  if (!provider || !signer) {
    throw new Error('Provider or signer not available');
  }

  try {
    setLoadingStates(prev => ({ ...prev, initialization: true }));

    // Get network information first
    const network = await provider.getNetwork();
    const chainId = network.chainId;

/*
      daoToken: ethers.Contract.from(
        CONTRACT_ADDRESSES.DAO_TOKEN,
        DAOTokenABI,
        signer
      ) as ethers.Contract & IDAOToken,
*/

    const instances: ContractInstances = {
        daoToken: new ethers.Contract(
          CONTRACT_ADDRESSES.DAO_TOKEN,
          DAOTokenABI,
          signer
        ),
        logicConstituent: new ethers.Contract(
          CONTRACT_ADDRESSES.LOGIC_CONSTITUENT,
          LogicConstituentABI,
          signer
        ),
        stateConstituent: new ethers.Contract(
          CONTRACT_ADDRESSES.STATE_CONSTITUENT,
          StateConstituentABI,
          signer
        ) as unknown as IStateConstituent,
        viewConstituent: new ethers.Contract(
          CONTRACT_ADDRESSES.VIEW_CONSTITUENT,
          ViewConstituentABI,
          signer
        ) as unknown as IViewConstituent
      };

    setContractInstances(instances);
    setConnectionState(prev => ({
      ...prev,
      isConnected: true,
      chainId // Now chainId is properly defined
    }));

      // Set up event listeners
      setupEventListeners(instances);

      return instances;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        initialization: error as Error
      }));
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, initialization: false }));
    }
  }, [provider, signer]);

  // Set up event listeners for contract events
  const setupEventListeners = useCallback((instances: ContractInstances) => {
    // Listen for proposal events
    instances.stateConstituent.on('ProposalCreated', async (proposalId: BigNumber, creator: string) => {
      const proposal = await fetchProposal(proposalId.toString());
      if (proposal) {
        setActiveProposals(prev => [...prev, proposal]);
      }
    });

    // Listen for vote events
    instances.stateConstituent.on('VoteCast', async (proposalId: BigNumber, voter: string, support: boolean) => {
      const proposal = await fetchProposal(proposalId.toString());
      if (proposal) {
        setActiveProposals(prev => 
          prev.map(p => p.id === proposalId.toString() ? proposal : p)
        );
      }
    });

    // Listen for token distribution updates
    instances.daoToken.on('DailyAllocationUpdated', async (allocation: BigNumber) => {
      await syncTokenDistribution();
    });
  }, []);

  // Fetch proposal data from contracts
  const fetchProposal = async (proposalId: string): Promise<Proposal | null> => {
    if (!contractInstances) return null;

  try {
    setLoadingStates(prev => ({ ...prev, [`proposal-${proposalId}`]: true }));

    // Check cache first
    const cached = proposalCache[proposalId];
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }

    // Fetch from contract - now we know this returns ProposalData
    const proposalData = await contractInstances.stateConstituent.getProposal(proposalId);

    const createdAtValue = proposalData.createdAt instanceof BigNumber ? 
      proposalData.createdAt.toNumber() : 
      proposalData.createdAt;

    const proposal: Proposal = {
      id: proposalId,
      creator: proposalData.creator,
      title: proposalData.title,
      description: proposalData.description,
      category: proposalData.category,
      // Convert BigNumber to number for frontend use
      createdAt: proposalData.createdAt.toNumber(),
      startEpoch: proposalData.startEpoch,
      endEpoch: proposalData.endEpoch,
      executionDelay: proposalData.executionDelay,
      currentState: proposalData.currentState,
      forVotes: proposalData.forVotes,
      againstVotes: proposalData.againstVotes,
      quorum: proposalData.quorum
    };

    /*const proposal: Proposal = {
      id: proposalId,
      creator: proposalData.creator,
      title: proposalData.title,
      description: proposalData.description,
      category: proposalData.category,
      createdAt: createdAtValue,
      startEpoch: proposalData.startEpoch,
      endEpoch: proposalData.endEpoch,
      executionDelay: proposalData.executionDelay,
      currentState: proposalData.currentState || proposalData.state || ProposalState.PENDING_SUBMISSION,
      forVotes: proposalData.forVotes,
      againstVotes: proposalData.againstVotes,
      quorum: proposalData.quorum
    };*/

    // Update cache
    setProposalCache(prev => ({
      ...prev,
      [proposalId]: {
        data: proposal,
        timestamp: Date.now()
      }
    }));

    return proposal;
  } catch (error) {
    setErrors(prev => ({
      ...prev,
      [`proposal-${proposalId}`]: error as Error
    }));
    return null;
  } finally {
    setLoadingStates(prev => ({ ...prev, [`proposal-${proposalId}`]: false }));
  }
};

  // Sync token distribution data
  const syncTokenDistribution = async () => {
    if (!contractInstances) return;

    try {
      setLoadingStates(prev => ({ ...prev, tokenDistribution: true }));

      const distribution = await Promise.all([
        contractInstances.daoToken.dailyAllocation(),
        contractInstances.daoToken.treasuryBalance(),
        contractInstances.daoToken.lastDailyPrice(),
        contractInstances.daoToken.currentDailyPrice()
      ]);

      setTokenDistribution({
        dailyAllocation: distribution[0],
        treasuryBalance: distribution[1],
        lastDailyPrice: distribution[2],
        currentDailyPrice: distribution[3]
      });
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        tokenDistribution: error as Error
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, tokenDistribution: false }));
    }
  };

  // Vote on a proposal
const castVote = async (proposalId: string, support: boolean): Promise<void> => {
  if (!contractInstances) throw new Error('Contracts not initialized');

  try {
    setLoadingStates(prev => ({ ...prev, [`vote-${proposalId}`]: true }));

    // We now know this returns ContractTransaction
    const tx = await contractInstances.stateConstituent.castVote(proposalId, support);
    await tx.wait();

    // Refresh proposal data
    await fetchProposal(proposalId);
  } catch (error) {
    setErrors(prev => ({
      ...prev,
      [`vote-${proposalId}`]: error as Error
    }));
    throw error;
  } finally {
    setLoadingStates(prev => ({ ...prev, [`vote-${proposalId}`]: false }));
  }
};

  // Create a new proposal
const createProposal = async (
  title: string,
  description: string,
  category: number
): Promise<string> => {
  if (!contractInstances) throw new Error('Contracts not initialized');

  try {
    setLoadingStates(prev => ({ ...prev, createProposal: true }));

    // We now know this returns ContractTransaction
    const tx = await contractInstances.stateConstituent.createProposal(
      title,
      description,
      category
    );
    
    const receipt = await tx.wait();

    // Get proposal ID from event
    //const event = receipt.events?.find(e => e.event === 'ProposalCreated');
    const event = receipt.events?.find((e: ethers.Event) => e.event === 'ProposalCreated');
    const proposalId = event?.args?.proposalId.toString();

    if (!proposalId) throw new Error('Failed to get proposal ID');

    // Fetch and cache the new proposal
    await fetchProposal(proposalId);

    return proposalId;
  } catch (error) {
    setErrors(prev => ({
      ...prev,
      createProposal: error as Error
    }));
    throw error;
  } finally {
    setLoadingStates(prev => ({ ...prev, createProposal: false }));
  }
};

  // Initialize contracts when provider and signer are available
  useEffect(() => {
    if (provider && signer && !contractInstances) {
      initializeContracts().catch(console.error);
    }
  }, [provider, signer, contractInstances]);

  // Return the hook's interface
  return {
    // Contract instances
    contracts: contractInstances,
    
    // State
    isConnected: connectionState.isConnected,
    chainId: connectionState.chainId,
    loading: loadingStates,
    errors,
    
    // Data
    activeProposals,
    tokenDistribution,
    
    // Actions
    createProposal,
    castVote,
    fetchProposal,
    syncTokenDistribution,
    
    // Initialization
    initializeContracts
  };
}
