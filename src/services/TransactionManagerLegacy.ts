// src/services/TransactionManager.ts

import { ethers } from 'ethers';
import { EventEmitter } from 'events';

// First, let's define our transaction states and types
export enum TransactionState {
  PENDING = 'PENDING',       // Transaction is waiting to be sent
  SUBMITTED = 'SUBMITTED',   // Transaction has been sent to network
  MINING = 'MINING',        // Transaction is being mined
  CONFIRMING = 'CONFIRMING', // Waiting for confirmation blocks
  COMPLETED = 'COMPLETED',   // Transaction successfully completed
  FAILED = 'FAILED',        // Transaction failed
  CANCELLED = 'CANCELLED'    // Transaction was cancelled
}

export interface Transaction {
  id: string;               // Unique identifier for tracking
  hash?: string;           // Transaction hash once submitted
  description: string;     // Human-readable description
  method: string;          // Contract method being called
  params: any[];          // Method parameters
  state: TransactionState; // Current transaction state
  confirmations: number;   // Number of confirmations received
  error?: Error;          // Error if transaction failed
  gasPrice?: ethers.BigNumber; // Gas price used
  gasLimit?: ethers.BigNumber; // Gas limit used
  nonce?: number;         // Transaction nonce
  contract: ethers.Contract; // Contract instance
  createTime: number;     // When transaction was created
  submitTime?: number;    // When transaction was submitted
  completeTime?: number;  // When transaction completed/failed
  retryCount?: number;
}

// Configuration options for transaction management
interface TransactionConfig {
  minGasPrice?: ethers.BigNumber;
  maxGasPrice?: ethers.BigNumber;
  gasIncreasePercentage?: number; // For retry with higher gas
  requiredConfirmations?: number;
  maxRetries?: number;
  retryInterval?: number; // ms between retries
}

export class TransactionManager extends EventEmitter {
  private transactions: Map<string, Transaction>;
  private provider: ethers.providers.Provider;
  private signer: ethers.Signer;
  
  // Default configuration values
  private readonly config: Required<TransactionConfig> = {
    minGasPrice: ethers.utils.parseUnits('1', 'gwei'),
    maxGasPrice: ethers.utils.parseUnits('500', 'gwei'),
    gasIncreasePercentage: 10,
    requiredConfirmations: 2,
    maxRetries: 3,
    retryInterval: 15000 // 15 seconds
  };

  constructor(
    provider: ethers.providers.Provider,
    signer: ethers.Signer,
    config?: Partial<TransactionConfig>
  ) {
    super();
    this.provider = provider;
    this.signer = signer;
    this.transactions = new Map();

    // Override default config with provided values
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start listening for network events
    this.setupNetworkListeners();
  }

