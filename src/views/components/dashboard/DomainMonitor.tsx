// Main App: src/views/components/dashboard/DomainMonitor.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import { Shield, Check, AlertCircle } from 'lucide-react';
import { useWeb3Manager } from '../../../hooks/useWeb3Manager';

interface DomainMetrics {
  currentLevel: number;    // 16.67-25.00
  stage: number;          // From StateConstituent
  governanceWeight: number;
  capabilities: {
    daoStructure: boolean;    // >= 17.59
    complexGovernance: boolean; // >= 20.37
    sovereignAuthority: boolean; // >= 23.15
  };
}

const DomainMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<DomainMetrics>();
  const { contractService } = useWeb3Manager();

useEffect(() => {
  if (!contractService) {
    console.error("[DomainMonitor] Contract service not initialized.");
  }

  if (!!contractService) {
    console.error("[DomainMonitor] Contract service initialized.");
  }
}, []);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!contractService) {
        console.error('[DomainMonitor] Contract service not initialized');
        return;
      } else {
        console.log('[DomainMonitor] Contract service initialized. Continuing...');
      }

      try {
        const stateData = await contractService.getProposalState(
          '0'
        );

        const stage = stateData.data.stage || 0;
        //const stage = stateData.data.stage?.toNumber() || 0;
        const currentLevel = stage >= 3 ? 
          16.67 + (stage - 3) * 1.85185185 : 
          16.67;

        setMetrics({
          currentLevel,
          stage: stage,
          governanceWeight: Math.floor((currentLevel - 16.67) * 10) / 10 + 1,
          capabilities: {
            daoStructure: currentLevel >= 17.59259259,
            complexGovernance: currentLevel >= 20.37037037,
            sovereignAuthority: currentLevel >= 23.14814815
          }
        });
      } catch (error) {
        console.error('[DomainMonitor] Failed to load domain metrics:', error);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [contractService]);

  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <Typography>Loading domain status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Shield className="h-5 w-5 mr-2" />
          <Typography variant="h6">Domain Status</Typography>
        </Box>

        <Box mb={3}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Domain Level Progress
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="h4" component="span">
              {metrics.currentLevel.toFixed(8)}
            </Typography>
            <Typography variant="body2" color="textSecondary" ml={1}>
              / 25.00
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={((metrics.currentLevel - 16.67) / (25 - 16.67)) * 100}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Stage
            </Typography>
            <Typography variant="h6">
              {metrics.stage}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Governance Weight
            </Typography>
            <Typography variant="h6">
              {metrics.governanceWeight}x
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Available Capabilities
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.entries(metrics.capabilities).map(([key, enabled]) => (
            <Chip
              key={key}
              label={formatCapability(key)}
              icon={enabled ? <Check /> : <AlertCircle />}
              color={enabled ? "primary" : "default"}
              variant={enabled ? "filled" : "outlined"}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const formatCapability = (key: string): string => {
  switch (key) {
    case 'daoStructure': return 'DAO Structure';
    case 'complexGovernance': return 'Complex Governance';
    case 'sovereignAuthority': return 'Sovereign Authority';
    default: return key;
  }
};

export default DomainMonitor;
