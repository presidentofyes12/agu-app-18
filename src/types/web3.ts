// types/web3.ts
import { ContractService } from '../views/components/dashboard/contractService';
import { FoundationState } from '../services/DataSynchronizationService';
import { ContractEventManager } from '../services/ContractEventManager';

export interface Web3ManagerState {
  isInitialized: boolean;
  contractManager: ContractEventManager | null;
  contractService: ContractService | null;  // Add this line
  error: Error | null;
  contracts: null;
  startInitialization: () => Promise<void>;
  isWalletConnecting: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  web3State: {
    account: string | null;
    chainId: number | null;
  };
  foundationState: FoundationState | undefined;
}
