// src/hooks/useContractEvents.ts

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAtom } from 'jotai';
import { Web3ReactProvider } from '@web3-react/core'
import { useWeb3React } from './useWeb3ReactProvider';

import { ContractEventManager } from '../services/ContractEventManager';

import {
  providerAtom,
  signerAtom,
  accountAtom,
  chainIdAtom
} from '../state/web3State';


// Define interface for event handling
interface EventHandlers {
  onProposalCreated?: (event: any) => void;
  onVoteCast?: (event: any) => void;
  onDAORegistered?: (event: any) => void;
}

// Define return type for our hook
interface UseContractEventsReturn {
  // Event manager status
  isInitialized: boolean;
  error: Error | null;
  
  // Contract interaction methods
  createProposal: (description: string, category: number) => Promise<string>;
  castVote: (proposalId: string, support: boolean) => Promise<void>;
  
  // Event subscription method
  subscribeToEvents: (handlers: EventHandlers) => void;
  
  // Contract state queries
  getProposal: (proposalId: string) => Promise<any>;
  getActiveMemberCount: () => Promise<number>;
  
  // Manual refresh method
  refreshState: () => Promise<void>;
  
  // Add contract instances
  daoToken: ethers.Contract | null;
  stateConstituent: ethers.Contract | null;
  logicConstituent: ethers.Contract | null;
  viewConstituent: ethers.Contract | null;
}

