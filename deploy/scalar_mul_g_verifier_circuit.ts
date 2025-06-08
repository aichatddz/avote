import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const verifier = await hre.viem.deployContract("contracts/circuit/scalar_mul_g_verifier.sol:Groth16Verifier", [], {});
  console.log("scalar_mul_g_verifier deployed to:", verifier);
};

func.tags = ["ScalarMulGCircuit"];
export default func;