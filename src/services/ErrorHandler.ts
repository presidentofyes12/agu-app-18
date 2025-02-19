// src/services/ErrorHandler.ts

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
//import { ContractError, TransactionError } from '@ethersproject/contracts';

// We define different error categories to handle each appropriately
export enum ErrorCategory {
  TRANSACTION = 'TRANSACTION',
  CONTRACT_CALL = 'CONTRACT_CALL',
  NETWORK = 'NETWORK',
  NOSTR = 'NOSTR',
  USER_INPUT = 'USER_INPUT',
  UNKNOWN = 'UNKNOWN'
}

// We create a custom error class to standardize error handling
export class DAOError extends Error {
  public readonly category: ErrorCategory;
  public readonly context: any;
  public readonly recoverable: boolean;
  public readonly retryCount: number;
  public readonly originalError?: Error;
  public readonly id: string;

  constructor(
    message: string,
    category: ErrorCategory,
    options: {
      context?: any;
      recoverable?: boolean;
      retryCount?: number;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'DAOError';
    this.category = category;
    this.context = options.context;
    this.recoverable = options.recoverable ?? true;
    this.retryCount = options.retryCount ?? 0;
    this.originalError = options.originalError;
    this.id = ethers.utils.id(Date.now().toString());
    this.retryCount = options.retryCount ?? 0;
  }

  // Helper method to determine if we should retry
  public shouldRetry(): boolean {
    if (!this.recoverable) return false;
    if (this.retryCount >= ErrorHandler.MAX_RETRIES) return false;

    // Check specific conditions for each error category
    switch (this.category) {
      case ErrorCategory.TRANSACTION:
        return this.isRetryableTransactionError();
      case ErrorCategory.NETWORK:
        return this.isRetryableNetworkError();
      case ErrorCategory.CONTRACT_CALL:
        return this.isRetryableContractError();
      default:
        return false;
    }
  }

  private isRetryableTransactionError(): boolean {
    const message = this.message.toLowerCase();
    return message.includes('nonce too low') ||
           message.includes('replacement fee too low') ||
           message.includes('transaction underpriced');
  }

  private isRetryableNetworkError(): boolean {
    const message = this.message.toLowerCase();
    return message.includes('network error') ||
           message.includes('timeout') ||
           message.includes('connection refused');
  }

  private isRetryableContractError(): boolean {
    const message = this.message.toLowerCase();
    return message.includes('execution reverted') ||
           message.includes('gas required exceeds allowance');
  }
}

export class ErrorHandler extends EventEmitter {
  public static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second
  private readonly errorLog: Map<string, DAOError[]>;
  private readonly activeRetries: Map<string, number>;

  constructor() {
    super();
    this.errorLog = new Map();
    this.activeRetries = new Map();
  }

  // Main error handling method
  public async handleError(
    error: unknown,
    context: {
      operation: string;
      retryCallback?: () => Promise<any>;
    }
  ): Promise<void> {
    const daoError = this.normalizeError(error, context);
    if (daoError.shouldRetry() && context.retryCallback) {
      await this.handleRetry(daoError, {
        operation: context.operation,
        retryCallback: context.retryCallback
      });
    } else {
      this.emit('unrecoverableError', daoError);
    }
  }

  // Update error checking to use ethers v5 error types
  /*private normalizeError(error: unknown, context: any): DAOError {
    if (error instanceof DAOError) {
      return error;
    }

    const err = error as Error;
    let category = ErrorCategory.UNKNOWN;
    let recoverable = true;

    // Use error message pattern matching instead of instanceof
    /if (err.message?.toLowerCase().includes('transaction')) {
      category = ErrorCategory.TRANSACTION;
    } else if (error.message.includes('call revert') || error.message.includes('execution reverted')) {
      category = ErrorCategory.CONTRACT_CALL;
    } else if (error.message.includes('network')) {
      category = ErrorCategory.NETWORK;
    }*

if (error instanceof ethers.errors.TransactionError) {
  category = ErrorCategory.TRANSACTION;
} else if (error instanceof Error && error.message.includes('execution reverted')) {
  category = ErrorCategory.CONTRACT_CALL;
}

    return new DAOError(err.message, category, {
      context,
      originalError: err
    });
  }*/

// In ErrorHandler.ts
private normalizeError(error: unknown, context: any): DAOError {
  let category = ErrorCategory.UNKNOWN;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('transaction')) {
      category = ErrorCategory.TRANSACTION;
    } else if (message.includes('execution reverted')) {
      category = ErrorCategory.CONTRACT_CALL;
    } else if (message.includes('network')) {
      category = ErrorCategory.NETWORK;
    }
  }

  return new DAOError(
    error instanceof Error ? error.message : 'Unknown error',
    category,
    { context, originalError: error instanceof Error ? error : undefined }
  );
}

  // Make retryCount mutable in DAOError
  private createUpdatedError(error: DAOError, newRetryCount: number): DAOError {
    return new DAOError(error.message, error.category, {
      ...error,
      retryCount: newRetryCount
    });
  }

  /*// Handle retry logic with exponential backoff
  private async handleRetry(
    error: DAOError,
    context: {
      operation: string;
      retryCallback: () => Promise<any>;
    }
  ): Promise<void> {
    const retryCount = error.retryCount;
    const operationId = `${context.operation}-${Date.now()}`;

    // Calculate delay with exponential backoff
    const delay = this.calculateRetryDelay(retryCount);

    // Record retry attempt
    this.activeRetries.set(operationId, retryCount + 1);

    // Emit retry event
    this.emit('retrying', {
      error,
      retryCount: retryCount + 1,
      delay
    });

    // Wait for backoff period
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Attempt retry
      await context.retryCallback();
      
      // If successful, emit recovery event
      this.emit('recovered', {
        error,
        retryCount: retryCount + 1,
        operationId
      });
    } catch (retryError) {
      // If retry fails, handle the new error
      const updatedError = this.normalizeError(retryError, context);
      updatedError.retryCount = retryCount + 1;
      
      await this.handleError(updatedError, context);
    } finally {
      this.activeRetries.delete(operationId);
    }
  }*/
  
    // Update error handling to use the new error creation
  private async handleRetry(error: DAOError, context: { 
    operation: string;
    retryCallback: () => Promise<any>;
  }): Promise<void> {
    try {
      await context.retryCallback();
      this.emit('recovered', { error, retryCount: error.retryCount + 1 });
    } catch (retryError) {
      const updatedError = this.createUpdatedError(
        this.normalizeError(retryError as Error, context),
        error.retryCount + 1
      );
      await this.handleError(updatedError, context);
    }
  }


  // Calculate retry delay using exponential backoff
  private calculateRetryDelay(retryCount: number): number {
    return Math.min(
      ErrorHandler.BASE_DELAY * Math.pow(2, retryCount),
      30000 // Max 30 seconds
    );
  }

  // Log errors for monitoring and debugging
  private logError(error: DAOError): void {
    const errorList = this.errorLog.get(error.category) || [];
    errorList.push(error);
    this.errorLog.set(error.category, errorList);

    // Prune old errors to prevent memory leaks
    if (errorList.length > 100) {
      errorList.shift();
    }
  }

  // Helper methods for error analysis
  public getErrorStats(): Record<ErrorCategory, number> {
    const stats = {} as Record<ErrorCategory, number>;
    for (const category of Object.values(ErrorCategory)) {
      stats[category] = this.errorLog.get(category)?.length || 0;
    }
    return stats;
  }
}
