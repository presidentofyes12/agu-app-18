// src/components/DAODashboard/DashboardMetrics.tsx

import { 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Box
} from '@mui/material';
import { ethers } from 'ethers';
import { useDAOMetrics } from 'hooks/useDAOMetrics';

// Create a MetricCard component
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  trend 
}: { 
  title: string;
  value: string;
  subtitle: string;
  trend?: { value: number; timeframe: string; }
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4">
        {value}
      </Typography>
      <Typography color="textSecondary" variant="body2">
        {subtitle}
      </Typography>
      {trend && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="body2" 
            color={trend.value >= 0 ? 'success.main' : 'error.main'}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
            {trend.timeframe}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

export const DashboardMetrics: React.FC = () => {
  const {
    totalSupply,
    treasuryBalance,
    activeMembers,
    votingPower,
    proposalCount,
    avgParticipation
  } = useDAOMetrics();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Treasury Balance"
          value={ethers.utils.formatEther(treasuryBalance)}
          subtitle="PITA Tokens"
          trend={{
            value: 12.5,
            timeframe: '24h'
          }}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Active Members"
          value={activeMembers.toString()}
          subtitle="Participants"
          trend={{
            value: 5.2,
            timeframe: '7d'
          }}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <MetricCard
          title="Governance Participation"
          value={`${avgParticipation}%`}
          subtitle="30-day average"
          trend={{
            value: -2.1,
            timeframe: '30d'
          }}
        />
      </Grid>
    </Grid>
  );
};
