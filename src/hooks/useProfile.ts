// src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { UserProfile } from '../types/profile';
import { ProfileAnalyzer } from '../services/ProfileAnalyzer';
import { Connection, NetworkMetrics } from '../types';

export const useProfile = (
  connections: Connection[],
  metrics: NetworkMetrics,
  rewardMetrics: {
    daily: number;
    weekly: number;
    projected: number;
  }
) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileHistory, setProfileHistory] = useState<UserProfile[]>([]);

  useEffect(() => {
    const analyzer = new ProfileAnalyzer(connections, metrics, rewardMetrics);
    const newProfile = analyzer.generateProfile();
    
    setProfile(newProfile);
    setProfileHistory(prev => [...prev, newProfile].slice(-30)); // Keep last 30 days
  }, [connections, metrics, rewardMetrics]);

  const getProfileInsights = () => {
    if (!profile || !profileHistory.length) return null;

    const previousProfile = profileHistory[profileHistory.length - 2];
    if (!previousProfile) return null;

    return {
      networkScoreChange: profile.networkScore - previousProfile.networkScore,
      improvementAreas: profile.developmentAreas,
      recentAchievements: profile.uniqueStrengths.filter(
        strength => !previousProfile.uniqueStrengths.includes(strength)
      ),
      growthOpportunities: calculateGrowthOpportunities(profile),
    };
  };

  const calculateGrowthOpportunities = (currentProfile: UserProfile) => {
    const opportunities: string[] = [];

    if (currentProfile.networkScore < 80) {
      if (currentProfile.activeConnectionsRatio < 0.7) {
        opportunities.push('Activate more connections to improve network quality');
      }
      if (currentProfile.rewardEfficiency < 0.6) {
        opportunities.push('Optimize connection selection for better rewards');
      }
      if (currentProfile.networkStability < 0.5) {
        opportunities.push('Focus on maintaining longer-term connections');
      }
    }

    return opportunities;
  };

  return {
    profile,
    profileHistory,
    insights: getProfileInsights(),
  };
};
