// services/StateTransitionService.ts
import { ethers } from 'ethers';
import { FoundationService } from './FoundationService';
import { AuthorityService } from './AuthorityService';
import { ContractService } from 'views/components/dashboard/contractService';
/*import { DomainService } from './DomainService';
import { IntegrationService } from './IntegrationService';
import { UnifiedFieldsService } from './UnifiedFieldsService';*/

// Base interface for all system states
export interface SystemState {
  level: number;
  address: string;
  metrics?: SystemMetrics;
  timestamp: number;
  type: string;
}

// Add this near the top of StateTransitionService.ts with the other interfaces
export type TransitionContext = 
  | { state: 'INITIAL' }
  | { state: 'EXECUTING' }
  | { state: 'COMPLETED' }
  | { state: 'FAILED'; error: string };

// Extending the base state for specific layers
export interface FoundationState extends SystemState {
  type: 'FOUNDATION';
  capabilities: string[];
  requirements: string[];
}

// Add system metrics interface
interface SystemMetrics {
  activity: number;
  participation: number;
  contribution: number;
  reputation: number;
}

export class StateTransitionService {
  private static instance: StateTransitionService;
  private provider: ethers.providers.Provider;
  private contractService: ContractService;

  private constructor(
    provider: ethers.providers.Provider,
    contractService: ContractService
  ) {
    this.provider = provider;
    this.contractService = contractService;
  }

  private async getMetrics(address: string): Promise<SystemMetrics> {
    // Get metrics from contracts
    const [activity, participation, contribution, reputation] = await Promise.all([
      this.contractService.getActivityMetrics(address),
      this.contractService.getParticipationMetrics(address),
      this.contractService.getContributionMetrics(address),
      this.contractService.getReputationScore(address)
    ]);

    return {
      activity,
      participation,
      contribution,
      reputation
    };
  }

  private async validateLayerTransition(
    address: string,
    fromState: SystemState,
    toState: SystemState
  ): Promise<boolean> {
    // Implement layer transition validation logic
    // Check requirements for crossing layer boundaries
    const metrics = await this.getMetrics(address);
    const minRequirements = this.getLayerRequirements(toState.level);
    
    return Object.entries(minRequirements).every(
      ([key, value]) => metrics[key as keyof SystemMetrics] >= value
    );
  }

  private async validateRegularTransition(
    address: string,
    fromState: SystemState,
    toState: SystemState
  ): Promise<boolean> {
    // Implement regular transition validation logic
    const metrics = await this.getMetrics(address);
    const requiredIncrease = toState.level - fromState.level;
    
    return metrics.activity >= requiredIncrease * 10 &&
           metrics.participation >= requiredIncrease * 5;
  }

private getLayerRequirements(level: number): Partial<SystemMetrics> {
  type RequirementLevels = {
    [key: string]: { activity: number; participation: number; }
  };

  const requirements: RequirementLevels = {
    "8.333333333": { activity: 100, participation: 50 },
    "16.66666667": { activity: 200, participation: 100 },
    "25.00000000": { activity: 300, participation: 150 },
    "50.00000000": { activity: 400, participation: 200 }
  };
  
  const boundary = Object.keys(requirements)
    .find(b => level >= parseFloat(b)) || "8.333333333";
  
  return requirements[boundary];
}

  private emitStateTransition(
    address: string,
    fromState: SystemState,
    toState: SystemState
  ): void {
    // Emit event for state transition
    this.contractService.stateContract.emit('StateTransition', {
      address,
      fromLevel: fromState.level,
      toLevel: toState.level,
      timestamp: Date.now()
    });
  }

  // Layer-specific state getters
  private async getAuthorityState(
    address: string,
    level: number
  ): Promise<SystemState> {
    return {
      type: 'AUTHORITY',
      level,
      address,
      timestamp: Date.now(),
      metrics: await this.getMetrics(address)
    };
  }

