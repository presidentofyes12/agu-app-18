// hooks/useStateTransition.ts

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { SystemState, TransitionContext } from '../services/StateTransitionService';
import { StateTransitionService } from '../services/StateTransitionService';
import { ContractService } from 'views/components/dashboard/contractService';
import { FoundationState, FoundationCapability } from 'services/FoundationService';

interface UseStateTransitionResult {
  currentState: SystemState | null;
  loading: boolean;
  error: Error | null;
  executeTransition: (nextLevel: number) => Promise<void>;
  refreshState: () => Promise<void>;
}

interface UISystemState extends SystemState {
  capabilities: FoundationCapability[];
}

export const useStateTransition = (address: string): UseStateTransitionResult => {
  const [currentState, setCurrentState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [transitionContext, setTransitionContext] = useState<TransitionContext>({
    state: 'INITIAL'
  });

  // Initialize provider safely
  const getProvider = useCallback(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Web3 provider not available');
    }
    return new ethers.providers.Web3Provider(window.ethereum);
  }, []);

  // Initialize services
  const initializeServices = useCallback(() => {
    try {
      const provider = getProvider();
      const contractService = new ContractService(provider, process.env.REACT_APP_CONTRACT_ADDRESS || '');
      return StateTransitionService.getInstance(provider, contractService);
    } catch (err) {
      console.error('Failed to initialize services:', err);
      return null;
    }
  }, [getProvider]);

  const loadState = useCallback(async () => {
    const stateService = initializeServices();
    if (!stateService) return;

    try {
      setLoading(true);
      const state = await stateService.getCurrentState(address);
      
      // Transform base state to UI state by ensuring capabilities
      const uiState: UISystemState = {
        ...state,
        capabilities: state.type === 'FOUNDATION' 
          ? (state as FoundationState).capabilities
          : []
      };
      
      setCurrentState(uiState);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load state'));
    } finally {
      setLoading(false);
    }
  }, [address, initializeServices]);

  // Initial load
  useEffect(() => {
    loadState();
  }, [loadState]);

  const executeTransition = async (nextLevel: number) => {
    const stateService = initializeServices();
    if (!stateService || !currentState) {
      throw new Error('Service not initialized or no current state');
    }

    try {
      setLoading(true);
      setTransitionContext({ state: 'EXECUTING' });

      // Create the next state object
      const nextState: SystemState = {
        ...currentState,
        level: nextLevel,
        timestamp: Date.now()
      };

      await stateService.executeTransition(address, nextState);
      
      // Refresh state after transition
      await loadState();
      
      setTransitionContext({ state: 'COMPLETED' });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to execute transition'));
      setTransitionContext({ 
        state: 'FAILED',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    currentState,
    loading,
    error,
    executeTransition,
    refreshState: loadState
  };
};
