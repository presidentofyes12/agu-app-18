// types/domain.ts
interface DomainMetrics {
  currentLevel: number;    // Current domain level (16.67-25.00)
  proposalCount: number;   // From StateConstituent
  activeUserCount: number; // From StateConstituent
  currentStage: number;    // From StateConstituent
  reputationScores: Record<string, number>; // From StateConstituent
  treasuryBalance: bigint; // From DAOToken
  lastEpochUpdate: number; // From StateConstituent
  governanceWeight: number;
}

interface DomainCapabilities {
  daoStructure: boolean;   // >= 17.59
  complexGovernance: boolean; // >= 20.37
  sovereignAuthority: boolean; // >= 23.15
}

enum DomainStateType {
  // Basic DAO Structure (17.59-19.44)
  FIRST_DOMAIN = 17.59259259,
  SECOND_DOMAIN = 18.51851852,
  THIRD_DOMAIN = 19.44444444,

  // Complex Governance (20.37-22.22)
  FIRST_AUTHORITY_COMPLEX = 20.37037037,
  SECOND_AUTHORITY_COMPLEX = 21.2962963,
  THIRD_AUTHORITY_COMPLEX = 22.22222222,

  // Sovereign Authority (23.15-25.00)
  FIRST_SOVEREIGN_STATE = 23.14814815,
  SECOND_SOVEREIGN_STATE = 24.07407407,
  THIRD_SOVEREIGN_STATE = 25.00000000
}

interface DomainCapability {
  type: DomainCapabilityType;
  scope: 'basic' | 'complex' | 'sovereign';
  weight: number;
  description: string;
}

enum DomainCapabilityType {
  // Basic DAO Structure (17.59-19.44)
  DEFINE_STRUCTURE = 'define_structure',
  MANAGE_DEPARTMENTS = 'manage_departments',
  SET_POLICIES = 'set_policies',

  // Complex Governance (20.37-22.22)
  MODIFY_GOVERNANCE = 'modify_governance',
  MANAGE_TREASURY = 'manage_treasury',
  VETO_DECISIONS = 'veto_decisions',

  // Sovereign Authority (23.15-25.00)
  SET_DIRECTION = 'set_direction',
  EMERGENCY_ACTIONS = 'emergency_actions',
  STRATEGIC_DECISIONS = 'strategic_decisions'
}
