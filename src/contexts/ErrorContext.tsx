// src/contexts/ErrorContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ErrorHandler, DAOError, ErrorCategory } from '../services/ErrorHandler';

interface ErrorContextType {
  handleError: (error: Error, context: any) => Promise<void>;
  clearError: (id: string) => void;
  currentError: DAOError | null;
  isRetrying: boolean;
  retryCount: number;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errorHandler] = useState(() => new ErrorHandler());
  const [currentError, setCurrentError] = useState<DAOError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleUnrecoverableError = (error: DAOError) => {
      setCurrentError(error);
      setIsRetrying(false);
    };

    const handleRetrying = (data: { error: DAOError; retryCount: number }) => {
      setIsRetrying(true);
      setRetryCount(data.retryCount);
    };

    const handleRecovered = () => {
      setCurrentError(null);
      setIsRetrying(false);
      setRetryCount(0);
    };

    errorHandler.on('unrecoverableError', handleUnrecoverableError);
    errorHandler.on('retrying', handleRetrying);
    errorHandler.on('recovered', handleRecovered);

    return () => {
      errorHandler.removeListener('unrecoverableError', handleUnrecoverableError);
      errorHandler.removeListener('retrying', handleRetrying);
      errorHandler.removeListener('recovered', handleRecovered);
    };
  }, [errorHandler]);

  const value = {
    handleError: (error: Error, context: any) => errorHandler.handleError(error, context),
    clearError: () => setCurrentError(null),
    currentError,
    isRetrying,
    retryCount
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
