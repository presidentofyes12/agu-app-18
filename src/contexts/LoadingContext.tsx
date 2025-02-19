// src/contexts/LoadingContext.tsx

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { LoadingStateManager, LoadingPriority, LoadingOperation } from '../services/LoadingStateManager';


interface LoadingContextType {
  startLoading: (
    name: string, 
    options?: {
      priority?: LoadingPriority;
      estimatedDuration?: number;
      dependencies?: string[];
      context?: any;
    }
  ) => string;
  updateProgress: (id: string, progress: number) => void;
  completeLoading: (id: string) => void;
  isLoading: boolean;
  currentOperations: LoadingOperation[];
  performanceMetrics: ReturnType<LoadingStateManager['getPerformanceMetrics']>;
}

// Type-safe method forwarding
const createTypedMethods = (loadingManager: LoadingStateManager) => ({
  startLoading: (
    name: string,
    options?: Parameters<LoadingStateManager['startLoading']>[1]
  ) => loadingManager.startLoading(name, options),
  
  updateProgress: (id: string, progress: number) => 
    loadingManager.updateProgress(id, progress),
  
  completeLoading: (id: string) => 
    loadingManager.completeLoading(id)
});

/*interface LoadingContextType {
  startLoading: (name: string, options?: {
    priority?: LoadingPriority;
    estimatedDuration?: number;
    dependencies?: string[];
    context?: any;
  }) => string;
  updateProgress: (id: string, progress: number) => void;
  completeLoading: (id: string) => void;
  isLoading: boolean;
  currentOperations: LoadingOperation[];
  performanceMetrics: Array<{
    totalDuration: number;
    occurrences: number;
    averageDuration: number;
    name: string;
  }>;
}*/

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({
  children,
  fallback
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [loadingManager] = useState(() => new LoadingStateManager());
  const methods = useMemo(() => createTypedMethods(loadingManager), [loadingManager]);
  const [loadingState, setLoadingState] = useState(loadingManager.getLoadingState());
// Update state definition
const [metrics, setMetrics] = useState<Array<{
  totalDuration: number;
  occurrences: number;
  averageDuration: number;
  name: string;
}>>([]);

  useEffect(() => {
    const handleStateChange = (newState: any) => {
      setLoadingState(newState);
      setMetrics(loadingManager.getPerformanceMetrics());
    };

    loadingManager.on('loadingStateChanged', handleStateChange);
    
    return () => {
      loadingManager.removeListener('loadingStateChanged', handleStateChange);
    };
  }, [loadingManager]);

// Update method calls with proper typing
/*const value: LoadingContextType = {
  startLoading: (name: string, options?: {
    priority?: LoadingPriority;
    estimatedDuration?: number;
    dependencies?: string[];
    context?: any;
  }) => loadingManager.startLoading(name, options),
  updateProgress: (id: string, progress: number) => 
    loadingManager.updateProgress(id, progress),
  completeLoading: (id: string) => loadingManager.completeLoading(id),
  isLoading: loadingState.isLoading,
  currentOperations: loadingState.operations,
  performanceMetrics: metrics
};*/

  const value: LoadingContextType = {
    ...methods,
    isLoading: loadingState.isLoading,
    currentOperations: loadingState.operations,
    performanceMetrics: metrics
  };

  return (
    <LoadingContext.Provider value={value}>
      {loadingState.highPriorityCount > 0 && fallback ? fallback : children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
