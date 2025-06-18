import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { sepolia } from 'viem/chains'
import { createWalletClient, http} from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";
import { AvoteProxy } from "../deployments/contracts";
import { GenerateCheckSumProof, PublicKey } from "../component/prover";
import { ActivityID } from "./const";
import { buildBabyjub } from "circomlibjs";
import { SumProof } from "../component/util";

const params = {
    oracle_wallet_private: process.env.SEPOLIA_PK_ORACLE,
}

async function main() {
    configDotenv({ path: resolve(__dirname, "./.env") })    

    const oracle = params.oracle_wallet_private;
    if (!oracle) {
        throw new Error("Please set oracle private key in a .env file")
    }

    const SEPOLIA_ALCHEMY_AK = process.env.SEPOLIA_ALCHEMY_AK
    if (!SEPOLIA_ALCHEMY_AK) {
        throw new Error("Please set your SEPOLIA_ALCHEMY_AK in a .env file")
    }

    const account = privateKeyToAccount(oracle as `0x${string}`);
    let walletClient = createWalletClient({
        account: account,
        chain: sepolia,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`),
    });

    const contract = await hre.viem.getContractAt("Avote", AvoteProxy, {
        client: {wallet: walletClient},
    })
    let voteInfo = await contract.read.GetVoteInfo([ActivityID]);

    const curve = await buildBabyjub()
    let proofs = await GenerateCheckSumProof(curve, voteInfo.counterPublicKeys)
    let p: SumProof[] = [];
    for (let i = 0; i < proofs.length; i++) {
      p.push({
        proof: proofs[i].proof,
        sum: proofs[i].sum,
      });
    }
    await contract.write.ChangeStateToVoting([ActivityID, p]);
}

main().then(()=>{
    console.log("submit_public_key succeeded");
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
})