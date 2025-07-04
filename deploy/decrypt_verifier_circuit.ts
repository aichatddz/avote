import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const decryptVerifier = await hre.viem.deployContract("contracts/circuit/decrypt_verifier.sol:Groth16Verifier", [], {});
  console.log("decrypt_verifier deployed to:", decryptVerifier);
};

func.tags = ["DecryptCircuit"];
export default func;