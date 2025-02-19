// src/components/LoadingIndicators/index.tsx

import React, { useEffect, useState } from 'react';
import { LinearProgress, Box, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { Loader2 } from "lucide-react";
import { useLoading } from '../../contexts/LoadingContext';
import { LoadingPriority, LoadingOperation } from '../../services/LoadingStateManager';

// Update LoadingSpinner to use MUI CircularProgress
export function LoadingSpinner({
  delay = 200,
  minDuration = 500
}: {
  delay?: number;
  minDuration?: number;
}) {
  const { isLoading } = useLoading();
  const [shouldShow, setShouldShow] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading && !shouldShow) {
      timeoutId = setTimeout(() => {
        setStartTime(Date.now());
        setShouldShow(true);
      }, delay);
    } else if (!isLoading && shouldShow) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDuration - elapsedTime);
      
      timeoutId = setTimeout(() => {
        setShouldShow(false);
      }, remainingTime);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, shouldShow, delay, minDuration, startTime]);

  if (!shouldShow) return null;

  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <CircularProgress />
    </Box>
  );
}

// Replace the custom Progress component with MUI LinearProgress
export function LoadingProgress() {
  const { currentOperations } = useLoading();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentOperations.length === 0) {
      setProgress(0);
      return;
    }

    const totalProgress = currentOperations.reduce((acc, op) => {
      return acc + (op.progress ?? 0);
    }, 0);

    setProgress(totalProgress / currentOperations.length);
  }, [currentOperations]);

  if (currentOperations.length === 0) return null;

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <LinearProgress variant="determinate" value={progress} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {currentOperations.length} operations in progress
      </Typography>
    </Box>
  );
}

// Loading overlay for high-priority operations
export function LoadingOverlay({
  blur = true,
  showProgress = true
}: {
  blur?: boolean;
  showProgress?: boolean;
}) {
  const { currentOperations } = useLoading();
  const highPriorityOps = currentOperations.filter(
    op => op.priority === LoadingPriority.HIGH
  );

  if (highPriorityOps.length === 0) return null;

  return (
    <div className={`
      fixed inset-0 z-50
      flex items-center justify-center
      bg-background/80
      ${blur ? 'backdrop-blur-sm' : ''}
    `}>
      <div className="max-w-md p-6 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        {showProgress && highPriorityOps.map(operation => (
          <OperationProgress 
            key={operation.id}
            operation={operation}
          />
        ))}
      </div>
    </div>
  );
}

// Individual operation progress indicator
function OperationProgress({ operation }: { operation: LoadingOperation }) {
  const getTimeRemaining = () => {
    if (!operation.estimatedDuration || !operation.progress) return null;
    
    const elapsed = Date.now() - operation.startTime;
    const estimated = operation.estimatedDuration;
    const remaining = ((estimated / (operation.progress / 100)) - elapsed) / 1000;
    
    return remaining > 0 ? `${Math.ceil(remaining)}s remaining` : 'Almost done...';
  };

  return (
    <Box sx={{ my: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">{operation.name}</Typography>
        {operation.progress && (
          <Typography variant="body2">{Math.round(operation.progress)}%</Typography>
        )}
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={operation.progress} 
        sx={{ height: 2 }}
      />
      {operation.estimatedDuration && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
          {getTimeRemaining()}
        </Typography>
      )}
    </Box>
  );
}

// Performance monitoring component
export function LoadingMetrics() {
  const { performanceMetrics } = useLoading();
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance Metrics</h3>
      <div className="space-y-2">
        {performanceMetrics.map(metric => (
          <div 
            key={metric.name}
            className="p-2 bg-muted rounded-lg"
          >
            <div className="flex justify-between">
              <span className="font-medium">{metric.name}</span>
              <span>{Math.round(metric.averageDuration)}ms avg</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {metric.occurrences} occurrences
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Optimize loading state updates using debouncing
function useDebounceLoading(delay = 100) {
  const { isLoading } = useLoading();
  const [debouncedLoading, setDebouncedLoading] = useState(isLoading);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLoading(isLoading);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [isLoading, delay]);

  return debouncedLoading;
}

// Create a suspense-like loading boundary
export function LoadingBoundary({
  children,
  fallback,
  threshold = 500
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  threshold?: number;
}) {
  const debouncedLoading = useDebounceLoading(threshold);

  return (
    <div className="relative">
      {debouncedLoading && (
        <div className="absolute inset-0">
          {fallback}
        </div>
      )}
      <div className={debouncedLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </div>
    </div>
  );
}
