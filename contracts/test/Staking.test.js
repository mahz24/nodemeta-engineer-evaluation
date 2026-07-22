const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking", function () {
  let nftToken;
  let rewardToken;
  let staking;
  let owner;
  let other;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();

    const NFTToken = await ethers.getContractFactory("NFTToken");
    nftToken = await NFTToken.deploy();
    await nftToken.waitForDeployment();

    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();

    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(
      await nftToken.getAddress(),
      await rewardToken.getAddress()
    );
    await staking.waitForDeployment();

    const minterRole = await rewardToken.MINTER_ROLE();
    await rewardToken.grantRole(minterRole, await staking.getAddress());
  });

  // --- Core (must implement for 60-min assessment) ---
  it.skip("should allow NFT owner to stake their token", async function () {});

  it.skip("should reject staking by non-owner", async function () {});

  it.skip("should return correct pending rewards after 1 day", async function () {});

  it.skip("should allow unstaking and return NFT + rewards", async function () {});

  // --- Optional (nice-to-have if time remains) ---
  it.skip("should accrue rewards at 10 NTE per day calculated per-second", async function () {});

  it.skip("should reject unstaking by non-staker", async function () {});

  it.skip("should protect unstake against reentrancy", async function () {});

  it.skip("should return all staked tokens for an address", async function () {});
});
