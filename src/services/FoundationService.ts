// services/FoundationService.ts
import { ethers } from 'ethers';
import { ContractService } from 'views/components/dashboard/contractService';
import { TokenMetrics, FoundationMetrics } from 'views/components/dashboard/contractService';

export interface FoundationState {
  level: number;
  address: string;
  timestamp: number;
  type: 'FOUNDATION';  // Now it must be exactly "FOUNDATION"
  state: FoundationStateType;
  capabilities: FoundationCapability[];
  requirements: FoundationRequirement[];
  nextState?: FoundationStateType;
}

// Add this to FoundationService.ts
interface TokenMetricsData {
  // Core token metrics
  price: number;
  supply: string;
  marketCap: string;
  volume24h: string;
  priceChange24h: number;
  
  // Staking and treasury metrics
  totalStaked: string;
  treasuryBalance: string;
  
  // Field metrics used in higher states
  fieldStrength?: number;
  fieldSynchronization?: number;
  unityProgress?: number;
  
  // Historical data
  priceHistory: Array<{
    timestamp: number;
    price: number;
  }>;
}

export enum FoundationStateType {
  LEGAL_GROUND_ZERO = 0,
  PRIMARY_RIGHT = 0.925925926,
  SECONDARY_RIGHT = 1.851851852,
  TERTIARY_RIGHT = 2.777777778,
  FIRST_POWER_STATE = 3.703703704,
  SECOND_POWER_STATE = 4.62962963,
  THIRD_POWER_STATE = 5.555555556,
  FIRST_FORMATION_STATE = 6.481481481,
  SECOND_FORMATION_STATE = 7.407407407,
  FORMATION_NEXUS = 8.333333333
}

export interface FoundationCapability {
  type: string;
  active: boolean;
  description: string;
}

export interface FoundationRequirement {
  type: string;
  threshold: number;
  current: number;
}

export class FoundationService {
  private static instance: FoundationService;
  private contractService: ContractService;

  private constructor(contractService: ContractService) {
    this.contractService = contractService;
  }

  public static getInstance(contractService: ContractService): FoundationService {
    if (!FoundationService.instance) {
      FoundationService.instance = new FoundationService(contractService);
    }
    return FoundationService.instance;
  }

// In FoundationService
// services/FoundationService.ts
/*public async evaluateState(address: string): Promise<FoundationState> {
  // Get metrics first
  const tokenMetrics = await this.contractService.getTokenMetrics();
  const balance = await this.contractService.getBalance(address);
  const activity = await this.contractService.getActivityScore(address);
  
  // Calculate state based on metrics
  const state = this.calculateState(balance, tokenMetrics, activity);
  
  // Get capabilities and requirements
  const capabilities = this.getCapabilities(state);
  const requirements = await this.getRequirements(state, address);
  
  return {
    level: Number(state),
    address,
    timestamp: Date.now(),
    type: 'FOUNDATION',
    state,  // Add this to match the interface
    capabilities,
    requirements,
    // Remove metrics as it's not in the interface
  };
}*/

// Update this method in FoundationService
// Then in the evaluateState method, we ensure we're returning exactly that:
public async evaluateState(address: string): Promise<FoundationState> {
    const metrics = await this.contractService.getMetrics(address);
    
    const state = this.calculateState(
        metrics.balance.toBigInt(),
        metrics.tokenMetrics,
        metrics.activityScore
    );
    
    return {
        level: Number(state),
        address,
        timestamp: Date.now(),
        type: 'FOUNDATION' as const,  // TypeScript now knows this is exactly "FOUNDATION"
        state,
        capabilities: this.getCapabilities(state),
        requirements: await this.getRequirements(state, address)
    };
}

// services/FoundationService.ts
private calculateState(
    balance: bigint,
    tokenMetrics: TokenMetrics,  // Now using the correct interface
    activity: number
): FoundationStateType {
  // Start at Legal Ground Zero
  let state = FoundationStateType.LEGAL_GROUND_ZERO;

  // Progress through states based on criteria
  if (balance > BigInt(0)) {
    state = FoundationStateType.PRIMARY_RIGHT;
  }
  if (activity > 0) {
    state = FoundationStateType.SECONDARY_RIGHT;
  }
  // Continue for other states...

  return state;
}

  private getCapabilities(state: FoundationStateType): FoundationCapability[] {
    const capabilities: FoundationCapability[] = [];
    
    // Add capabilities based on state
    if (state >= FoundationStateType.PRIMARY_RIGHT) {
      capabilities.push({
        type: 'VIEW_METRICS',
        active: true,
        description: 'View basic token metrics'
      });
    }
    // Add more capabilities...

    return capabilities;
  }

  private async getRequirements(
    state: FoundationStateType,
    address: string
  ): Promise<FoundationRequirement[]> {
    // Get requirements for next state
    const nextState = this.getNextState(state);
    if (!nextState) return [];

    const requirements: FoundationRequirement[] = [];
    const metrics = await this.contractService.getTokenMetrics();

    switch (nextState) {
      case FoundationStateType.PRIMARY_RIGHT:
        requirements.push({
          type: 'TOKEN_BALANCE',
          threshold: 1,
          current: Number(ethers.utils.parseEther(metrics.treasuryBalance))
        });
        break;
      // Add other state requirements...
    }

    return requirements;
  }

private getNextState(state: FoundationStateType): FoundationStateType | undefined {
    const states = Object.values(FoundationStateType).filter(x => typeof x === 'number') as FoundationStateType[];
    const currentIndex = states.indexOf(state);
    return currentIndex < states.length - 1 ? states[currentIndex + 1] : undefined;
}
}
