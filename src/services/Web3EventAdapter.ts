// src/services/Web3EventAdapter.ts

import { ethers } from 'ethers';
import { TypedEventEmitter } from '../raven/helper/event-emitter';

// Define the Ethereum event types we care about
export enum Web3Events {
  AccountsChanged = 'accountsChanged',
  ChainChanged = 'chainChanged',
  Connect = 'connect',
  Disconnect = 'disconnect'
}

// Type definitions for the event handlers
type Web3EventMap = {
  [Web3Events.AccountsChanged]: (accounts: string[]) => void;
  [Web3Events.ChainChanged]: (chainId: string) => void;
  [Web3Events.Connect]: (info: { chainId: string }) => void;
  [Web3Events.Disconnect]: (error: { code: number; message: string }) => void;
}

export class Web3EventAdapter extends TypedEventEmitter<Web3Events, Web3EventMap> {
  private provider: ethers.providers.Web3Provider;
  private ethereum: any; // Using any here since we're wrapping the provider anyway

  constructor(ethereum: any) {
    super();
    this.ethereum = ethereum;
    this.provider = new ethers.providers.Web3Provider(ethereum);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Map Ethereum provider events to our typed events
    this.ethereum.on('accountsChanged', (accounts: string[]) => {
      this.emit(Web3Events.AccountsChanged, accounts);
    });

    this.ethereum.on('chainChanged', (chainId: string) => {
      this.emit(Web3Events.ChainChanged, chainId);
    });

    this.ethereum.on('connect', (info: { chainId: string }) => {
      this.emit(Web3Events.Connect, info);
    });

    this.ethereum.on('disconnect', (error: { code: number; message: string }) => {
      this.emit(Web3Events.Disconnect, error);
    });
  }

  public getProvider(): ethers.providers.Web3Provider {
    return this.provider;
  }

  public cleanup(): void {
    // Clean up Ethereum provider listeners
    if (this.ethereum.removeAllListeners) {
      this.ethereum.removeAllListeners();
    }
    // Clean up our event emitter
    this.removeAllListeners();
  }
  
  public async requestAccounts(): Promise<string[]> {
    return await this.ethereum.request({ 
      method: 'eth_requestAccounts' 
    }) as string[];
  }

  public async requestChainId(): Promise<string> {
    return await this.ethereum.request({ 
      method: 'eth_chainId' 
    }) as string;
  }

  public getWeb3Provider(): ethers.providers.Web3Provider {
    return new ethers.providers.Web3Provider(this.ethereum);
  }
}
