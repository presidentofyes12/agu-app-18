// src/services/ProposalLifecycle.ts

import { ethers } from 'ethers';
import { EventEmitter } from 'events';

import { ProposalData, ProposalState, toProposalState } from '../types/contracts';

interface Vote {
  voter: string;
  weight: ethers.BigNumber;
  support: boolean;
}

// Define the proposal structure that combines Nostr and on-chain data
export interface Proposal {
  // Identifiers
  id: string;                    // On-chain proposal ID
  nostrEventId?: string;         // Nostr event ID
  creator: string;               // Creator's address
  nostrPubkey?: string;         // Creator's Nostr pubkey

  // Core proposal data
  title: string;
  description: string;
  category: number;
  
  // Timing parameters
  createdAt: number;
  discussionEndTime: number;
  votingStartTime: number;
  votingEndTime: number;
  executionDelay: ethers.BigNumber;
  startEpoch: ethers.BigNumber;           // Block number when voting starts
  endEpoch: ethers.BigNumber;             // Block number when voting ends
  
  // State tracking
  currentState: ProposalState;
  stateUpdates: Array<{
    from: ProposalState;
    to: ProposalState;
    timestamp: number;
    txHash?: string;
  }>;
  
  // Voting data
  forVotes: ethers.BigNumber;
  againstVotes: ethers.BigNumber;
  quorum: ethers.BigNumber;
  votingPower: ethers.BigNumber;
  forVotesList: Vote[];
  againstVotesList: Vote[];
  
  // Transaction tracking
  submissionTx?: string;
  executionTx?: string;
  cancelTx?: string;
  
  // Discussion and updates tracking
  discussionMessages: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: number;
  }>;
  updates: Array<{
    id: string;
    content: string;
    timestamp: number;
  }>;
}


export class ProposalLifecycle {
  static getProposalState(data: Partial<ProposalData>): ProposalState {
    // Implement state calculation logic
    if (!data.currentState) return ProposalState.DRAFT;
    return toProposalState(data.currentState);
  }

  static isActive(state: ProposalState): boolean {
    return state === ProposalState.ACTIVE;
  }

  static isCompleted(state: ProposalState): boolean {
    return [
      ProposalState.EXECUTED,
      ProposalState.DEFEATED,
      ProposalState.CANCELED,
      ProposalState.EXPIRED
    ].includes(state);
  }
}

export class ProposalLifecycleManager extends EventEmitter {
  private readonly proposals: Map<string, Proposal>;
  private readonly stateContract: ethers.Contract;
  private readonly daoToken: ethers.Contract;
  private readonly raven: any; // Nostr client type

  constructor(
    stateContract: ethers.Contract,
    daoToken: ethers.Contract,
    raven: any
  ) {
    super();
    this.proposals = new Map();
    this.stateContract = stateContract;
    this.daoToken = daoToken;
    this.raven = raven;

    this.setupEventListeners();
  }

private async handleNostrUpdate(event: any): Promise<void> {
  const proposal = this.proposals.get(event.proposalId);
  if (!proposal) return;

  proposal.updates.push({
    id: event.id,
    content: event.content,
    timestamp: event.created_at
  });

  this.emit('proposalUpdated', proposal);
}

private async handleVoteCast(
  proposalId: string,
  voter: string,
  support: boolean,
  event: any
): Promise<void> {
  const proposal = this.proposals.get(proposalId);
  if (!proposal) return;

  // Update vote counts
  if (support) {
    proposal.forVotes = proposal.forVotes.add(1);
  } else {
    proposal.againstVotes = proposal.againstVotes.add(1);
  }

  this.emit('voteCast', {
    proposalId,
    voter,
    support,
    event
  });
}

private async handleProposalExecuted(proposalId: string, event: any): Promise<void> {
  await this.updateProposalState(
    proposalId,
    ProposalState.QUEUED,
    ProposalState.EXECUTED,
    event.transactionHash
  );
}

private async handleProposalCanceled(proposalId: string, event: any): Promise<void> {
  await this.updateProposalState(
    proposalId,
    this.proposals.get(proposalId)?.currentState || ProposalState.DRAFT,
    ProposalState.CANCELED,
    event.transactionHash
  );
}

  private setupEventListeners(): void {
    // Listen for Nostr events
    this.raven.on('proposal.created', this.handleNostrProposalCreated.bind(this));
    this.raven.on('proposal.discussion', this.handleNostrDiscussion.bind(this));
    this.raven.on('proposal.update', this.handleNostrUpdate.bind(this));

    // Listen for contract events
    //this.stateContract.on('ProposalCreated', this.handleOnChainProposalCreated.bind(this)); Contract needs to be edited, re-deployed, and re-verified to get ABI with this
    this.stateContract.on('VoteCast', this.handleVoteCast.bind(this));
    //this.stateContract.on('ProposalExecuted', this.handleProposalExecuted.bind(this)); Contract needs to be edited, re-deployed, and re-verified to get ABI with this
    // this.stateContract.on('ProposalCanceled', this.handleProposalCanceled.bind(this)); Contract needs to be edited, re-deployed, and re-verified to get ABI with this
  }

