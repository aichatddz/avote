import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "@openzeppelin/hardhat-upgrades";
import * as contracts from "../deployments/contracts"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const Avote = await hre.ethers.getContractFactory("Avote");
  const avote = await hre.upgrades.deployProxy(Avote, [
    contracts.VoterVerifierCircuit, contracts.PublicKeyVerifierCircuit, contracts.DecryptVerifierCircuit, contracts.CheckSumVerifierCircuit, contracts.ScalarMulGVerifierCircuit
  ], { kind: "uups" });
  await avote.waitForDeployment();
  console.log("Avote deployed:", await avote.getAddress());
  console.log("Avote implements deployed:", await hre.upgrades.erc1967.getImplementationAddress(await avote.getAddress()));
};

func.tags = ["AvoteLogic"];
export default func;