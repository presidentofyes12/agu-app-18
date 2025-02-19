// src/types/shared.ts

import { ethers } from 'ethers';

export interface ProposalState {
  id: string;
  title: string;
  description: string;
  category: number;
  creator: string;
  startTime: number;
  endTime: number;
  forVotes: ethers.BigNumber;
  againstVotes: ethers.BigNumber;
  executed: boolean;
  lastUpdated: number;
  discussion?: DiscussionThread | null;
}

export interface MemberState {
  address: string;
  reputationScore: ethers.BigNumber;
  stakingBalance: ethers.BigNumber;
  lastActivityTimestamp: number;
  isActive: boolean;
}

export interface TokenMetrics {
  totalSupply: ethers.BigNumber;
  price: ethers.BigNumber;
  marketCap: ethers.BigNumber;
  fieldStrength?: number;
  fieldSynchronization?: number;
  unityProgress?: number;
}

export interface GovernanceState {
  currentEpoch: number;
  proposalCount: number;
  totalVotingPower: ethers.BigNumber;
}

export interface DiscussionThread {
  id: string;
  proposalId: string;
  messages: NostrMessage[];
  lastUpdated: number;
}

export interface NostrMessage {
  id: string;
  pubkey: string;
  content: string;
  timestamp: number;
}

export interface CreateProposalData {
  title: string;
  description: string;
  category: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}
