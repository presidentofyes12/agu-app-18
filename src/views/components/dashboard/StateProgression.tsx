// Main App: src/views/components/dashboard/StateProgression.tsx

import React, { useEffect, useCallback } from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Box,
  FormLabel
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

// Import service types
import { 
  SystemState as ServiceSystemState,
  FoundationState as ServiceFoundationState 
} from '../../../services/StateTransitionService';

// Import UI types
import { 
  SystemState as UISystemState,
  TransitionRequirements,
  Capability 
} from '../../../types/transition';

// Custom hooks
import { useStateTransition } from '../../../hooks/useStateTransition';
import { useTransitionRequirements } from '../../../hooks/useTransitionRequirements';

// Utility functions
import { getLayerName, calculateProgress } from '../../../util/stateUtils';

// Components
import { RequirementDisplay } from '../../../components/RequirementDisplay';

interface StateProgressionProps {
  address: string;
}

// Helper function to format capability names for display
const formatCapability = (capability: Capability): string => {
  const formattingMap: { [key: string]: string } = {
    daoStructure: 'DAO Structure',
    complexGovernance: 'Complex Governance',
    sovereignAuthority: 'Sovereign Authority',
    BASIC_RIGHTS: 'Basic Rights',
    INTERMEDIATE_RIGHTS: 'Intermediate Rights',
    FORMATION_COMPLETE: 'Formation Complete'
  };
  
  return formattingMap[capability.type] || capability.type;
};

// Adapter function to transform service state to UI state
const adaptServiceStateToUIState = (state: ServiceSystemState): UISystemState => {
  // Check if state is a FoundationState
  const capabilities = (state as ServiceFoundationState).capabilities || [];

  return {
    ...state,
    capabilities: capabilities.map(capType => ({
      type: capType,
      active: true,
      description: ''  // Add description if available from the service
    }))
  };
};

export const StateProgression: React.FC<StateProgressionProps> = ({ address }) => {
  const { 
    currentState: serviceState, 
    loading: stateLoading, 
    error: stateError,
    executeTransition 
  } = useStateTransition(address);

  // Transform service state to UI state
  const currentState = serviceState ? adaptServiceStateToUIState(serviceState) : null;

  const {
    transitionRequirements,
    loading: requirementsLoading,
    error: requirementsError,
    checkTransitionRequirements
  } = useTransitionRequirements(address, currentState);

  const handleTransition = useCallback(async () => {
    if (!transitionRequirements?.nextState) return;
    
    try {
      await executeTransition(transitionRequirements.nextState);
    } catch (error) {
      console.error('Failed to execute transition:', error);
    }
  }, [executeTransition, transitionRequirements]);

  useEffect(() => {
    if (currentState) {
      checkTransitionRequirements();
    }
  }, [currentState, checkTransitionRequirements]);

  if (stateLoading || requirementsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentState) {
    return null;
  }

  const error = stateError || requirementsError;
  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">
          Error: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardHeader 
        title={
          <Typography variant="h6">System State</Typography>
        }
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Current State Display */}
          <Box>
            <FormLabel>Current Level</FormLabel>
            <Typography variant="h4">
              {currentState.level.toFixed(8)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getLayerName(currentState.level)}
            </Typography>
          </Box>

          {/* Progress to Next State */}
          <Box>
            <FormLabel>Progress to Next State</FormLabel>
            <LinearProgress 
              variant="determinate"
              value={calculateProgress(currentState, transitionRequirements || undefined)}
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Capabilities */}
          <Box>
            <FormLabel>Active Capabilities</FormLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {currentState.capabilities.map((cap: Capability) => (
                <Chip 
                  key={cap.type}
                  label={formatCapability(cap)}
                  variant="outlined"
                  color={cap.active ? "primary" : "default"}
                />
              ))}
            </Box>
          </Box>

          {/* Transition Requirements */}
          {transitionRequirements && (
            <Box>
              <FormLabel>Next State Requirements</FormLabel>
              <Box sx={{ mt: 1 }}>
                {transitionRequirements.requirements.map(req => (
                  <RequirementDisplay
                    key={req.type}
                    requirement={req}
                    currentValue={req.currentValue}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Transition Controls */}
          {transitionRequirements?.readyForTransition && (
            <Button
              variant="contained"
              fullWidth
              onClick={handleTransition}
            >
              Progress to Next State
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
