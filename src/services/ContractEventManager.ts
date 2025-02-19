// src/services/ContractEventManager.ts

import { ethers } from 'ethers';

// Import contract ABIs - we have these from the provided JSON files
import DAOTokenABI from 'contracts/abis/DAOToken.json';
import LogicConstituentABI from 'contracts/abis/LogicConstituent.json';
import StateConstituentABI from 'contracts/abis/StateConstituent.json';
import ViewConstituentABI from 'contracts/abis/ViewConstituent.json';
import { EventEmitter } from 'events';

// Define event types for better type safety
export interface ContractEvent {
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp: number;
}

export interface BaseContractEvent extends ethers.Event {
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  timestamp?: number;
  // Include ethers.js Event properties we need
  event: string;
  args: Array<any>;
  removeListener: () => void;
  getBlock: () => Promise<ethers.providers.Block>;
  getTransaction: () => Promise<ethers.providers.TransactionResponse>;
  getTransactionReceipt: () => Promise<ethers.providers.TransactionReceipt>;
}

/*export interface ProposalCreatedEvent extends ContractEvent {
  proposalId: string;
  creator: string;
  startEpoch: number;
  endEpoch: number;
}

export interface VoteCastEvent extends ContractEvent {
  proposalId: string;
  voter: string;
  support: boolean;
  votes: ethers.BigNumber;
}*/

interface ContractInstances {
    daoToken: ethers.Contract | null;
    logicConstituent: ethers.Contract | null;
    stateConstituent: ethers.Contract | null;
    viewConstituent: ethers.Contract | null;
}

export interface DAORegisteredEvent extends ContractEvent {
  globalId: ethers.BigNumber;
  daoAddress: string;
  level: number;
}

// First, let's define an interface for the event structure we expect
export interface ContractEventWithArgs extends ethers.Event {
  event: string;
  args: any[]; // We'll make this more specific below
}

// Now we can define our specific event interfaces
export interface ProposalCreatedEventArgs {
  proposalId: ethers.BigNumber;
  creator: string;
  startEpoch: ethers.BigNumber;
  endEpoch: ethers.BigNumber;
}

export interface ProposalCreatedEvent extends BaseContractEvent {
  args: [ProposalCreatedEventArgs];
  event: 'ProposalCreated';
}

export interface VoteCastEventArgs {
  proposalId: ethers.BigNumber;
  voter: string;
  support: boolean;
  votes: ethers.BigNumber;
}

export interface VoteCastEvent extends BaseContractEvent {
  args: [VoteCastEventArgs];
  event: 'VoteCast';
}

export class ContractEventManager extends EventEmitter {
  /*private provider: ethers.providers.Provider;
  private signer: ethers.Signer | null;*/
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  //private contracts: any = null;
private contracts: ContractInstances = {
    daoToken: null,
    logicConstituent: null,
    stateConstituent: null,
    viewConstituent: null
};

  private readonly contractAddresses = {
    DAO_TOKEN: '0x972Dc127cD4bbAfC87f885a554d8208113d768C6',
    LOGIC_CONSTITUENT: '0x5215bcD28f7A54E11F5A0ca3A687a679Ff69FeCC',
    STATE_CONSTITUENT: '0x98f345C539f67e8D6D5B7ceD4048b4Ee99307910',
    VIEW_CONSTITUENT: '0x8A2F613a31d6FdB9EEA3b6e6DD45959d832224FD'
  };

  constructor() {
    super();
    // No automatic initialization
  }

  public async initialize(provider: ethers.providers.Web3Provider, signerT: ethers.Signer) {
    this.provider = provider;
    this.signer = signerT;
    
    // Only now do we set up contracts
    await this.setupContracts(provider, signerT);
  }

