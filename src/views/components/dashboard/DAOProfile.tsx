// src/views/components/dashboard/DAOProfile.tsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import { 
  Award,
  TrendingUp,
  Target,
  Activity,
  Users,
  Star
} from 'lucide-react';
import { useWeb3Manager } from '../../../hooks/useWeb3Manager';
import { ProfileAnalyzer } from '../../../services/ProfileAnalyzer';
import { 
  UserProfile, 
  Connection, 
  NetworkMetrics, 
  RewardMetrics 
} from '../../../types/profile';

const DAOProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { web3State, contractService } = useWeb3Manager();

  useEffect(() => {
    const loadProfile = async () => {
      if (!contractService || !web3State.account) return;

      try {
        const [membershipStatus, metrics, rewardMetrics] = await Promise.all([
          contractService.getMembershipStatus(web3State.account),
          contractService.getTokenMetrics(),
          {
            daily: 8.33,
            weekly: 58.31,
            projected: 249.9
          }
        ]);

        // Convert membership status to Connection format
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const daysConnected = Math.floor((currentTimestamp - membershipStatus.lastActivity) / (24 * 60 * 60));
        
        const connection: Connection = {
          address: web3State.account,
          daysConnected: daysConnected,
          rewardShare: membershipStatus.biddingShares,
          status: membershipStatus.isActive ? 'active' : 'inactive'
        };

        const networkMetrics: NetworkMetrics = {
          directConnections: membershipStatus.biddingShares,
          extendedNetwork: metrics.activeUsers,
          networkValue: parseFloat(metrics.treasuryBalance)
        };

        const analyzer = new ProfileAnalyzer(
          [connection],
          networkMetrics,
          rewardMetrics
        );

        const userProfile = analyzer.generateProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [contractService, web3State.account]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            DAO Profile
          </Typography>
          <Grid container spacing={3}>
            {/* Network Score */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Award className="mr-2" />
                  <Typography variant="h6">Network Score</Typography>
                </Box>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {profile.networkScore}
                </Typography>
                <Chip 
                  label={profile.engagementLevel}
                  color="primary"
                />
              </Paper>
            </Grid>

            {/* Network Growth */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp className="mr-2" />
                  <Typography variant="h6">Growth Metrics</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Network Growth Rate
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={profile.networkGrowthRate * 100}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
                <Chip 
                  label={profile.growthTrend}
                  color={
                    profile.growthTrend === 'accelerating' ? 'success' :
                    profile.growthTrend === 'stable' ? 'primary' : 'warning'
                  }
                />
              </Paper>
            </Grid>

            {/* Networking Style */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Target className="mr-2" />
                  <Typography variant="h6">Strategy</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`Style: ${profile.networkingStyle}`} />
                  <Chip label={`Strategy: ${profile.connectionStrategy}`} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Strengths and Development Areas */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Star className="mr-2" />
                <Typography variant="h6">Unique Strengths</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.uniqueStrengths.map((strength, index) => (
                  <Chip 
                    key={index}
                    label={strength}
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Activity className="mr-2" />
                <Typography variant="h6">Development Areas</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profile.developmentAreas.map((area, index) => (
                  <Chip 
                    key={index}
                    label={area}
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DAOProfile;
