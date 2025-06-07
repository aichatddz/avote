import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "@openzeppelin/hardhat-upgrades";

// PublicKeyCircuit: 0x5bb54c5c11966492106ea1b8dce691f58b5f3fa9
// DecryptCircuit: 0xa6b401198ff094111692edbfbb7c958854a387a3
// VoterCircuit: 0x43e7ca2dd749da623d6c279e214422af617421fa
// CheckSumCircuit: 0x93fb05f8ffa5984d651d71849b84c190f00c0cf3
// address _voteVerifier, address _publicKeyVerifier, address _decryptVerifier, address _check_sum_verifier
// Avote deployed: 0x9A82Db3a845359D3cBD8809d7f1A0e8A7BaeB979
// Avote implements deployed: 0x893d4ee02D23E57ddc642D81510101B226aa4B8C

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const Avote = await hre.ethers.getContractFactory("Avote");
  const avote = await hre.upgrades.deployProxy(Avote, [
    '0x43e7ca2dd749da623d6c279e214422af617421fa',
    '0x5bb54c5c11966492106ea1b8dce691f58b5f3fa9',
    '0xa6b401198ff094111692edbfbb7c958854a387a3',
    '0x93fb05f8ffa5984d651d71849b84c190f00c0cf3'
  ], { kind: "uups" });
  await avote.waitForDeployment();
  console.log("Avote deployed:", await avote.getAddress());
  console.log("Avote implements deployed:", await hre.upgrades.erc1967.getImplementationAddress(await avote.getAddress()));
};

func.tags = ["AvoteLogic"];
export default func;