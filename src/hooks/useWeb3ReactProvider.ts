// First, let's update the Web3React interface in useWeb3ReactProvider.ts
// src/hooks/useWeb3ReactProvider.ts

import { useWeb3React as useWeb3ReactCore } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

// Extended interface to match actual Web3React context
export interface Web3ReactContextInterface {
  connector?: any;
  library?: Web3Provider;
  chainId?: number;
  account?: string | null;
  isActive: boolean;
  error?: Error;
  provider?: Web3Provider;
  isActivating: boolean;
  connect: () => Promise<void>;
  deactivate: () => void;  // Add this explicitly
}


export function useWeb3React(): Web3ReactContextInterface {
  const context = useWeb3ReactCore<Web3Provider>();
  
  // Create a wrapper that provides the expected interface
  const wrappedContext: Web3ReactContextInterface = {
    ...context,
    isActive: context.isActive ?? false,
    isActivating: context.isActivating ?? false,
    // Implement connect method
    connect: async () => {
      if (context.connector) {
        try {
          await context.connector.activate();
        } catch (error) {
          console.error('Failed to connect:', error);
          throw error;
        }
      } else {
        throw new Error('No connector available');
      }
    },
    // Implement deactivate method
    deactivate: () => {
      if (context.connector) {
        try {
          //context.connector.deactivate();
          context.connector?.deactivate!();
        } catch (error) {
          console.error('Failed to deactivate:', error);
        }
      }
    }
  };

  return wrappedContext;
}
