import { ContractService } from './contractService';
import { Proposal, ProposalState } from 'types/contracts';
import { toBigNumber, formatUnits, parseUnits } from 'utils/web3';

export class ProposalIntegrationService {
  private contractService: ContractService;

  constructor(contractService: ContractService) {
    this.contractService = contractService;
  }

  async getAllProposals(): Promise<Proposal[]> {
    try {
      // Get the total number of proposals
      const proposalCount = await this.contractService.stateContract.proposalCount();
      const proposals: Proposal[] = [];

      // Fetch each proposal
      for (let i = 0; i < proposalCount.toNumber(); i++) {
        try {
          const proposal = await this.getProposalById(i.toString());
          if (proposal) {
            proposals.push(proposal);
          }
        } catch (error) {
          console.error(`Error fetching proposal ${i}:`, error);
        }
      }

      return proposals;
    } catch (error) {
      console.error('Error fetching all proposals:', error);
      throw error;
    }
  }

  private async getProposalById(id: string): Promise<Proposal | null> {
    try {
      const [
        basicInfo,
        metadata,
        votes
      ] = await Promise.all([
        this.contractService.stateContract.getProposalBasicInfo(id),
        this.contractService.stateContract.getProposalMetadata(id),
        this.contractService.stateContract.getProposalVotes(id)
      ]);

      // Extract data from the responses
      const startEpoch = basicInfo.startEpoch || 0;
      const endEpoch = basicInfo.endEpoch || 0;
      const currentState = this.mapChainStateToProposalState(basicInfo.state);
      const creator = metadata.creator;
      const title = metadata.title;
      const description = metadata.description;
      const category = metadata.category;

      // Create the proposal object
      const proposal: Proposal = {
        id,
        creator,
        title,
        description,
        category,
        createdAt: Math.floor(Date.now() / 1000), // Use actual timestamp from chain if available
        startEpoch: toBigNumber(startEpoch),
        endEpoch: toBigNumber(endEpoch),
        executionDelay: toBigNumber(86400), // 1 day default
        currentState,
        forVotes: votes.forVotes,
        againstVotes: votes.againstVotes,
        quorum: votes.quorum,




      };

      return proposal;
    } catch (error) {
      console.error(`Error fetching proposal ${id}:`, error);
      return null;
    }
  }

  private mapChainStateToProposalState(state: number): ProposalState {
    const stateMap: { [key: number]: ProposalState } = {
      0: ProposalState.DRAFT,
      1: ProposalState.DISCUSSION,
      2: ProposalState.PENDING_SUBMISSION,
      3: ProposalState.SUBMITTED,
      4: ProposalState.ACTIVE,
      5: ProposalState.SUCCEEDED,
      6: ProposalState.QUEUED,
      7: ProposalState.EXECUTED,
      8: ProposalState.DEFEATED,
      9: ProposalState.EXPIRED,
      10: ProposalState.CANCELED
    };

    return stateMap[state] || ProposalState.DRAFT;
  }

  public async updateProposalNostrHash(proposalId: string, nostrHash: string): Promise<void> {
    try {
      await this.contractService.stateContract.updateProposalNostrHash(proposalId, nostrHash);
    } catch (error) {
      console.error('Error updating proposal Nostr hash:', error);
      throw error;
    }
  }

  public async castVote(
    proposalId: string,
    support: boolean
  ): Promise<void> {
    try {
      const tx = await this.contractService.stateContract.castVote(
        proposalId,
        support
      );
      await tx.wait();
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }
}