  private setupNetworkListeners(): void {
    // Monitor block events to track confirmations
    this.provider.on('block', this.handleNewBlock.bind(this));
    
    // Handle network changes
    this.provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        // Network changed - check pending transactions
        this.handleNetworkChange(newNetwork.chainId);
      }
    });
  }

  private async handleNewBlock(blockNumber: number): Promise<void> {
    // Update confirmations for all mining/confirming transactions
    const promises = Array.from(this.transactions.values())
      .filter(tx => tx.state === TransactionState.MINING || 
                    tx.state === TransactionState.CONFIRMING)
      .map(async (tx) => {
        if (!tx.hash) return;

        try {
          const receipt = await this.provider.getTransactionReceipt(tx.hash);
          if (receipt) {
            // Update confirmation count
            tx.confirmations = blockNumber - receipt.blockNumber + 1;

            // Check if we have enough confirmations
            if (tx.confirmations >= this.config.requiredConfirmations) {
              await this.finalizeTransaction(tx.id, receipt);
            } else if (tx.state === TransactionState.MINING) {
              // Move to confirming state once we have first confirmation
              this.updateTransactionState(tx.id, TransactionState.CONFIRMING);
            }
          }
        } catch (error) {
          console.error(`Error checking receipt for transaction ${tx.id}:`, error);
        }
      });

    await Promise.all(promises);
  }

  private handleNetworkChange(newChainId: number): void {
    // Check all pending transactions when network changes
    const pending = Array.from(this.transactions.values())
      .filter(tx => tx.state === TransactionState.SUBMITTED || 
                    tx.state === TransactionState.MINING);

    pending.forEach(tx => {
      this.updateTransactionState(tx.id, TransactionState.FAILED, 
        new Error('Network changed while transaction was pending'));
    });
  }

  // Create and submit a new transaction
  public async submitTransaction(
    contract: ethers.Contract,
    method: string,
    params: any[],
    description: string
  ): Promise<string> {
    // Create transaction ID and record
    const id = ethers.utils.id(Date.now().toString() + Math.random());
    const transaction: Transaction = {
      id,
      description,
      method,
      params,
      state: TransactionState.PENDING,
      confirmations: 0,
      contract,
      createTime: Date.now()
    };

    this.transactions.set(id, transaction);
    this.emit('transactionCreated', { ...transaction });

    try {
      // Get gas estimate and price
      const gasLimit = await contract.estimateGas[method](...params);
      const gasPrice = await this.getGasPrice();

      // Update transaction with gas info
      transaction.gasLimit = gasLimit;
      transaction.gasPrice = gasPrice;
      
      // Get nonce
      transaction.nonce = await this.signer.getTransactionCount();

      // Submit transaction
      await this.sendTransaction(id);

      return id;
    } catch (error) {
      this.handleTransactionError(id, error as Error);
      throw error;
    }
  }

  private async sendTransaction(id: string): Promise<void> {
    const tx = this.transactions.get(id);
    if (!tx) throw new Error('Transaction not found');

    try {
      // Update state to submitted
      this.updateTransactionState(id, TransactionState.SUBMITTED);
      
      // Send transaction
      const response = await tx.contract[tx.method](...tx.params, {
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        nonce: tx.nonce
      });

      // Update transaction with hash
      tx.hash = response.hash;
      tx.submitTime = Date.now();
      this.updateTransactionState(id, TransactionState.MINING);

      // Wait for transaction to be mined
      const receipt = await response.wait(1); // Wait for 1 confirmation
      
      // Update confirmation count
      tx.confirmations = 1;
      
      if (receipt.status === 0) {
        throw new Error('Transaction reverted');
      }
    } catch (error) {
      await this.handleTransactionError(id, error as Error);
    }
  }

  private async handleTransactionError(id: string, error: Error): Promise<void> {
    const tx = this.transactions.get(id);
    if (!tx) return;

    // Check if we should retry
    if (this.shouldRetry(tx, error)) {
      // Increase gas price for retry
      if (tx.gasPrice) {
        const newGasPrice = tx.gasPrice.mul(100 + this.config.gasIncreasePercentage)
                                     .div(100);
        if (newGasPrice.lte(this.config.maxGasPrice)) {
          tx.gasPrice = newGasPrice;
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.config.retryInterval));
          // Retry transaction
          await this.sendTransaction(id);
          return;
        }
      }
    }

    // If we get here, we're not retrying
    this.updateTransactionState(id, TransactionState.FAILED, error);
  }

  private shouldRetry(tx: Transaction, error: Error): boolean {
    // Only retry if under max attempts
    const attempts = tx.retryCount || 0;
    if (attempts >= this.config.maxRetries) return false;

    // Check error types that warrant retry
    const message = error.message.toLowerCase();
    return message.includes('nonce too low') ||
           message.includes('replacement fee too low') ||
           message.includes('transaction underpriced') ||
           message.includes('network error') ||
           message.includes('timeout');
  }

  private async getGasPrice(): Promise<ethers.BigNumber> {
    const gasPrice = await this.provider.getGasPrice();
    
    // Ensure gas price is within bounds
    if (gasPrice.lt(this.config.minGasPrice)) {
      return this.config.minGasPrice;
    }
    if (gasPrice.gt(this.config.maxGasPrice)) {
      return this.config.maxGasPrice;
    }
    
    return gasPrice;
  }

  private async finalizeTransaction(
    id: string,
    receipt: ethers.providers.TransactionReceipt
  ): Promise<void> {
    const tx = this.transactions.get(id);
    if (!tx) return;

    // Update final state based on receipt status
    const finalState = receipt.status === 1 ? 
      TransactionState.COMPLETED : 
      TransactionState.FAILED;

    tx.completeTime = Date.now();
    this.updateTransactionState(id, finalState);
  }

  private updateTransactionState(
    id: string,
    state: TransactionState,
    error?: Error
  ): void {
    const tx = this.transactions.get(id);
    if (!tx) return;

    tx.state = state;
    if (error) tx.error = error;

    // Emit state change event
    this.emit('transactionUpdated', { ...tx });

    // Emit specific events based on state
    switch (state) {
      case TransactionState.COMPLETED:
        this.emit('transactionCompleted', { ...tx });
        break;
      case TransactionState.FAILED:
        this.emit('transactionFailed', { ...tx, error });
        break;
    }
  }

  // Public methods for transaction info
  public getTransaction(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }

  public getPendingTransactions(): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => 
        tx.state === TransactionState.PENDING ||
        tx.state === TransactionState.SUBMITTED ||
        tx.state === TransactionState.MINING ||
        tx.state === TransactionState.CONFIRMING
      );
  }

  // Cleanup method
  public cleanup(): void {
    this.provider.removeAllListeners('block');
    this.provider.removeAllListeners('network');
    this.removeAllListeners();
  }
}
