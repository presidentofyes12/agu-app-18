// hooks/useTransitionRequirements.ts

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { SystemState, TransitionRequirements } from '../types/transition';
import { StateTransitionService } from '../services/StateTransitionService';
import { ContractService } from 'views/components/dashboard/contractService';
import { LAYER_BOUNDARIES } from '../types/transition';

interface UseTransitionRequirementsResult {
  transitionRequirements: TransitionRequirements | null;
  loading: boolean;
  error: Error | null;
  checkTransitionRequirements: () => Promise<void>;
}

export const useTransitionRequirements = (
  address: string,
  currentState: SystemState | null
): UseTransitionRequirementsResult => {
  const [transitionRequirements, setTransitionRequirements] = useState<TransitionRequirements | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize services
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  const contractService = new ContractService(provider, process.env.REACT_APP_CONTRACT_ADDRESS || '');
  const stateService = StateTransitionService.getInstance(provider, contractService);

  const calculateNextState = (currentLevel: number): number => {
    // Find the next layer boundary
    const nextBoundary = Object.values(LAYER_BOUNDARIES)
      .sort((a, b) => a - b)
      .find(boundary => boundary > currentLevel);

    // If we're not close to a boundary, increment by a smaller amount
    return nextBoundary 
      ? Math.min(currentLevel + 0.925925926, nextBoundary)
      : currentLevel + 0.925925926;
  };

  const checkTransitionRequirements = useCallback(async () => {
    if (!stateService || !currentState) return;

    try {
      setLoading(true);
      
      // Get current metrics
      const metrics = await contractService.getMetrics(address);
      
      // Calculate requirements based on current state
      const nextState = calculateNextState(currentState.level);
      
      const requirements = [
        {
          type: 'Activity',
          threshold: Math.ceil(nextState * 10),
          currentValue: metrics.activityScore,
          description: 'Minimum activity score required'
        },
        {
          type: 'Reputation',
          threshold: Math.ceil(nextState * 5),
          currentValue: await contractService.getReputationScore(address),
          description: 'Minimum reputation score required'
        }
      ];

      // Check if all requirements are met
      const readyForTransition = requirements.every(
        req => req.currentValue >= req.threshold
      );

      setTransitionRequirements({
        requirements,
        readyForTransition,
        nextState
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check requirements'));
    } finally {
      setLoading(false);
    }
  }, [address, currentState, contractService, stateService]);

  return {
    transitionRequirements,
    loading,
    error,
    checkTransitionRequirements
  };
};
