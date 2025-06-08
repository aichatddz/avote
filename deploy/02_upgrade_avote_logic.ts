import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "@openzeppelin/hardhat-upgrades";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const Avote = await hre.ethers.getContractFactory("Avote");
  const avote = await hre.upgrades.upgradeProxy("0x9Bd28886C7Aca72123D035225BC71D65eC114109", Avote);
  await avote.waitForDeployment();
  console.log("Avote deployed:", await avote.getAddress());
  console.log("Avote implements deployed:", await hre.upgrades.erc1967.getImplementationAddress(await avote.getAddress()));
};

func.tags = ["AvoteLogicUpgrade02"];
export default func;