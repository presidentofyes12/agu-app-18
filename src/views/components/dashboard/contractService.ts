// Main App: views/components/dashboard/contractService.ts
import { ethers, BigNumber } from 'ethers';
import { RavenService } from '../../../services/RavenService';
import { RPC_URL } from '../../../util/constant';


import StateConstituentABI from 'contracts/abis/StateConstituent.json';
import LogicConstituentABI from 'contracts/abis/LogicConstituent.json';
import ViewConstituentABI from 'contracts/abis/ViewConstituent.json';
import DAOTokenABI from 'contracts/abis/DAOToken.json';

import { 
  IStateConstituent, 
  IViewConstituent, 
  IDAOToken, 
  ILogicConstituent,
  ContractInstances as ImportedContractInstances,
  ProposalData,
  ProposalStateOld
} from 'types/contracts';

import { ProposalStateData } from 'types/contracts';

// Define our domain state types for better type safety
export enum DomainStateType {
    Initial = 'INITIAL',
    Active = 'ACTIVE',
    Mature = 'MATURE'
}

// The base ABI needed for contract interactions
const tokenAbi = [
    // DAO status functions
    "function proposalCount() external view returns (uint256)",
    "function activeUserCount() external view returns (uint256)",
    "function currentEpoch() external view returns (uint256)",
    "function lastEpochUpdate() external view returns (uint256)",
    "function currentStage() external view returns (uint256)",
    "function daoAnalytics() external view returns (uint256, uint256, uint256, uint256)",
    
    // Proposal creation and management
    "function createProposal(address proposer, uint8 category, uint256 startEpoch, uint256 endEpoch) external returns (uint256)",
    
    // Voting functionality
    "function getProposalState(uint256 proposalId) external view returns (uint8, uint256, uint256, bool, bool, uint256, uint256, uint8, uint256)",
    "function castVote(uint256 proposalId, bool support, uint256 voteAmount) external",
    "function getProposalBasicInfo(uint256 proposalId) external view returns (uint256, uint256, bool, bool, uint256, uint256, uint8, uint256)",
    
    // Member management
    "function initializeAdmin() external",
    "function registerMember(address member) external",
    "function isDaoMember(address) external view returns (bool)",
    "function activeDaoList(uint256) external view returns (address)",
    "function daoPosInList(address) external view returns (uint256)",
    
    // Token economics
    "function performAnnualMint() external",
    "function isActiveUser(address) external view returns (bool)",
    "function daoBiddingShares(address) external view returns (uint256)",
    "function lastAnnualMint() external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
    "function placeBid(uint256 amount, uint256 price, bool isPermanent) external",
    "function getDaoLimit(address) external view returns (uint256)",
    "function getTotalDaoBids(address) external view returns (uint256)",
    "function dailyAllocation() external view returns (uint256)",
    "function calculateDailyAllocation() external",
    "function recordActivity(address) external",
    "function lastActivity(address) external view returns (uint256)",
    "function currentDailyPrice() external view returns (uint256)",
    "function treasuryBalance() external view returns (uint256)",
    "function balanceOf(address) external view returns (uint256)"
];

// Define strongly-typed interfaces for our return types
export interface TokenMetrics {
    price: string;
    supply: string;
    treasuryBalance: string;
    activeUsers: number;
    dailyAllocation: string;
    fieldStrength?: number;
    fieldSynchronization?: number;
    unityProgress?: number;
}

/*interface ProposalState {
    state: number;
    startEpoch: number;
    endEpoch: number;
    canceled: boolean;
    executed: boolean;
    forVotes: ethers.BigNumber;
    againstVotes: ethers.BigNumber;
    stage: number;
    proposerReputation: number;
}*/

export interface DomainState {
  level: number;
  state: DomainStateType;  // This exists
  stage: number;           // Add this for the stage property
  capabilities: string[];
  requirements: Requirement[];
  nextState?: DomainStateType;
  governanceWeight: number;
  lastStateUpdate: number;  // Add this to match component usage
}

interface FieldMetrics {
    fieldStrength: number;
    fieldSynchronization: number;
    unityProgress: number;
}

