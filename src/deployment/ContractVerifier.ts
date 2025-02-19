// src/deployment/ContractVerifier.ts
import { ethers } from 'ethers';
import { Logger } from '../services/Logger';

export interface VerificationConfig {
  explorerApiKey: string;
  explorerApiUrl: string;
  waitTime: number;
  maxAttempts: number;
}

export class ContractVerifier {
  private readonly logger: Logger;
  private readonly config: VerificationConfig;

  constructor(config: VerificationConfig) {
    this.config = config;
    this.logger = new Logger('ContractVerifier');
  }

  async verify(
    address: string,
    constructorArgs: any[],
    contractPath: string,
    optimizationRuns?: number
  ): Promise<boolean> {
    this.logger.info(`Starting verification for contract at ${address}`);

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        await this.submitVerification(address, constructorArgs, contractPath, optimizationRuns);
        await this.waitForVerification(address);
        
        this.logger.info(`Contract at ${address} verified successfully`);
        return true;
      } catch (error) {
        if (attempt === this.config.maxAttempts) {
          // Safely type check the error before logging
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Verification failed after ${attempt} attempts: ${errorMessage}`);
          // Throw a properly typed Error
          throw new Error(`Verification failed: ${errorMessage}`);
        }
        this.logger.warn(`Verification attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, this.config.waitTime));
      }
    }

    return false;
  }

  private async submitVerification(
    address: string,
    constructorArgs: any[],
    contractPath: string,
    optimizationRuns?: number
  ): Promise<void> {
    // Implementation would depend on the specific explorer API
    // This is a placeholder for the actual API call
    this.logger.info('Submitting verification request...');
  }

  private async waitForVerification(address: string): Promise<void> {
    // Implementation would poll the explorer API to check verification status
    // This is a placeholder for the actual polling logic
    this.logger.info('Waiting for verification to complete...');
  }
}

