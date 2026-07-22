// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NFTToken.sol";
import "./RewardToken.sol";

/**
 * @title Staking
 * @dev STUBBED staking contract — Smart Contract Developer candidates implement this.
 */
contract Staking is ReentrancyGuard {
    NFTToken public nftToken;
    RewardToken public rewardToken;

    // Reward rate: 10 NTE per day, accrued per-second
    uint256 public constant REWARD_RATE_PER_SECOND = 1157407407407407;

    // TODO hints for candidates
    mapping(uint256 => address) public stakers;
    mapping(uint256 => uint256) public stakeTimestamps;

    constructor(address _nftTokenAddress, address _rewardTokenAddress) {
        nftToken = NFTToken(_nftTokenAddress);
        rewardToken = RewardToken(_rewardTokenAddress);
    }

    function stake(uint256 tokenId) external {
        // TODO: Candidate implements — transfer NFT to this contract, start reward tracking
    }

    function unstake(uint256 tokenId) external {
        // TODO: Candidate implements — return NFT to staker, pay accrued rewards, protect against reentrancy
    }

    function pendingRewards(uint256 tokenId) external view returns (uint256) {
        // TODO: Candidate implements — calculate rewards at 10 NTE per day, accrued per-second
        return 0;
    }

    function getStakedTokens(address owner) external view returns (uint256[] memory) {
        // TODO: Candidate implements — return array of token IDs staked by this address
        owner;
        uint256[] memory empty;
        return empty;
    }
}