interface Requirement {
    type: string;
    threshold: number;
    current: number;
    description?: string;
    achieved?: boolean;
}

// Add this interface to ContractService.ts
export interface FoundationMetrics {
    tokenMetrics: TokenMetrics;
    fieldMetrics: FieldMetrics;
    balance: ethers.BigNumber;
    activityScore: number;
}

export interface StateContractFunctions {
    proposals(id: number): Promise<any>;
    proposalStage(id: number): Promise<number>;
    // ... other state functions
}

export interface DAOTokenFunctions {
    currentDailyPrice(): Promise<ethers.BigNumber>;
    totalSupply(): Promise<ethers.BigNumber>;
    treasuryBalance(): Promise<ethers.BigNumber>;
    activeUserCount(): Promise<ethers.BigNumber>;
    dailyAllocation(): Promise<ethers.BigNumber>;
    // ... other token functions
}

interface ContractInstances {
    stateConstituent: ethers.Contract & StateContractFunctions;
    daoToken: ethers.Contract & DAOTokenFunctions;
    logicConstituent: ethers.Contract;
    viewConstituent?: ethers.Contract & IViewConstituent; // Make it optional since we don't always need it
}

// In contractService.ts
export interface StateContractFunctions {
    proposals(id: number): Promise<any>;
    proposalStage(id: number): Promise<number>;
    // ... other state functions
}

export interface DAOTokenFunctions {
    currentDailyPrice(): Promise<ethers.BigNumber>;
    totalSupply(): Promise<ethers.BigNumber>;
    treasuryBalance(): Promise<ethers.BigNumber>;
    activeUserCount(): Promise<ethers.BigNumber>;
    dailyAllocation(): Promise<ethers.BigNumber>;
    // ... other token functions
}

// The main ContractService class implementation
/*export class ContractService {
    private readonly provider: ethers.providers.Web3Provider;
    public contract: ethers.Contract; // removed readonly- is redefined later
    private readonly contractAddress: string;
    public readonly stateContract: ethers.Contract;
    public readonly logicContract: ethers.Contract;
    public readonly logicConstituent: ethers.Contract;
    public readonly daoToken: ethers.Contract;*/

// Define a local interface that combines ethers.Contract with our specific interfaces
interface StronglyTypedContracts {
    stateConstituent: ethers.Contract & StateContractFunctions & IStateConstituent;
    daoToken: ethers.Contract & DAOTokenFunctions & IDAOToken;
    logicConstituent: ethers.Contract & ILogicConstituent;
    viewConstituent: ethers.Contract & IViewConstituent;
}

// Enhanced interfaces for the Raven service integration
interface RavenMessage {
    id: string;
    content: string;
    timestamp: number;
    type: 'VOTE_FOR' | 'VOTE_AGAINST' | 'COMMENT';
}

interface RavenProposal {
    id: string;
    content: string;
    created_at: number;
    category?: number;
    isPermanent?: boolean;
}

