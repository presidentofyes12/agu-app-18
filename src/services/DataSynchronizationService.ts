// services/DataSynchronizationService.ts
import { ethers } from 'ethers';
import { Event as NostrEvent } from 'nostr-tools';
import { UnifiedEventListener } from './UnifiedEventListener';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWeb3Manager } from 'hooks/useWeb3Manager';

// Define contract event type
interface ContractEvent {
  transactionHash: string;
  blockNumber: number;
  args: any[];
}

// Define state change event type
interface StateChangeEvent {
  type: 'foundation' | 'authority' | 'domain' | 'integration' | 'unified';
  address: string;
  state: any;
}

// Define layer-specific state interfaces
export interface FoundationState {
  level: number;
  capabilities: string[];
  requirements: Array<{
    type: string;
    value: any;
  }>;
  lastSync: number;
}

interface AuthorityState {
  level: number;
  capabilities: string[];
  governanceWeight: number;
  lastSync: number;
}

interface DomainState {
  level: number;
  capabilities: string[];
  parameters: Record<string, any>;
  lastSync: number;
}

interface IntegrationState {
  level: number;
  capabilities: string[];
  crossDAOState: Record<string, any>;
  lastSync: number;
}

interface UnifiedState {
  level: number;
  capabilities: string[];
  fieldState: Record<string, any>;
  lastSync: number;
}

// Update SyncState interface with proper types
interface SyncState {
  foundation: FoundationState;
  authority: AuthorityState;
  domain: DomainState;
  integration: IntegrationState;
  unified: UnifiedState;
}

interface SyncMetadata {
  lastBlockNumber: number;
  lastNostrEventId: string;
  chainId: number;
  version: string;
}

export class DataSynchronizationService {
  private static instance: DataSynchronizationService;
  private provider: ethers.providers.Provider;
  private eventListener: UnifiedEventListener;
  private localState: Map<string, SyncState>;
  private metadata: Map<string, SyncMetadata>;
  private syncInProgress: boolean;
  private syncQueue: Array<() => Promise<void>>;
  private syncInterval: number;
  private db: IDBDatabase | null;