  private async setupContracts(provider: ethers.providers.Web3Provider, signerT: ethers.Signer) {
    // super();
    //this.provider = provider;
    this.signer = signerT || null;

    // Initialize contracts
    this.contracts = {
      daoToken: new ethers.Contract(
        this.contractAddresses.DAO_TOKEN,
        DAOTokenABI,
        this.signer || this.provider
      ),
      logicConstituent: new ethers.Contract(
        this.contractAddresses.LOGIC_CONSTITUENT,
        LogicConstituentABI,
        this.signer || this.provider
      ),
      stateConstituent: new ethers.Contract(
        this.contractAddresses.STATE_CONSTITUENT,
        StateConstituentABI.abi,
        this.signer || this.provider
      ),
      viewConstituent: new ethers.Contract(
        this.contractAddresses.VIEW_CONSTITUENT,
        ViewConstituentABI,
        this.signer || this.provider
      )
    };

    this.setupEventListeners();
  }

private setupEventListeners(): void {
    // Listen for proposal-related events
    if (!this.contracts.stateConstituent) {
        console.warn('State constituent contract not initialized');
        return;
    }
    
    // The below function must be fixed- ABI, deployment, and verification update
    /*this.contracts.stateConstituent.on('ProposalCreated', 
        async (proposalId: ethers.BigNumber, creator: string, startEpoch: ethers.BigNumber, endEpoch: ethers.BigNumber, event: ProposalCreatedEvent) => {
        const block = await event.getBlock();
        
        // Create our processed event object
        const processedEvent = {
          type: 'ProposalCreated',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
          timestamp: block.timestamp,
          data: {
            proposalId: proposalId.toString(),
            creator,
            startEpoch: startEpoch.toNumber(),
            endEpoch: endEpoch.toNumber()
          }
        };

        this.emit('ProposalCreated', processedEvent);
    });*/

    this.contracts.stateConstituent.on('VoteCast',
        async (proposalId: ethers.BigNumber, voter: string, support: boolean, votes: ethers.BigNumber, event: VoteCastEvent) => {
        const block = await event.getBlock();
        
        const processedEvent = {
          type: 'VoteCast',
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
          timestamp: block.timestamp,
          data: {
            proposalId: proposalId.toString(),
            voter,
            support,
            votes: votes.toString()
          }
        };

        this.emit('VoteCast', processedEvent);
    });

    // Monitor DAO registrations
    this.contracts.stateConstituent.on('DAORegistered',
        async (globalId, daoAddress, level, event) => {
        const block = await event.getBlock();
        const timestamp = block.timestamp;

        const daoEvent: DAORegisteredEvent = {
          globalId,
          daoAddress,
          level,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
          timestamp
        };

        this.emit('DAORegistered', daoEvent);
    });

    // Add error handling for contract events
    Object.values(this.contracts).forEach(contract => {
        if (contract) {
            contract.on('error', (error: Error) => {
                console.error('Contract event error:', error);
                this.emit('error', error);
            });
        }
    });
  }

  public async createProposal(description: string, category: number): Promise<string> {
    if (!this.contracts.stateConstituent) {
        throw new Error('State constituent contract not initialized');
    }
    
    if (!this.signer) {
      throw new Error('No signer available');
    }

    const startEpoch = Math.floor(Date.now() / 1000);
    const endEpoch = startEpoch + (7 * 24 * 60 * 60); // 7 days voting period

    const tx = await this.contracts.stateConstituent.createProposal(
      await this.signer.getAddress(),
      category,
      startEpoch,
      endEpoch
    );

    const receipt = await tx.wait();
    // Type casting the event appropriately
    const event = receipt.events?.find(
      (e: ethers.Event): e is ProposalCreatedEvent => e.event === 'ProposalCreated'
    );

    if (!event) {
      throw new Error('Proposal creation event not found');
    }

    return event.args[0].proposalId.toString();
  }

  public async castVote(proposalId: string, support: boolean): Promise<void> {
    if (!this.signer) {
      throw new Error('No signer available');
    }
    
    if (!this.contracts.stateConstituent) {
      throw new Error('StateConstituent not found');
    }

    const tx = await this.contracts.stateConstituent.castVote(
      proposalId,
      support
    );

    await tx.wait();
  }

  // Query methods
public async getProposal(proposalId: string) {
    if (!this.contracts.stateConstituent || !this.contracts.viewConstituent) {
        throw new Error('Required contracts not initialized');
    }

    const proposal = await this.contracts.stateConstituent.getProposalBasicInfo(proposalId);
    const state = await this.contracts.viewConstituent.getProposalState(
        this.contractAddresses.STATE_CONSTITUENT,
        proposalId
    );

    return {
        ...proposal,
        state: state[0],
        forVotes: state[5],
        againstVotes: state[6]
    };
}

public async getActiveMemberCount(): Promise<number> {
    if (!this.contracts.stateConstituent) {
        throw new Error('State constituent contract not initialized');
    }
    return (await this.contracts.stateConstituent.activeMemberCount()).toNumber();
}

  // Cleanup method
public cleanup(): void {
    Object.values(this.contracts).forEach(contract => {
        if (contract) {
            contract.removeAllListeners();
        }
    });
}
}
