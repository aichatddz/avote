import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const publicKeyVerifier = await hre.viem.deployContract("contracts/circuit/publickey_verifier.sol:Groth16Verifier", [], {});
  console.log("publickey_verifier deployed to:", publicKeyVerifier);
};

func.tags = ["PublicKeyCircuit"];
export default func;