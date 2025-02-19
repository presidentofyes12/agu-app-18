// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ProposalManager {
    struct Proposal {
        string title;
        string description;
        uint8 category;
        uint256 startEpoch;
        uint256 endEpoch;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 quorum;
        address creator;
        bool executed;
        bool canceled;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        uint256 startEpoch,
        uint256 endEpoch
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votes
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    function createProposal(
        string memory title,
        string memory description,
        uint8 category
    ) external returns (uint256) {
        uint256 proposalId = proposalCount++;
        uint256 startEpoch = block.number;
        uint256 endEpoch = startEpoch + 40320; // ~1 week at 15s blocks

        proposals[proposalId] = Proposal({
            title: title,
            description: description,
            category: category,
            startEpoch: startEpoch,
            endEpoch: endEpoch,
            forVotes: 0,
            againstVotes: 0,
            quorum: 100,
            creator: msg.sender,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalId, msg.sender, startEpoch, endEpoch);
        return proposalId;
    }

    function castVote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.number >= proposal.startEpoch, "Voting not started");
        require(block.number <= proposal.endEpoch, "Voting ended");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.canceled, "Proposal canceled");

        if (support) {
            proposal.forVotes += 1;
        } else {
            proposal.againstVotes += 1;
        }

        emit VoteCast(proposalId, msg.sender, support, 1);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.number > proposal.endEpoch, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(proposal.forVotes > proposal.againstVotes, "Proposal not passed");
        require(proposal.forVotes + proposal.againstVotes >= proposal.quorum, "Quorum not reached");

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.creator, "Not creator");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Already canceled");

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function getProposal(uint256 proposalId) external view returns (
        string memory title,
        string memory description,
        uint8 category,
        uint256 startEpoch,
        uint256 endEpoch,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 quorum,
        address creator,
        bool executed,
        bool canceled
    ) {
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.category,
            proposal.startEpoch,
            proposal.endEpoch,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.quorum,
            proposal.creator,
            proposal.executed,
            proposal.canceled
        );
    }
}