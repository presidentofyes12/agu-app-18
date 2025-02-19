// types/transition.ts

export interface SystemMetrics {
  activity: number;
  participation: number;
  contribution: number;
  reputation: number;
}

export interface Capability {
  type: string;
  active: boolean;
  description: string;
}

// Base interface for system states that matches StateTransitionService
export interface BaseSystemState {
  level: number;
  address: string;
  metrics?: SystemMetrics;
  timestamp: number;
  type: string;
}

// Extended interface used in the UI components
export interface SystemState extends BaseSystemState {
  capabilities: Capability[];
}

export interface TransitionRequirement {
  type: string;
  threshold: number;
  currentValue: number;
  description?: string;
}

export interface TransitionRequirements {
  requirements: TransitionRequirement[];
  readyForTransition: boolean;
  nextState: number;
}

// Layer boundaries for state transitions
export const LAYER_BOUNDARIES = {
  FOUNDATION_TO_AUTHORITY: 8.333333333,
  AUTHORITY_TO_DOMAIN: 16.66666667,
  DOMAIN_TO_INTEGRATION: 25.00000000,
  INTEGRATION_TO_UNIFIED: 50.00000000
};

// Layer names mapping
export const LAYER_NAMES: { [key: number]: string } = {
  0: 'Foundation Layer',
  8.333333333: 'Authority Layer',
  16.66666667: 'Domain Layer',
  25.00000000: 'Integration Layer',
  50.00000000: 'Unified Layer'
};
