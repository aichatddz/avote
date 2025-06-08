import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
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
    let walletClient = createWalletClient({
        account: account,
        chain: sepolia,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`),
    });

    const avote = await hre.viem.getContractAt("Avote", AvoteProxy, {
        client: {wallet: walletClient}
    })
    await avote.write.MigrateScalarMulGCircuit(["0x1c393a10866b9363062fef35792ae29cd1557221"]);
    
}

main().then(()=>{
    console.log("migrate scalar_mul_g_verifier succeed");
}).catch((error) => {
    console.error(error);
    process.exit(1);
})