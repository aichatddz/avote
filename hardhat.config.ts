import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-deploy";
import "@openzeppelin/hardhat-upgrades";   // 添加升级插件
import type { HardhatUserConfig } from "hardhat/config";
import {configDotenv} from "dotenv";
import { resolve } from "path";

configDotenv({ path: resolve(__dirname, "./.env") })

const SEPOLIA_PK_ONE = process.env.SEPOLIA_PK_ONE
if (!SEPOLIA_PK_ONE) {
  throw new Error("Please set at least one private key in a .env file")
}

const SEPOLIA_ALCHEMY_AK = process.env.SEPOLIA_ALCHEMY_AK
if (!SEPOLIA_ALCHEMY_AK) {
  throw new Error("Please set your SEPOLIA_ALCHEMY_AK in a .env file")
}

const SEPOLIA_ETHERSCAN_API_KEY = process.env.SEPOLIA_ETHERSCAN_API_KEY

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // 启用 IR 编译模式
    },
  },
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`,
      accounts: [`${SEPOLIA_PK_ONE}`],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: SEPOLIA_ETHERSCAN_API_KEY as string,
    }
  }
};

export default config;

