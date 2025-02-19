// types/contracts2.ts
import { ethers } from 'ethers';
export interface TokenMetrics {
  price: string;
  supply: string;
  marketCap: string;
  volume24h: string;
  priceChange24h: number;
  totalStaked: string;
  treasuryBalance: string;
  priceHistory: { timestamp: number; price: number; }[];
}

export interface ProposalState {
  state: number;
  startEpoch: number;
  endEpoch: number;
  canceled: boolean;
  executed: boolean;
  forVotes: ethers.BigNumber;
  againstVotes: ethers.BigNumber;
  stage: number;
  proposerReputation: number;
}
