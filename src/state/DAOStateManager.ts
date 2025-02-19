// src/state/DAOStateManager.ts

import { ethers } from 'ethers';
import { StateStorage } from '../services/storage';
import { EventEmitter } from 'events';
import { ProposalState, MemberState, TokenMetrics, GovernanceState, DiscussionThread, NostrMessage, ContractInstances, NostrClient, CreateProposalData } from 'types/interfaces';

// First, let's define our core state interfaces to understand what we're managing
interface DAOState {
  // Contract state
  [key: string]: any;
  contractState: {
    proposals: Map<string, ProposalState>;
    members: Map<string, MemberState>;
    tokenMetrics: TokenMetrics;
    governance: GovernanceState;
  };
  
  // Nostr state
  nostrState: {
    discussions: Map<string, DiscussionThread>;
    messages: Map<string, NostrMessage>;
    relayStatus: Map<string, boolean>;
  };
  
  // UI state
  uiState: {
    currentView: string;
    notifications: Notification[];
    modals: Map<string, boolean>;
    loadingStates: Map<string, boolean>;
    errors: Map<string, Error>;
  };
}

// Now let's create our state manager that will handle all state updates
export class DAOStateManager extends EventEmitter {
  private state: DAOState;
  private storage: StateStorage;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;
  private readonly SYNC_INTERVAL = 15000; // 15 seconds
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private provider: ethers.providers.Provider,
    private contracts: ContractInstances,
    private nostrClient: NostrClient
  ) {
    super();
    
    // Initialize state storage with persistence
    this.storage = new StateStorage('dao-state');
    
    // Initialize state with cached data if available
    this.state = this.loadInitialState();
    
    // Set up event subscriptions
    this.setupEventListeners();
  }

  private handleProposalCreated = async (
    proposalId: ethers.BigNumber,
    creator: string,
    event: ethers.Event
  ): Promise<void> => {
    const proposal = await this.fetchProposal(proposalId.toNumber());
    await this.updateState(
      ['contractState', 'proposals'],
      new Map([[proposalId.toString(), proposal]]),
      { merge: true }
    );
  };

  private handleVoteCast = async (
    proposalId: ethers.BigNumber,
    voter: string,
    support: boolean,
    event: ethers.Event
  ): Promise<void> => {
    const proposal = await this.fetchProposal(proposalId.toNumber());
    await this.updateState(
      ['contractState', 'proposals'],
      new Map([[proposalId.toString(), proposal]]),
      { merge: true }
    );
  };

  private handleTransfer = async (
    from: string,
    to: string,
    amount: ethers.BigNumber,
    event: ethers.Event
  ): Promise<void> => {
    await this.syncTokenMetrics();
  };

  private handleNostrMessage = (message: NostrMessage): void => {
    this.updateState(
      ['nostrState', 'messages'],
      new Map([[message.id, message]]),
      { merge: true }
    );
  };

  private handleNostrReaction = (reaction: any): void => {
    // Handle Nostr reactions if needed
  };

  // Add missing sync methods
  private async syncMembers(): Promise<void> {
    const members = await this.fetchMembers();
    await this.updateState(
      ['contractState', 'members'],
      members,
      { merge: true }
    );
  }

  private async syncTokenMetrics(): Promise<void> {
    const metrics = await this.fetchTokenMetrics();
    await this.updateState(
      ['contractState', 'tokenMetrics'],
      metrics
    );
  }

private async fetchMembers(): Promise<Map<string, MemberState>> {
  const memberCount = await this.contracts.stateConstituent.getMemberCount();
  const members = new Map();
  
  for (let i = 0; i < memberCount.toNumber(); i++) {
    //const member = await this.contracts.stateConstituent.getMember(i);
    const member = await this.contracts.stateConstituent.getMember(i.toString());
    members.set(member.address, member);
  }
  
  return members;
}

  private async calculateMarketCap(): Promise<ethers.BigNumber> {
    const [totalSupply, price] = await Promise.all([
      this.contracts.daoToken.totalSupply(),
      this.contracts.daoToken.currentDailyPrice()
    ]);
    return totalSupply.mul(price).div(ethers.constants.WeiPerEther);
  }

private async fetchTokenMetrics(): Promise<TokenMetrics> {
  const [totalSupply, price, marketCap] = await Promise.all([
    this.contracts.daoToken.totalSupply(),
    this.contracts.daoToken.currentDailyPrice(),
    this.calculateMarketCap()
  ]);
  
  return {
    totalSupply,
    price,
    marketCap,
    lastUpdated: Date.now()
  };
}

