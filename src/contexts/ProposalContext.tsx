// src/contexts/ProposalContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { useContractEvents } from 'hooks/useContractEvents';
import { ProposalLifecycleManager, Proposal } from 'services/ProposalLifecycle';
import { ravenAtom } from 'atoms';
import { ethers } from 'ethers';
import { ProposalState } from '../types/contracts';

interface Vote {
  voter: string;
  weight: ethers.BigNumber;
  support: boolean;
}

interface ProposalContextType {
  // Core functionality
  createProposal: (title: string, description: string, category: number, options?: any) => Promise<string>;
  submitProposal: (proposalId: string) => Promise<void>;
  castVote: (proposalId: string, support: boolean, reason?: string) => Promise<void>;
  executeProposal: (proposalId: string) => Promise<void>;
  cancelProposal: (proposalId: string) => Promise<void>;
  
  // Query methods
  getProposal: (proposalId: string) => Proposal | undefined;
  getProposalsByState: (state: ProposalState) => Proposal[];
  getProposalTimeline?: (proposalId: string) => Promise<Array<{
    state: ProposalState;
    timestamp: number;
    txHash?: string;
    metadata?: any;
  }>> | undefined;
  
  // State
  activeProposals: Proposal[];
  pendingProposals: Proposal[];
  completedProposals: Proposal[];
  
  // Status
  loading: boolean;
  error: Error | null;
  
  // Add the address tracking
  voterAddresses: Set<string>;    // Using Set prevents duplicate addresses
  
  // Optional: Add helper methods
  isVoter: (address: string) => boolean;
  
  // Add this new subscription method
  subscribeToProposalEvents: (
    proposalId: string, 
    handlers: {
      onVoteCast?: (event: { voter: string; support: boolean }) => void;
      onStateChange?: (event: { fromState: ProposalState; toState: ProposalState }) => void;
      onDiscussionUpdate?: () => void;
    }
  ) => () => void; // Returns an unsubscribe function
} // getProposalTimeline: (proposalId: string) => Promise<any[]>;

/*

"Core teams" were likely hallucinated by an AI into existence, because they never existed in any contract:

  coreTeamAddresses: Set<string>; // Core team members who can make special proposals
  isCoreTeam: (address: string) => boolean;

*/

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export function ProposalProvider({ children }: { children: React.ReactNode }) {
  const { stateConstituent, daoToken } = useContractEvents(); // raven
  const [raven] = useAtom(ravenAtom);
  const [lifecycleManager, setLifecycleManager] = useState<ProposalLifecycleManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Add state for address tracking
  const [voterAddresses, setVoterAddresses] = useState<Set<string>>(new Set());
  // "Core teams" were likely hallucinated by an AI into existence, because they never existed in any contract:
  // const [coreTeamAddresses, setCoreTeamAddresses] = useState<Set<string>>(new Set());

  // Proposal state
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([]);
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);
  const [completedProposals, setCompletedProposals] = useState<Proposal[]>([]);

  /*useEffect(() => {
    const newVoterAddresses = new Set<string>();
    
    // Add addresses from active proposals
    activeProposals.forEach(proposal => {
      // Add the proposal creator
      newVoterAddresses.add(proposal.creator);
      
      // Get addresses from the voting data
      proposal.forVotes.forEach(vote => newVoterAddresses.add(vote.voter));
      proposal.againstVotes.forEach(vote => newVoterAddresses.add(vote.voter));
    });
    
    // Add addresses from completed proposals too
    completedProposals.forEach(proposal => {
      newVoterAddresses.add(proposal.creator);
      proposal.forVotes.forEach(vote => newVoterAddresses.add(vote.voter));
      proposal.againstVotes.forEach(vote => newVoterAddresses.add(vote.voter));
    });

    setVoterAddresses(newVoterAddresses);
  }, [activeProposals, completedProposals]);*/
  
