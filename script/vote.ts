import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { sepolia } from 'viem/chains'
import { createWalletClient, http} from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";
import { AvoteProxy } from "../deployments/contracts";
import { GenerateVoteProof } from "../component/prover";
import { ActivityID } from "./const";
import { randomScalar } from "../component/util";
import { buildBabyjub } from "circomlibjs";

const params = {
    voter_wallet_private: process.env.SEPOLIA_PK_VOTER5,
    value: 3n,
}

async function main() {
    configDotenv({ path: resolve(__dirname, "./.env") })    

    const voter = params.voter_wallet_private;
    if (!voter) {
        throw new Error("Please set voter's private key in a .env file")
    }

    const SEPOLIA_ALCHEMY_AK = process.env.SEPOLIA_ALCHEMY_AK
    if (!SEPOLIA_ALCHEMY_AK) {
        throw new Error("Please set your SEPOLIA_ALCHEMY_AK in a .env file")
    }

    const account = privateKeyToAccount(voter as `0x${string}`);
    let walletClient = createWalletClient({
        account: account,
        chain: sepolia,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${SEPOLIA_ALCHEMY_AK}`),
    });

    const contract = await hre.viem.getContractAt("Avote", AvoteProxy, {
        client: {wallet: walletClient},
    })
    let voteInfo = await contract.read.GetVoteInfo([ActivityID]);

    const curve = await buildBabyjub();
    const proof = await GenerateVoteProof(curve, {
        publicKey: voteInfo.sumPublicKey,
        value: params.value,
        voterNum: BigInt(voteInfo.voters.length),
        candidateNum: BigInt(voteInfo.candidates.length),
        randomK: randomScalar(curve),
    });

    const avote = await hre.viem.getContractAt("Avote", AvoteProxy, {
        client: {wallet: walletClient}
    })
    const rsp = await avote.write.Vote([ActivityID, proof.proof, proof.cipher]);
    console.log("rsp: ", rsp)
}

main().then(()=>{
    console.log("vote succeeded");
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
})