// src/components/DAODashboard/TokenAnalytics.tsx

import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar 
} from '@mui/material';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ethers, BigNumber } from 'ethers';
import { useTokenAnalytics } from 'hooks/useTokenAnalytics';
import { PriceChart } from 'components/shared/charts/PriceChart';
import { DistributionChart } from 'components/shared/charts/DistributionChart';
import { MetricItem } from 'components/shared/MetricItem';

// Finally, let's create the TokenAnalytics component to show token metrics and distribution
export const TokenAnalytics: React.FC = () => {
  const { 
    tokenMetrics, 
    distribution, 
    priceHistory 
  } = useTokenAnalytics(); // We'll create this hook next

  const formatUSD = (value: number | string | BigNumber) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  };

const formatNumber = (value: number | string | BigNumber): string => {
  return new Intl.NumberFormat('en-US').format(Number(value));
};

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Token Analytics</Typography>
      </CardContent>
      <CardContent>
        <div className="space-y-6">
          {/* Price Chart */}
          <PriceChart data={priceHistory} />
          
          {/* Distribution Overview */}
          <DistributionChart data={distribution} />
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricItem
              label="Market Cap"
              value={formatUSD(tokenMetrics.marketCap)}
            />
            <MetricItem
              label="Circulating Supply"
              value={formatNumber(tokenMetrics.circulatingSupply)}
            />
            <MetricItem
              label="Total Staked"
              value={`${tokenMetrics.stakedPercentage}%`}
            />
            <MetricItem
              label="Holder Count"
              value={formatNumber(tokenMetrics.holderCount)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
