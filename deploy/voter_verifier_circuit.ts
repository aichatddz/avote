import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const voteVerifier = await hre.viem.deployContract("contracts/circuit/vote_verifier.sol:Groth16Verifier", [], {});
  console.log("vote_verifier deployed to:", voteVerifier);
};

func.tags = ["VoterCircuit"];
export default func;