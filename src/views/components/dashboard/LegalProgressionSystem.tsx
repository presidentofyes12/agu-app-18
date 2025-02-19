// Main App: src/views/components/dashboard/LegalProgressionSystem.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Button,
  Alert
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';

// Import existing components
import TokenMetrics from './TokenMetrics';
import UnifiedFieldsSystem from './UnifiedFieldsSystem';
import { useWeb3Manager } from '../../../hooks/useWeb3Manager';

interface LegalState {
  level: number;
  currentState: string;
  capabilities: string[];
  nextStateRequirements: Requirement[];
}

interface Requirement {
  type: string;
  threshold: number;
  current: number;
  description?: string;
  achieved?: boolean;
}

// Define legal state names and their corresponding levels
const LEGAL_STATES = {
  INITIAL: { level: 0, name: 'Initial State' },
  BASIC: { level: 16.67, name: 'Basic Legal Framework' },
  INTERMEDIATE: { level: 33.33, name: 'Intermediate Framework' },
  ADVANCED: { level: 50.00, name: 'Advanced Framework' },
  UNIFIED: { level: 66.67, name: 'Unified Legal System' },
  COMPLETE: { level: 83.33, name: 'Complete Legal Framework' }
} as const;

// Helper function to get legal state name based on level
const getLegalStateName = (level: number): string => {
  const states = Object.values(LEGAL_STATES);
  const currentState = states.reduce((prev, curr) => {
    return (level >= curr.level && curr.level > prev.level) ? curr : prev;
  }, states[0]);
  return currentState.name;
};

// Helper function to map capabilities based on level
const mapCapabilities = (level: number): string[] => {
  const capabilities: string[] = [];
  
  if (level >= LEGAL_STATES.BASIC.level) {
    capabilities.push('Basic Legal Operations');
  }
  if (level >= LEGAL_STATES.INTERMEDIATE.level) {
    capabilities.push('Advanced Governance');
  }
  if (level >= LEGAL_STATES.ADVANCED.level) {
    capabilities.push('Automated Compliance');
  }
  if (level >= LEGAL_STATES.UNIFIED.level) {
    capabilities.push('Cross-Chain Integration');
  }
  if (level >= LEGAL_STATES.COMPLETE.level) {
    capabilities.push('Full Legal Autonomy');
  }
  
  return capabilities;
};

// Helper function to get requirements for next state
const getNextStateRequirements = (level: number): Requirement[] => {
  const states = Object.values(LEGAL_STATES);
  const nextState = states.find(state => state.level > level);
  
  if (!nextState) {
    return [];
  }

  return [
    {
      type: 'Governance Participation',
      threshold: 1000,
      current: 750,
      description: 'Active governance participants required',
      achieved: false
    },
    {
      type: 'Proposal Success Rate',
      threshold: 75,
      current: 65,
      description: 'Percentage of successful proposals',
      achieved: false
    },
    {
      type: 'Community Engagement',
      threshold: 5000,
      current: 4200,
      description: 'Total number of active community members',
      achieved: false
    }
  ];
};

// Helper function to check if progression is possible
const canProgress = (state: LegalState | null): boolean => {
  if (!state || !state.nextStateRequirements) {
    return false;
  }
  
  return state.nextStateRequirements.every(req => req.current >= req.threshold);
};

const LegalProgressionSystem: React.FC = () => {
  const { web3State, contractService } = useWeb3Manager();
  const [legalState, setLegalState] = useState<LegalState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLegalState = async () => {
      if (!contractService) {
        console.warn('Contract service not initialized');
        return;
      }

      try {
        setLoading(true);
        const state = await contractService.getProposalState('0');
        
        // Map contract state to legal framework levels
        const stage = state.data.stage || 0;
        const level = stage >= 3 ? 
          16.67 + (stage - 3) * 1.85185185 : 
          16.67;

        setLegalState({
          level,
          currentState: getLegalStateName(level),
          capabilities: mapCapabilities(level),
          nextStateRequirements: getNextStateRequirements(level)
        });
      } catch (error) {
        console.error('Failed to load legal state:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contractService) {
      loadLegalState();
    }
  }, [contractService]);

  // Early return for loading state
  if (loading) {
    return (
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <LinearProgress />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Legal Framework Status */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceIcon />
                  Legal Framework Status
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current Level: {legalState?.level.toFixed(8)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Progress to Next State
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={((legalState?.level || 0) % 1.85185185) * 100} 
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Active Capabilities
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {legalState?.capabilities.map((cap, index) => (
                    <Chip 
                      key={index}
                      label={cap}
                      icon={<SecurityIcon />}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Requirements and Progression */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GavelIcon />
                  Next State Requirements
                </Typography>
              </Box>

              {legalState?.nextStateRequirements.map((req, index) => (
                <Alert 
                  key={index}
                  severity={req.achieved ? "success" : "info"}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">
                    {req.description}
                  </Typography>
                  <LinearProgress 
                    variant="determinate"
                    value={(req.current / req.threshold) * 100}
                    sx={{ mt: 1 }}
                  />
                </Alert>
              ))}

              <Button 
                variant="contained"
                fullWidth
                disabled={!canProgress(legalState)}
                sx={{ mt: 2 }}
              >
                Progress to Next State
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Integration with existing components */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <TokenMetrics />
        </Grid>
        <Grid item xs={12} md={6}>
          <UnifiedFieldsSystem />
        </Grid>
      </Grid>
    </Box>
  );
};

export default LegalProgressionSystem;
