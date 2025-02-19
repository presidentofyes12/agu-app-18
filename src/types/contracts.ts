// src/types/contracts.ts

import { BigNumber } from 'ethers';
import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { NostrMessage, DiscussionThread, MemberState, GovernanceState, TokenMetrics } from './interfaces';
import { SignerProvider } from '../services/TransactionManager';

export interface UseContractEventsReturn {
  provider: SignerProvider;
  contracts: {
    daoToken: ethers.Contract;
    logicConstituent: ethers.Contract;
    stateConstituent: ethers.Contract;
    viewConstituent: ethers.Contract;
  };
}

// First, let's define the core address type for type safety
export type Address = string;

export interface IContractWithEvents extends EventEmitter {
  on(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
}

export interface IContractEvents {
  on(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string): this;
}


// Re-export ProposalState for backward compatibility
export { ProposalState as ProposalStateEnum } from './contracts';

// Define the core proposal structure that combines Nostr and blockchain data
export interface Proposal {
  // Identifiers
  id: string;
  nostrEventId?: string;
  creator: Address;
  nostrPubkey?: string;

  // Core proposal data
  title: string;
  description: string;
  category: number;
  
  // Timing parameters
  createdAt: number;
  startEpoch: BigNumber;
  endEpoch: BigNumber;
  executionDelay: BigNumber;
  
  // State tracking
  currentState: ProposalState;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  quorum: BigNumber;
  
  // Transaction data
  submissionTx?: string;
  executionTx?: string;
  cancelTx?: string;
  isPermanent?: boolean;
}

// Define the member state structure
export interface Member {
  address: Address;
  nostrPubkey?: string;
  reputationScore: BigNumber;
  stakingBalance: BigNumber;
  lastActivityTimestamp: BigNumber;
  isActive: boolean;
  daoBiddingShares: BigNumber;
}

// Define vote structure
export interface Vote {
  proposalId: string;
  voter: Address;
  nostrPubkey?: string;
  support: boolean;
  votes: BigNumber;
  reason?: string;
  timestamp: number;
}

// Define token distribution state
export interface TokenDistribution {
  dailyAllocation: BigNumber;
  treasuryBalance: BigNumber;
  lastDailyPrice: BigNumber;
  currentDailyPrice: BigNumber;
}

// Define committee structure
export interface Committee {
  id: string;
  name: string;
  members: Address[];
  requiredVotes: BigNumber;
  proposalCount: BigNumber;
}

// Define the interfaces for each constituent contract
export interface IStateConstituent extends ethers.Contract {
  // Proposal management
  createProposal(
    title: string,
    description: string,
    category: number
  ): Promise<ethers.ContractTransaction>;
  getProposal(id: string): Promise<ProposalData>;
  castVote(proposalId: string, support: boolean): Promise<ethers.ContractTransaction>;
  executeProposal: (proposalId: string) => Promise<void>;
  cancelProposal: (proposalId: string) => Promise<void>;


  // Member management
  getMember: (address: Address) => Promise<Member>;
  isActiveMember: (address: Address) => Promise<boolean>;
  updateMemberActivity: (address: Address) => Promise<void>;

  // Committee management
  getCommittee: (committeeId: string) => Promise<Committee>;
  addCommitteeMember: (committeeId: string, member: Address) => Promise<void>;
  removeCommitteeMember: (committeeId: string, member: Address) => Promise<void>;
}

export interface ILogicConstituent {
  // Validation functions
  validateQuorum: (
    totalVotes: BigNumber,
    forVotes: BigNumber,
    againstVotes: BigNumber,
    votedMembers: BigNumber,
    activeMemberCount: BigNumber,
    currentStage: BigNumber
  ) => Promise<boolean>;

  validateRootDAO: (
    localId: BigNumber,
    level: BigNumber,
    countAtLevel: BigNumber
  ) => Promise<boolean>;

  // Calculation functions
  calculateStakingBonus: (
    stakeDuration: BigNumber,
    stakeAmount: BigNumber
  ) => Promise<BigNumber>;

  calculateReputation: (
    baseScore: BigNumber,
    trustScores: BigNumber[],
    isFamilial: boolean[],
    isInstitutional: boolean[]
  ) => Promise<BigNumber>;
}

export interface IViewConstituent extends ethers.Contract{
  // State queries
  getProposalState: (
    stateContract: Address,
    proposalId: string
  ) => Promise<[number, BigNumber, BigNumber, boolean, boolean, BigNumber, BigNumber, number, BigNumber]>;

  getStakingInfo: (
    stateContract: Address,
    user: Address
  ) => Promise<[BigNumber, BigNumber]>;

  getUserReputation: (
    stateContract: Address,
    user: Address
  ) => Promise<BigNumber>;

  getDAOInfo: (
    stateContract: Address,
    globalId: BigNumber
  ) => Promise<[BigNumber, BigNumber, boolean]>;
}

export interface IDAOToken extends IContractEvents {
  // Token info
  name: () => Promise<string>;
  symbol: () => Promise<string>;
  decimals: () => Promise<number>;
  totalSupply: () => Promise<BigNumber>;
  
  dailyAllocation(): Promise<BigNumber>;
  treasuryBalance(): Promise<BigNumber>;
  lastDailyPrice(): Promise<BigNumber>;
  currentDailyPrice(): Promise<BigNumber>;
  
