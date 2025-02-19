// src/contexts/TransactionContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useContractEvents } from 'hooks/useContractEvents';
import { Provider } from 'types/provider';

import { ethers, BigNumber } from 'ethers';
import { UseContractEventsReturn } from '../types/contracts';
import { TransactionManager, Transaction, TransactionState } from '../services/TransactionManager';

interface TransactionContextType {
  createTransaction: (
    description: string,
    contract: ethers.Contract,
    method: string,
    params: any[]
  ) => Promise<string>;
  submitTransaction: (id: string) => Promise<void>;
  getTransaction: (id: string) => Transaction | undefined;
  pendingTransactions: Transaction[];
  recentTransactions: Transaction[];
}

interface TransactionContextValue {
  createTransaction: (
    description: string,
    contract: ethers.Contract,
    method: string,
    params: any[]
  ) => Promise<string>;
  submitTransaction: (id: string) => Promise<void>;
  getTransaction: (id: string) => Transaction | undefined;
  pendingTransactions: Transaction[];
  recentTransactions: Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  // Cast the result with proper type assertion
  const contractEvents = useContractEvents() as unknown as UseContractEventsReturn;
  
  const [transactionManager, setTransactionManager] = useState<TransactionManager | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Initialize transaction manager
  useEffect(() => {
    if (!contractEvents.provider) return;
    
    const manager = new TransactionManager(contractEvents.provider);
    setTransactionManager(manager);
  }, [contractEvents.provider]);

  // Handle transaction updates
  const handleTransactionUpdate = (transaction: Transaction) => {
    // Update pending transactions
    setPendingTransactions(prev => {
      if (transaction.state === TransactionState.COMPLETED ||
          transaction.state === TransactionState.FAILED ||
          transaction.state === TransactionState.REVERTED) {
        return prev.filter(tx => tx.id !== transaction.id);
      }
      return prev;
    });

    // Update recent transactions
    setRecentTransactions(prev => {
      const withoutCurrent = prev.filter(tx => tx.id !== transaction.id);
      if (transaction.state === TransactionState.COMPLETED ||
          transaction.state === TransactionState.FAILED ||
          transaction.state === TransactionState.REVERTED) {
        return [transaction, ...withoutCurrent].slice(0, 10);
      }
      return withoutCurrent;
    });
  };

  const value: TransactionContextValue = {
    createTransaction: async (
      description: string,
      contract: ethers.Contract,
      method: string, 
      params: any[]
    ) => {
      if (!transactionManager) throw new Error('Transaction manager not initialized')
      return await transactionManager.createTransaction(description, contract, method, params)
    },
    
    submitTransaction: async (id: string) => {
      if (!transactionManager) throw new Error('Transaction manager not initialized')
      await transactionManager.submitTransaction(id)
    },

    getTransaction: (id: string) => {
      if (!transactionManager) return undefined
      return transactionManager.getTransaction(id)
    },

    pendingTransactions: [], // Implement state tracking
    recentTransactions: []  // Implement state tracking
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

// Custom hook for using transactions
export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
