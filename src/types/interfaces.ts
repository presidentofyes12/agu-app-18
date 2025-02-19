// src/types/interfaces.ts

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { ILogicConstituent, IViewConstituent, IStateConstituent, IDAOToken } from 'types/contracts';

// Contract State Types
export interface ProposalState {
  id: string;
  title: string;
  description: string;
  category: number;
  creator: string;
  startTime: number;
  endTime: number;
  executed: boolean;
  lastUpdated: number;
  createdAt: ethers.BigNumber;
  startEpoch: ethers.BigNumber;
  endEpoch: ethers.BigNumber;
  forVotes: ethers.BigNumber;
  againstVotes: ethers.BigNumber;
  quorum: ethers.BigNumber;
  discussion?: DiscussionThread | null;
}

export interface MemberState {
  address: string;
  reputationScore: ethers.BigNumber;
  stakingBalance: ethers.BigNumber;
  lastActivityTimestamp: number;
  isActive: boolean;
  daoBiddingShares: ethers.BigNumber;
}

export interface TokenMetrics {
  totalSupply: ethers.BigNumber;
  price: ethers.BigNumber;
  marketCap: ethers.BigNumber;
  lastUpdated: number;
  fieldStrength?: number;
  fieldSynchronization?: number;
  unityProgress?: number;
}

export interface GovernanceState {
  currentEpoch: number;
  proposalCount: number;
  totalVotingPower: ethers.BigNumber;
  lastUpdated: number;
}

// Nostr Types
export interface DiscussionThread {
  id: string;
  proposalId: string;
  title: string;
  description: string;
  messages: NostrMessage[];
  lastUpdated: number;
}

export interface NostrMessage {
  id: string;
  pubkey: string;
  content: string;
  timestamp: number;
  threadId?: string;
}

export interface NostrClient extends EventEmitter {
  on(event: 'message', listener: (message: NostrMessage) => void): this;
  on(event: 'reaction', listener: (reaction: any) => void): this;
  getDiscussions(): Promise<DiscussionThread[]>;
  createDiscussion(data: CreateProposalData): Promise<void>;
}

// Data Types
export interface CreateProposalData {
  title: string;
  description: string;
  category: number;
  proposalId?: string;
}

// Contract Types
export interface ContractInstances {
  daoToken: ethers.Contract & IDAOToken;
  logicConstituent: ethers.Contract & ILogicConstituent;
  stateConstituent: ethers.Contract & IStateConstituent;
  viewConstituent: ethers.Contract & IViewConstituent;
}