  // Token operations
  balanceOf: (account: Address) => Promise<BigNumber>;
  transfer: (recipient: Address, amount: BigNumber) => Promise<boolean>;
  approve: (spender: Address, amount: BigNumber) => Promise<boolean>;
  
  // DAO-specific functions
  placeBid: (amount: BigNumber, price: BigNumber, isPermanent: boolean) => Promise<void>;
  getDaoLimit: (dao: Address) => Promise<BigNumber>;
  calculateDailyAllocation: () => Promise<void>;
  recordActivity: (user: Address) => Promise<void>;
}

// Define the events that we'll need to handle
export interface ContractEvent {
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface ProposalCreatedEvent extends ContractEvent {
  proposalId: BigNumber;
  creator: Address;
  startEpoch: BigNumber;
  endEpoch: BigNumber;
}

export interface VoteCastEvent extends ContractEvent {
  proposalId: BigNumber;
  voter: Address;
  support: boolean;
  votes: BigNumber;
}

export interface ProposalStateOld {
  stage: number;
  state: number;
  data: ProposalData;
}

// Define the core ProposalState enum that will be used throughout the application
export enum ProposalState {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  DISCUSSION = 'DISCUSSION',
  PENDING_SUBMISSION = 'PENDING_SUBMISSION',
  SUBMITTED = 'SUBMITTED',
  ACTIVE = 'ACTIVE',
  SUCCEEDED = 'SUCCEEDED',
  QUEUED = 'QUEUED',
  EXECUTED = 'EXECUTED',
  DEFEATED = 'DEFEATED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED'
}

// Type guard to check if a value is a valid ProposalState
export function isProposalState(value: any): value is ProposalState {
  return Object.values(ProposalState).includes(value);
}

// Helper to safely convert any state value to ProposalState
export function toProposalState(state: number | string | ProposalState): ProposalState {
  if (typeof state === 'number') {
    // Map on-chain numeric states to our enum
    const stateMap: { [key: number]: ProposalState } = {
      0: ProposalState.PENDING,
      1: ProposalState.ACTIVE,
      2: ProposalState.CANCELED,
      3: ProposalState.DEFEATED,
      4: ProposalState.SUCCEEDED,
      5: ProposalState.EXECUTED,
      6: ProposalState.EXPIRED,
      7: ProposalState.DRAFT
    };
    return stateMap[state] || ProposalState.DRAFT;
  }
  if (typeof state === 'string') {
    return Object.values(ProposalState).includes(state as ProposalState) 
      ? state as ProposalState 
      : ProposalState.DRAFT;
  }
  if (isProposalState(state)) {
    return state;
  }
  return ProposalState.DRAFT;
}

/*export interface ProposalData {
  stage?: number;
  endEpoch: BigNumber;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  currentState: number;
}*/

// Base interface for proposal data
export interface ProposalData {
  id: string;
  creator: string;
  title: string;
  description: string;
  category: number;
  createdAt: BigNumber;
  startEpoch: BigNumber;
  endEpoch: BigNumber;
  executionDelay: BigNumber;
  currentState: ProposalState;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  quorum: BigNumber;
  stage?: number;
}

/*export interface ProposalData {
  currentState: ProposalStateEnum;
}*/

export interface ContractInstances {
  daoToken: ethers.Contract;
  logicConstituent: ethers.Contract;
  stateConstituent: ethers.Contract;
  viewConstituent: ethers.Contract;
}

export interface NostrClient extends EventEmitter {
  on(event: 'message', listener: (message: NostrMessage) => void): this;
  on(event: 'reaction', listener: (reaction: any) => void): this;
  getDiscussions(): Promise<DiscussionThread[]>;
  createDiscussion(data: {
    proposalId: string;
    title: string;
    description: string;
  }): Promise<void>;
}


// Add missing state interfaces
export interface DAOState {
  contractState: ContractState;
  nostrState: NostrState;
  uiState: UIState;
  lastSyncTime: number;
}

export interface ContractState {
  proposals: Map<string, ProposalState>;
  members: Map<string, MemberState>;
  tokenMetrics: TokenMetrics;
  governance: GovernanceState;
}

export interface NostrState {
  discussions: Map<string, DiscussionThread>;
  messages: Map<string, NostrMessage>;
  relayStatus: Map<string, boolean>;
}

export interface UIState {
  currentView: string;
  notifications: Notification[];
  modals: Map<string, boolean>;
  loadingStates: Map<string, boolean>;
  errors: Map<string, Error>;
}

export interface ProposalStateData {
  stage: number;
  state: ProposalState;
  endEpoch: number;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  currentState: ProposalState;
  data: ProposalData;
  ravenVotes?: {
    forVotes: number;
    againstVotes: number;
  };
}

/*// Contract instances container type
export interface ContractInstances {
  daoToken: IDAOToken;
  logicConstituent: ILogicConstituent;
  stateConstituent: IStateConstituent;
  viewConstituent: IViewConstituent;
}*/


export interface ProposalStateResponse {
  state: ProposalState;
  data: ProposalData;
  stage: number;
  endEpoch: number;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  currentState: ProposalState;
  ravenVotes?: {
    forVotes: number;
    againstVotes: number;
  };
}
