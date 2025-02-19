// src/components/TransactionFlow/TransactionHandler.tsx

import React, { useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { useTransactions } from '../../contexts/TransactionContext';
import { Transaction, TransactionState } from '../../services/TransactionManager';
import { TransactionDialog, GlobalTransactionStatus, useTransactionNotifications } from './index';

export function TransactionHandler() {
  const { recentTransactions } = useTransactions();
  const { hasPendingTransactions } = useTransactionNotifications();
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const lastTransaction = recentTransactions[0];
    if (lastTransaction && (
      lastTransaction.state === TransactionState.PENDING ||
      lastTransaction.state === TransactionState.BROADCASTING ||
      lastTransaction.state === TransactionState.MINING
    )) {
      setActiveTransaction(lastTransaction);
    }
  }, [recentTransactions]);

  return (
    <>
      {/* Transaction Dialog */}
      {activeTransaction && (
        <TransactionDialog
          transaction={activeTransaction}
          onClose={() => setActiveTransaction(null)}
        />
      )}

      {/* Global Status Indicator */}
      {hasPendingTransactions && <GlobalTransactionStatus />}
    </>
  );
}
