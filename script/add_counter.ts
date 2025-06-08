import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { sepolia } from 'viem/chains'
import { createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";
import { AvoteProxy } from "../deployments/contracts";

// const COUNTER: `0x${string}` = "0xCB643869a723B88B93F84100481194B39c5c7623"; // counter 1
// const COUNTER: `0x${string}` = "0x752164ACdba08F42DBbD7FfeEd1d415165bD5613"; // counter 2
const COUNTER: `0x${string}` = "0xEDb7da8323C16A2937857a0155f5041Ebcd47B61"; // counter 3

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
    await avote.write.AddCounter([COUNTER]);
    
}

main().then(()=>{
    console.log("add counter succeed");
}).catch((error) => {
    console.error(error);
    process.exit(1);
})