export class ContractService {
    public readonly provider: ethers.providers.Web3Provider;
    private _raven?: RavenService;
    public get raven(): RavenService {
      if (!this._raven) {
        throw new Error('RavenService not initialized');
      }
      return this._raven;
    }
    public stateContract: ethers.Contract & StateContractFunctions & IStateConstituent;
    public daoToken: ethers.Contract & DAOTokenFunctions & IDAOToken;
    public contract: ethers.Contract;
    private readonly contractAddress: string;
    public readonly logicContract: ethers.Contract & ILogicConstituent;
    public readonly logicConstituent: ethers.Contract & ILogicConstituent;
    public readonly viewContract: ethers.Contract & IViewConstituent;
    public readonly contracts: {
        stateConstituent: ethers.Contract & IStateConstituent;
        daoToken: ethers.Contract & IDAOToken;
        logicConstituent: ethers.Contract & ILogicConstituent;
        viewConstituent?: ethers.Contract & IViewConstituent;
    };


constructor(provider: ethers.providers.Web3Provider, contractAddress: string, raven?: any) {
    // Create provider with explicit network config
    const network = {
        name: "pulsechain",
        chainId: 943,
        ensAddress: null
    };
    // @ts-ignore - Keep the provider assignment despite TypeScript warnings
    this.provider = new ethers.providers.Web3Provider(provider.provider, network);
    this._raven = RavenService.setInstance(raven);
    this.contractAddress = contractAddress;
    
    const signer = provider.getSigner();
        
        // Initialize with proper type assertions
        this.stateContract = new ethers.Contract(
            "0x473b40c989A259eAcED8D8829A1517692aEa8c82",
            tokenAbi,
            signer
        ) as ethers.Contract & StateContractFunctions & IStateConstituent;
        
        this.daoToken = new ethers.Contract(
            "0x23767A0C9A072C6A081C27A1C03Cc95B9F9cc6E0",
            DAOTokenABI,
            signer
        ) as ethers.Contract & DAOTokenFunctions & IDAOToken;
        
        this.logicContract = new ethers.Contract(
            "0x4F10e042C775F5F821339D89d2a5656c7B4C49ba",
            LogicConstituentABI,
            signer
        ) as ethers.Contract & ILogicConstituent;
        
        this.viewContract = new ethers.Contract(
            "0x658D387603B5758336a13b79276Ddd580642121C",
            ViewConstituentABI,
            signer
        ) as ethers.Contract & IViewConstituent;

        this.logicConstituent = this.logicContract;
        
        // Initialize contracts with proper types
        this.contracts = {
            stateConstituent: new ethers.Contract(
                "0x473b40c989A259eAcED8D8829A1517692aEa8c82",
                tokenAbi,
                signer
            ) as ethers.Contract & IStateConstituent,

            daoToken: new ethers.Contract(
                "0x23767A0C9A072C6A081C27A1C03Cc95B9F9cc6E0",
                DAOTokenABI,
                signer
            ) as ethers.Contract & IDAOToken,

            logicConstituent: new ethers.Contract(
                "0x4F10e042C775F5F821339D89d2a5656c7B4C49ba",
                LogicConstituentABI,
                signer
            ) as ethers.Contract & ILogicConstituent,

            viewConstituent: new ethers.Contract(
                "0x658D387603B5758336a13b79276Ddd580642121C",
                ViewConstituentABI,
                signer
            ) as ethers.Contract & IViewConstituent
        };
        
        // Verify contract initialization
        if (!this.verifyContracts()) {
            throw new Error('Contract initialization failed');
        }
        
        this.contract = this.stateContract;
    }

    private verifyContracts(): boolean {
        return !!(
            this.contracts.stateConstituent.provider &&
            this.contracts.daoToken.provider &&
            this.contracts.logicConstituent.provider
        );
    }

    // Field calculation methods
    private calculateFieldStrength(totalSupply: ethers.BigNumber, dailyAllocation: ethers.BigNumber): number {
        const supplyNumber = parseFloat(ethers.utils.formatEther(totalSupply));
        const allocationNumber = parseFloat(ethers.utils.formatEther(dailyAllocation));
        return (allocationNumber / supplyNumber) * 100;
    }

    private calculateSynchronization(dailyAllocation: ethers.BigNumber): number {
        const allocationNumber = parseFloat(ethers.utils.formatEther(dailyAllocation));
        return Math.min(allocationNumber * 2, 100); // Example calculation
    }

    private calculateUnityProgress(activeUsers: number): number {
        const targetUsers = 10000; // Example target
        return Math.min((activeUsers / targetUsers) * 100, 100);
    }

    // Metric gathering methods
    async getActivityMetrics(address: string): Promise<number> {
        const activity = await this.contract.getActivityCount(address);
        return activity.toNumber();
    }

    async getParticipationMetrics(address: string): Promise<number> {
        const participation = await this.contract.getParticipationScore(address);
        return participation.toNumber();
    }

    async getContributionMetrics(address: string): Promise<number> {
        const contribution = await this.contract.getContributionScore(address);
        return contribution.toNumber();
    }

    async getReputationScore(address: string): Promise<number> {
        const reputation = await this.contract.getReputationScore(address);
        return reputation.toNumber();
    }

