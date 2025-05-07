import { buildBabyjub, Point } from "circomlibjs";
import { ethers, BigNumberish } from "ethers";
import * as snarkjs from "snarkjs";
import { Voter$Type } from "../artifacts/contracts/implement/voter.sol/Voter";
import { Abi, GetContractReturnType, publicActions } from "viem";
import { getProof } from "viem/_types/actions/public/getProof";

interface BaseCreateSignalParam {

}

interface CreateVoteSignalsParam {
    publicKey: Point;
    value: number;
}

interface CreatePublicKeySignalsParam {
    privateKey: bigint;
}

interface CreateDecryptSignalsParam {
    privateKey: bigint;
    publicKey: Point;
    c1: Point;
}

export abstract class Prover {

    private wasmPath: string;
    private zkeyPath: string;

    abstract createSignals(params: BaseCreateSignalParam): Promise<snarkjs.CircuitSignals>;
    // abstract submitToContract(proof: snarkjs.Groth16Proof, publicSignals: snarkjs.PublicSignals):  Promise<ethers.ContractTransactionResponse>;

    public constructor(wasmPath: string, zkeyPath: string) {
        this.wasmPath = wasmPath;
        this.zkeyPath = zkeyPath;
    }

    private createProve(signals: snarkjs.CircuitSignals): Promise<{
        proof: snarkjs.Groth16Proof;
        publicSignals: snarkjs.PublicSignals;
    }>{
        return snarkjs.groth16.fullProve(
          signals,
          this.wasmPath,
          this.zkeyPath
        );
    }

    public async prove<L extends number>(params: BaseCreateSignalParam, l: L): Promise<[
        _pA: [bigint, bigint],
        _pB: [[bigint, bigint], [bigint, bigint]],
        _pC: [bigint, bigint],
        _pubSignals: BigNumberishTuple<L>,
      ]>{
        const signals = await this.createSignals(params);
        const {proof, publicSignals} = await this.createProve(signals);
        return createSubmitParams<L>(proof, publicSignals, l);
    }
}

export class Voter extends Prover {
    public constructor() {
        super("./circom/compile/vote_js/vote.wasm", "./circom/vote_0001.zkey");
    }
    async createSignals(params: CreateVoteSignalsParam): Promise<snarkjs.CircuitSignals> {
        const curve = await buildBabyjub();
        const m: Point = curve.mulPointEscalar(curve.Base8, params.value);  // the mapped point in the curve of value value
        const k: bigint = ethers.toBigInt( ethers.randomBytes(32) ); // random big number
        const c1: Point = curve.mulPointEscalar(curve.Base8, k);
        const c2: Point = curve.addPoint(m, curve.mulPointEscalar(params.publicKey, k));
        return {
            k:   k.toString(2).padStart(256,'0').split('').map(Number),
            qx:  curve.F.toString(params.publicKey[0]),
            qy:  curve.F.toString(params.publicKey[1]),
            c1x: curve.F.toString(c1[0]),
            c1y: curve.F.toString(c1[1]),
            c2x: curve.F.toString(c2[0]),
            c2y: curve.F.toString(c2[1]),
            mx:  curve.F.toString(m[0]),
            my:  curve.F.toString(m[1]),
        };    
    }
}

export class SubmitPublicKey extends Prover {
    public constructor() {
        super("./circom/compile/publickey_js/publickey.wasm", "./circom/publickey_0001.zkey");
    }
    async createSignals(params: CreatePublicKeySignalsParam): Promise<snarkjs.CircuitSignals> {
        const curve = await buildBabyjub();
        const publicKey: Point = curve.mulPointEscalar(curve.Base8, params.privateKey);
        return {
            d:   params.privateKey.toString(2).padStart(256,'0').split('').map(Number),
            qx:  curve.F.toString(publicKey[0]),
            qy:  curve.F.toString(publicKey[1]),
        };
    }
}

export class Decrypt extends Prover {
    public constructor() {
        super("./circom/compile/decrypt_js/decrypt.wasm", "./circom/decrypt_0001.zkey");
    }
    async createSignals(params: CreateDecryptSignalsParam): Promise<snarkjs.CircuitSignals> {
        const curve = await buildBabyjub();
        const dMulC1: Point = curve.mulPointEscalar(params.c1, params.privateKey);
        return {
            d:   params.privateKey.toString(2).padStart(256,'0').split('').map(Number),
            qx:  curve.F.toString(params.publicKey[0]),
            qy:  curve.F.toString(params.publicKey[1]),
            c1x: curve.F.toString(params.c1[0]),
            c1y: curve.F.toString(params.c1[1]),
            dc1x: curve.F.toString(dMulC1[0]),
            dc1y: curve.F.toString(dMulC1[1]),
        };
    }
}

type BigNumberishTuple<N extends number, T extends any[] = []> = 
  T['length'] extends N ? T : BigNumberishTuple<N, [...T, bigint]>;

function createSubmitParams<PublicSignalLength extends number>(proof: snarkjs.Groth16Proof, publicSignals: snarkjs.PublicSignals, l: PublicSignalLength): [
    _pA: [bigint, bigint],
    _pB: [[bigint, bigint], [bigint, bigint]],
    _pC: [bigint, bigint],
    _pubSignals: BigNumberishTuple<PublicSignalLength>,
  ] {
    if (publicSignals.length !== l) {
        throw new Error(`Input array must have exactly ${length} elements`);
    }
    return [
        [proof.pi_a[0], proof.pi_a[1]],
        [
          [proof.pi_b[0][1], proof.pi_b[0][0]],
          [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        [proof.pi_c[0], proof.pi_c[1]],
        publicSignals as any];
}
