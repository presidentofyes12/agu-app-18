// hooks/useWeb3Manager.ts

import { useState, useCallback, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { ContractService } from 'views/components/dashboard/contractService';
import { ContractEventManager } from '../services/ContractEventManager';
import { FoundationService, FoundationState } from '../services/FoundationService';
import { DomainState, IntegrationState } from '../types/dao';

// Let's define our Web3State interface more completely
interface Web3State {
  account: string | null;
  provider: any;
  isActive: boolean;
  chainId?: number;
  fieldLevel?: number;
  fieldCapabilities?: string[];
}

// First, let's define what our Web3Manager should return
interface Web3ManagerReturn {
  isInitialized: boolean;
  contractManager: ContractEventManager | null;
  contractService: ContractService | null;  // Add this
  error: Error | null;
  contracts: null;
  startInitialization: () => Promise<void>;
  isWalletConnecting: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  web3State: {
    account: string | null;
    provider: any;
    isActive: boolean;
    chainId: number | undefined;
  };
  foundationState: FoundationState | undefined;
  domainState: DomainState | undefined;     // Add this since you have it
  integrationState: IntegrationState | undefined;  // Add this since you have it
  provider: ethers.providers.Web3Provider; // Add this line
}

export function useWeb3Manager(): Web3ManagerReturn {
  // Add the missing state hooks
  const [web3State, setWeb3State] = useState<Web3State>({
    account: null,
    provider: null,
    isActive: false,
    chainId: undefined
  });
  
  // Add contractService state
  const [contractService, setContractService] = useState<ContractService | null>(null);
  const [hasInitializationStarted, setHasInitializationStarted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [contractManager, setContractManager] = useState<ContractEventManager | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [contracts, setContracts] = useState(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [domainState, setDomainState] = useState<DomainState>();
  const [integrationState, setIntegrationState] = useState<IntegrationState>();
  const [foundationState, setFoundationState] = useState<FoundationState>();

  // Get Web3React context
  const { account, provider, isActive, connector, chainId } = useWeb3React();

  // Update connection status whenever wallet state changes
  useEffect(() => {
    if (isActive && account) {
      setConnectionStatus('connected');
      console.log('Wallet connected:', { account, chainId });
    } else if (isWalletConnecting) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isActive, account, chainId, isWalletConnecting]);

  // Separate function just for wallet connection
  const connectWallet = useCallback(async () => {
    if (!connector) {
      console.log('No connector available');
      return false;
    }

    try {
      setIsWalletConnecting(true);
      setConnectionStatus('connecting');
      await connector.activate();
      console.log('Wallet connection triggered');
      return true;
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect wallet'));
      setConnectionStatus('disconnected');
      return false;
    } finally {
      setIsWalletConnecting(false);
    }
  }, [connector]);

  // Initialize contracts only after explicit wallet connection
  const startInitialization = useCallback(async () => {
    try {
      setConnectionStatus('connecting');

      // Now TypeScript knows about window.ethereum
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();

      // Initialize contract service
      const CONTRACT_ADDRESS = "0x473b40c989A259eAcED8D8829A1517692aEa8c82";
      const newContractService = new ContractService(provider, CONTRACT_ADDRESS);
      setContractService(newContractService);

      // Initialize foundation service with the new contract service
      const foundationService = FoundationService.getInstance(newContractService);
      const initialState = await foundationService.evaluateState(accounts[0]);
      setFoundationState(initialState);

      // Safely check domain and integration states
      if (domainState?.level && integrationState?.level && 
          domainState.level >= 25.00 && integrationState.level >= 50.00) {
        const fieldState = await newContractService.getFieldState();
        setWeb3State(prev => ({
          ...prev,
          fieldLevel: fieldState.level,
          fieldCapabilities: fieldState.capabilities
        }));
      }
    console.log('startInitialization called with state:', {
      hasInitializationStarted,
      isActive,
      hasProvider: !!provider,
      account
    });

    // Always try to connect wallet first
    console.log('Starting wallet connection...');
    const connected = await connectWallet();
    
    if (!connected) {
      console.log('Wallet connection failed or declined');
      return;
    }

    // Only proceed with contract initialization if wallet is properly connected
    if (!isActive || !provider) {
      console.log('Missing requirements:', { isActive, hasProvider: !!provider });
      return;
    }

    setHasInitializationStarted(true);
    console.log('Creating Web3Provider and ContractManager...');
    
    const web3Provider = new ethers.providers.Web3Provider(provider as any);
    const signer = web3Provider.getSigner();
    console.log('Got signer for account:', await signer.getAddress());

    const manager = new ContractEventManager();
    console.log('Initializing ContractManager...');
    await manager.initialize(web3Provider, signer);
    
    console.log('Contract initialization successful');
    
  if (domainState?.level !== undefined && integrationState?.level !== undefined && domainState.level >= 25.00 && integrationState.level >= 50.00) {
    const fieldState = await newContractService.getFieldState();
    setWeb3State(prev => ({
      ...prev,
      fieldLevel: fieldState.level,
      fieldCapabilities: fieldState.capabilities
    }));
  }
  
    setContractManager(manager);
    setIsInitialized(true);
    setError(null);
    } catch (err) {
      console.error('Failed to initialize Web3:', err);
      setError(err instanceof Error ? err : new Error('Unknown error during initialization'));
      setIsInitialized(false);
    }
}, [provider, isActive, connectWallet, hasInitializationStarted, domainState, integrationState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (contractManager) {
        contractManager.cleanup();
      }
    };
  }, [contractManager]);

  // Add foundation state tracking
  useEffect(() => {
    if (web3State.account && contractService) {
      const trackFoundationState = async () => {
        const foundationService = FoundationService.getInstance(contractService);
        const state = await foundationService.evaluateState(web3State.account!);
        setFoundationState(state);
      };

      trackFoundationState();
      const interval = setInterval(trackFoundationState, 30000);
      return () => clearInterval(interval);
    }
  }, [web3State.account, contractService]);

  return {
    isInitialized,
    contractManager,
    contractService,  // Add this line
    provider: web3State.provider, // Adding the missing property
    error,
    contracts: null,
    startInitialization,
    isWalletConnecting,
    connectionStatus,
    web3State: {
      account: account ?? null,
      provider,
      isActive,
      chainId
    },
    foundationState,
    domainState,      // Add this
    integrationState  // Add this
  };
}