    // State management methods
    async getState(address: string): Promise<{ level: number }> {
        const state = await this.contract.getState(address);
        return { level: state.toNumber() };
    }

    async updateState(address: string, level: string): Promise<ethers.ContractTransaction> {
        return await this.contract.updateState(address, level);
    }

// Update the getFieldState method to use the new getDomainState
async getFieldState(): Promise<{ level: number; capabilities: string[] }> {
    try {
        const domainState = await this.getDomainState();
        const capabilities = await this.logicConstituent.getDomainCapabilities(
            Math.floor(domainState.level)
        );
        return { 
            level: domainState.level,
            capabilities 
        };
    } catch (error) {
        console.error('Error getting field state:', error);
        throw error;
    }
}

    async getFieldMetrics(): Promise<FieldMetrics> {
        const [totalSupply, dailyAllocation, activeUsers] = await Promise.all([
            this.daoToken.totalSupply(),
            this.daoToken.dailyAllocation(),
            this.daoToken.activeUserCount()
        ]);
        
        return {
            fieldStrength: this.calculateFieldStrength(totalSupply, dailyAllocation),
            fieldSynchronization: this.calculateSynchronization(dailyAllocation),
            unityProgress: this.calculateUnityProgress(activeUsers.toNumber())
        };
    }

// Add this method to ContractService class
async getMetrics(address: string): Promise<FoundationMetrics> {
    try {
        // Get all metrics in parallel for better performance
        const [
            tokenMetrics,
            fieldMetrics,
            balance,
            activityScore
        ] = await Promise.all([
            this.getTokenMetrics(),
            this.getFieldMetrics(),
            this.getBalance(address),
            this.getActivityScore(address)
        ]);

        return {
            tokenMetrics,
            fieldMetrics,
            balance,
            activityScore
        };
    } catch (error) {
        console.error('Error getting foundation metrics:', error);
        throw error;
    }
}

    // DAO status methods
    async validateStateRequirements(address: string, level: number): Promise<boolean> {
        try {
            const [
                balanceReq,
                activityReq,
                reputationReq
            ] = await Promise.all([
                this.validateBalanceRequirement(address, level),
                this.validateActivityRequirement(address, level),
                this.validateReputationRequirement(address, level)
            ]);

            return balanceReq && activityReq && reputationReq;
        } catch (error) {
            console.error('Error validating state requirements:', error);
            throw error;
        }
    }

    private async validateBalanceRequirement(address: string, level: number): Promise<boolean> {
        const balance = await this.getBalance(address);
        const requirement = this.getRequiredBalance(level);
        return balance.gte(requirement);
    }

    private async validateActivityRequirement(address: string, level: number): Promise<boolean> {
        const activity = await this.getActivityScore(address);
        const requirement = this.getRequiredActivity(level);
        return activity >= requirement;
    }

    private async validateReputationRequirement(address: string, level: number): Promise<boolean> {
        const reputation = await this.getReputationScore(address);
        const requirement = this.getRequiredReputation(level);
        return reputation >= requirement;
    }

    private getRequiredBalance(level: number): ethers.BigNumber {
        // Implement balance requirements by level
        return ethers.utils.parseEther('1');
    }

    private getRequiredActivity(level: number): number {
        // Implement activity requirements by level
        return 100;
    }

