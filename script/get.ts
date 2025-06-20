import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { configDotenv } from "dotenv"
import { resolve } from "path";
import { AvoteProxy } from "../deployments/contracts";
import { ActivityID } from "./const"

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

    const avote = await hre.viem.getContractAt("Avote", AvoteProxy, {})

    let voteInfo = await avote.read.GetActivityInfo([ActivityID]);
    console.log("voteInfo: ", voteInfo);
    let counter1 = await avote.read.validCounters([0n]);
    console.log("counter1: ", counter1);
    let counter2 = await avote.read.validCounters([1n]);
    console.log("counter2: ", counter2);
    let counter3 = await avote.read.validCounters([2n]);
    console.log("counter3: ", counter3);

    const publickeyVerifier = await avote.read.publicKeyVerifier();
    console.log("publickeyVerifier: ", publickeyVerifier);

    const voteVerifier = await avote.read.voteVerifier();
    console.log("voteVerifier: ", voteVerifier);

    const sumVerifier = await avote.read.sumVerifier();
    console.log("sumVerifier: ", sumVerifier);

    const decryptVerifier = await avote.read.decryptVerifier();
    console.log("decryptVerifier: ", decryptVerifier);

    const scalarMulGVerifier = await avote.read.scalarMulGVerifier();
    console.log("scalarMulGVerifier: ", scalarMulGVerifier);
}

main().then(()=>{
    console.log("initialize");
}).catch((error) => {
    console.error(error);
    process.exit(1);
})