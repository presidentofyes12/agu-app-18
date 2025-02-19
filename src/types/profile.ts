// src/types/profile.ts

// The UserProfile interface defines all aspects of a user's participation in the DAO
export interface UserProfile {
  networkScore: number;
  engagementLevel: 'novice' | 'connected' | 'networker' | 'influencer';
  activeConnectionsRatio: number;
  networkDensity: number;
  networkStability: number;
  networkGrowthRate: number;
  rewardEfficiency: number;
  consistencyScore: number;
  optimizationIndex: number;
  connectionStrategy: 'selective' | 'expansive' | 'balanced';
  networkingStyle: 'passive' | 'active' | 'strategic';
  growthTrend: 'accelerating' | 'stable' | 'declining';
  achievementScore: number;
  uniqueStrengths: string[];
  developmentAreas: string[];
}

// The Connection interface represents a single network connection in the DAO
export interface Connection {
  address: string;
  daysConnected: number;
  rewardShare: number;
  status: 'active' | 'inactive';
}

// NetworkMetrics tracks the overall network health and activity
export interface NetworkMetrics {
  directConnections: number;
  extendedNetwork: number;
  networkValue: number;
}

// RewardMetrics captures the various timeframes of rewards
export interface RewardMetrics {
  daily: number;
  weekly: number;
  projected: number;
}
