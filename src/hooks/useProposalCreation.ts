// src/hooks/useProposalCreation.ts

import { useState, useCallback } from 'react';
import { useProposals } from '../contexts/ProposalContext';
import { ProposalState } from '../types/contracts';
import { ethers } from 'ethers';
import { useContractEvents } from './useContractEvents';
import { useAtom } from 'jotai';
import { ravenAtom } from 'atoms';

interface ProposalCreationOptions {
  discussionPeriod?: number;
  votingPeriod?: number;
  executionDelay?: number;
  quorumRequired?: number;
}

interface DiscussionEvent {
  pubkey: string;
  created_at: number;
}

interface UseProposalCreationReturn {
  // State
  isCreating: boolean;
  isSubmitting: boolean;
  error: Error | null;
  currentProposal: {
    id: string;
    state: ProposalState;
    discussionEndTime: number;
    title?: string;  // Add these optional fields
  } | null;

  // Actions
  startProposalCreation: (
    title: string,
    description: string,
    category: number,
    options?: ProposalCreationOptions
  ) => Promise<string>;
  
  submitToChain: (proposalId: string) => Promise<void>;
  cancelProposal: (proposalId: string) => Promise<void>;
  
  // Discussion management
  addDiscussionComment: (
    proposalId: string,
    comment: string
  ) => Promise<void>;
  
  updateProposal: (
    proposalId: string,
    updates: {
      title?: string;
      description?: string;
      category?: number;
    }
  ) => Promise<void>;
  
  discussionStats: {
    commentCount: number;
    uniqueParticipants: Set<string>;
  };
  canSubmitToChain: (proposalId: string) => { canSubmit: boolean; reason?: string };
  validateProposalParams: (title: string, description: string, category: number, options: any) => { isValid: boolean; errors: string[] };
  getDiscussionTimeRemaining: () => string;
}