    private getRequiredReputation(level: number): number {
        // Implement reputation requirements by level
        return 50;
    }

async getDAOStatus(): Promise<{
    proposalCount: number;
    activeUserCount: number;
    treasury: ethers.BigNumber;
    currentEpoch: number;
    lastEpochUpdate: number;
    currentStage: number;
    analytics: {
        transactions: number;
        users: number;
        votes: number;
        velocity: number;
    };
}> {
    try {
        const [
            proposalCount,
            activeUserCount,
            treasury,
            currentEpoch,
            lastEpochUpdate,
            currentStage,
            analyticsData
        ] = await Promise.all([
            this.contract.proposalCount(),
            this.daoToken.activeUserCount(),
            this.daoToken.treasuryBalance(),
            this.contract.currentEpoch(),
            this.contract.lastEpochUpdate(),
            this.contract.currentStage(),
            this.contract.daoAnalytics()
        ]);

        // Since daoAnalytics only returns activeUsers, we'll use that for the users metric
        // and set other analytics values to 0 for now
        return {
            proposalCount: proposalCount.toNumber(),
            activeUserCount: activeUserCount.toNumber(),
            treasury,
            currentEpoch: currentEpoch.toNumber(),
            lastEpochUpdate: lastEpochUpdate.toNumber(),
            currentStage: currentStage.toNumber(),
            analytics: {
                transactions: 0,
                users: analyticsData.toNumber(), // Use the activeUsers value
                votes: 0,
                velocity: 0
            }
        };
    } catch (error) {
        console.error('Error getting DAO status:', error);
        return {
            proposalCount: 0,
            activeUserCount: 0,
            treasury: ethers.BigNumber.from(0),
            currentEpoch: 0,
            lastEpochUpdate: Math.floor(Date.now() / 1000),
            currentStage: 0,
            analytics: {
                transactions: 0,
                users: 0,
                votes: 0,
                velocity: 0
            }
        };
    }
}

// Add this method to the ContractService class
async getDomainState(): Promise<DomainState> {
    try {
        // Get data from state contract
        const [
            daoAnalytics
        ] = await Promise.all([
            this.stateContract.daoAnalytics()
        ]);
        
        const activeUserCount = await this.daoToken.activeUserCount();

        // Calculate level using contract's formula
        const currentStage = await this.stateContract.currentStage();
        const level = 16.67 + (currentStage * 1.85185185);

        const stageNumber = currentStage.toNumber();
        
        // Calculate capabilities based on actual stage progression
        const capabilities = [];
        if (stageNumber >= 1) capabilities.push('DAO_STRUCTURE');
        if (stageNumber >= 2) capabilities.push('COMPLEX_GOVERNANCE');
        if (stageNumber >= 3) capabilities.push('SOVEREIGN_AUTHORITY');

        // Map state based on actual thresholds
        let state = DomainStateType.Initial;
        if (stageNumber >= 2) state = DomainStateType.Active;
        if (stageNumber >= 4) state = DomainStateType.Mature;

        return {
            level,
            state,
            stage: stageNumber,
            capabilities,
            requirements: [{
                type: 'STAGE',
                threshold: stageNumber + 1,
                current: stageNumber,
                description: 'Current stage progress',
                achieved: false
            }],
            nextState: this.calculateNextState(state),
            governanceWeight: Math.pow(2, stageNumber),
            lastStateUpdate: Math.floor(Date.now() / 1000)
        };
    } catch (error) {
        console.error('Failed to get domain state:', error);
        return {
            level: 16.67,
            state: DomainStateType.Initial,
            stage: 0,
            capabilities: [],
            requirements: [],
            nextState: DomainStateType.Active,
            governanceWeight: 1,
            lastStateUpdate: Math.floor(Date.now() / 1000)
        };
    }
}

// Support method for getDomainState
private calculateNextState(currentState: DomainStateType): DomainStateType | undefined {
    const states = Object.values(DomainStateType);
    const currentIndex = states.indexOf(currentState);
    return currentIndex < states.length - 1 ? states[currentIndex + 1] : undefined;
}

private async safeContractCall<T>(
    call: () => Promise<T>,
    fallback: T,
    errorContext: string,
    retries = 3
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
        try {
            // Ensure we have a connection before each attempt
            if (!this.contract.provider) {
                await this.reconnectProvider();
            }
            return await call();
        } catch (error) {
            lastError = error as Error;
            console.error(`Error in ${errorContext} (attempt ${i + 1}/${retries}):`, error);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
    }
    
    console.error(`All ${retries} attempts failed for ${errorContext}:`, lastError);
    return fallback;
}

private async reconnectProvider() {
    if (window.ethereum) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            this.contract = new ethers.Contract(
                this.contractAddress,
                DAOTokenABI,
                signer
            );
        } catch (error) {
            console.error('Failed to reconnect provider:', error);
        }
    }
}

    // Enhanced proposal creation with Raven integration
