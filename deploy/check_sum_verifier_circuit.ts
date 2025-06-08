import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const checkSumVerifier = await hre.viem.deployContract("contracts/circuit/check_sum_verifier.sol:Groth16Verifier", [], {});
  console.log("check_sum_verifier deployed to:", checkSumVerifier);

//   await hre.deployments.save("contracts/circuit/check_sum_verifier.sol:Groth16Verifier", {
//     abi: checkSumVerifier.abi,
//     address: checkSumVerifier.address,
//   });
};

func.tags = ["CheckSumCircuit"];
export default func;