  private async getDomainState(
    address: string,
    level: number
  ): Promise<SystemState> {
    return {
      type: 'DOMAIN',
      level,
      address,
      timestamp: Date.now(),
      metrics: await this.getMetrics(address)
    };
  }

  private async getIntegrationState(
    address: string,
    level: number
  ): Promise<SystemState> {
    return {
      type: 'INTEGRATION',
      level,
      address,
      timestamp: Date.now(),
      metrics: await this.getMetrics(address)
    };
  }

  private async getUnifiedState(
    address: string,
    level: number
  ): Promise<SystemState> {
    return {
      type: 'UNIFIED',
      level,
      address,
      timestamp: Date.now(),
      metrics: await this.getMetrics(address)
    };
  }

// services/StateTransitionService.ts
public static getInstance(
  provider: ethers.providers.Provider | null,
  contractService: ContractService | null
): StateTransitionService | null {
  if (!provider || !contractService) return null;
  
  if (!this.instance) {
    this.instance = new StateTransitionService(provider, contractService);
  }
  return this.instance;
}

  public async getCurrentState(address: string): Promise<SystemState> {
    // Get state from contract
    const rawState = await this.contractService.stateContract.getState(address);
    const level = Number(rawState.level);

    // Determine which layer the address is in
    if (level < 8.333333333) {
      return this.getFoundationState(address, level);
    } else if (level < 16.66666667) {
      return this.getAuthorityState(address, level);
    } else if (level < 25.00000000) {
      return this.getDomainState(address, level);
    } else if (level < 50.00000000) {
      return this.getIntegrationState(address, level);
    } else {
      return this.getUnifiedState(address, level);
    }
  }

private async getFoundationState(
    address: string,
    level: number
): Promise<FoundationState> {
    const service = FoundationService.getInstance(this.contractService);
    const metrics = await this.getMetrics(address);
    const foundationState = await service.evaluateState(address);
    
    // Map FoundationCapability[] to string[] by extracting the type
    return {
        type: 'FOUNDATION',
        level: foundationState.level,
        address: foundationState.address,
        metrics: metrics,
        timestamp: foundationState.timestamp,
        capabilities: foundationState.capabilities.map(cap => cap.type),
        requirements: foundationState.requirements.map(req => req.type)
    };
}

  // Similar methods for other layers...

  public async validateTransition(
    address: string, 
    fromState: SystemState,
    toState: SystemState
  ): Promise<boolean> {
    // Validate state progression
    if (toState.level <= fromState.level) {
      return false;
    }

    // Validate layer transition if crossing boundary
    if (this.isLayerTransition(fromState.level, toState.level)) {
      return this.validateLayerTransition(address, fromState, toState);
    }

    // Validate regular transition
    return this.validateRegularTransition(address, fromState, toState);
  }

  private isLayerTransition(fromLevel: number, toLevel: number): boolean {
    const boundaries = [
      8.333333333,  // Foundation to Authority
      16.66666667,  // Authority to Domain
      25.00000000,  // Domain to Integration
      50.00000000   // Integration to Unified
    ];

    return boundaries.some(boundary => 
      fromLevel < boundary && toLevel >= boundary
    );
  }

  public async executeTransition(
    address: string,
    toState: SystemState
  ): Promise<void> {
    const currentState = await this.getCurrentState(address);
    
    if (!await this.validateTransition(address, currentState, toState)) {
      throw new Error('Invalid transition');
    }

    try {
      // Start transaction
      const tx = await this.contractService.stateContract.updateState(
        address,
        this.formatStateLevel(toState.level)
      );
      await tx.wait();

      // Emit state transition event
      this.emitStateTransition(address, currentState, toState);
    } catch (error) {
      console.error('Transition failed:', error);
      throw error;
    }
  }

  private formatStateLevel(level: number): string {
    // Convert decimal level to contract format (8 decimal places)
    return ethers.utils.parseUnits(
      level.toFixed(8),
      8
    ).toString();
  }
}
