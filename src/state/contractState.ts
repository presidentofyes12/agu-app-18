// src/state/contractState.ts

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { ethers, BigNumber } from 'ethers';
import {
  Address,
  Proposal,
  Member,
  Vote,
  TokenDistribution,
  Committee,
  ContractInstances,
  ContractEvent
} from 'types/contracts';

import { ProposalState } from '../types/contracts';

// First, we create atoms for the core contract instances. These are the base
// building blocks that will allow us to interact with our smart contracts.
export const contractInstancesAtom = atom<ContractInstances | null>(null);

// We create atoms for provider and signer to handle Web3 connectivity
export const providerAtom = atom<ethers.providers.Provider | null>(null);
export const signerAtom = atom<ethers.Signer | null>(null);

// This atom tracks the connection status to both the blockchain and our contracts
export const contractConnectionAtom = atom<{
  isConnected: boolean;
  chainId: number | null;
  error: Error | null;
}>({
  isConnected: false,
  chainId: null,
  error: null
});

// Update the proposal state comparisons
const getProposalStats = (proposals: Proposal[]) => ({
  total: proposals.length,
  active: proposals.filter(p => p.currentState === ProposalState.ACTIVE).length,
  succeeded: proposals.filter(p => p.currentState === ProposalState.SUCCEEDED).length,
  defeated: proposals.filter(p => p.currentState === ProposalState.DEFEATED).length
});

// We create cache duration constants to help manage state freshness
const CACHE_DURATION = {
  PROPOSALS: 5 * 60 * 1000, // 5 minutes
  MEMBERS: 5 * 60 * 1000,   // 5 minutes
  EVENTS: 1 * 60 * 1000,    // 1 minute
  TOKEN: 30 * 1000          // 30 seconds
};

// We define interfaces for our cached data to ensure type safety
interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface ProposalCache {
  [id: string]: CachedData<Proposal>;
}

interface MemberCache {
  [address: string]: CachedData<Member>;
}

// Create atoms for caching proposal and member data to improve performance
export const proposalCacheAtom = atomWithStorage<ProposalCache>('dao-proposal-cache', {});
export const memberCacheAtom = atomWithStorage<MemberCache>('dao-member-cache', {});

// Create atoms for active state tracking
export const activeProposalsAtom = atom<Proposal[]>([]);
export const activeMembersAtom = atom<Member[]>([]);
export const activeCommitteesAtom = atom<Committee[]>([]);

// Create atoms for token-related state
export const tokenDistributionAtom = atom<TokenDistribution | null>(null);
export const tokenPriceAtom = atom<BigNumber>(BigNumber.from(0));
export const treasuryBalanceAtom = atom<BigNumber>(BigNumber.from(0));

// Create atoms for proposal-related state
export const proposalCountAtom = atom<number>(0);
export const currentEpochAtom = atom<number>(0);

// Create atoms for tracking votes and participation
export const votingPowerAtom = atom<BigNumber>(BigNumber.from(0));
export const participationRateAtom = atom<number>(0);

// Create an atom for event tracking
export const contractEventsAtom = atom<ContractEvent[]>([]);

// Create helper functions for state management
export const contractStateUtils = {
  // Function to check if cached data is still valid
  isCacheValid: (timestamp: number, duration: number): boolean => {
    return Date.now() - timestamp < duration;
  },

  // Function to get cached proposal data
  getCachedProposal: (
    cache: ProposalCache,
    proposalId: string
  ): Proposal | null => {
    const cached = cache[proposalId];
    if (!cached || !contractStateUtils.isCacheValid(cached.timestamp, CACHE_DURATION.PROPOSALS)) {
      return null;
    }
    return cached.data;
  },

  // Function to get cached member data
  getCachedMember: (
    cache: MemberCache,
    address: Address
  ): Member | null => {
    const cached = cache[address];
    if (!cached || !contractStateUtils.isCacheValid(cached.timestamp, CACHE_DURATION.MEMBERS)) {
      return null;
    }
    return cached.data;
  }
};

// Create derived atoms that combine data from multiple sources
export const proposalStatsAtom = atom((get) => {
  const proposals = get(activeProposalsAtom);
  return {
    total: proposals.length,
    active: proposals.filter(p => p.currentState === ProposalState.ACTIVE).length,
    succeeded: proposals.filter(p => p.currentState === ProposalState.SUCCEEDED).length,
    defeated: proposals.filter(p => p.currentState === ProposalState.DEFEATED).length
  };
});

export const memberStatsAtom = atom((get) => {
  const members = get(activeMembersAtom);
  const totalStaked = members.reduce(
    (sum, member) => sum.add(member.stakingBalance),
    BigNumber.from(0)
  );
  
  return {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.isActive).length,
    totalStaked,
    averageReputation: members.reduce((sum, m) => sum + m.reputationScore.toNumber(), 0) / members.length
  };
});

// Create an atom for tracking the synchronization status of our state
export const syncStatusAtom = atom<{
  lastSync: number;
  isSyncing: boolean;
  error: Error | null;
}>({
  lastSync: 0,
  isSyncing: false,
  error: null
});

// Create a utility atom for managing loading states
export const loadingStatesAtom = atom<{
  [key: string]: boolean;
}>({});

// Create an atom for error tracking
export const contractErrorsAtom = atom<{
  [key: string]: Error;
}>({});

// Create derived atoms for filtering and sorting proposals
export const filteredProposalsAtom = atom((get) => {
  const proposals = get(activeProposalsAtom);
  // Helper function to check if a proposal is recent (within last 7 days)
  const isRecent = (timestamp: number) => {
    return Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000;
  };

  return {
    recent: proposals.filter(p => isRecent(p.createdAt)),
    needsAction: proposals.filter(p => p.currentState === ProposalState.ACTIVE),
    completed: proposals.filter(p => 
      p.currentState === ProposalState.EXECUTED || 
      p.currentState === ProposalState.DEFEATED
    )
  };
});

// Create an atom for tracking user-specific state
export const userStateAtom = atom<{
  votingPower: BigNumber;
  proposalsVoted: string[];
  ownProposals: string[];
}>({
  votingPower: BigNumber.from(0),
  proposalsVoted: [],
  ownProposals: []
});

// Export utility functions for state updates
export const getProposalUpdater = (set: (value: any) => void) => ({
  addProposal: (proposal: Proposal) => {
    set((prev: Proposal[]) => [...prev, proposal]);
  },
  updateProposal: (proposalId: string, updates: Partial<Proposal>) => {
    set((prev: Proposal[]) => prev.map(p => 
      p.id === proposalId ? { ...p, ...updates } : p
    ));
  },
  removeProposal: (proposalId: string) => {
    set((prev: Proposal[]) => prev.filter(p => p.id !== proposalId));
  }
});
