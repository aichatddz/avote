import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const verifier = await hre.viem.deployContract("contracts/circuit/public_key_verifier.sol:Groth16Verifier", [], {});
  console.log("public_key_verifier deployed to:", verifier);
};

func.tags = ["PublicKeyCircuit"];
export default func;