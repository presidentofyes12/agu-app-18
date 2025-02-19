// src/types/state.ts

import { BigNumber } from 'ethers';

export interface TokenMetrics {
  totalSupply: BigNumber;
  price: BigNumber;
  marketCap: BigNumber;
  volume24h: BigNumber;
  stakingTotal: BigNumber;
  treasury: BigNumber;
  fieldStrength?: number;
  fieldSynchronization?: number;
  unityProgress?: number;
}

export interface GovernanceState {
  currentEpoch: number;
  proposalCount: number;
  totalVotingPower: BigNumber;
  quorumRequirement: BigNumber;
}

export interface MemberState {
  address: string;
  reputationScore: BigNumber;
  stakingBalance: BigNumber;
  lastActivityTimestamp: number;
  isActive: boolean;
}

export interface DiscussionThread {
  id: string;
  proposalId: string;
  title: string;
  content: string;
  author: string;
  timestamp: number;
  replies: NostrMessage[];
}

export interface NostrMessage {
  id: string;
  pubkey: string;
  content: string;
  timestamp: number;
  tags: string[][];
}

export interface CreateProposalData {
  title: string;
  description: string;
  category: number;
  options?: {
    discussionPeriod?: number;
    votingPeriod?: number;
    executionDelay?: number;
  };
}
