// src/views/components/dashboard/ProposalTypes.ts
import { ethers, BigNumber } from 'ethers';
import { ProposalState } from 'types/contracts';

// Export the DAO proposal interface that matches the contract types
export interface DAOProposal {
  id: string;
  title: string;
  description: string;
  proposer?: string;
  creator: string;
  startTime: number;
  endTime: number;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  executed: boolean;
  category: number;
  startEpoch: BigNumber;
  endEpoch: BigNumber;
  executionDelay: BigNumber;
  currentState: ProposalState;
  quorum: BigNumber;
  createdAt: number;
}

// Export service interfaces
export interface VoteResult {
  forVotes: BigNumber;
  againstVotes: BigNumber;
}

export interface ProposalCreation {
  title: string;
  description: string;
  category: number;
  votingPeriod: number;
}
