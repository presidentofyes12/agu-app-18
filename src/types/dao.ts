// types/dao.ts
import { BigNumber } from 'ethers';

export interface DAOStatus {
  proposalCount: number;
  activeUserCount: number;
  currentEpoch: number;
  lastEpochUpdate: number;
  currentStage: number;
  treasury: BigNumber;
  analytics: {
    transactions: number;
    users: number;
    votes: number;
    velocity: number;
  };
  epochProgress: number;
  analyticsData: Array<{
    name: string;
    value: number;
  }>;
}

export interface DomainState {
  level: number;
  capabilities: string[];
  governanceWeight: number;
  lastStateUpdate: number;
}

export interface ProposalState {
  lastUpdate: number;  // Add this to fix the missing property error
  stage: number;
  // ... other proposal state properties
}

export interface IntegrationState {
  level: number;
  currentStage: {
    jurisdiction: boolean;
    powerDomain: boolean;
    authorityDomain: boolean;
    integrationField: boolean;
  };
  crossDAOCapabilities: string[];
  anonymousTransactions: boolean;
}

// types/dao.ts
export interface TokenMetricsProps {
  domainState?: DomainState;
  key?: string;
}

export interface ProposalListProps {
  domainWeight?: number;
  key?: string;
}

export interface GovernanceProps {
  domainLevel: number;
  governanceWeight: number;
  stage: number;
}

export interface ProgressProps {
  value: number;
  max: number;
  className?: string;
}

// Web3 related types
export interface Web3State {
  account: string | null;
  provider: any;
  isActive: boolean;
  chainId: number | null;
}

// For proper typing of window.ethereum events
export interface Web3EventMap {
  accountsChanged: (accounts: string[]) => void;
  chainChanged: (chainId: string) => void;
}

export interface Web3ManagerHook {
  web3State: Web3State;
  contractService: any;
}

// Component prop interfaces for placeholder components
export interface ComponentStateProps {
  state: DomainState;
}

export type DepartmentManagerProps = ComponentStateProps;
export type PolicyManagerProps = ComponentStateProps;
export type RoleManagerProps = ComponentStateProps;
export type ParameterManagerProps = ComponentStateProps;
export type TreasuryManagerProps = ComponentStateProps;
export type VetoManagerProps = ComponentStateProps;
export type StrategyManagerProps = ComponentStateProps;
export type EmergencyControlsProps = ComponentStateProps;
export type ProtocolManagerProps = ComponentStateProps;
