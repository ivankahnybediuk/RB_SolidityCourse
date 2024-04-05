const hre = require("hardhat");

async function main() {
    await hre.run('compile');

    const domainOwnershipManager = await hre.ethers.deployContract("DomainOwnershipManager");
    await domainOwnershipManager.waitForDeployment();

    const contractAddress = await domainOwnershipManager.getAddress();
    console.log("DomainOwnershipManager deployed to:", contractAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
