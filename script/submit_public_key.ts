import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { sepolia } from 'viem/chains'
import { createWalletClient, http} from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";
import { AvoteProxy } from "../deployments/contracts";
import { PublicKey } from "../component/prover";
import { ActivityID } from "./const";

const params = {
    counter_wallet_private: process.env.SEPOLIA_PK_COUNTER3,
    counter_private: process.env.SEPOLIA_PRIVATE_COUNTER_3,
}

async function main() {
    configDotenv({ path: resolve(__dirname, "./.env") })    

    const counter1 = params.counter_wallet_private;
    if (!counter1) {
        throw new Error("Please set at least one private key in a .env file")
    }

    if (!params.counter_private) {
        throw new Error("Please set counter private key in a .env file")
    }

    const SEPOLIA_ALCHEMY_AK = process.env.SEPOLIA_ALCHEMY_AK
    if (!SEPOLIA_ALCHEMY_AK) {
        throw new Error("Please set your SEPOLIA_ALCHEMY_AK in a .env file")
    }

    const account = privateKeyToAccount(counter1 as `0x${string}`);
    let walletClient = createWalletClient({
        account: account,
        chain: sepolia,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`),
    });


    let prover = new PublicKey();
    const proof = await prover.prove({
        privateKey: BigInt(params.counter_private),
    });

    const avote = await hre.viem.getContractAt("Avote", AvoteProxy, {
        client: {wallet: walletClient}
    })
    await avote.write.SubmitPublicKey([ActivityID, ...proof]);
}

main().then(()=>{
    console.log("submit_public_key succeeded");
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
})