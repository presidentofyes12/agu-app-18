// hooks/useStateTransitions.ts
import { useState, useEffect, useCallback } from 'react';
import { useWeb3Manager } from './useWeb3Manager';
import { StateTransitionEvent, UnifiedEventListener} from '../services/UnifiedEventListener';

export const useStateTransitions = (address: string) => {
  const [transitions, setTransitions] = useState<StateTransitionEvent[]>([]);
  const { provider } = useWeb3Manager();
  
  useEffect(() => {
    const eventListener = UnifiedEventListener.getInstance(
      provider,
      'wss://nostr-relay.example.com'
    );

    const unsubscribe = eventListener.subscribe('state-transition', (event) => {
      setTransitions(prev => [...prev, event]);
    });

    return () => {
      unsubscribe();
    };
  }, [address, provider]);

  return transitions;
};