  // Proposal Creation Flow
  public async createProposal(
    title: string,
    description: string,
    category: number,
    options: {
      discussionPeriod?: number;
      votingPeriod?: number;
      executionDelay?: number;
    } = {}
  ): Promise<string> {
    try {
      // First, create the proposal in Nostr for discussion
      const nostrEvent = await this.raven.publishProposalDraft({
        title,
        description,
        category,
        options
      });

      // Create local proposal object
      // Get current block number for epoch initialization
      const currentBlock = await this.stateContract.provider.getBlockNumber();
      
      const proposal: Proposal = {
        id: ethers.utils.id(nostrEvent.id), // Temporary ID until on-chain submission
        nostrEventId: nostrEvent.id,
        creator: await this.stateContract.signer.getAddress(),
        nostrPubkey: this.raven.publicKey,
        title,
        description,
        category,
        createdAt: Math.floor(Date.now() / 1000),
        discussionEndTime: Math.floor(Date.now() / 1000) + (options.discussionPeriod || 172800), // 2 days default
        votingStartTime: 0, // Set when submitted on-chain
        votingEndTime: 0,   // Set when submitted on-chain
        startEpoch: ethers.BigNumber.from(currentBlock), // Initialize with current block
        endEpoch: ethers.BigNumber.from(currentBlock + Math.floor((options.votingPeriod || 172800) / 15)), // ~15 sec blocks
        executionDelay: ethers.BigNumber.from(options.executionDelay || 86400), // 1 day default
        currentState: ProposalState.DRAFT,
        stateUpdates: [{
          from: ProposalState.DRAFT,
          to: ProposalState.DRAFT,
          timestamp: Math.floor(Date.now() / 1000)
        }],
        forVotes: ethers.BigNumber.from(0),
        againstVotes: ethers.BigNumber.from(0),
        quorum: ethers.BigNumber.from(0),
        votingPower: ethers.BigNumber.from(0),
        forVotesList: [],
        againstVotesList: [],
        discussionMessages: [],
        updates: []
      };

      this.proposals.set(proposal.id, proposal);
      //this.emit('proposalCreated', proposal);

      return proposal.id;
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw new Error('Failed to create proposal');
    }
  }

  // State Transition Handlers
  private async handleNostrProposalCreated(event: any): Promise<void> {
    const proposal = this.proposals.get(event.proposalId);
    if (!proposal) return;

    await this.updateProposalState(
      proposal.id,
      ProposalState.DRAFT,
      ProposalState.DISCUSSION
    );
  }

  private async handleNostrDiscussion(event: any): Promise<void> {
    const proposal = this.proposals.get(event.proposalId);
    if (!proposal) return;

    proposal.discussionMessages.push({
      id: event.id,
      author: event.pubkey,
      content: event.content,
      timestamp: event.created_at
    });

    this.emit('proposalDiscussionUpdated', proposal);
  }

  private async handleOnChainProposalCreated(
    proposalId: string,
    creator: string,
    startBlock: number,
    endBlock: number,
    event: any
  ): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    
    if (proposal) {
      proposal.startEpoch = ethers.BigNumber.from(startBlock);
      proposal.endEpoch = ethers.BigNumber.from(endBlock);
      proposal.votingStartTime = Math.floor(Date.now() / 1000);
      proposal.votingEndTime = proposal.votingStartTime + 
        ((endBlock - startBlock) * 15); // Assuming 15 second blocks

      await this.updateProposalState(
        proposalId,
        proposal.currentState,
        ProposalState.ACTIVE
      );
      
      // Emit event with updated proposal data
      this.emit('proposalCreated', {
        ...proposal,
        startEpoch: startBlock,
        endEpoch: endBlock
      });
    }
  }

  // State Management Helpers
  private async updateProposalState(
    proposalId: string,
    fromState: ProposalState,
    toState: ProposalState,
    txHash?: string
  ): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return;

    // Validate state transition
    if (!this.isValidStateTransition(fromState, toState)) {
      throw new Error(`Invalid state transition: ${fromState} -> ${toState}`);
    }

    // Update proposal state
    proposal.currentState = toState;
    proposal.stateUpdates.push({
      from: fromState,
      to: toState,
      timestamp: Math.floor(Date.now() / 1000),
      txHash
    });

    // Emit state change event
    this.emit('proposalStateChanged', {
      proposalId,
      fromState,
      toState,
      txHash
    });

    // Sync state to Nostr
    await this.syncStateToNostr(proposal);
  }

