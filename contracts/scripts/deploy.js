const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to BNB Smart Chain Testnet / localhost...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  console.log("📦 Deploying NFTToken...");
  const NFTToken = await hre.ethers.getContractFactory("NFTToken");
  const nftToken = await NFTToken.deploy();
  await nftToken.waitForDeployment();
  const nftTokenAddress = await nftToken.getAddress();
  console.log("✅ NFTToken deployed to:", nftTokenAddress);

  console.log("🪙 Deploying RewardToken...");
  const RewardToken = await hre.ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("✅ RewardToken deployed to:", rewardTokenAddress);

  console.log("🔒 Deploying Staking...");
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(nftTokenAddress, rewardTokenAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ Staking deployed to:", stakingAddress);

  const MINTER_ROLE = await rewardToken.MINTER_ROLE();
  await (await rewardToken.grantRole(MINTER_ROLE, stakingAddress)).wait();
  console.log("✅ Granted MINTER_ROLE on RewardToken to Staking contract");

  console.log("🏪 Deploying NFTMarketplace...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy(nftTokenAddress);
  await nftMarketplace.waitForDeployment();
  const marketplaceAddress = await nftMarketplace.getAddress();
  console.log("✅ NFTMarketplace deployed to:", marketplaceAddress);

  console.log("🎨 Minting 5 sample NFTs to deployer...");
  const sampleUris = [
    "ipfs://nodemeta/sample-1",
    "ipfs://nodemeta/sample-2",
    "ipfs://nodemeta/sample-3",
    "ipfs://nodemeta/sample-4",
    "ipfs://nodemeta/sample-5",
  ];

  for (const uri of sampleUris) {
    const tx = await nftToken.mintNFT(deployer.address, uri);
    await tx.wait();
  }
  console.log("✅ Minted 5 sample NFTs");

  const deployedAddresses = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    nftToken: nftTokenAddress,
    rewardToken: rewardTokenAddress,
    staking: stakingAddress,
    marketplace: marketplaceAddress,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedAddresses, null, 2));
  console.log("💾 Saved addresses to:", outputPath);

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contracts on BscScan...");
    try {
      await hre.run("verify:verify", { address: nftTokenAddress, constructorArguments: [] });
      console.log("✅ NFTToken verified");
    } catch (error) {
      console.log("⚠️ NFTToken verification:", error.message);
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("   NFTToken:", nftTokenAddress);
  console.log("   RewardToken:", rewardTokenAddress);
  console.log("   Staking:", stakingAddress);
  console.log("   NFTMarketplace:", marketplaceAddress);
  console.log("\n📝 Next steps:");
  console.log("   1. Update frontend .env with deployed contract addresses");
  console.log("   2. Update backend .env with BSC Testnet RPC URL");
  console.log("   3. Open http://localhost:3000/verify to test the verification dashboard");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