private async fetchGovernanceState(): Promise<GovernanceState> {
  const [currentEpoch, proposalCount, totalVotingPower] = await Promise.all([
    this.contracts.stateConstituent.getCurrentEpoch(),
    this.contracts.stateConstituent.getProposalCount(),
    this.contracts.daoToken.getTotalVotingPower()
  ]);
  
  return {
    currentEpoch,
    proposalCount,
    totalVotingPower,
    lastUpdated: Date.now()
  };
}

  private async syncGovernance(): Promise<void> {
    const governance = await this.fetchGovernanceState();
    await this.updateState(
      ['contractState', 'governance'],
      governance
    );
  }

  private async syncMessages(): Promise<void> {
    // Implement if needed for Nostr message sync
  }

  private loadInitialState(): DAOState {
    const now = Date.now();
    return {
      contractState: {
        proposals: new Map(),
        members: new Map(),
        tokenMetrics: {
          totalSupply: ethers.BigNumber.from(0),
          price: ethers.BigNumber.from(0),
          marketCap: ethers.BigNumber.from(0),
          lastUpdated: now
        },
        governance: {
          currentEpoch: 0,
          proposalCount: 0,
          totalVotingPower: ethers.BigNumber.from(0),
          lastUpdated: now
        }
      },
      nostrState: {
        discussions: new Map(),
        messages: new Map(),
        relayStatus: new Map()
      },
      uiState: {
        currentView: 'dashboard',
        notifications: [],
        modals: new Map(),
        loadingStates: new Map(),
        errors: new Map()
      }
    };
  }

  private setupEventListeners(): void {
    // Listen for contract events
    this.contracts.stateConstituent.on('ProposalCreated', this.handleProposalCreated.bind(this));
    this.contracts.stateConstituent.on('VoteCast', this.handleVoteCast.bind(this));
    this.contracts.daoToken.on('Transfer', this.handleTransfer.bind(this));

    // Listen for Nostr events
    this.nostrClient.on('message', this.handleNostrMessage.bind(this));
    this.nostrClient.on('reaction', this.handleNostrReaction.bind(this));

    // Set up periodic sync
    this.startSync();
  }

  // State Update Methods
  private async updateState<T extends keyof DAOState>(
    path: string[],
    value: Partial<DAOState[T]>,
    options: {
      persist?: boolean;
      emit?: boolean;
      merge?: boolean;
    } = {}
  ): Promise<void> {
    const { persist = true, emit = true, merge = false } = options;

    let current = this.state as any;
    for (const key of path.slice(0, -1)) {
      current = current[key];
    }
    const lastKey = path[path.length - 1];

    if (merge && typeof current[lastKey] === 'object') {
      current[lastKey] = { ...current[lastKey], ...value };
    } else {
      current[lastKey] = value;
    }

    // Persist if needed
    if (persist) {
      await this.storage.setState(this.state);
    }

    // Emit change event
    if (emit) {
      this.emit('stateChanged', {
        path,
        value,
        timestamp: Date.now()
      });
    }
  }

  // Synchronization Methods
  private async startSync(): Promise<void> {
    // Clear any existing sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Start new sync interval
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncState();
      } catch (error) {
        console.error('State sync failed:', error);
        this.emit('syncError', error);
      }
    }, this.SYNC_INTERVAL);

    // Perform initial sync
    await this.syncState();
  }

  private async syncState(): Promise<void> {
    // Update last sync time
    this.lastSyncTime = Date.now();

    // Sync contract state
    await Promise.all([
      this.syncProposals(),
      this.syncMembers(),
      this.syncTokenMetrics(),
      this.syncGovernance()
    ]);

    // Sync Nostr state
    await Promise.all([
      this.syncDiscussions(),
      this.syncMessages()
    ]);

    // Emit sync completed event
    this.emit('syncCompleted', {
      timestamp: this.lastSyncTime
    });
  }

  // Contract State Sync Methods
  private async syncProposals(): Promise<void> {
    const proposalCount = await this.contracts.stateConstituent.proposalCount();
    const newProposals = new Map();

    // Fetch all proposals in parallel
    const promises = Array.from({ length: proposalCount.toNumber() }, (_, i) =>
      this.fetchProposal(i + 1)
    );

    const proposals = await Promise.all(promises);

    // Update state with new proposals
    for (const proposal of proposals) {
      newProposals.set(proposal.id, proposal);
    }

    await this.updateState(
      ['contractState', 'proposals'],
      newProposals,
      { merge: true }
    );
  }