useEffect(() => {
  const newVoterAddresses = new Set<string>();
  
  // Add addresses from active proposals
  activeProposals.forEach(proposal => {
    // Add the proposal creator
    newVoterAddresses.add(proposal.creator);
    
    // Get addresses from the voting data
    proposal.forVotesList.forEach((vote: Vote) => newVoterAddresses.add(vote.voter));
    proposal.againstVotesList.forEach((vote: Vote) => newVoterAddresses.add(vote.voter));
  });
  
  // Add addresses from completed proposals too
  completedProposals.forEach(proposal => {
    newVoterAddresses.add(proposal.creator);
    proposal.forVotesList.forEach((vote: Vote) => newVoterAddresses.add(vote.voter));
    proposal.againstVotesList.forEach((vote: Vote) => newVoterAddresses.add(vote.voter));
  });

  setVoterAddresses(newVoterAddresses);
}, [activeProposals, completedProposals]);
  
  // "Core teams" were likely hallucinated by an AI into existence, because they never existed in any contract:
  /*
  useEffect(() => {
    // This could fetch from a contract, config, or other source
    const fetchCoreTeamAddresses = async () => {
      if (!stateConstituent) return;
      
      try {
        // Example: fetch from a contract getter
        //const coreMembers = await stateConstituent.getCoreTeamMembers(); Contract needs to be edited, re-deployed, and re-verified to get ABI with this
        //setCoreTeamAddresses(new Set(coreMembers));
        const signerAddress = await stateConstituent.signer.getAddress();
        // Now we have a real string to put in our Set
        setCoreTeamAddresses(new Set([signerAddress]));
      } catch (error) {
        console.error('Failed to fetch core team addresses:', error);
      }
    };

    fetchCoreTeamAddresses();
  }, [stateConstituent]);
  */
  
  const isVoter = useCallback((address: string) => {
    return voterAddresses.has(address);
  }, [voterAddresses]);
  
  // "Core teams" were likely hallucinated by an AI into existence, because they never existed in any contract:
  /*
  const isCoreTeam = useCallback((address: string) => {
    return coreTeamAddresses.has(address);
  }, [coreTeamAddresses]);
  */
  
  // Initialize lifecycle manager
  useEffect(() => {
    if (!stateConstituent || !daoToken || !raven) return;

    const manager = new ProposalLifecycleManager(
      stateConstituent,
      daoToken,
      raven
    );

    // Set up event listeners for the lifecycle manager
    // manager.on('proposalCreated', handleProposalCreated); Contract needs to be edited, re-deployed, and re-verified to get ABI with this
    manager.on('proposalStateChanged', handleProposalStateChanged);
    manager.on('voteCast', handleVoteCast);
    //manager.on('proposalExecuted', handleProposalExecuted); Contract needs to be edited, re-deployed, and re-verified to get ABI with this

    setLifecycleManager(manager);
    setLoading(false);
  }, [stateConstituent, daoToken, raven]);

  // Event handlers
  const handleProposalCreated = (proposal: Proposal) => {
    // Ensure proposal has all required fields
    const normalizedProposal: Proposal = {
      ...proposal,
      startEpoch: proposal.startEpoch || ethers.BigNumber.from(0),
      endEpoch: proposal.endEpoch || ethers.BigNumber.from(0),
      executionDelay: proposal.executionDelay || ethers.BigNumber.from(86400),
      forVotes: proposal.forVotes || ethers.BigNumber.from(0),
      againstVotes: proposal.againstVotes || ethers.BigNumber.from(0),
      quorum: proposal.quorum || ethers.BigNumber.from(0)
    };
    setPendingProposals(prev => [...prev, normalizedProposal]);
  };

  const handleProposalStateChanged = async (event: {
    proposalId: string;
    fromState: ProposalState;
    toState: ProposalState;
    txHash?: string;
  }) => {
    const proposal = lifecycleManager?.getProposal(event.proposalId);
    if (!proposal) return;

    // Update proposal lists based on new state
    switch (event.toState) {
      case ProposalState.ACTIVE:
        setPendingProposals(prev => prev.filter(p => p.id !== event.proposalId));
        setActiveProposals(prev => [...prev, proposal]);
        break;
      
      case ProposalState.EXECUTED:
      case ProposalState.DEFEATED:
      case ProposalState.EXPIRED:
      case ProposalState.CANCELED:
        setActiveProposals(prev => prev.filter(p => p.id !== event.proposalId));
        setCompletedProposals(prev => [...prev, proposal]);
        break;
    }
  };

  const handleVoteCast = async (event: {
    proposalId: string;
    support: boolean;
    reason?: string;
    txHash: string;
  }) => {
    // Get the proposal's current state from the contract
    const proposal = await lifecycleManager?.getProposal(event.proposalId);
    if (!proposal) return;

    setActiveProposals(prev =>
      prev.map(p => {
        if (p.id === event.proposalId) {
          return {
            ...p,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            quorum: proposal.quorum
          };
        }
        return p;
      })
    );

    // Emit vote cast event for UI updates
    if (lifecycleManager) {
      lifecycleManager.emit('voteCast', {
        proposalId: event.proposalId,
        support: event.support,
        reason: event.reason,
        txHash: event.txHash
      });
    }
  };

  const handleProposalExecuted = (proposalId: string) => {
    setActiveProposals(prev => prev.filter(p => p.id !== proposalId));
    const proposal = lifecycleManager?.getProposal(proposalId);
    if (proposal) {
      setCompletedProposals(prev => [...prev, proposal]);
    }
  };

  // API methods
  const createProposal = async (
    title: string,
    description: string,
    category: number,
    options?: any
  ) => {
    try {
      if (!lifecycleManager) throw new Error('Lifecycle manager not initialized');
      
      // Create the proposal
      const proposalId = await lifecycleManager.createProposal(
        title, 
        description, 
        category, 
        options
      );

      // Get the created proposal
      const proposal = await lifecycleManager.getProposal(proposalId);
      if (!proposal) {
        throw new Error('Failed to get created proposal');
      }

      // Add to pending proposals
      setPendingProposals(prev => [...prev, proposal]);

      return proposalId;
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError(err as Error);
      throw err;
    }
  };

  const submitProposal = async (proposalId: string) => {
    try {
      if (!lifecycleManager) throw new Error('Lifecycle manager not initialized');
      await lifecycleManager.submitProposalOnChain(proposalId);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const castVote = async (
    proposalId: string,
    support: boolean,
    reason?: string
  ) => {
    try {
      if (!lifecycleManager) throw new Error('Lifecycle manager not initialized');
      await lifecycleManager.castVote(proposalId, support, reason);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const executeProposal = async (proposalId: string) => {
    try {
      if (!lifecycleManager) throw new Error('Lifecycle manager not initialized');
      // Implementation of execute logic
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const cancelProposal = async (proposalId: string) => {
    try {
      if (!lifecycleManager) throw new Error('Lifecycle manager not initialized');
      // Implementation of cancel logic
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

const subscribeToProposalEvents = useCallback((
  proposalId: string,
  handlers: {
    onVoteCast?: (event: { voter: string; support: boolean }) => void;
    onStateChange?: (event: { fromState: ProposalState; toState: ProposalState }) => void;
    onDiscussionUpdate?: () => void;
  }
) => {
  if (!lifecycleManager) {
    console.warn('Lifecycle manager not initialized');
    return () => {}; // Return no-op cleanup function
  }

  // Set up event listeners
  const voteCastListener = (event: any) => {
    if (event.proposalId === proposalId && handlers.onVoteCast) {
      handlers.onVoteCast({
        voter: event.voter,
        support: event.support
      });
    }
  };

  const stateChangeListener = (event: any) => {
    if (event.proposalId === proposalId && handlers.onStateChange) {
      handlers.onStateChange({
        fromState: event.fromState,
        toState: event.toState
      });
    }
  };

  const discussionListener = (event: any) => {
    if (event.proposalId === proposalId && handlers.onDiscussionUpdate) {
      handlers.onDiscussionUpdate();
    }
  };

  // Subscribe to events
  lifecycleManager.on('voteCast', voteCastListener);
  lifecycleManager.on('proposalStateChanged', stateChangeListener);
  lifecycleManager.on('discussionUpdated', discussionListener);

  // Return cleanup function
  return () => {
    lifecycleManager.off('voteCast', voteCastListener);
    lifecycleManager.off('proposalStateChanged', stateChangeListener);
    lifecycleManager.off('discussionUpdated', discussionListener);
  };
}, [lifecycleManager]);

  /*const value = {
    // Core functionality
    createProposal,
    submitProposal,
    castVote,
    executeProposal,
    cancelProposal,

    voterAddresses,
    coreTeamAddresses,
    isVoter,
    isCoreTeam,

    // Query methods
    getProposal: (proposalId: string) => lifecycleManager?.getProposal(proposalId),
    getProposalsByState: (state: ProposalState) => lifecycleManager?.getProposalsByState(state) ?? [],
    getProposalTimeline: (proposalId: string) => lifecycleManager?.getProposalTimeline(proposalId),

    // State
    activeProposals,
    pendingProposals,
    completedProposals,

    // Status
    loading,
    error,
    subscribeToProposalEvents,
    
  };*/

  const value: ProposalContextType = {
    // Core functionality
    createProposal,
    submitProposal,
    castVote,
    executeProposal,
    cancelProposal,

    voterAddresses,
    isVoter,

    // Query methods
    getProposal: (proposalId: string) => lifecycleManager?.getProposal(proposalId),
    getProposalsByState: (state: ProposalState) => lifecycleManager?.getProposalsByState(state) ?? [],

    // State
    activeProposals,
    pendingProposals,
    completedProposals,

    // Status
    loading,
    error,
    subscribeToProposalEvents,
    /* getProposalTimeline does not actually exist.
    getProposalTimeline: (proposalId: string) => {
      if (!lifecycleManager) return undefined;
      return lifecycleManager.getProposalTimeline(proposalId);
    }*/
  };
  // "Core teams" were likely hallucinated by an AI into existence, because they never existed in any contract:
  //  isCoreTeam,
  //  coreTeamAddresses,
  return (
    <ProposalContext.Provider value={value}>
      {children}
    </ProposalContext.Provider>
  );
}

// Custom hook for using the proposal context
export function useProposals() {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposals must be used within a ProposalProvider');
  }
  return context;
}