async createProposal(
    category: number,
    votingPeriod: number,
    title: string,
    description: string,
    postToPulsechain: boolean = false
): Promise<{
    nostrEventId: string;
    proposalHash: string;
}> {
    try {
        // Get current epoch for timing calculations
        const currentEpoch = await this.contracts.stateConstituent.currentEpoch();
        const startEpoch = currentEpoch.add(1);
        const endEpoch = startEpoch.add(BigNumber.from(votingPeriod * 24)); // Convert days to hours

        const signer = this.provider.getSigner();
        const address = await signer.getAddress();

        // Always post to Nostr first
        const proposalData = {
            title,
            description,
            category,
            startEpoch: startEpoch.toString(),
            endEpoch: endEpoch.toString(),
            creator: address
        };

        // Post to Nostr and get the event ID
        const nostrEventId = await this.raven.postProposal(proposalData);
        if (!nostrEventId) {
            throw new Error('Failed to post proposal to Nostr');
        }

        // Create hash of the proposal data
        const proposalHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['string', 'string', 'uint8', 'uint256', 'uint256', 'address', 'string'],
                [title, description, category, startEpoch, endEpoch, address, nostrEventId]
            )
        );

        // Store metadata in Nostr channel
        const metadata = {
            name: title,
            about: JSON.stringify({
                problem: description,
                solution: '',
                impact: '',
                risks: '',
                timeline: `${votingPeriod} days`,
                budget: '',
                team: '',
                references: ''
            }),
            image: '',
            external_url: '',
            attributes: [
                {
                    trait_type: 'Category',
                    value: category
                },
                {
                    trait_type: 'Hash',
                    value: proposalHash
                }
            ]
        };

        await this.raven.createChannel(metadata);

        // If posting to Pulsechain is requested, store the hash
        if (postToPulsechain) {
            // Validate category before contract call
            if (category < 0 || category > 5) {
                throw new Error("Category must be between 0 and 5");
            }

            // First do the contract call with 4 arguments
            let tx = await this.contracts.stateConstituent.createProposal(
                address,        // 1st: proposer's address
                category,       // 2nd: category as uint8
                startEpoch,     // 3rd: startEpoch
                endEpoch        // 4th: endEpoch
            );
            await tx.wait();

            // Then store hash in a separate transaction
            const signer = this.provider.getSigner();
            await signer.sendTransaction({
                to: "0x0000000000000000000000000000000000000000",
                value: 0,
                data: proposalHash
            });
        }

        return {
            nostrEventId,
            proposalHash
        };
    } catch (error) {
        console.error('Error creating proposal:', error);
        throw error;
    }
}

    async getCurrentEpoch(): Promise<number> {
        try {
            const epoch = await this.contract.currentEpoch();
            return epoch.toNumber();
        } catch (error) {
            console.error('Error getting current epoch:', error);
            throw error;
        }
    }

    async getProposalCount(): Promise<number> {
        try {
            const count = await this.contract.proposalCount();
            return count.toNumber();
        } catch (error) {
            console.error('Error getting proposal count:', error);
            throw error;
        }
    }

    // Utility method for transaction logging
    private async logTransaction(
        tx: ethers.ContractTransaction,
        description: string
    ): Promise<ethers.ContractReceipt> {
        console.log(`\n📝 Transaction Details (${description}):`);
        console.log(`- Hash: ${tx.hash}`);
        console.log(`- From: ${this.formatAddress(tx.from)}`);
        console.log(`- To: ${this.formatAddress(tx.to)}`);
        
        const receipt = await tx.wait();
        console.log('\n✅ Transaction Confirmed:');
        console.log(`- Block: ${receipt.blockNumber}`);
        console.log(`- Gas Used: ${receipt.gasUsed.toString()}`);
        
        return receipt;
    }

    private formatAddress(address: string | undefined): string {
        if (!address) return 'undefined';
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }

    // Token metrics methods
    async getAuthorityMetrics(address: string): Promise<{
        level: number;
        score: number;
        lastUpdate: number;
    }> {
        try {
            const [level, score, lastUpdate] = await Promise.all([
                this.contract.getAuthorityLevel(address),
                this.contract.getAuthorityScore(address),
                this.contract.getLastUpdate(address)
            ]);

            return {
                level: level.toNumber(),
                score: score.toNumber(),
                lastUpdate: lastUpdate.toNumber()
            };
        } catch (error) {
            console.error('Error getting authority metrics:', error);
            throw error;
        }
    }

    async getBalance(address: string): Promise<ethers.BigNumber> {
        try {
            return await this.contract.balanceOf(address);
        } catch (error) {
            console.error('Error getting balance:', error);
            throw error;
        }
    }

    async getActivityScore(address: string): Promise<number> {
        try {
            const score = await this.contract.activityScore(address);
            return score.toNumber();
        } catch (error) {
            console.error('Error getting activity score:', error);
            throw error;
        }
    }

    // Now update getTokenMetrics to use the daoToken contract
    async getTokenMetrics(): Promise<TokenMetrics> {
        try {
            // Use daoToken instead of contract for token-specific operations
            const [
                currentPrice,
                totalSupply,
                treasuryBalance,
                activeUserCount,
                dailyAllocation
            ] = await Promise.all([
                this.daoToken.currentDailyPrice(),
                this.daoToken.totalSupply(),
                this.daoToken.treasuryBalance(),
                this.daoToken.activeUserCount(),
                this.daoToken.dailyAllocation()
            ]);

            // Get field metrics using the logic contract
            const fieldMetrics = await this.getFieldMetrics();

            return {
                price: ethers.utils.formatEther(currentPrice),
                supply: ethers.utils.formatEther(totalSupply),
                treasuryBalance: ethers.utils.formatEther(treasuryBalance),
                activeUsers: activeUserCount.toNumber(),
                dailyAllocation: ethers.utils.formatEther(dailyAllocation),
                ...fieldMetrics
            };
        } catch (error) {
            console.error('Error getting token metrics:', error);
            // Log more detailed error information to help with debugging
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
            }
            return {
                price: '0',
                supply: '0',
                treasuryBalance: '0',
                activeUsers: 0,
                dailyAllocation: '0',
                fieldStrength: 0,
                fieldSynchronization: 0,
                unityProgress: 0
            };
        }
    }

    private ensureContract(): void {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }
    }

    // Membership methods
    async getMembershipStatus(address: string): Promise<{
        isActive: boolean;
        biddingShares: number;
        lastActivity: number;
    }> {
        try {
            const [
                isActive,
                biddingShares,
                lastActivityTime
            ] = await Promise.all([
                this.contract.isActiveUser(address),
                this.contract.daoBiddingShares(address),
                this.contract.lastActivity(address)
            ]);

            return {
                isActive,
                biddingShares: biddingShares.toNumber(),
                lastActivity: lastActivityTime.toNumber()
            };
        } catch (error) {
            console.error('Error fetching membership status:', error);
            throw error;
        }
    }

    // Bidding methods
    async placeBid(amount: ethers.BigNumber, price: ethers.BigNumber, isPermanent: boolean): Promise<ethers.ContractReceipt> {
        try {
            const tx = await this.contract.placeBid(amount, price, isPermanent);
            return this.logTransaction(tx, 'Place Bid');
        } catch (error) {
            console.error('Error placing bid:', error);
            throw error;
        }
    }

    async getBidConstraints(daoAddress: string): Promise<{
        minBidAmount: ethers.BigNumber;
        maxPermanentBidAmount: ethers.BigNumber;
        availableBidRoom: ethers.BigNumber;
        daoLimit: ethers.BigNumber;
        totalBids: ethers.BigNumber;
    }> {
        try {
            const [
                dailyAllocation,
                daoLimit,
                totalBids
            ] = await Promise.all([
                this.contract.dailyAllocation(),
                this.contract.getDaoLimit(daoAddress),
                this.contract.getTotalDaoBids(daoAddress)
            ]);

            const minBidAmount = dailyAllocation.div(1000); // 0.1% minimum
            const maxPermanentBidAmount = daoLimit.mul(25).div(100); // 25% limit
            const availableBidRoom = daoLimit.sub(totalBids);

            return {
                minBidAmount,
                maxPermanentBidAmount,
                availableBidRoom,
                daoLimit,
                totalBids
            };
        } catch (error) {
            console.error('Error calculating bid constraints:', error);
            throw error;
        }
    }

    // Activity recording methods
    async recordActivity(address: string): Promise<ethers.ContractReceipt> {
        try {
            const tx = await this.contract.recordActivity(address);
            return this.logTransaction(tx, 'Record Activity');
        } catch (error) {
            console.error('Error recording activity:', error);
            throw error;
        }
    }

    async calculateDailyAllocation(): Promise<ethers.ContractReceipt> {
        try {
            const tx = await this.contract.calculateDailyAllocation();
            return this.logTransaction(tx, 'Calculate Daily Allocation');
        } catch (error) {
            console.error('Error calculating daily allocation:', error);
            throw error;
        }
    }

    // Initialization and registration methods
    async initializeAdmin(): Promise<ethers.ContractReceipt> {
        try {
            const tx = await this.contract.initializeAdmin();
            return this.logTransaction(tx, 'Initialize Admin');
        } catch (error) {
            console.error('Error initializing admin:', error);
            throw error;
        }
    }

    async registerMember(memberAddress: string): Promise<ethers.ContractReceipt> {
        try {
            const tx = await this.contract.registerMember(memberAddress);
            return this.logTransaction(tx, 'Register Member');
        } catch (error) {
            console.error('Error registering member:', error);
            throw error;
        }
    }

    // Voting methods
    // Enhanced proposal state retrieval
    async getProposalState(proposalId: string): Promise<ProposalStateData> {
        try {
            // Get on-chain state
            //const onChainState = await this.contracts.stateConstituent.getProposal(proposalId);
            const onChainState = await this.contracts.stateConstituent.getProposalBasicInfo(proposalId);
            
            // Get Raven votes if available
            let ravenVotes;
            if (this.raven) {
                const messages = await this.raven.getChannelMessages(proposalId);
                const forVotes = messages.filter(m => m.content === 'VOTE_FOR').length;
                const againstVotes = messages.filter(m => m.content === 'VOTE_AGAINST').length;
                ravenVotes = { forVotes, againstVotes };
            }

            /*return {
                state: onChainState.currentState,
                data: onChainState,
                ravenVotes
            };*/

            return {
                state: onChainState.currentState,
                stage: onChainState.stage || 0,
                endEpoch: onChainState.endEpoch.toNumber(),
                forVotes: onChainState.forVotes,
                againstVotes: onChainState.againstVotes,
                currentState: onChainState.currentState,
                data: onChainState,
                ravenVotes
            };
        } catch (error) {
            console.error('Error getting proposal state:', error);
            throw error;
        }
    }

    async castVote(
        proposalId: number,
        support: boolean,
        voteAmount: BigNumber
    ): Promise<void> {
        try {
            // Cast vote on-chain
            const tx = await this.contracts.stateConstituent.castVote(
                proposalId.toString(),
                support
            );
            await tx.wait();

            // Record vote in Raven if available
            if (this.raven) {
                await this.raven.sendDirectMessage(
                    proposalId.toString(),
                    support ? 'VOTE_FOR' : 'VOTE_AGAINST'
                );
            }
        } catch (error) {
            console.error('Error casting vote:', error);
            throw error;
        }
    }

    async getProposalBasicInfo(proposalId: number): Promise<{
        startEpoch: number;
        endEpoch: number;
        canceled: boolean;
        executed: boolean;
        forVotes: ethers.BigNumber;
        againstVotes: ethers.BigNumber;
        stage: number;
        proposerReputation: number;
    }> {
        try {
            const info = await this.contract.getProposalBasicInfo(proposalId);
            return {
                startEpoch: info[0].toNumber(),
                endEpoch: info[1].toNumber(),
                canceled: info[2],
                executed: info[3],
                forVotes: info[4],
                againstVotes: info[5],
                stage: info[6],
                proposerReputation: info[7]
            };
        } catch (error) {
            console.error('Error getting proposal info:', error);
            throw error;
        }
    }
}