private async fetchProposal(id: number): Promise<ProposalState> {
  const idString = id.toString();
  const proposalData = await this.contracts.stateConstituent.getProposal(idString);
  const discussion = this.state.nostrState.discussions.get(idString);

  return {
    // id is set in proposalData spread below
    startTime: proposalData.startEpoch.toNumber(),
    endTime: proposalData.endEpoch.toNumber(),
    executed: false,
    ...proposalData,
    discussion: discussion || null,
    lastUpdated: Date.now()
  };
}

  /*private async fetchProposal(id: number): Promise<ProposalState> {
    const proposalData = await this.contracts.stateConstituent.getProposal(id.toString());
    const discussion = this.state.nostrState.discussions.get(proposalData.id || id.toString());

    return {
      id: id.toString(),
      startTime: proposalData.startEpoch.toNumber(),
      endTime: proposalData.endEpoch.toNumber(),
      executed: false, // Set based on contract state
      ...proposalData,
      discussion: discussion || null,
      lastUpdated: Date.now()
    };
  }*/

  // Nostr State Sync Methods
  private async syncDiscussions(): Promise<void> {
    const discussions = await this.nostrClient.getDiscussions();
    const newDiscussions = new Map();

    for (const discussion of discussions) {
      newDiscussions.set(discussion.id, {
        ...discussion,
        lastUpdated: Date.now()
      });
    }

    await this.updateState(
      ['nostrState', 'discussions'],
      newDiscussions,
      { merge: true }
    );
  }

  // UI State Management Methods
  public async updateUI(
    path: string[],
    value: any,
    options: {
      temporary?: boolean;
      duration?: number;
    } = {}
  ): Promise<void> {
    const { temporary = false, duration = 5000 } = options;

    await this.updateState(
      ['uiState', ...path],
      value,
      { persist: !temporary }
    );

    if (temporary) {
      setTimeout(async () => {
        /*await this.updateState(
          ['uiState', ...path],
          null,
          { persist: false }
        );*/
        await this.updateState(
          ['uiState', ...path],
          {} as Partial<DAOState['uiState']>,
          { persist: false }
        );
      }, duration);
    }
  }

  // Public API Methods
  public async getProposal(id: string): Promise<ProposalState | null> {
    const proposal = this.state.contractState.proposals.get(id);
    
    if (!proposal || !this.isProposalCacheFresh(proposal)) {
      return await this.fetchProposal(parseInt(id));
    }

    return proposal;
  }

  public async createProposal(
    data: CreateProposalData
  ): Promise<string> {
    try {
      // Create proposal on chain
      const tx = await this.contracts.stateConstituent.createProposal(
        data.title,
        data.description,
        data.category
      );
      const receipt = await tx.wait();

      // Get proposal ID from event
      const event = receipt.events?.find(e => e.event === 'ProposalCreated');
      const proposalId = event?.args?.proposalId.toString();

      // Create Nostr discussion thread
      await this.nostrClient.createDiscussion({
        proposalId,
        title: data.title,
        description: data.description,
        category: data.category
      });

      // Sync state
      await this.syncProposals();

      return proposalId;
    } catch (error) {
      console.error('Failed to create proposal:', error);
      throw error;
    }
  }

  // Validation and Helper Methods
  private isStateFresh(state: DAOState): boolean {
    return Date.now() - state.lastSyncTime < this.CACHE_DURATION;
  }

  private isProposalCacheFresh(proposal: ProposalState): boolean {
    return Date.now() - proposal.lastUpdated < this.CACHE_DURATION;
  }

  private validateAndUpdateCachedState(cached: DAOState): DAOState {
    // Convert plain objects back to proper types
    return {
      ...cached,
      contractState: {
        ...cached.contractState,
        proposals: new Map(Object.entries(cached.contractState.proposals)),
        members: new Map(Object.entries(cached.contractState.members))
      },
      nostrState: {
        ...cached.nostrState,
        discussions: new Map(Object.entries(cached.nostrState.discussions)),
        messages: new Map(Object.entries(cached.nostrState.messages))
      },
      uiState: {
        ...cached.uiState,
        modals: new Map(Object.entries(cached.uiState.modals)),
        loadingStates: new Map(Object.entries(cached.uiState.loadingStates)),
        errors: new Map(Object.entries(cached.uiState.errors))
      }
    };
  }
}
