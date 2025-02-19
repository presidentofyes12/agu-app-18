// src/services/LoadingStateManager.ts

import { EventEmitter } from 'events';

// We define different loading state priorities to handle concurrent operations
export enum LoadingPriority {
  LOW = 0,    // Background operations that don't block UI
  MEDIUM = 1, // Operations that show loading indicators but don't block
  HIGH = 2    // Critical operations that may block UI interaction
}

// We track detailed information about each loading operation
export interface LoadingOperation {
  id: string;
  name: string;
  priority: LoadingPriority;
  startTime: number;
  estimatedDuration?: number;
  progress?: number;
  dependencies?: string[];
  context?: any;
}

export class LoadingStateManager extends EventEmitter {
  // We maintain multiple maps to efficiently track different aspects of loading states
  private activeOperations: Map<string, LoadingOperation>;
  private operationsByPriority: Map<LoadingPriority, Set<string>>;
  private dependencyGraph: Map<string, Set<string>>;
  private timeoutHandlers: Map<string, NodeJS.Timeout>;

  // We track performance metrics to optimize future operations
  private performanceMetrics: Map<string, {
    totalDuration: number;
    occurrences: number;
    averageDuration: number;
  }>;

  constructor() {
    super();
    this.activeOperations = new Map();
    this.operationsByPriority = new Map([
      [LoadingPriority.LOW, new Set()],
      [LoadingPriority.MEDIUM, new Set()],
      [LoadingPriority.HIGH, new Set()]
    ]);
    this.dependencyGraph = new Map();
    this.timeoutHandlers = new Map();
    this.performanceMetrics = new Map();
  }

  // Start tracking a new loading operation
  public startLoading(
    name: string,
    options: {
      priority?: LoadingPriority;
      estimatedDuration?: number;
      dependencies?: string[];
      context?: any;
    } = {}
  ): string {
    // Generate unique ID for this operation
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const operation: LoadingOperation = {
      id,
      name,
      priority: options.priority ?? LoadingPriority.MEDIUM,
      startTime: Date.now(),
      estimatedDuration: options.estimatedDuration,
      dependencies: options.dependencies,
      context: options.context
    };

    // Record the operation
    this.activeOperations.set(id, operation);
    this.operationsByPriority.get(operation.priority)?.add(id);

    // Set up dependency tracking
    if (options.dependencies?.length) {
      this.updateDependencyGraph(id, options.dependencies);
    }

    // Set up timeout handling if duration is estimated
    if (options.estimatedDuration) {
      this.setupTimeoutHandler(id, options.estimatedDuration);
    }

    // Emit events
    this.emit('operationStarted', operation);
    this.emit('loadingStateChanged', this.getLoadingState());

    return id;
  }

  // Update progress of an operation
  public updateProgress(id: string, progress: number): void {
    const operation = this.activeOperations.get(id);
    if (!operation) return;

    operation.progress = Math.min(Math.max(progress, 0), 100);
    
    this.emit('progressUpdated', {
      id,
      progress: operation.progress
    });
  }

private cleanupDependencies(operationId: string): void {
  // Remove this operation from the dependency graph
  this.dependencyGraph.delete(operationId);

  // Remove this operation from other operations' dependencies
  for (const dependencies of this.dependencyGraph.values()) {
    dependencies.delete(operationId);
  }
}

  // Complete a loading operation
  public completeLoading(id: string): void {
    const operation = this.activeOperations.get(id);
    if (!operation) return;

    // Update performance metrics
    this.updatePerformanceMetrics(operation);

    // Clean up operation tracking
    this.activeOperations.delete(id);
    this.operationsByPriority.get(operation.priority)?.delete(id);
    this.cleanupDependencies(id);
    this.clearTimeoutHandler(id);

    // Emit events
    this.emit('operationCompleted', operation);
    this.emit('loadingStateChanged', this.getLoadingState());
  }

  // Get current loading state
  public getLoadingState() {
    return {
      isLoading: this.activeOperations.size > 0,
      highPriorityCount: this.operationsByPriority.get(LoadingPriority.HIGH)?.size ?? 0,
      mediumPriorityCount: this.operationsByPriority.get(LoadingPriority.MEDIUM)?.size ?? 0,
      lowPriorityCount: this.operationsByPriority.get(LoadingPriority.LOW)?.size ?? 0,
      operations: Array.from(this.activeOperations.values())
    };
  }

  // Handle dependencies between operations
  private updateDependencyGraph(operationId: string, dependencies: string[]): void {
    this.dependencyGraph.set(operationId, new Set(dependencies));

    // Check if this creates a cycle
    if (this.hasCycle()) {
      this.dependencyGraph.delete(operationId);
      throw new Error('Circular dependency detected in loading operations');
    }
  }

  // Check for cycles in dependency graph using DFS
  private hasCycle(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      const dependencies = this.dependencyGraph.get(node) ?? new Set();
      for (const dep of dependencies) {
        if (dfs(dep)) return true;
      }

      recStack.delete(node);
      return false;
    };

    for (const node of this.dependencyGraph.keys()) {
      if (dfs(node)) return true;
    }

    return false;
  }

  // Update performance metrics for completed operations
  private updatePerformanceMetrics(operation: LoadingOperation): void {
    const duration = Date.now() - operation.startTime;
    const existing = this.performanceMetrics.get(operation.name);

    if (existing) {
      existing.totalDuration += duration;
      existing.occurrences += 1;
      existing.averageDuration = existing.totalDuration / existing.occurrences;
    } else {
      this.performanceMetrics.set(operation.name, {
        totalDuration: duration,
        occurrences: 1,
        averageDuration: duration
      });
    }
  }

  // Handle timeouts for operations
  private setupTimeoutHandler(id: string, duration: number): void {
    const handler = setTimeout(() => {
      const operation = this.activeOperations.get(id);
      if (operation) {
        this.emit('operationTimeout', operation);
      }
    }, duration);

    this.timeoutHandlers.set(id, handler);
  }

  private clearTimeoutHandler(id: string): void {
    const handler = this.timeoutHandlers.get(id);
    if (handler) {
      clearTimeout(handler);
      this.timeoutHandlers.delete(id);
    }
  }

  // Get performance statistics
  public getPerformanceMetrics() {
    return Array.from(this.performanceMetrics.entries()).map(([name, metrics]) => ({
      name,
      ...metrics
    }));
  }
}
