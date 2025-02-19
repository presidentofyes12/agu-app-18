// services/AuthorityService.ts
import { ContractService } from 'views/components/dashboard/contractService';

export enum AuthorityStateType {
  // Secondary Formation (8.33-10.19)
  SECONDARY_FORMATION = 9.259259259,
  TERTIARY_FORMATION = 10.18518519,

  // Power States (11.11-12.96)
  FIRST_POWER = 11.11111111,
  SECOND_POWER = 12.03703704,
  THIRD_POWER = 12.96296296,

  // Authority States (13.89-16.67)
  FIRST_AUTHORITY = 13.88888889,
  SECOND_AUTHORITY = 14.81481481,
  THIRD_AUTHORITY = 15.74074074,
  COMPLETE_AUTHORITY = 16.66666667
}

export interface VotingCapability {
  type: VotingCapabilityType;
  requiredState: AuthorityStateType;
  description: string;
}

export enum VotingCapabilityType {
  BASIC_VOTE = 'basic_vote',           // 9.26: Basic voting rights
  TEAM_VOTE = 'team_vote',             // 10.19: Vote on team matters
  WEIGHTED_VOTE = 'weighted_vote',      // 11.11: Voting power multiplier
  DELEGATION = 'delegation',            // 12.04: Delegate votes
  CREATE_PROPOSAL = 'create_proposal',  // 13.89: Create proposals
  VETO_VOTE = 'veto_vote',             // 14.81: Veto rights
  EMERGENCY_VOTE = 'emergency_vote'     // 15.74: Emergency voting powers
}

export interface AuthorityStateResponse {
  level: number;
  capabilities: VotingCapabilityType[];
  timestamp: number;
  address: string;
}

export class AuthorityService {
  private static instance: AuthorityService;
  private contractService: ContractService;

  public static getInstance(contractService: ContractService): AuthorityService {
    if (!AuthorityService.instance) {
      AuthorityService.instance = new AuthorityService(contractService);
    }
    return AuthorityService.instance;
  }

  private constructor(contractService: ContractService) {
    this.contractService = contractService;
  }

  public async getCurrentState(address: string): Promise<AuthorityStateResponse> {
    try {
      // Get base metrics from contract
      const baseMetrics = await this.contractService.getAuthorityMetrics(address);
      const level = Number(baseMetrics.level);
      
      // Get all capabilities for this level
      const capabilities = Object.values(VotingCapabilityType)
        .filter(capability => {
          const requiredState = this.getRequiredState(capability);
          return level >= requiredState;
        });

      return {
        level,
        capabilities,
        timestamp: Date.now(),
        address
      };
    } catch (error) {
      console.error('Error getting authority state:', error);
      throw error;
    }
  }

public async getVotingPower(
  address: string,
  baseAmount: bigint
): Promise<bigint> {
  const state = await this.getCurrentState(address);
  
  // Calculate multiplier based on authority level
  let multiplier = 1.0;
  if (state.level >= AuthorityStateType.FIRST_POWER) {
    multiplier = 1 + ((state.level - 11.11111111) / 5);
  }

  return baseAmount * BigInt(Math.floor(multiplier * 1e9)) / BigInt(1e9);
}

public async hasCapability(
  address: string,
  capability: VotingCapabilityType
): Promise<boolean> {
  const state = await this.getCurrentState(address);
  const requiredState = this.getRequiredState(capability);
  return state.level >= requiredState;
}

  private getRequiredState(capability: VotingCapabilityType): AuthorityStateType {
    switch (capability) {
      case VotingCapabilityType.BASIC_VOTE:
        return AuthorityStateType.SECONDARY_FORMATION;
      case VotingCapabilityType.TEAM_VOTE:
        return AuthorityStateType.TERTIARY_FORMATION;
      case VotingCapabilityType.WEIGHTED_VOTE:
        return AuthorityStateType.FIRST_POWER;
      case VotingCapabilityType.DELEGATION:
        return AuthorityStateType.SECOND_POWER;
      case VotingCapabilityType.CREATE_PROPOSAL:
        return AuthorityStateType.FIRST_AUTHORITY;
      case VotingCapabilityType.VETO_VOTE:
        return AuthorityStateType.SECOND_AUTHORITY;
      case VotingCapabilityType.EMERGENCY_VOTE:
        return AuthorityStateType.THIRD_AUTHORITY;
      default:
        return AuthorityStateType.SECONDARY_FORMATION;
    }
  }
}