private isValidStateTransition(
  fromState: ProposalState,
  toState: ProposalState
): boolean {
  // Define valid state transitions with proper typing
  const validTransitions: Partial<Record<ProposalState, ProposalState[]>> = {
    [ProposalState.DRAFT]: [ProposalState.DISCUSSION],
    [ProposalState.DISCUSSION]: [ProposalState.PENDING_SUBMISSION, ProposalState.CANCELED],
    [ProposalState.PENDING_SUBMISSION]: [ProposalState.SUBMITTED, ProposalState.CANCELED],
    [ProposalState.SUBMITTED]: [ProposalState.ACTIVE, ProposalState.CANCELED],
    [ProposalState.ACTIVE]: [ProposalState.SUCCEEDED, ProposalState.DEFEATED],
    [ProposalState.SUCCEEDED]: [ProposalState.QUEUED, ProposalState.EXPIRED],
    [ProposalState.QUEUED]: [ProposalState.EXECUTED, ProposalState.EXPIRED],
    [ProposalState.DEFEATED]: [],
    [ProposalState.EXECUTED]: [],
    [ProposalState.EXPIRED]: [],
    [ProposalState.CANCELED]: []
  };

  return validTransitions[fromState]?.includes(toState) ?? false;
}

  // Synchronization Methods
  private async syncStateToNostr(proposal: Proposal): Promise<void> {
    try {
      await this.raven.publishProposalUpdate({
        proposalId: proposal.id,
        nostrEventId: proposal.nostrEventId,
        currentState: proposal.currentState,
        stateUpdate: proposal.stateUpdates[proposal.stateUpdates.length - 1],
        votingData: {
          forVotes: proposal.forVotes.toString(),
          againstVotes: proposal.againstVotes.toString(),
          quorum: proposal.quorum.toString()
        }
      });
    } catch (error) {
      console.error('Error syncing state to Nostr:', error);
      // Add to retry queue if needed
    }
  }

  // Proposal Submission and Voting Methods
  public async submitProposalOnChain(proposalId: string): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    try {
      await this.updateProposalState(
        proposalId,
        proposal.currentState,
        ProposalState.PENDING_SUBMISSION
      );

      const tx = await this.stateContract.createProposal(
        proposal.title,
        proposal.description,
        proposal.category,
        {
          startEpoch: proposal.startEpoch,
          endEpoch: proposal.endEpoch
        }
      );

      proposal.submissionTx = tx.hash;
      
      // Wait for transaction and get receipt
      const receipt = await tx.wait();
      
      // Find the ProposalCreated event in the receipt
      const event = receipt.events?.find(
        (e: any) => e.event === 'ProposalCreated'
      );
      
      if (!event) {
        throw new Error('Failed to get proposal ID from transaction');
      }

      // Update proposal with on-chain ID
      const onChainProposalId = event.args.proposalId;
      
      // Create a new map entry with the on-chain ID
      this.proposals.set(onChainProposalId.toString(), {
        ...proposal,
        id: onChainProposalId.toString()
      });
      
      // Remove the old entry
      this.proposals.delete(proposalId);
      
      await this.updateProposalState(
        onChainProposalId.toString(),
        ProposalState.PENDING_SUBMISSION,
        ProposalState.SUBMITTED,
        tx.hash
      );

    } catch (error) {
      console.error('Error submitting proposal:', error);
      // Revert state if transaction fails
      await this.updateProposalState(
        proposalId,
        ProposalState.PENDING_SUBMISSION,
        proposal.currentState
      );
      throw error;
    }
  }

  public async castVote(
    proposalId: string,
    support: boolean,
    reason?: string
  ): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    try {
      // Cast vote on-chain
      const tx = await this.stateContract.castVote(proposalId, support);
      await tx.wait();

      // Publish vote to Nostr with optional reason
      await this.raven.publishVote({
        proposalId,
        nostrEventId: proposal.nostrEventId,
        support,
        reason,
        txHash: tx.hash
      });

      // Update local state
      if (support) {
        proposal.forVotes = proposal.forVotes.add(1);
      } else {
        proposal.againstVotes = proposal.againstVotes.add(1);
      }

      this.emit('voteCast', {
        proposalId,
        support,
        reason,
        txHash: tx.hash
      });
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  // Query Methods
  public getProposal(proposalId: string): Proposal | undefined {
    return this.proposals.get(proposalId);
  }

  public getProposalsByState(state: ProposalState): Proposal[] {
    return Array.from(this.proposals.values())
      .filter(proposal => proposal.currentState === state);
  }

  public async getProposalTimeline(proposalId: string): Promise<Array<{
    state: ProposalState;
    timestamp: number;
    txHash?: string;
    metadata?: any;
  }>> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    return proposal.stateUpdates.map(update => ({
      state: update.to,
      timestamp: update.timestamp,
      txHash: update.txHash
    }));
  }
}
