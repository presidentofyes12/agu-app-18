// src/components/ErrorBoundary/index.tsx

import React from 'react';
import { LoadingPriority } from '../../services/LoadingStateManager';
import { useLoading } from '../../contexts/LoadingContext';

// First, define proper interfaces for props and state
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          onReset={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

// Define types for ErrorFallback props
interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  onReset: () => void;
}

function ErrorFallback({
  error,
  errorInfo,
  onReset
}: ErrorFallbackProps) {
  return (
    <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <details className="text-sm">
        <summary>View error details</summary>
        <pre className="mt-2 p-2 bg-background rounded">
          {error.toString()}
          {errorInfo.componentStack}
        </pre>
      </details>
      <button
        onClick={onReset}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Try again
      </button>
    </div>
  );
}

// Update the LoadingErrorBoundary to use proper types
interface LoadingErrorBoundaryProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LoadingErrorBoundary({
  children,
  loadingFallback,
  errorFallback
}: LoadingErrorBoundaryProps) {
  const { isLoading } = useLoading();

  return (
    <ErrorBoundary fallback={errorFallback}>
      {isLoading && loadingFallback ? loadingFallback : children}
    </ErrorBoundary>
  );
}
