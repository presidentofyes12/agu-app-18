// types/ethereum.d.ts

import { ExternalProvider } from '@ethersproject/providers';

declare global {
  interface Window {
    ethereum?: ExternalProvider & {
      on(event: string, callback: (...args: any[]) => void): void;
      removeListener(event: string, callback: (...args: any[]) => void): void;
      isMetaMask?: boolean;
      request?: (...args: any[]) => Promise<any>;
    };
  }
}

export interface EthereumEvent {
  type: string;
  payload: any;
}

export interface Web3ProviderState {
  account: string | null;
  chainId: number | null;
  provider: ExternalProvider | null;
}

export type EthereumEventCallback = (event: EthereumEvent) => void;
