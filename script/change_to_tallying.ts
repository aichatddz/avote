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
import { BigPoint, SumProof } from "../component/util";

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
    
    let ballots = voteInfo.ballots;
    let pointsC1: BigPoint[] = [];
    let pointsC2: BigPoint[] = [];
    for (let i = 0; i < ballots.length; i++) {
      pointsC1.push(ballots[i].c1);
      pointsC2.push(ballots[i].c2);
    }

    let proofsC1: SumProof[] = [];
    let proofsC2: SumProof[] = [];

    let proof1 = await GenerateCheckSumProof(curve, pointsC1);
    for (let j = 0; j < proof1.length; j++) {
      proofsC1.push({
        proof: proof1[j].proof,
        sum: proof1[j].sum,
      });
    }

    let proof2 = await GenerateCheckSumProof(curve, pointsC2);
    for (let j = 0; j < proof2.length; j++) {
      proofsC2.push({
        proof: proof2[j].proof,
        sum: proof2[j].sum,
      });
    }

    await contract.write.ChangeStateToTallying([ActivityID, proofsC1, proofsC2]);
}

main().then(()=>{
    console.log("trigger state to tallying succeeded");
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
})