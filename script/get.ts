import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import * as fixtureTest from "../test/fixture"
import { sepolia } from 'viem/chains'
import {createPublicClient, createWalletClient, http} from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";

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

    // const rpcUrl = SEPOLIA_ALCHEMY_AK
    // let walletClient = createWalletClient({
    //     account: account,
    //     chain: sepolia,
    //     transport: http(`https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`),
    // });
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`),
    })
    // const accounts = await hre.viem.getWalletClients();

    const avote = await hre.viem.getContractAt("Avote", "0x9A82Db3a845359D3cBD8809d7f1A0e8A7BaeB979", {})

    let voteInfo = await avote.read.GetVoteInfo([1n]);
    console.log("voteInfo: ", voteInfo);
    let counters = await avote.read.validCounters([0n]);
    console.log("counters: ", counters);
    counters = await avote.read.validCounters([1n]);
    console.log("counters: ", counters);
    counters = await avote.read.validCounters([2n]);
    console.log("counters: ", counters);
    counters = await avote.read.validCounters([3n]);
    console.log("counters: ", counters);
    counters = await avote.read.validCounters([4n]);
    console.log("counters: ", counters);
}

main().then(()=>{
    console.log("initialize");
}).catch((error) => {
    console.error(error);
    process.exit(1);
})