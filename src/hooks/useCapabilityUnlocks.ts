import { useState, useEffect, useCallback } from 'react';
import { useWeb3Manager } from './useWeb3Manager';
import { CapabilityUnlockEvent, UnifiedEventListener } from '../services/UnifiedEventListener';

// hooks/useCapabilityUnlocks.ts
export const useCapabilityUnlocks = (address: string) => {
  const [unlocks, setUnlocks] = useState<CapabilityUnlockEvent[]>([]);
  const { provider } = useWeb3Manager();
  
  useEffect(() => {
    const eventListener = UnifiedEventListener.getInstance(
      provider,
      'wss://nostr-relay.example.com'
    );

    const unsubscribe = eventListener.subscribe('capability-unlock', (event) => {
      setUnlocks(prev => [...prev, event]);
    });

    return () => {
      unsubscribe();
    };
  }, [address, provider]);

  return unlocks;
};
