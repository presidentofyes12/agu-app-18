// src/connectors/types.ts
import type { BaseProvider, Web3Provider } from '@ethersproject/providers'
import type { Networkish } from '@ethersproject/networks'
// First, let's define a proper Ethereum provider interface that matches Web3React's expectations
export interface EthereumProvider {
  // Basic provider methods
  isConnected?: () => boolean;
  request?: (args: { method: string; params?: any[] }) => Promise<any>;
  // Provider state
  chainId?: string;
  selectedAddress?: string;
  // Event handling
  on?: (event: string, callback: (params?: any) => void) => void;
  removeListener?: (event: string, callback: (params?: any) => void) => void;
}
