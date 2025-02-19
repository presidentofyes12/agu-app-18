const hre = require("hardhat");

async function main() {
  const ethers = hre.ethers;
  const ProposalManager = await ethers.getContractFactory("ProposalManager");
  const proposalManager = await ProposalManager.deploy();
  await proposalManager.deployed();

  console.log("ProposalManager deployed to:", proposalManager.address);

  // Create a test proposal
  const tx = await proposalManager.createProposal(
    "Test Proposal",
    "This is a test proposal",
    1 // category
  );
  await tx.wait();

  console.log("Test proposal created");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});