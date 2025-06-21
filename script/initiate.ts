import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { sepolia } from 'viem/chains'
import { createWalletClient, http} from "viem"
import { privateKeyToAccount } from "viem/accounts";
import { configDotenv } from "dotenv"
import { resolve } from "path";
import { AvoteProxy } from "../deployments/contracts";
import { ActivityID } from "./const";

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
    await avote.write.Initiate([
        [
            '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
            '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
            '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
            '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
            '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
        ], [
            '0x42F98BEee3C4354a770A7E488aA3B5A31d6F9276',
            '0x4B866aeFBE267B4ad4CF34977e963c4BEa3A14A5',
            '0xfC031A45517C5E1EB8b7acFCb14179acb3a1E7ef',
            '0x576b3B55240a73adbB4FB97126CDb16d477b8001',
            '0xFaDd1179EB22037A52c8DB836fFbD16a5288a648',
        ], ActivityID, 5n, 3n, 2n
    ], {
        value: 3n
    });

}

main().then(()=>{
    console.log("initialize");
}).catch((error) => {
    console.error(error);
    process.exit(1);
})