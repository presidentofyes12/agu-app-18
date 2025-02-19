import { Web3Provider } from '@ethersproject/providers'
import { Web3ReactHooks } from '@web3-react/core'
import type { Networkish } from '@ethersproject/networks'
import type { BaseProvider } from '@ethersproject/providers'
import { injected } from './injected'

// Create our hooks with all required methods, including ENS functionality
const injectedHooks: Web3ReactHooks = {
  useProvider: <T extends BaseProvider = Web3Provider>(
    network?: Networkish,
    enabled = true
  ): T | undefined => {
    if (!enabled || !window?.ethereum) return undefined;
    try {
      const provider = new Web3Provider(window.ethereum);
      return provider as unknown as T;
    } catch (error) {
      console.error('Error creating Web3Provider:', error);
      return undefined;
    }
  },

  useAccount: () => {
    try {
      if (!window?.ethereum) return undefined;
      // Synchronously return the current account if available
      return (window.ethereum as any).selectedAddress;
    } catch {
      return undefined;
    }
  },

  useChainId: () => {
    try {
      if (!window?.ethereum) return undefined;
      // Synchronously return the current chainId if available
      const chainId = (window.ethereum as any).chainId;
      return chainId ? parseInt(chainId, 16) : undefined;
    } catch {
      return undefined;
    }
  },

  useIsActive: () => {
    try {
      return !!(window?.ethereum as any)?.isConnected?.();
    } catch {
      return false;
    }
  },

  useIsActivating: () => false,

  // Implement the required ENS hooks
  useENSNames: (provider?: BaseProvider) => {
    // Return empty array by default as we're not implementing ENS functionality
    return [];
  },

  useENSName: (provider?: BaseProvider) => {
    // Return undefined by default as we're not implementing ENS functionality
    return undefined;
  },

  useAccounts: () => {
    try {
      if (!window?.ethereum) return undefined;
      // Synchronously return the current accounts if available
      const selectedAddress = (window.ethereum as any).selectedAddress;
      return selectedAddress ? [selectedAddress] : undefined;
    } catch {
      return undefined;
    }
  },
}

export const connectors: [any, Web3ReactHooks][] = [
  [injected, injectedHooks]
]
