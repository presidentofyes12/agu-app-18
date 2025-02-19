// src/components/ErrorHandling/ErrorDisplay.tsx

import React, { MouseEvent } from 'react';
import { Alert, AlertTitle, Button, Typography } from "@mui/material";
import { Loader2 } from "lucide-react";
import { useError } from '../../contexts/ErrorContext';
import { ErrorCategory } from '../../services/ErrorHandler';

export function ErrorDisplay() {
  const { currentError, isRetrying, retryCount, clearError } = useError();

  if (!currentError) return null;

  const handleDismiss = () => {
    if (currentError) {
      clearError(currentError.id);
    }
  };

  const getErrorMessage = () => {
    switch (currentError.category) {
      case ErrorCategory.TRANSACTION:
        return 'There was an error with your transaction. Please try again.';
      case ErrorCategory.NETWORK:
        return 'Network connection error. Please check your internet connection.';
      case ErrorCategory.CONTRACT_CALL:
        return 'There was an error interacting with the smart contract.';
      case ErrorCategory.NOSTR:
        return 'There was an error with the messaging system.';
      case ErrorCategory.USER_INPUT:
        return 'Please check your input and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <Alert
      severity={isRetrying ? "info" : "error"}
      className="fixed bottom-4 right-4 max-w-md"
    >
      <AlertTitle className="flex items-center">
        {isRetrying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Retrying... (Attempt {retryCount}/3)
          </>
        ) : (
          'Error'
        )}
      </AlertTitle>
      <Typography className="mt-2">
        <p>{getErrorMessage()}</p>
        <p className="text-sm mt-1 text-muted-foreground">
          {currentError.message}
        </p>
        {!isRetrying && currentError.recoverable && (
          <div className="mt-3">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                // Trigger retry if available
                currentError.shouldRetry();
              }}
            >
              Try Again
            </Button>
          </div>
        )}
        {!currentError.recoverable && (
    <Button
      variant="outlined"
      size="small"
      onClick={handleDismiss}
      className="mt-3"
    >
      Dismiss
    </Button>
        )}
      </Typography>
    </Alert>
  );
}

/*// Usage example in a component:
function TransactionComponent() {
  const { handleError } = useError();

  const handleTransaction = async () => {
    try {
      // Attempt transaction
      await performTransaction();
    } catch (error) {
      await handleError(error, {
        operation: 'performTransaction',
        retryCallback: handleTransaction
      });
    }
  };

  return (
    <div>
      <Button onClick={handleTransaction}>
        Perform Transaction
      </Button>
      <ErrorDisplay />
    </div>
  );
}*/
