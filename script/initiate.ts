import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import * as fixtureTest from "../test/fixture"
import { sepolia } from 'viem/chains'
import {createPublicClient, createWalletClient, http} from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";
import Conf from "./config";
import { AvoteProxy } from "../deployments/contracts";

async function main() {
    configDotenv({ path: resolve(__dirname, "./.env") })    

    const SEPOLIA_PK_ONE = process.env.SEPOLIA_PK_ONE
    if (!SEPOLIA_PK_ONE) {
        throw new Error("Please set at least one private key in a .env file")
    }

    const SEPOLIA_ALCHEMY_AK = process.env.SEPOLIA_ALCHEMY_AK
    if (!SEPOLIA_ALCHEMY_AK) {
        throw new Error("Please set your SEPOLIA_ALCHEMY_AK in a .env file")
    }

    const account = privateKeyToAccount(SEPOLIA_PK_ONE as `0x${string}`);
    // const rpcUrl = SEPOLIA_ALCHEMY_AK
    let walletClient = createWalletClient({
        account: account,
        chain: sepolia,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`),
    });
    // const publciClient = createPublicClient({
    //     chain: sepolia,
    //     transport: http(),
    // })
    const accounts = await hre.viem.getWalletClients();

    // let info = await avote.read.GetVoteInfo([1n]);

    // for (let i = 1; i <= 3; i++) {
        const avote = await hre.viem.getContractAt("Avote", AvoteProxy, {
            client: {wallet: walletClient}
        })
        await avote.write.AddCounter([accounts[3].account.address]);
    // }
    
}

main().then(()=>{
    console.log("initialize");
}).catch((error) => {
    console.error(error);
    process.exit(1);
})