export function useContractEvents() {
  const { provider, account, isActive, chainId } = useWeb3React();
  const [eventManager, setEventManager] = useState<ContractEventManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [shouldInitialize, setShouldInitialize] = useState(false);
  /*const [contracts, setContracts] = useState<ContractInstances>({
    daoToken: null,
    stateConstituent: null,
    logicConstituent: null,
    viewConstituent: null
  });*/
  const [currentSigner, setCurrentSigner] = useState<ethers.Signer | null>(null);
  
// Add this at the start of the useContractEvents hook, right after the existing state declarations
useEffect(() => {
  if (isActive && provider && account) {
    setShouldInitialize(true);
  }
}, [isActive, provider, account]);
  
  // Log initial hook state
  useEffect(() => {
    console.log('Initialization state changed:', {
      shouldInitialize,
      isInitialized,
      hasProvider: !!provider,
      isActive,
      account,
      chainId
    });
  }, [shouldInitialize, isInitialized, provider, isActive, account, chainId]);

  // Add initialization trigger function
  const initialize = useCallback(async () => {
    console.log('Initialize function called, current state:', {
      shouldInitialize,
      isInitialized
    });
    
    // Force shouldInitialize to true when initialize is called
    setShouldInitialize(true);
    
    // Add a small delay to ensure state update propagates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Set shouldInitialize to true');
  }, []);
  
const [contracts, setContracts] = useState<{
    daoToken: ethers.Contract | null;
    stateConstituent: ethers.Contract | null;
    logicConstituent: ethers.Contract | null;
    viewConstituent: ethers.Contract | null;
}>({
    daoToken: null,
    stateConstituent: null,
    logicConstituent: null,
    viewConstituent: null
});

// First, let's organize our initialization effect
useEffect(() => {
  let mounted = true;
  
  console.log('Contract initialization cycle:', {
    shouldInitialize,
    hasProvider: !!provider,
    isActive,
    account,
    chainId
  });
  
  if (!shouldInitialize) {
    console.log('Waiting for initialization trigger - current state:', {
      isInitialized,
      error
    });
    return;
  }

  if (!provider || !isActive || !account) {
    console.log('Initialization requirements not met:', {
      shouldInitialize,
      hasProvider: !!provider,
      isActive,
      hasAccount: !!account
    });
    return;
  }

  console.log('Starting contract initialization...');
  
  const setupContracts = async () => {
    try {
      // Here's the key change - we handle the provider type correctly
      let web3Provider: ethers.providers.Web3Provider;
      
      // We check if the provider is already a Web3Provider
      if (provider instanceof ethers.providers.Web3Provider) {
        web3Provider = provider;
      } else {
        // If not, we create a new Web3Provider with the provider as ExternalProvider
        web3Provider = new ethers.providers.Web3Provider(
          provider as ethers.providers.ExternalProvider
        );
      }

      console.log('Provider initialized successfully');
      const signer = web3Provider.getSigner(account);
      
      console.log('useContractEvents: Loading contract ABIs');
      // Rest of your initialization code remains the same...
      // Initialize contracts
      const DAOTokenABI = require('../contracts/abis/DAOToken.json');
      const StateConstituentABI = require('../contracts/abis/StateConstituent.json');
      const LogicConstituentABI = require('../contracts/abis/LogicConstituent.json');
      const ViewConstituentABI = require('../contracts/abis/ViewConstituent.json');
      
      const addresses = {
        daoToken: '0x972Dc127cD4bbAfC87f885a554d8208113d768C6',
        logicConstituent: '0x5215bcD28f7A54E11F5A0ca3A687a679Ff69FeCC',
        stateConstituent: '0x98f345C539f67e8D6D5B7ceD4048b4Ee99307910',
        viewConstituent: '0x8A2F613a31d6FdB9EEA3b6e6DD45959d832224FD'
      };

      console.log('useContractEvents: Creating contract instances');
      const newContracts = {
        daoToken: new ethers.Contract(addresses.daoToken, DAOTokenABI, signer),
        stateConstituent: new ethers.Contract(addresses.stateConstituent, StateConstituentABI, signer),
        logicConstituent: new ethers.Contract(addresses.logicConstituent, LogicConstituentABI, signer),
        viewConstituent: new ethers.Contract(addresses.viewConstituent, ViewConstituentABI, signer)
      };

      console.log('Creating contract manager...');
      const manager = new ContractEventManager();
      await manager.initialize(web3Provider, signer);
      
      if (mounted) {
        setContracts(newContracts);
        setEventManager(manager);
        setIsInitialized(true);
        setError(null);
        console.log('Contract initialization successful');
      }
    } catch (error) {
      console.error('Contract initialization failed:', error);
      if (mounted) {
        setError(error instanceof Error ? error : new Error('Failed to initialize'));
        setIsInitialized(false);
      }
    }
  };

  setupContracts();

  return () => {
    mounted = false;
    if (eventManager) {
      eventManager.cleanup();
    }
  };
}, [shouldInitialize, provider, isActive, account, chainId]);

  useEffect(() => {
    const setupSigner = async () => {
      if (provider && account) {
        try {
          const signer = provider.getSigner(account);
          setCurrentSigner(signer);
        } catch (err) {
          console.error('Failed to get signer:', err);
          setCurrentSigner(null);
        }
      }
    };

    setupSigner();
  }, [provider, account]);

  /*useEffect(() => {
    const isPulseChain = chainId === 369 || chainId === 943;
    
    if (!provider || !isActive || !isPulseChain || !currentSigner) {
      setIsInitialized(false);
      if (!isPulseChain && isActive) {
        setError(new Error('Please connect to PulseChain network'));
      }
      return;
    }

    try {
      const manager = new ContractEventManager(provider, currentSigner);
      setEventManager(manager);
      setIsInitialized(true);
      setError(null);

      return () => {
        manager.cleanup();
        setEventManager(null);
        setIsInitialized(false);
      };
    } catch (err) {
      console.error('Failed to initialize contracts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error initializing contracts'));
      setIsInitialized(false);
    }
  }, [provider, account, isActive, chainId, currentSigner]);

  // Initialize the event manager when dependencies change
  useEffect(() => {
    // We'll add specific checks for PulseChain
    const isPulseChain = chainId === 369 || chainId === 943;
    
    if (!provider || !isActive || !isPulseChain) {
      setIsInitialized(false);
      if (!isPulseChain && isActive) {
        setError(new Error('Please connect to PulseChain network'));
      }
      return;
    }

    try {
      // Get signer from provider
      const signer = provider.getSigner(account);
      // Create new event manager instance
            // Set up contract instances using the signer
      const contractSetup = async () => {
        const DAOTokenABI = require('../contracts/abis/DAOToken.json');
        const StateConstituentABI = require('../contracts/abis/StateConstituent.json');
        const LogicConstituentABI = require('../contracts/abis/LogicConstituent.json');
        const ViewConstituentABI = require('../contracts/abis/ViewConstituent.json');
      
        // Contract addresses - you should get these from your environment config
        const addresses = {
          daoToken: '0x972Dc127cD4bbAfC87f885a554d8208113d768C6',
          logicConstituent: '0x5215bcD28f7A54E11F5A0ca3A687a679Ff69FeCC',
          stateConstituent: '0x98f345C539f67e8D6D5B7ceD4048b4Ee99307910',
          viewConstituent: '0x8A2F613a31d6FdB9EEA3b6e6DD45959d832224FD'
        };
      
        // Initialize contracts
        const newContracts = {
          daoToken: new ethers.Contract(addresses.daoToken, DAOTokenABI, signer),
          stateConstituent: new ethers.Contract(addresses.stateConstituent, StateConstituentABI, signer),
          logicConstituent: new ethers.Contract(addresses.logicConstituent, LogicConstituentABI, signer),
          viewConstituent: new ethers.Contract(addresses.viewConstituent, ViewConstituentABI, signer)
        };
      
        const manager = new ContractEventManager(provider, signer);
        setEventManager(manager);
        setContracts(newContracts);
        setIsInitialized(true);
        setError(null);
      };
      
      // Cleanup function to remove listeners when component unmounts
      return () => {
        if (eventManager) {
          eventManager.cleanup();
        }
        setEventManager(null);
        setIsInitialized(false);
      };
    } catch (err) {
      console.error('Failed to initialize contracts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error initializing contracts'));
      setIsInitialized(false);
    }
  }, [provider, account, isActive, chainId]); // Reinitialize if these dependencies change*/

  // Contract interaction methods wrapped in useCallback
  const createProposal = useCallback(async (
    description: string,
    category: number
  ): Promise<string> => {
    if (!eventManager) {
      throw new Error('Contract event manager not initialized');
    }

    try {
      return await eventManager.createProposal(description, category);
    } catch (err) {
      console.error('Error creating proposal:', err);
      throw err;
    }
  }, [eventManager]);

  const castVote = useCallback(async (
    proposalId: string,
    support: boolean
  ): Promise<void> => {
    if (!eventManager) {
      throw new Error('Contract event manager not initialized');
    }

    try {
      await eventManager.castVote(proposalId, support);
    } catch (err) {
      console.error('Error casting vote:', err);
      throw err;
    }
  }, [eventManager]);

  // Event subscription method
  const subscribeToEvents = useCallback((handlers: EventHandlers) => {
    if (!eventManager) {
      console.warn('Cannot subscribe to events: manager not initialized');
      return;
    }

    // Set up event listeners based on provided handlers
    if (handlers.onProposalCreated) {
      eventManager.on('ProposalCreated', handlers.onProposalCreated);
    }
    if (handlers.onVoteCast) {
      eventManager.on('VoteCast', handlers.onVoteCast);
    }
    if (handlers.onDAORegistered) {
      eventManager.on('DAORegistered', handlers.onDAORegistered);
    }
  }, [eventManager]);

  // Query methods
  const getProposal = useCallback(async (proposalId: string) => {
    if (!eventManager) {
      throw new Error('Contract event manager not initialized');
    }
    return await eventManager.getProposal(proposalId);
  }, [eventManager]);

  const getActiveMemberCount = useCallback(async () => {
    if (!eventManager) {
      throw new Error('Contract event manager not initialized');
    }
    return await eventManager.getActiveMemberCount();
  }, [eventManager]);

  const refreshState = useCallback(async () => {
    if (!eventManager || !provider || !currentSigner) {
      throw new Error('Contract event manager not initialized');
    }

    try {
      eventManager.cleanup();
      //const newManager = new ContractEventManager(provider, currentSigner);
      const newManager = new ContractEventManager();
      setEventManager(newManager);
    } catch (err) {
      console.error('Error refreshing contract state:', err);
      throw err;
    }
  }, [eventManager, provider, currentSigner]);

  //setIsInitialized(true); //

  // Return the contracts along with other values
  return {
    isInitialized,
    error,
    initialize,
    createProposal,
    castVote,
    subscribeToEvents,
    getProposal,
    getActiveMemberCount,
    refreshState,
    // Add contract instances to return value
    daoToken: contracts.daoToken,
    stateConstituent: contracts.stateConstituent,
    logicConstituent: contracts.logicConstituent,
    viewConstituent: contracts.viewConstituent
  };
}

// Usage example in a component:
/*
function ProposalComponent() {
  const {
    isInitialized,
    error,
    createProposal,
    castVote
  } = useContractEvents();

  useEffect(() => {
    if (!isInitialized) return;

    const handlers = {
      onProposalCreated: (event) => {
        console.log('New proposal created:', event);
      },
      onVoteCast: (event) => {
        console.log('Vote cast:', event);
      }
    };

    subscribeToEvents(handlers);
  }, [isInitialized]);

  const handleCreateProposal = async () => {
    try {
      const proposalId = await createProposal(
        "My proposal description",
        1 // category
      );
      console.log('Created proposal:', proposalId);
    } catch (err) {
      console.error('Failed to create proposal:', err);
    }
  };

  return (
    <div>
      {error && <div>Error: {error.message}</div>}
      {!isInitialized && <div>Loading...</div>}
      {isInitialized && (
        <button onClick={handleCreateProposal}>
          Create Proposal
        </button>
      )}
    </div>
  );
}
*/
