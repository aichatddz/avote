import { buildBabyjub, Point } from "circomlibjs";
import * as snarkjs from "snarkjs";
import { BigPoint } from "./util";

interface BaseCreateSignalParam {

}

interface CreateVoteSignalsParam {
    publicKey: Point;
    value: number;
    randomK: bigint;
}

interface CreatePublicKeySignalsParam {
    privateKey: bigint;
}

interface CreateDecryptSignalsParam {
    privateKey: bigint;
    publicKey: Point;
    c1: Point;
}

interface CreateCheckSumParam {
    lastSum: BigPoint;
    points: BigPoint[];
    outSum: BigPoint;
}

export abstract class Prover<PublicSignalLength extends number = number> {

    private wasmPath: string;
    private zkeyPath: string;
    private publicSignalLength: PublicSignalLength;

    abstract createSignals(params: BaseCreateSignalParam): Promise<snarkjs.CircuitSignals>;

    public constructor(wasmPath: string, zkeyPath: string, publicSignalLength: PublicSignalLength) {
        this.wasmPath = wasmPath;
        this.zkeyPath = zkeyPath;
        this.publicSignalLength = publicSignalLength;
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

    public async prove(params: BaseCreateSignalParam): Promise<[
        _pA: [bigint, bigint],
        _pB: [[bigint, bigint], [bigint, bigint]],
        _pC: [bigint, bigint],
        _pubSignals: any,
      ]>{
        const signals = await this.createSignals(params);
        const {proof, publicSignals} = await this.createProve(signals);
        return createSubmitParams(proof, publicSignals, this.publicSignalLength);
    }
}

export class Voter extends Prover<6> {
    private randomK: bigint;
    public constructor(randomK: bigint) {
        super("./circom/compile/vote_js/vote.wasm", "./circom/vote_0001.zkey", 6);
        this.randomK = randomK;
    }
    async createSignals(params: CreateVoteSignalsParam): Promise<snarkjs.CircuitSignals> {
        const curve = await buildBabyjub();
        const m: Point = curve.mulPointEscalar(curve.Base8, params.value);  // the mapped point in the curve of value value
        const k: bigint = this.randomK; // random big number
        const c1: Point = curve.mulPointEscalar(curve.Base8, k);
        const c2: Point = curve.addPoint(m, curve.mulPointEscalar(params.publicKey, k));
        return {
            randomK: k,
            publicKey: [ curve.F.toString(params.publicKey[0]), curve.F.toString(params.publicKey[1]) ],
            c1: [ curve.F.toString(c1[0]), curve.F.toString(c1[1]) ],
            c2: [curve.F.toString(c2[0]), curve.F.toString(c2[1]) ],
            m: [ curve.F.toString(m[0]), curve.F.toString(m[1]) ],
        };    
    }
}

export class SubmitPublicKey extends Prover<2> {
    public constructor() {
        super("./circom/compile/publickey_js/publickey.wasm", "./circom/publickey_0001.zkey", 2);
    }
    async createSignals(params: CreatePublicKeySignalsParam): Promise<snarkjs.CircuitSignals> {
        const curve = await buildBabyjub();
        const publicKey: Point = curve.mulPointEscalar(curve.Base8, params.privateKey);
        return {
            // d:   params.privateKey.toString(2).padStart(256,'0').split('').map(Number),
            privateKey: params.privateKey,
            publicKey:  [curve.F.toString(publicKey[0]), curve.F.toString(publicKey[1])],
        };
    }
}

export class Decrypt extends Prover<6> {
    public constructor() {
        super("./circom/compile/decrypt_js/decrypt.wasm", "./circom/decrypt_0001.zkey", 6);
    }
    async createSignals(params: CreateDecryptSignalsParam): Promise<snarkjs.CircuitSignals> {
        const curve = await buildBabyjub();
        const dMulC1: Point = curve.mulPointEscalar(params.c1, params.privateKey);
        return {
            // d:   params.privateKey.toString(2).padStart(256,'0').split('').map(Number),
            privateKey: params.privateKey,
            publicKey: [ curve.F.toString(params.publicKey[0]), curve.F.toString(params.publicKey[1]) ],
            c1: [curve.F.toString(params.c1[0]),  curve.F.toString(params.c1[1])],
            dMulC1: [ curve.F.toString(dMulC1[0]), curve.F.toString(dMulC1[1]) ],
        };
    }
}

export class CheckSum extends Prover<66> {
    public constructor() {
        super("./circom/compile/check_sum_js/check_sum.wasm", "./circom/check_sum_0001.zkey", 66);
    }
    async createSignals(params: CreateCheckSumParam): Promise<snarkjs.CircuitSignals> {
        const curve = await buildBabyjub();
        let points: bigint[][] = [[params.lastSum.x, params.lastSum.y]];
        for (let i: number = 0; i < params.points.length; i++) {
            points.push([params.points[i].x, params.points[i].y]);
        }
        return {
            points: points,
            sum: [params.outSum.x, params.outSum.y],
        }
        // const dMulC1: Point = curve.mulPointEscalar(params.c1, params.privateKey);
        // return {
        //     // d:   params.privateKey.toString(2).padStart(256,'0').split('').map(Number),
        //     privateKey: params.privateKey,
        //     publicKey: [ curve.F.toString(params.publicKey[0]), curve.F.toString(params.publicKey[1]) ],
        //     c1: [curve.F.toString(params.c1[0]),  curve.F.toString(params.c1[1])],
        //     dMulC1: [ curve.F.toString(dMulC1[0]), curve.F.toString(dMulC1[1]) ],
        // };
    }
}

type BigNumberishTuple<N extends number, T extends any[] = []> = 
  T['length'] extends N ? T : BigNumberishTuple<N, [...T, bigint]>;

function createSubmitParams<PublicSignalLength extends number>(proof: snarkjs.Groth16Proof, publicSignals: snarkjs.PublicSignals, length: PublicSignalLength): [
    _pA: [bigint, bigint],
    _pB: [[bigint, bigint], [bigint, bigint]],
    _pC: [bigint, bigint],
    _pubSignals: BigNumberishTuple<PublicSignalLength>,
  ] {
    if (publicSignals.length !== length) {
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