  private constructor(
    provider: ethers.providers.Provider,
    eventListener: UnifiedEventListener
  ) {
    this.provider = provider;
    this.eventListener = eventListener;
    this.localState = new Map();
    this.metadata = new Map();
    this.syncInProgress = false;
    this.syncQueue = [];
    this.syncInterval = 30000; // 30 seconds
    this.db = null;
    this.initializeDB().then(() => this.initializeSyncLoop());
  }

private async initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('syncStateDB', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('states')) {
        db.createObjectStore('states');
      }
    };

    request.onsuccess = () => {
      this.db = request.result;
      resolve(request.result);  // Resolve with the database instance
    };
  });
}

  public static getInstance(
    provider: ethers.providers.Provider,
    eventListener: UnifiedEventListener
  ): DataSynchronizationService {
    if (!DataSynchronizationService.instance) {
      DataSynchronizationService.instance = new DataSynchronizationService(
        provider,
        eventListener
      );
    }
    return DataSynchronizationService.instance;
  }

  private async initializeSyncLoop(): Promise<void> {
    // Set up periodic sync
    setInterval(() => this.syncAll(), this.syncInterval);

    // Listen for blockchain events
    this.provider.on('block', async (blockNumber: number) => {
      await this.handleNewBlock(blockNumber);
    });

    // Subscribe to Nostr events
    this.eventListener.subscribe('state-transition', async (event: NostrEvent) => {
      await this.handleNostrStateTransition(event);
    });
  }

  private async getFoundationState(address: string): Promise<FoundationState> {
    try {
      const contract = new ethers.Contract(
        address,
        ['function getFoundationState() view returns (tuple(uint256 level, string[] capabilities, tuple(string type, bytes value)[] requirements))'],
        this.provider
      );
      
      const state = await contract.getFoundationState();
      return {
        level: state.level.toNumber(),
        capabilities: state.capabilities,
        requirements: state.requirements.map((req: any) => ({
          type: req.type,
          value: req.value
        })),
        lastSync: Date.now()
      };
    } catch (error) {
      console.error('Error fetching foundation state:', error);
      throw error;
    }
  }

  private async getRelevantEvents(blockNumber: number): Promise<ContractEvent[]> {
    try {
      const filter = {
        fromBlock: blockNumber,
        toBlock: blockNumber
      };
      
      const events = await this.provider.getLogs(filter);
      return events.map(event => ({
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        args: event.topics.slice(1) // Remove event signature
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  private hasStateChanged(oldState: any, newState: any): boolean {
    return JSON.stringify(oldState) !== JSON.stringify(newState);
  }

  private async handleContractEvent(event: ContractEvent): Promise<void> {
    try {
      // Extract relevant data from event
      const { transactionHash, blockNumber, args } = event;

      // Update affected addresses
      const address = args[0];
      if (this.localState.has(address)) {
        await this.syncAddress(address);
      }
    } catch (error) {
      console.error('Error handling contract event:', error);
    }
  }

  private async updateStateFromNostr(state: SyncState, event: NostrEvent): Promise<void> {
    try {
      const tags = new Map(
        event.tags.map(([key, value]) => [key, value] as [string, string])
      );
      const stateType = tags.get('type');
      const stateData = JSON.parse(event.content);

      switch (stateType) {
        case 'foundation':
          state.foundation = { ...state.foundation, ...stateData };
          break;
        case 'authority':
          state.authority = { ...state.authority, ...stateData };
          break;
        case 'domain':
          state.domain = { ...state.domain, ...stateData };
          break;
        case 'integration':
          state.integration = { ...state.integration, ...stateData };
          break;
        case 'unified':
          state.unified = { ...state.unified, ...stateData };
          break;
      }
    } catch (error) {
      console.error('Error updating state from Nostr:', error);
      throw error;
    }
  }

  private emitSyncEvent(layer: keyof SyncState, address: string, state: any): void {
    const event: StateChangeEvent = {
      type: layer,
      address,
      state
    };
    this.eventListener.emit('sync', event);
  }

  private async syncAll() {
    if (this.syncInProgress) {
      return;
    }

    try {
      this.syncInProgress = true;
      
      // Process sync queue first
      while (this.syncQueue.length > 0) {
        const syncTask = this.syncQueue.shift();
        if (syncTask) {
          await syncTask();
        }
      }

      // Sync each address
      for (const [address, state] of this.localState) {
        await this.syncAddress(address);
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncAddress(address: string) {
    const state = this.localState.get(address);
    if (!state) return;

    // Sync each layer in order
    await this.syncFoundationLayer(address, state.foundation);
    await this.syncAuthorityLayer(address, state.authority);
    await this.syncDomainLayer(address, state.domain);
    await this.syncIntegrationLayer(address, state.integration);
    await this.syncUnifiedLayer(address, state.unified);

    // Update metadata
    const metadata = this.metadata.get(address);
    if (metadata) {
      metadata.lastBlockNumber = await this.provider.getBlockNumber();
      this.metadata.set(address, metadata);
    }

    // Persist to local storage
    await this.persistState(address);
  }

  private async syncFoundationLayer(address: string, state: SyncState['foundation']) {
    // Get latest foundation state from contracts
    const contractState = await this.getFoundationState(address);
    
    // Check for changes
    if (this.hasStateChanged(state, contractState)) {
      // Update local state
      state.level = contractState.level;
      state.capabilities = contractState.capabilities;
      state.requirements = contractState.requirements;
      state.lastSync = Date.now();

      // Emit sync event
      this.emitSyncEvent('foundation', address, state);
    }
  }

  // Implement layer-specific sync methods
  private async syncAuthorityLayer(address: string, state: AuthorityState): Promise<void> {
    try {
      const contract = new ethers.Contract(
        address,
        ['function getAuthorityState() view returns (tuple(uint256 level, string[] capabilities, uint256 weight))'],
        this.provider
      );
      
      const contractState = await contract.getAuthorityState();
      if (this.hasStateChanged(state, contractState)) {
        state.level = contractState.level.toNumber();
        state.capabilities = contractState.capabilities;
        state.governanceWeight = contractState.weight.toNumber();
        state.lastSync = Date.now();
        
        this.emitSyncEvent('authority', address, state);
      }
    } catch (error) {
      console.error('Error syncing authority layer:', error);
      throw error;
    }
  }

  private async syncDomainLayer(address: string, state: DomainState): Promise<void> {
    // Implementation similar to syncAuthorityLayer
    try {
      const contract = new ethers.Contract(
        address,
        ['function getDomainState() view returns (tuple(uint256 level, string[] capabilities, bytes parameters))'],
        this.provider
      );
      
      const contractState = await contract.getDomainState();
      if (this.hasStateChanged(state, contractState)) {
        state.level = contractState.level.toNumber();
        state.capabilities = contractState.capabilities;
        state.parameters = contractState.parameters;
        state.lastSync = Date.now();
        
        this.emitSyncEvent('domain', address, state);
      }
    } catch (error) {
      console.error('Error syncing domain layer:', error);
      throw error;
    }
  }

  private async syncIntegrationLayer(address: string, state: IntegrationState): Promise<void> {
    // Implementation similar to other sync methods
    try {
      const contract = new ethers.Contract(
        address,
        ['function getIntegrationState() view returns (tuple(uint256 level, string[] capabilities, bytes crossDAOState))'],
        this.provider
      );
      
      const contractState = await contract.getIntegrationState();
      if (this.hasStateChanged(state, contractState)) {
        state.level = contractState.level.toNumber();
        state.capabilities = contractState.capabilities;
        state.crossDAOState = contractState.crossDAOState;
        state.lastSync = Date.now();
        
        this.emitSyncEvent('integration', address, state);
      }
    } catch (error) {
      console.error('Error syncing integration layer:', error);
      throw error;
    }
  }

  private async syncUnifiedLayer(address: string, state: UnifiedState): Promise<void> {
    // Implementation similar to other sync methods
    try {
      const contract = new ethers.Contract(
        address,
        ['function getUnifiedState() view returns (tuple(uint256 level, string[] capabilities, bytes fieldState))'],
        this.provider
      );
      
      const contractState = await contract.getUnifiedState();
      if (this.hasStateChanged(state, contractState)) {
        state.level = contractState.level.toNumber();
        state.capabilities = contractState.capabilities;
        state.fieldState = contractState.fieldState;
        state.lastSync = Date.now();
        
        this.emitSyncEvent('unified', address, state);
      }
    } catch (error) {
      console.error('Error syncing unified layer:', error);
      throw error;
    }
  }

  private async persistState(address: string) {
    const state = this.localState.get(address);
    const metadata = this.metadata.get(address);
    
    if (state && metadata) {
      try {
        // Store in IndexedDB
        await this.storeInIndexedDB(address, {
          state,
          metadata
        });

        // Backup to local storage
        localStorage.setItem(
          `state_${address}`,
          JSON.stringify({ state, metadata })
        );
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
    }
  }

  private async storeInIndexedDB(address: string, data: any) {
    const db = await this.getIndexedDB();
    const tx = db.transaction('states', 'readwrite');
    const store = tx.objectStore('states');
    await store.put(data, address);
  }

private getIndexedDB(): Promise<IDBDatabase> {
  if (this.db) {
    return Promise.resolve(this.db);
  }
  return this.initializeDB();
}

private async loadPersistedState(address: string): Promise<{
  state: SyncState;
  metadata: SyncMetadata;
} | null> {
  try {
    const db = await this.getIndexedDB();
    const tx = db.transaction('states', 'readonly');
    const store = tx.objectStore('states');
    const rawData = await store.get(address);

    if (rawData && 
        'state' in rawData && 
        'metadata' in rawData && 
        this.isValidSyncState(rawData.state) && 
        this.isValidSyncMetadata(rawData.metadata)) {
      return rawData as { state: SyncState; metadata: SyncMetadata };
    }

    // Fall back to localStorage...
      const stored = localStorage.getItem(`state_${address}`);
      if (stored) {
        return JSON.parse(stored);
      }

      return null;
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      return null;
    }
  }

private isValidSyncState(state: any): state is SyncState {
  // We check if the state has all required layers
  if (!state || typeof state !== 'object') return false;
  
  // Check for presence and structure of each layer
  return ['foundation', 'authority', 'domain', 'integration', 'unified'].every(layer => {
    if (!(layer in state)) return false;
    
    // Each layer must be an object with required properties
    const layerState = state[layer];
    return (
      typeof layerState === 'object' &&
      'level' in layerState && typeof layerState.level === 'number' &&
      'capabilities' in layerState && Array.isArray(layerState.capabilities) &&
      'lastSync' in layerState && typeof layerState.lastSync === 'number'
    );
  });
}

private isValidSyncMetadata(metadata: any): metadata is SyncMetadata {
  // Check if metadata has all required properties with correct types
  return (
    metadata &&
    typeof metadata === 'object' &&
    'lastBlockNumber' in metadata && typeof metadata.lastBlockNumber === 'number' &&
    'lastNostrEventId' in metadata && typeof metadata.lastNostrEventId === 'string' &&
    'chainId' in metadata && typeof metadata.chainId === 'number' &&
    'version' in metadata && typeof metadata.version === 'string'
  );
}

  private async handleNewBlock(blockNumber: number) {
    // Check for relevant contract events
    const events = await this.getRelevantEvents(blockNumber);
    
    for (const event of events) {
      // Add sync task to queue
      this.syncQueue.push(async () => {
        await this.handleContractEvent(event);
      });
    }

    if (events.length > 0) {
      // Trigger sync if not already in progress
      if (!this.syncInProgress) {
        await this.syncAll();
      }
    }
  }

  private async handleNostrStateTransition(event: NostrEvent) {
    const address = event.tags.find(t => t[0] === 'p')?.[1];
    if (!address) return;

    // Add sync task to queue
    this.syncQueue.push(async () => {
      const state = this.localState.get(address);
      if (state) {
        // Update state based on Nostr event
        await this.updateStateFromNostr(state, event);
        // Trigger persist
        await this.persistState(address);
      }
    });

    if (!this.syncInProgress) {
      await this.syncAll();
    }
  }

  public async getState(address: string): Promise<SyncState | null> {
    let state = this.localState.get(address);
    
    if (!state) {
      // Try to load from persistence
      const persisted = await this.loadPersistedState(address);
      if (persisted) {
        this.localState.set(address, persisted.state);
        this.metadata.set(address, persisted.metadata);
        state = persisted.state;
      }
    }

    return state || null;
  }

  public async initialize(address: string) {
    // Load or initialize state
    let state = await this.loadPersistedState(address);
    
    if (!state) {
      // Initialize new state
      state = {
        state: this.getInitialState(),
        metadata: {
          lastBlockNumber: await this.provider.getBlockNumber(),
          lastNostrEventId: '',
          chainId: (await this.provider.getNetwork()).chainId,
          version: '1.0.0'
        }
      };
    }

    this.localState.set(address, state.state);
    this.metadata.set(address, state.metadata);

    // Perform initial sync
    await this.syncAddress(address);
  }

  private getInitialState(): SyncState {
    return {
      foundation: {
        level: 0,
        capabilities: [],
        requirements: [],
        lastSync: 0
      },
      authority: {
        level: 0,
        capabilities: [],
        governanceWeight: 1,
        lastSync: 0
      },
      domain: {
        level: 0,
        capabilities: [],
        parameters: {},
        lastSync: 0
      },
      integration: {
        level: 0,
        capabilities: [],
        crossDAOState: {},
        lastSync: 0
      },
      unified: {
        level: 0,
        capabilities: [],
        fieldState: {},
        lastSync: 0
      }
    };
  }
}

// Create a React hook for easy component integration
export const useSynchronizedState = (address: string) => {
  const [state, setState] = useState<SyncState | null>(null);
  const { provider } = useWeb3Manager();
  const eventListener = UnifiedEventListener.getInstance(
    provider,
    'wss://nostr-relay.example.com'
  );

  useEffect(() => {
    const syncService = DataSynchronizationService.getInstance(
      provider,
      eventListener
    );

    // Initialize sync for address
    syncService.initialize(address).then(() => {
      // Get initial state
      syncService.getState(address).then(setState);
    });

    // Subscribe to state updates
    const unsubscribe = eventListener.subscribe('sync', (event) => {
      if (event.address === address) {
        syncService.getState(address).then(setState);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [address, provider]);

  return state;
};
