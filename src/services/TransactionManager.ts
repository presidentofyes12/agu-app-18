// src/services/TransactionManager.ts

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { Provider } from '../types/provider';

// We define detailed transaction states to track progress
export enum TransactionState {
  PENDING = 'PENDING',           // Awaiting user confirmation
  BROADCASTING = 'BROADCASTING', // Being sent to network
  MINING = 'MINING',            // Waiting for confirmations
  CONFIRMING = 'CONFIRMING',    // Getting additional confirmations
  COMPLETED = 'COMPLETED',      // Successfully completed
  FAILED = 'FAILED',            // Failed to complete
  REVERTED = 'REVERTED'         // Completed but reverted
}

// We track all important information about each transaction
export interface Transaction {
  id: string;
  hash?: string;
  description: string;
  state: TransactionState;
  createTime: number;
  confirmTime?: number;
  error?: Error;
  confirmations: number;
  requiredConfirmations: number;
  method: string;
  params: any[];
  contract: string;
  receipt?: ethers.providers.TransactionReceipt;
  replacementTx?: string;
}

// Configuration options for transaction handling
export interface TransactionConfig {
  confirmations?: number;
  gasLimit?: number;
  gasPriceMultiplier?: number;
  timeout?: number;
  replacementEnabled?: boolean;
}

type DefaultConfig = Required<TransactionConfig>;

// Define our provider type that guarantees getSigner availability
export type Web3Provider = ethers.providers.Web3Provider;
export type JsonRpcProvider = ethers.providers.JsonRpcProvider;
export type SignerProvider = Web3Provider | JsonRpcProvider;

export class TransactionManager extends EventEmitter {
  private readonly transactions: Map<string, Transaction>;
  private readonly defaultConfig: DefaultConfig;

  /*constructor(
    private provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider,
    config?: TransactionConfig
  ) {
    super();
    this.provider = provider;
    this.transactions = new Map();
    
    // Set sensible defaults that can be overridden
    this.defaultConfig = {
      confirmations: 2,
      gasLimit: 500000,
      gasPriceMultiplier: 1.1,
      timeout: 300000, // 5 minutes
      replacementEnabled: true,
      ...config
    };
  }*/

  constructor(
    private readonly provider: SignerProvider,
    config?: TransactionConfig
  ) {
    super();
    
    if (!('getSigner' in provider)) {
      throw new Error('Provider must support getSigner method');
    }

    this.transactions = new Map();
    
    // Set up default config with all required properties
    this.defaultConfig = {
      confirmations: 2,
      gasLimit: 500000,
      gasPriceMultiplier: 1.1,
      timeout: 300000, // 5 minutes
      replacementEnabled: true, // Set a default value
      ...config // Override defaults with any provided config values
    };
  }

  // Helper method for safe signer access
  private async getSigner(): Promise<ethers.providers.JsonRpcSigner> {
    try {
      return this.provider.getSigner();
    } catch (error) {
      throw new Error('Failed to get signer from provider');
    }
  }

  // Create and track a new transaction
  public async createTransaction(
    description: string,
    contract: ethers.Contract,
    method: string,
    params: any[],
    config?: TransactionConfig
  ): Promise<string> {
    // Generate unique ID for this transaction
    const id = ethers.utils.id(Date.now().toString() + Math.random());
    
    // Initialize transaction state
    const transaction: Transaction = {
      id,
      description,
      state: TransactionState.PENDING,
      createTime: Date.now(),
      confirmations: 0,
      requiredConfirmations: config?.confirmations || this.defaultConfig.confirmations,
      method,
      params,
      contract: contract.address
    };

    this.transactions.set(id, transaction);
    this.emit('transactionCreated', { ...transaction });

    return id;
  }

  // Submit a transaction to the network
  public async submitTransaction(id: string): Promise<void> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error('Transaction not found');

