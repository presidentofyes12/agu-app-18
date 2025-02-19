// src/services/ContractRegistry.ts

import { ethers } from 'ethers';
import { Logger } from './Logger';
import { loadConfig } from '../deployment/config';
import type { Config } from '../deployment/config';

class ContractRegistry {
  private static instance: ContractRegistry;
  private addresses: Map<string, string>;
  private readonly logger: Logger;

  private constructor() {
    this.addresses = new Map();
    this.logger = new Logger('ContractRegistry');
    this.loadAddresses();
  }

  public static getInstance(): ContractRegistry {
    if (!ContractRegistry.instance) {
      ContractRegistry.instance = new ContractRegistry();
    }
    return ContractRegistry.instance;
  }

  private loadAddresses() {
    // Load addresses from configuration
    const config: Config = loadConfig();
    
    // Validate each address
    Object.entries(config).forEach(([key, value]) => {
      if (key.endsWith('_ADDRESS') && typeof value === 'string') {
        if (this.validateAddress(value)) {
          this.addresses.set(key, value);
        } else {
          this.logger.error(`Invalid address for ${key}: ${value}`);
          throw new Error(`Invalid address configuration: ${key}`);
        }
      }
    });
  }

  public getAddress(contractName: string): string {
    const address = this.addresses.get(contractName);
    if (!address) {
      throw new Error(`Address not found for contract: ${contractName}`);
    }
    return address;
  }

  private validateAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }
}
