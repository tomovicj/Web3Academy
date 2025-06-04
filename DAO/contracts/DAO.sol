// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "contracts/NFT.sol";

interface NFTInterface {
    function mintMembership(address receiver) external payable returns (uint256);
}

contract DAO {
    NFT NFTContract;
    uint256 public nextProposalId;
    struct Proposal {
        uint256 deadline;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        address proposalCreator;
        bool executed;
        string description;
    }

    enum VotingChoice { None, For, Against, Abstain }

    mapping (uint256 => Proposal) proposals;
    mapping (address => mapping (uint256 => VotingChoice)) votes;

    event MembershipMinted(address indexed receiver, uint256 nftId);
    event ProposalCreated(uint256 proposalId);
    event UserVoted(uint256 proposalId, VotingChoice vote);
    event ProposalExecuted(uint256 proposalId, bool passed);

    error NotNFTHolder(address _address);
    error ProposalNotFound(uint256 _id);
    error AlreadyVoted(VotingChoice _votedFor); 
    error VotingPeriodEnded(uint256 _deadline);
    error VotingPeriodNotEnded(uint256 _deadline);
    error InvalidVotingChoice(VotingChoice _vote);
    error ProposalAlreadyExecuted();

    constructor(string memory _nftUri) {
        NFTContract = new NFT(msg.sender, _nftUri);
    }

    function isMember(address user) public view returns (bool) {
        return NFTContract.balanceOf(user) > 0;
    }

    modifier onlyMember() {
        if (!isMember(msg.sender)) revert NotNFTHolder(msg.sender);
        _;
    }

    function createProposal(string calldata _description) external onlyMember returns (uint256) {
        uint256 _proposalId = nextProposalId++;
        proposals[_proposalId] = Proposal({
            deadline: block.timestamp + 7 days,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            proposalCreator: msg.sender,
            executed: false,
            description: _description
        });
        emit ProposalCreated(_proposalId);
        return _proposalId;
    }

    function executeProposal(uint256 _proposalId) external onlyMember returns (bool) {
        Proposal storage _proposal = proposals[_proposalId];
        if (_proposal.deadline == 0) revert ProposalNotFound(_proposalId);
        if (_proposal.deadline > block.timestamp) revert VotingPeriodNotEnded(_proposal.deadline);
        if (_proposal.executed) revert ProposalAlreadyExecuted();
        
        _proposal.executed = true;
        bool _passed = _proposal.votesFor > (_proposal.votesAgainst + _proposal.votesAbstain);
        
        emit ProposalExecuted(_proposalId, _passed);
        return _passed;
    }

    function voteForProposal(uint256 _proposalId, VotingChoice _vote) external onlyMember {
        Proposal storage _proposal = proposals[_proposalId];
        if (_proposal.deadline == 0) revert ProposalNotFound(_proposalId);

        if (_proposal.deadline < block.timestamp) revert VotingPeriodEnded(_proposal.deadline);

        VotingChoice _votedFor = votes[msg.sender][_proposalId];
        if (_votedFor != VotingChoice.None) revert AlreadyVoted(_votedFor);

        if (_vote == VotingChoice.For) {
            _proposal.votesFor++;
        } else if (_vote == VotingChoice.Against) {
            _proposal.votesAgainst++;
        } else if (_vote == VotingChoice.Abstain) {
            _proposal.votesAbstain++;
        } else {
            revert InvalidVotingChoice(_vote);
        }

        votes[msg.sender][_proposalId] = _vote;

        emit UserVoted(_proposalId, _vote);
    }

    function getUserVote(address _voter, uint256 _proposalId) external view returns (VotingChoice) {
        return votes[_voter][_proposalId];
    }

    function mintMembership(address _user) external payable {
        uint256 _nftId = NFTInterface(address(NFTContract)).mintMembership{value: msg.value}(_user);
        emit MembershipMinted(_user, _nftId);
    }
}