export function useProposalCreation(): UseProposalCreationReturn {
  const { createProposal, submitProposal } = useProposals();
  //const { raven } = useContractEvents();
  const [raven] = useAtom(ravenAtom);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentProposal, setCurrentProposal] = useState<{
    id: string;
    state: ProposalState;
    discussionEndTime: number;
  } | null>(null);

  const startProposalCreation = useCallback(async (
    title: string,
    description: string,
    category: number,
    options?: ProposalCreationOptions
  ) => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Validate inputs
      if (!title.trim() || !description.trim()) {
        throw new Error('Title and description are required');
      }

      if (!raven) {
        throw new Error('Raven instance not initialized');
      }

      // Set default options
      const finalOptions = {
        discussionPeriod: 2 * 24 * 60 * 60, // 2 days
        votingPeriod: 3 * 24 * 60 * 60,     // 3 days
        executionDelay: 1 * 24 * 60 * 60,   // 1 day
        quorumRequired: ethers.utils.parseUnits('0.04', 18), // 4%
        ...options
      };

      // Create the proposal
      const proposalId = await createProposal(
        title,
        description,
        category,
        finalOptions
      );

      // Start Nostr discussion thread
      await raven.createDiscussionThread({
        proposalId,
        title,
        description,
        category,
        discussionEndTime: Math.floor(Date.now() / 1000) + finalOptions.discussionPeriod
      });

      setCurrentProposal({
        id: proposalId,
        state: ProposalState.DISCUSSION,
        discussionEndTime: Math.floor(Date.now() / 1000) + finalOptions.discussionPeriod
      });

      return proposalId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [createProposal, raven]);

  const submitToChain = useCallback(async (proposalId: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate discussion period has ended
      if (currentProposal?.discussionEndTime && 
          Date.now() < currentProposal.discussionEndTime * 1000) {
        throw new Error('Discussion period has not ended yet');
      }

      if (!raven) {
        throw new Error('Raven instance not initialized');
      }

      // Submit proposal to blockchain
      await submitProposal(proposalId);

      // Update Nostr thread with submission status
      await raven.updateDiscussionThread({
        proposalId,
        state: ProposalState.SUBMITTED,
        transactionHash: '', // Will be updated by lifecycle manager
        timestamp: Math.floor(Date.now() / 1000)
      });

      setCurrentProposal(prev => 
        prev?.id === proposalId ? 
          { ...prev, state: ProposalState.SUBMITTED } : 
          prev
      );
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [submitProposal, raven, currentProposal]);

  const addDiscussionComment = useCallback(async (
    proposalId: string,
    comment: string
  ) => {
    try {
      
      if (!raven) {
        throw new Error('Raven instance not initialized');
      }
      
      await raven.addDiscussionComment({
        proposalId,
        content: comment,
        timestamp: Math.floor(Date.now() / 1000)
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [raven]);

  const updateProposal = useCallback(async (
    proposalId: string,
    updates: {
      title?: string;
      description?: string;
      category?: number;
    }
  ) => {
    try {
      // Validate proposal is still in DISCUSSION state
      if (currentProposal?.state !== ProposalState.DISCUSSION) {
        throw new Error('Can only update proposals during discussion phase');
      }

      if (!raven) {
        throw new Error('Raven instance not initialized');
      }

      // Update Nostr thread
      await raven.updateProposalContent({
        proposalId,
        ...updates,
        timestamp: Math.floor(Date.now() / 1000)
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [raven, currentProposal]);

  const cancelProposal = useCallback(async (proposalId: string) => {
    try {
      // Can only cancel during DISCUSSION or PENDING_SUBMISSION
      if (currentProposal?.state !== ProposalState.DISCUSSION && 
          currentProposal?.state !== ProposalState.PENDING_SUBMISSION) {
        throw new Error('Cannot cancel proposal at current state');
      }
      
      if (!raven) {
        throw new Error('Raven instance not initialized');
      }
      
      // Update Nostr thread
      await raven.updateDiscussionThread({
        proposalId,
        state: ProposalState.CANCELED,
        timestamp: Math.floor(Date.now() / 1000)
      });

      setCurrentProposal(prev =>
        prev?.id === proposalId ?
          { ...prev, state: ProposalState.CANCELED } :
          prev
      );

    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [raven, currentProposal]);

  // Utility function to check if a proposal can be submitted to chain
  const canSubmitToChain = useCallback((proposalId: string): { 
    canSubmit: boolean; 
    reason?: string 
  } => {
    const proposal = currentProposal;
    if (!proposal || proposal.id !== proposalId) {
      return { canSubmit: false, reason: 'Proposal not found' };
    }

    if (proposal.state !== ProposalState.DISCUSSION) {
      return { canSubmit: false, reason: 'Proposal is not in discussion phase' };
    }

    if (Date.now() < proposal.discussionEndTime * 1000) {
      return { 
        canSubmit: false, 
        reason: `Discussion period ends in ${Math.ceil((proposal.discussionEndTime * 1000 - Date.now()) / (1000 * 60 * 60))} hours` 
      };
    }

    return { canSubmit: true };
  }, [currentProposal]);

  // Helper function to validate proposal parameters
  const validateProposalParams = useCallback((
    title: string,
    description: string,
    category: number,
    options?: ProposalCreationOptions
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Title validations
    if (title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    }
    if (title.trim().length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    // Description validations
    if (description.trim().length < 20) {
      errors.push('Description must be at least 20 characters long');
    }
    if (description.trim().length > 4000) {
      errors.push('Description must be less than 4000 characters');
    }

    // Category validation
    if (category < 0 || category > 4) {
      errors.push('Invalid category selected');
    }

    // Options validation
    if (options) {
      if (options.discussionPeriod && options.discussionPeriod < 24 * 60 * 60) {
        errors.push('Discussion period must be at least 24 hours');
      }
      if (options.votingPeriod && options.votingPeriod < 24 * 60 * 60) {
        errors.push('Voting period must be at least 24 hours');
      }
      if (options.executionDelay && options.executionDelay < 12 * 60 * 60) {
        errors.push('Execution delay must be at least 12 hours');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Helper function to format remaining time in discussion phase
  const getDiscussionTimeRemaining = useCallback((): string => {
    if (!currentProposal || currentProposal.state !== ProposalState.DISCUSSION) {
      return '';
    }

    const remainingMs = currentProposal.discussionEndTime * 1000 - Date.now();
    if (remainingMs <= 0) {
      return 'Discussion period has ended';
    }

    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }, [currentProposal]);

  // Track proposal discussion activity
  const [discussionStats, setDiscussionStats] = useState<{
    commentCount: number;
    uniqueParticipants: Set<string>;
    lastActivityTimestamp: number;
  }>({
    commentCount: 0,
    uniqueParticipants: new Set(),
    lastActivityTimestamp: 0
  });

  // Update discussion stats when new comments are added
  useCallback(async (proposalId: string) => {
    if (!raven || !currentProposal || currentProposal.id !== proposalId) return;

    try {
      const discussionEvents = await raven.getDiscussionEvents(proposalId);
      
      /*setDiscussionStats({
        commentCount: discussionEvents.length,
        uniqueParticipants: new Set(discussionEvents.map(e => e.pubkey)),
        lastActivityTimestamp: Math.max(...discussionEvents.map(e => e.created_at))
      });*/
      
setDiscussionStats({
  commentCount: discussionEvents.length,
  uniqueParticipants: new Set(discussionEvents.map((e: DiscussionEvent) => e.pubkey)),
  lastActivityTimestamp: Math.max(...discussionEvents.map((e: DiscussionEvent) => e.created_at))
});
    } catch (err) {
      console.error('Error fetching discussion stats:', err);
    }
  }, [raven, currentProposal]);

  return {
    // Core state
    isCreating,
    isSubmitting,
    error,
    currentProposal,
    discussionStats,

    // Core actions
    startProposalCreation,
    submitToChain,
    cancelProposal,
    addDiscussionComment,
    updateProposal,

    // Utility functions
    canSubmitToChain,
    validateProposalParams,
    getDiscussionTimeRemaining
  };
}
