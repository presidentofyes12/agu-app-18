// src/components/TransactionFlow/index.tsx

import React, { useEffect, useState } from 'react';
import useToast from 'hooks/use-toast';


import { 
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  AlertTitle,
  Button,
  LinearProgress,
  Box,
  Typography
} from '@mui/material';

/*
import { DialogHeader } from "@/components/ui/dialog";
import { AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
*/

import { ethers, BigNumber } from 'ethers';
import { EventEmitter } from 'events';

import { useTransactions } from '../../contexts/TransactionContext';
import { Transaction, TransactionState } from '../../services/TransactionManager';

// src/utils/formatters.ts
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}

// We'll create a type for our custom toast hook to fix the type error
interface ToastAPI {
  showMessage: (message: string, type: 'success' | 'error') => void;
}

export function TransactionDialog({ 
  transaction,
  onClose 
}: { 
  transaction: Transaction;
  onClose: () => void;
}) {
  const progress = calculateProgress(transaction);
  const status = getStatusText(transaction);

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>{transaction.description}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Progress indicator */}
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary" align="center">
              {status}
            </Typography>
          </Box>

          {/* Transaction details */}
          {transaction.hash && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">Transaction Hash:</Typography>
              <Box 
                sx={{ 
                  p: 1, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  wordBreak: 'break-all' 
                }}
              >
                <code>{transaction.hash}</code>
              </Box>
            </Box>
          )}

          {/* Show error if failed */}
          {transaction.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Transaction Failed</AlertTitle>
              {transaction.error.message}
            </Alert>
          )}

          {/* Confirmations progress */}
          {transaction.state === TransactionState.CONFIRMING && (
            <Typography variant="body2" align="center">
              Confirmations: {transaction.confirmations} / {transaction.requiredConfirmations}
            </Typography>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={transaction.state === TransactionState.BROADCASTING ||
                       transaction.state === TransactionState.MINING}
            >
              {transaction.state === TransactionState.COMPLETED ? 'Close' : 'Dismiss'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for transaction UI
function calculateProgress(transaction: Transaction): number {
  switch (transaction.state) {
    case TransactionState.PENDING:
      return 0;
    case TransactionState.BROADCASTING:
      return 20;
    case TransactionState.MINING:
      return 40;
    case TransactionState.CONFIRMING:
      return 40 + (transaction.confirmations / transaction.requiredConfirmations) * 40;
    case TransactionState.COMPLETED:
      return 100;
    case TransactionState.FAILED:
    case TransactionState.REVERTED:
      return 100;
    default:
      return 0;
  }
}

function getStatusText(transaction: Transaction): string {
  switch (transaction.state) {
    case TransactionState.PENDING:
      return 'Waiting for confirmation...';
    case TransactionState.BROADCASTING:
      return 'Broadcasting to network...';
    case TransactionState.MINING:
      return 'Transaction is being mined...';
    case TransactionState.CONFIRMING:
      return `Confirming transaction (${transaction.confirmations}/${transaction.requiredConfirmations})`;
    case TransactionState.COMPLETED:
      return 'Transaction completed successfully';
    case TransactionState.FAILED:
      return 'Transaction failed';
    case TransactionState.REVERTED:
      return 'Transaction reverted on-chain';
    default:
      return 'Unknown state';
  }
}

// Create a component for showing recent transactions
export function RecentTransactions() {
  const { recentTransactions } = useTransactions();

  if (recentTransactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Recent Transactions</h3>
      <div className="space-y-1">
        {recentTransactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
          />
        ))}
      </div>
    </div>
  );
}

// Create a component for individual transaction items
function TransactionItem({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center space-x-3">
        <TransactionStatusIcon state={transaction.state} />
        <div>
          <div className="text-sm font-medium">{transaction.description}</div>
          <div className="text-xs text-muted-foreground">
            {formatTimestamp(transaction.createTime)}
          </div>
        </div>
      </div>
      <TransactionStatusBadge state={transaction.state} />
    </div>
  );
}

// Create status indicator components
function TransactionStatusIcon({ state }: { state: TransactionState }) {
  const iconClass = {
    [TransactionState.PENDING]: "animate-pulse text-yellow-500",
    [TransactionState.BROADCASTING]: "animate-spin text-blue-500",
    [TransactionState.MINING]: "animate-spin text-blue-500",
    [TransactionState.CONFIRMING]: "animate-pulse text-blue-500",
    [TransactionState.COMPLETED]: "text-green-500",
    [TransactionState.FAILED]: "text-red-500",
    [TransactionState.REVERTED]: "text-red-500"
  }[state];

  return (
    <div className={`w-2 h-2 rounded-full ${iconClass}`} />
  );
}

function TransactionStatusBadge({ state }: { state: TransactionState }) {
  const badgeClass = {
    [TransactionState.PENDING]: "bg-yellow-500/10 text-yellow-500",
    [TransactionState.BROADCASTING]: "bg-blue-500/10 text-blue-500",
    [TransactionState.MINING]: "bg-blue-500/10 text-blue-500",
    [TransactionState.CONFIRMING]: "bg-blue-500/10 text-blue-500",
    [TransactionState.COMPLETED]: "bg-green-500/10 text-green-500",
    [TransactionState.FAILED]: "bg-red-500/10 text-red-500",
    [TransactionState.REVERTED]: "bg-red-500/10 text-red-500"
  }[state];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
      {state}
    </span>
  );
}

// Create a hook for managing transaction notifications
export function useTransactionNotifications() {
  const { pendingTransactions, recentTransactions } = useTransactions();
  // Correctly destructure the tuple returned by useToast
  const [_, showMessage, hideMessage] = useToast();

  useEffect(() => {
    const lastTransaction = recentTransactions[0];
    if (!lastTransaction) return;

    switch (lastTransaction.state) {
      case TransactionState.COMPLETED:
        showMessage("Transaction completed successfully", "success");
        break;
      case TransactionState.FAILED:
      case TransactionState.REVERTED:
        showMessage(
          lastTransaction.error?.message || "Transaction failed", 
          "error"
        );
        break;
    }
  }, [recentTransactions, showMessage]);

  return {
    hasPendingTransactions: pendingTransactions.length > 0
  };
}

// Create a component for showing the global transaction status
export function GlobalTransactionStatus() {
  const { pendingTransactions } = useTransactions();

  if (pendingTransactions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 rounded-lg bg-background border shadow-lg">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Pending Transactions</h4>
        {pendingTransactions.map(transaction => (
          <div key={transaction.id} className="text-sm">
            <div className="flex items-center space-x-2">
              <TransactionStatusIcon state={transaction.state} />
              <span>{transaction.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Create a hook for handling transaction submission
export function useTransactionSubmission() {
  const { createTransaction, submitTransaction } = useTransactions();
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  const submit = async (
    description: string,
    contract: ethers.Contract,
    method: string,
    params: any[]
  ) => {
    try {
      // Create the transaction
      const txId = await createTransaction(description, contract, method, params);

      // Submit it and track its state
      await submitTransaction(txId);

      return txId;
    } catch (error) {
      console.error('Transaction submission failed:', error);
      throw error;
    }
  };

  return {
    submit,
    currentTransaction
  };
}
