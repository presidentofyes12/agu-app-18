// src/services/ProfileAnalyzer.ts

import { 
  UserProfile, 
  Connection, 
  NetworkMetrics, 
  RewardMetrics 
} from '../types/profile';

export class ProfileAnalyzer {
  private connections: Connection[];
  private metrics: NetworkMetrics;
  private rewardMetrics: RewardMetrics;

  constructor(
    connections: Connection[],
    metrics: NetworkMetrics,
    rewardMetrics: RewardMetrics
  ) {
    this.connections = connections;
    this.metrics = metrics;
    this.rewardMetrics = rewardMetrics;
  }

  public generateProfile(): UserProfile {
    return {
      networkScore: this.calculateNetworkScore(),
      engagementLevel: this.determineEngagementLevel(),
      activeConnectionsRatio: this.calculateActiveConnectionsRatio(),
      networkDensity: this.calculateNetworkDensity(),
      networkStability: this.calculateNetworkStability(),
      networkGrowthRate: this.calculateGrowthRate(),
      rewardEfficiency: this.calculateRewardEfficiency(),
      consistencyScore: this.calculateConsistencyScore(),
      optimizationIndex: this.calculateOptimizationIndex(),
      connectionStrategy: this.analyzeConnectionStrategy(),
      networkingStyle: this.determineNetworkingStyle(),
      growthTrend: this.analyzeGrowthTrend(),
      achievementScore: this.calculateAchievementScore(),
      uniqueStrengths: this.identifyStrengths(),
      developmentAreas: this.identifyDevelopmentAreas(),
    };
  }

  private calculateNetworkScore(): number {
    const activeRatio = this.calculateActiveConnectionsRatio();
    const normalizedConnections = this.connections.length / 6;
    const rewardEfficiency = this.calculateRewardEfficiency();
    
    return Math.round(
      (activeRatio * 0.4 + normalizedConnections * 0.3 + rewardEfficiency * 0.3) * 100
    );
  }

  private determineEngagementLevel(): UserProfile['engagementLevel'] {
    const score = this.calculateNetworkScore();
    if (score >= 80) return 'influencer';
    if (score >= 60) return 'networker';
    if (score >= 40) return 'connected';
    return 'novice';
  }

  private calculateActiveConnectionsRatio(): number {
    const activeConnections = this.connections.filter(c => c.status === 'active').length;
    return this.connections.length ? activeConnections / this.connections.length : 0;
  }

  private calculateNetworkDensity(): number {
    return this.metrics.extendedNetwork 
      ? this.metrics.directConnections / this.metrics.extendedNetwork 
      : 0;
  }

  private calculateNetworkStability(): number {
    if (!this.connections.length) return 0;
    
    const avgDaysConnected = this.connections.reduce(
      (acc, conn) => acc + conn.daysConnected, 0
    ) / this.connections.length;
    
    return Math.min(avgDaysConnected / 30, 1);
  }

  private calculateGrowthRate(): number {
    const recentConnections = this.connections.filter(
      conn => conn.daysConnected <= 30
    ).length;
    return recentConnections / Math.max(this.connections.length, 1);
  }

  private calculateRewardEfficiency(): number {
    const maxPossibleDaily = 6 * 16.6666;
    return this.rewardMetrics.daily / maxPossibleDaily;
  }

  private calculateConsistencyScore(): number {
    const weeklyAverage = this.rewardMetrics.weekly / 7;
    const variance = Math.abs(weeklyAverage - this.rewardMetrics.daily) / weeklyAverage;
    return Math.max(0, 1 - variance);
  }

  private calculateOptimizationIndex(): number {
    const actualReward = this.rewardMetrics.daily;
    const potentialReward = 6 * 16.6666;
    return actualReward / potentialReward;
  }

  private analyzeConnectionStrategy(): UserProfile['connectionStrategy'] {
    const activeRatio = this.calculateActiveConnectionsRatio();
    const rewardEfficiency = this.calculateRewardEfficiency();
    
    if (activeRatio > 0.8 && rewardEfficiency > 0.7) return 'selective';
    if (this.connections.length >= 5) return 'expansive';
    return 'balanced';
  }

  private determineNetworkingStyle(): UserProfile['networkingStyle'] {
    const growthRate = this.calculateGrowthRate();
    const optimization = this.calculateOptimizationIndex();
    
    if (growthRate > 0.7 && optimization > 0.8) return 'strategic';
    if (growthRate > 0.5) return 'active';
    return 'passive';
  }

  private analyzeGrowthTrend(): UserProfile['growthTrend'] {
    const recentGrowth = this.calculateGrowthRate();
    const rewardTrend = this.rewardMetrics.projected > this.rewardMetrics.weekly * 4;
    
    if (recentGrowth > 0.3 && rewardTrend) return 'accelerating';
    if (recentGrowth > 0.1) return 'stable';
    return 'declining';
  }

  private calculateAchievementScore(): number {
    const baseScore = this.calculateNetworkScore();
    const bonusPoints = this.calculateBonusPoints();
    return Math.min(baseScore + bonusPoints, 100);
  }

  private calculateBonusPoints(): number {
    let bonus = 0;
    
    if (this.calculateActiveConnectionsRatio() > 0.9) bonus += 10;
    if (this.calculateRewardEfficiency() > 0.8) bonus += 10;
    if (this.calculateNetworkStability() > 0.7) bonus += 10;
    
    return bonus;
  }

  private identifyStrengths(): string[] {
    const strengths: string[] = [];
    
    if (this.calculateActiveConnectionsRatio() > 0.8) {
      strengths.push('High Active Connection Rate');
    }
    
    if (this.calculateRewardEfficiency() > 0.8) {
      strengths.push('Excellent Reward Optimization');
    }
    
    if (this.calculateNetworkStability() > 0.7) {
      strengths.push('Strong Network Stability');
    }
    
    if (this.calculateConsistencyScore() > 0.9) {
      strengths.push('Consistent Performance');
    }
    
    return strengths;
  }

  private identifyDevelopmentAreas(): string[] {
    const areas: string[] = [];
    
    if (this.connections.length < 6) {
      areas.push('Network Expansion');
    }
    
    if (this.calculateRewardEfficiency() < 0.6) {
      areas.push('Reward Optimization');
    }
    
    if (this.calculateNetworkStability() < 0.5) {
      areas.push('Connection Retention');
    }
    
    if (this.calculateConsistencyScore() < 0.7) {
      areas.push('Consistency Improvement');
    }
    
    return areas;
  }
}
