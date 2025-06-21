import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { sepolia } from 'viem/chains'
import { createWalletClient, http} from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";
import { AvoteProxy } from "../deployments/contracts";
import * as Prover from "../component/prover";
import { ActivityID } from "./const";
import { toPoint } from "../component/util";
import { buildBabyjub } from "circomlibjs";

const params = {
    counter_wallet_private: process.env.SEPOLIA_PK_COUNTER1,
    counter_private: process.env.SEPOLIA_PRIVATE_COUNTER_1,
}

async function main() {
    configDotenv({ path: resolve(__dirname, "./.env") })    

    const counter = params.counter_wallet_private;
    if (!counter) {
        throw new Error("Please set at least one private key in a .env file")
    }

    if (!params.counter_private) {
        throw new Error("Please set counter private key in a .env file")
    }

    const SEPOLIA_ALCHEMY_AK = process.env.SEPOLIA_ALCHEMY_AK
    if (!SEPOLIA_ALCHEMY_AK) {
        throw new Error("Please set your SEPOLIA_ALCHEMY_AK in a .env file")
    }

    const account = privateKeyToAccount(counter as `0x${string}`);
    let walletClient = createWalletClient({
        account: account,
        chain: sepolia,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`),
    });

    const contract = await hre.viem.getContractAt("Avote", AvoteProxy, {
        client: {wallet: walletClient},
    })
    let activityInfo = await contract.read.GetActivityInfo([ActivityID]);

    const curve = await buildBabyjub();
    
    const proof = await Prover.GenerateDecryptProof(curve, BigInt(params.counter_private), activityInfo.sumVotes.c1);
    
    // let prover = new Decrypt();
    // const proof = await prover.prove({
    //     privateKey: params.counter_private,
    //     publicKey: curve.mulPointEscalar(curve.Base8, params.counter_private),
    //     c1: toPoint(curve, voteInfo.sumVotes.c1),
    // });

    const avote = await hre.viem.getContractAt("Avote", AvoteProxy, {
        client: {wallet: walletClient}
    })
    await avote.write.Decrypt([ActivityID, proof.proof, proof.decryption]);
}

main().then(()=>{
    console.log("decrypt succeeded");
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
})