// services/UnifiedEventListener.ts
import { ethers } from 'ethers';
import { Event as NostrEvent } from 'nostr-tools';
import { nip19 } from 'nostr-tools';

export interface StateTransitionEvent {
  id: string;
  fromState: number;
  toState: number;
  timestamp: number;
  capabilities: string[];
  proofs: {
    blockchain?: string;
    nostr?: string;
  };
}

export interface CapabilityUnlockEvent {
  id: string;
  capability: string;
  level: number;
  requirements: any[];
  timestamp: number;
}

export class UnifiedEventListener {
  private static instance: UnifiedEventListener;
  private provider: ethers.providers.Provider;
  private nostrRelay: WebSocket;
  private stateTransitions: Map<string, StateTransitionEvent>;
  private capabilityUnlocks: Map<string, CapabilityUnlockEvent>;
  private eventCallbacks: Map<string, Set<(event: any) => void>>;

  private constructor(
    provider: ethers.providers.Provider,
    nostrRelayUrl: string
  ) {
    this.provider = provider;
    this.nostrRelay = new WebSocket(nostrRelayUrl);
    this.stateTransitions = new Map();
    this.capabilityUnlocks = new Map();
    this.eventCallbacks = new Map();
    this.initializeListeners();
  }

  public emit(eventType: string, event: any): void {
    const listeners = this.eventCallbacks.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  public static getInstance(
    provider: ethers.providers.Provider,
    nostrRelayUrl: string
  ): UnifiedEventListener {
    if (!UnifiedEventListener.instance) {
      UnifiedEventListener.instance = new UnifiedEventListener(
        provider,
        nostrRelayUrl
      );
    }
    return UnifiedEventListener.instance;
  }

  private initializeListeners() {
    // Initialize blockchain event listeners
    this.initializeBlockchainListeners();
    
    // Initialize Nostr event listeners
    this.initializeNostrListeners();
  }

  private initializeBlockchainListeners() {
    // Listen for Foundation state changes
    this.provider.on('StateUpdated', (oldState, newState, event) => {
      this.handleStateTransition({
        id: event.transactionHash,
        fromState: oldState,
        toState: newState,
        timestamp: Date.now(),
        capabilities: this.getCapabilitiesForState(newState),
        proofs: {
          blockchain: event.transactionHash
        }
      });
    });

    // Listen for capability unlocks
    this.provider.on('CapabilityUnlocked', (capability, level, event) => {
      this.handleCapabilityUnlock({
        id: event.transactionHash,
        capability,
        level,
        requirements: [],
        timestamp: Date.now()
      });
    });
  }

  private initializeNostrListeners() {
    this.nostrRelay.onopen = () => {
      // Subscribe to state transition events
      const stateFilter = {
        kinds: [1],
        '#t': ['state-transition']
      };
      
      // Subscribe to capability unlock events
      const capabilityFilter = {
        kinds: [1],
        '#t': ['capability-unlock']
      };

      this.nostrRelay.send(JSON.stringify([
        'REQ',
        'state-transitions',
        stateFilter
      ]));

      this.nostrRelay.send(JSON.stringify([
        'REQ',
        'capability-unlocks',
        capabilityFilter
      ]));
    };

    this.nostrRelay.onmessage = (event) => {
      const [type, subId, data] = JSON.parse(event.data);
      if (type === 'EVENT') {
        this.handleNostrEvent(data);
      }
    };
  }

private handleNostrEvent(event: NostrEvent) {
    // Create a helper function to safely get tag values
    const getTagValue = (tagName: string): string | undefined => {
        const tag = event.tags.find(tag => tag[0] === tagName);
        return tag ? tag[1] : undefined;
    };
    
    // Now use the helper function to safely access tag values
    const eventType = getTagValue('type');
    
    if (eventType === 'state-transition') {
        this.handleStateTransition({
            id: event.id,
            fromState: Number(getTagValue('from-state')),
            toState: Number(getTagValue('to-state')),
            timestamp: event.created_at * 1000,
            capabilities: JSON.parse(getTagValue('capabilities') || '[]'),
            proofs: {
                nostr: event.id
            }
        });
    } else if (eventType === 'capability-unlock') {
        this.handleCapabilityUnlock({
            id: event.id,
            capability: String(getTagValue('capability')),
            level: Number(getTagValue('level')),
            requirements: JSON.parse(getTagValue('requirements') || '[]'),
            timestamp: event.created_at * 1000
        });
    }
}

  private handleStateTransition(event: StateTransitionEvent) {
    this.stateTransitions.set(event.id, event);
    this.notifyListeners('state-transition', event);

    // Check for capability unlocks
    const newCapabilities = event.capabilities.filter(cap => 
      !this.hasCapability(event.fromState, cap)
    );

    newCapabilities.forEach(capability => {
      this.handleCapabilityUnlock({
        id: `${event.id}-${capability}`,
        capability,
        level: event.toState,
        requirements: [],
        timestamp: event.timestamp
      });
    });
  }

  private handleCapabilityUnlock(event: CapabilityUnlockEvent) {
    this.capabilityUnlocks.set(event.id, event);
    this.notifyListeners('capability-unlock', event);
  }

  private notifyListeners(eventType: string, event: any) {
    const listeners = this.eventCallbacks.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  public subscribe(
    eventType: string,
    callback: (event: any) => void
  ): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, new Set());
    }
    this.eventCallbacks.get(eventType)?.add(callback);

    return () => {
      this.eventCallbacks.get(eventType)?.delete(callback);
    };
  }

  private hasCapability(state: number, capability: string): boolean {
    // Implement capability check based on state level
    return false;
  }

  private getCapabilitiesForState(state: number): string[] {
    // Implement capability mapping based on state level
    return [];
  }
}
