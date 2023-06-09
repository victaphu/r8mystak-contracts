import { ethers } from "hardhat";

async function main() {
  // The oracle address on Polygon Mumbai
  // See https://docs.chain.link/chainlink-functions/supported-networks
  // for a list of supported networks and addresses.
  const oracleAddress = "0xeA6721aC65BCeD841B8ec3fc5fEdeA6141a0aDE4";

  // Set your contract name.
  const contractName = "STAKController";
  const staksName = "STAK20";
  //const contractName = "MyFirstContract"

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const staks20Contract = await ethers.getContractFactory(staksName);
  const deployedStaks20 = await staks20Contract.deploy();
  console.log("Deployed Functions Staks token address:", deployedStaks20.address);

  const consumerContract = await ethers.getContractFactory(contractName);
  const deployedContract = await consumerContract.deploy(oracleAddress, deployedStaks20.address);

  const result = await deployedStaks20.grantRole(await deployedStaks20.MINTER_ROLE(), deployedContract.address);
  await result.wait();

  console.log("Deployed Functions Consumer address:", deployedContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

