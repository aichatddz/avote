import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { sepolia } from 'viem/chains'
import {createPublicClient, createWalletClient, http} from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";

const COUNTER: `0x${string}` = "0xCB643869a723B88B93F84100481194B39c5c7623"

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

    const avote = await hre.viem.getContractAt("Avote", "0x9A82Db3a845359D3cBD8809d7f1A0e8A7BaeB979", {
        client: {wallet: walletClient}
    })
    await avote.write.AddCounter([COUNTER]);
    
}

main().then(()=>{
    console.log("add counter succeed");
}).catch((error) => {
    console.error(error);
    process.exit(1);
})