    try {
      // Update state
      this.updateTransaction(id, {
        state: TransactionState.BROADCASTING
      });

      // Get signer
      const signer = await this.getSigner();
      
      const contract = new ethers.Contract(
        transaction.contract,
        [], // ABI would be provided in actual usage
        signer
      );

      // Handle gas estimation and pricing safely
      const gasEstimate = await contract.estimateGas[transaction.method](
        ...transaction.params
      );
      const gasPrice = await this.provider.getGasPrice();

      const tx = await contract[transaction.method](...transaction.params, {
        gasLimit: Math.ceil(gasEstimate.toNumber() * 1.2),
        gasPrice
      });

      this.updateTransaction(id, {
        hash: tx.hash,
        state: TransactionState.MINING
      });

      await this.monitorTransaction(id, tx);
    } catch (error) {
      this.handleTransactionError(id, error as Error);
    }
  }

  // Monitor a transaction's progress
  private async monitorTransaction(
    id: string,
    tx: ethers.providers.TransactionResponse
  ): Promise<void> {
    const transaction = this.transactions.get(id);
    if (!transaction) return;

    try {
      // Set up timeout
      const timeout = setTimeout(() => {
        if (transaction.state === TransactionState.MINING) {
          this.handleTransactionTimeout(id);
        }
      }, this.defaultConfig.timeout);

      // Wait for confirmations
      const receipt = await tx.wait(transaction.requiredConfirmations);

      clearTimeout(timeout);

      // Check if transaction was successful
      if (receipt.status === 1) {
        this.updateTransaction(id, {
          state: TransactionState.COMPLETED,
          confirmTime: Date.now(),
          confirmations: receipt.confirmations,
          receipt
        });
      } else {
        this.updateTransaction(id, {
          state: TransactionState.REVERTED,
          confirmTime: Date.now(),
          receipt
        });
      }
    } catch (error) {
      console.error('Transaction monitoring failed:', error);
      this.handleTransactionError(id, error as Error);
    }
  }

  // Handle transaction errors
  private handleTransactionError(id: string, error: Error): void {
    const transaction = this.transactions.get(id);
    if (!transaction) return;

    // Check for specific error types
    if (error.message.includes('user rejected')) {
      this.updateTransaction(id, {
        state: TransactionState.FAILED,
        error: new Error('Transaction rejected by user')
      });
    } else if (error.message.includes('insufficient funds')) {
      this.updateTransaction(id, {
        state: TransactionState.FAILED,
        error: new Error('Insufficient funds for transaction')
      });
    } else {
      this.updateTransaction(id, {
        state: TransactionState.FAILED,
        error
      });
    }
  }

  // Handle transaction timeouts
  private async handleTransactionTimeout(id: string): Promise<void> {
    const transaction = this.transactions.get(id);
    if (!transaction || !transaction.hash) return;

    // Check if transaction is still pending
    const tx = await this.provider.getTransaction(transaction.hash);
    if (!tx || tx.blockNumber) return; // Transaction already mined

    if (this.defaultConfig.replacementEnabled) {
      await this.replaceTransaction(id);
    } else {
      this.updateTransaction(id, {
        state: TransactionState.FAILED,
        error: new Error('Transaction timed out')
      });
    }
  }

  // Replace a stuck transaction
  private async replaceTransaction(id: string): Promise<void> {
    const transaction = this.transactions.get(id);
    if (!transaction || !transaction.hash) return;

    try {
      const tx = await this.provider.getTransaction(transaction.hash);
      if (!tx || !tx.gasPrice) return;

      const signer = await this.getSigner();
      const newGasPrice = tx.gasPrice.mul(12).div(10);

      const replacementTx = await signer.sendTransaction({
        to: transaction.contract,
        data: tx.data,
        nonce: tx.nonce,
        gasLimit: tx.gasLimit,
        gasPrice: newGasPrice
      });

      this.updateTransaction(id, {
        hash: replacementTx.hash,
        replacementTx: tx.hash
      });

      await this.monitorTransaction(id, replacementTx);
    } catch (error) {
      this.handleTransactionError(id, error as Error);
    }
  }

  // Update transaction state
  private updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): void {
    const transaction = this.transactions.get(id);
    if (!transaction) return;

    const updatedTransaction = {
      ...transaction,
      ...updates
    };

    this.transactions.set(id, updatedTransaction);
    this.emit('transactionUpdated', { ...updatedTransaction });
  }

  // Get transaction by ID
  public getTransaction(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }

  // Get all transactions
  public getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
  }

  // Get pending transactions
  public getPendingTransactions(): Transaction[] {
    return this.getAllTransactions().filter(
      tx => tx.state === TransactionState.MINING ||
            tx.state === TransactionState.BROADCASTING
    );
  }
}
