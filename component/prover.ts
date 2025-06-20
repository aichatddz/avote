import { BabyJub, buildBabyjub, Point } from "circomlibjs";
import * as snarkjs from "snarkjs";
import * as Util from "./util";
import { decrypt } from "dotenv";

interface BaseCreateSignalParam {

}

interface CreateVoteProofInput {
    publicKey: Util.BigPoint;
    value: bigint;       // 1 <= v <= candidateNum
    randomK: bigint;
    voterNum: bigint;
    candidateNum: bigint;
}

interface CreateVoteSignalsParam {
    publicKey: Util.BigPoint;
    randomK: bigint;
    cipher: Util.BigCipher;
    m: Util.BigPoint;
}

interface CreatePublicKeySignalsParam {
    privateKey: bigint;
    publicKey: Util.BigPoint;
}

interface CreateScalarMulGSignalsParam {
    scalar: bigint;
}

interface CreateDecryptSignalsParam {
    privateKey: bigint;
    publicKey: Util.BigPoint;
    c1: Util.BigPoint;
    decryption: Util.BigPoint;
}

interface CreateCheckSumParam {
    lastSum: Util.BigPoint;
    points: Util.BigPoint[];
    outSum: Util.BigPoint;
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

export class PublicKey extends Prover<2> {
    public constructor() {
        super("./circom/compile/public_key_js/public_key.wasm", "./circom/public_key_0001.zkey", 2);
    }
    async createSignals(params: CreatePublicKeySignalsParam): Promise<snarkjs.CircuitSignals> {
        return {
            privateKey: params.privateKey,
            publicKey:  [params.publicKey.x, params.publicKey.y],
        };
    }
}

export class Voter extends Prover<6> {
    public constructor() {
        super("./circom/compile/vote_js/vote.wasm", "./circom/vote_0001.zkey", 6);
    }
    async createSignals(params: CreateVoteSignalsParam): Promise<snarkjs.CircuitSignals> {
        return {
            randomK: params.randomK,
            publicKey: [ params.publicKey.x, params.publicKey.y ],
            c1: [ params.cipher.c1.x, params.cipher.c1.y ],
            c2: [ params.cipher.c2.x, params.cipher.c2.y ],
            m: [ params.m.x, params.m.y ],
        };    
    }
}

export class ScalarMulG extends Prover<3> {
    public constructor() {
        super("./circom/compile/scalar_mul_g_js/scalar_mul_g.wasm", "./circom/scalar_mul_g_0001.zkey", 3);
    }
    async createSignals(params: CreateScalarMulGSignalsParam): Promise<snarkjs.CircuitSignals> {
        const curve = await buildBabyjub();
        const publicKey: Point = curve.mulPointEscalar(curve.Base8, params.scalar);
        return {
            scalar: params.scalar,
            point:  [curve.F.toString(publicKey[0]), curve.F.toString(publicKey[1])],
        };
    }
}

export class Decrypt extends Prover<6> {
    public constructor() {
        super("./circom/compile/decrypt_js/decrypt.wasm", "./circom/decrypt_0001.zkey", 6);
    }
    async createSignals(params: CreateDecryptSignalsParam): Promise<snarkjs.CircuitSignals> {
        return {
            privateKey: params.privateKey,
            publicKey: [params.publicKey.x, params.publicKey.y],
            c1: [params.c1.x, params.c1.y],
            dMulC1: [params.decryption.x, params.decryption.y],
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

export async function GenerateCheckSumProof(curve: BabyJub, points: readonly Util.BigPoint[]): Promise<Util.SumProof[]> {
    let proofs: Util.SumProof[] = [];
    let lastSum: Util.BigPoint = {x: 0n, y: 1n};
    let sumPoint = Util.toPoint(curve, lastSum);
    const windowSize = 32;
    for (let i = 0; i < Math.floor((points.length - 1) / (windowSize-1)) + 1; i++) {
        let windowPoints: Util.BigPoint[] = [];
        for (let j = 0; j < (windowSize-1); j++) {
            if (i*(windowSize-1)+j >= points.length) {
                windowPoints.push({
                    x: 0n,
                    y: 1n,
                });
            } else {
                windowPoints.push({
                    x: points[i*(windowSize-1) + j].x,
                    y: points[i*(windowSize-1) + j].y
                });
            }
            sumPoint = curve.addPoint(sumPoint, Util.toPoint(curve, windowPoints[j]));
        }

        let outSum: Util.BigPoint = Util.toBigPoint(curve, sumPoint);
        let prover = new CheckSum();
        const proof = await prover.prove({
            lastSum: lastSum,
            points: windowPoints,
            outSum: outSum,
        });

        proofs.push({
            proof: {
                a: proof[0],
                b: proof[1],
                c: proof[2],
            },
            sum: {
                x: outSum.x,
                y: outSum.y,
            }
        })
        lastSum = Util.toBigPoint(curve, sumPoint);
    }
    return proofs;
}

function mapBallotToValue(v: bigint, voterNum: bigint, candidateNum: bigint): bigint {
    // console.log("(voterNum+1n) ** (candidateNum - v): ", (voterNum+1n) ** (candidateNum - v))
    return (voterNum+1n) ** (candidateNum - v);
}

export async function GenerateVoteProof(curve: BabyJub, params: CreateVoteProofInput): Promise<Util.VoteProof> {
    let prover = new Voter();

    let randomK = params.randomK;
    if (randomK == 0n) {
        randomK = Util.randomScalar(curve);
    }

    const m: Util.BigPoint = Util.toBigPoint(curve, curve.mulPointEscalar(curve.Base8,
        mapBallotToValue(params.value, params.voterNum, params.candidateNum)));
    const c1: Util.BigPoint = Util.toBigPoint(curve, curve.mulPointEscalar(curve.Base8, randomK));
    const c2: Util.BigPoint = Util.sumBigPoints(curve, [m, Util.mulBigPointEscalar(curve, params.publicKey, randomK)]);

    const proof = await prover.prove({
        publicKey: params.publicKey,
        randomK: randomK,
        cipher: { c1: c1, c2: c2},
        m: m,       
    });

    return {
        proof: {
            a: proof[0],
            b: proof[1],
            c: proof[2],
        },
        cipher: {
            c1: c1,
            c2: c2
        }
    }
}

export async function GenerateSubmitPublicKeyProof(curve: BabyJub, privateKey: bigint): Promise<Util.SubmitPublicKeyProof> {
    let prover = new PublicKey();

    const publicKey: Util.BigPoint = Util.toBigPoint(curve, curve.mulPointEscalar(curve.Base8, privateKey));

    const proof = await prover.prove({
        publicKey: publicKey,
        privateKey: privateKey,     
    });

    return {
        proof: {
            a: proof[0],
            b: proof[1],
            c: proof[2],
        },
        publicKey: publicKey,
    }
}

export async function GenerateDecryptProof(curve: BabyJub, privateKey: bigint, c1: Util.BigPoint): Promise<Util.DecryptProof> {
    let prover = new Decrypt();

    const publicKey: Util.BigPoint = Util.toBigPoint(curve, curve.mulPointEscalar(curve.Base8, privateKey));
    const decryption: Util.BigPoint = Util.toBigPoint(curve, curve.mulPointEscalar(Util.toPoint(curve, c1), privateKey));

    const proof = await prover.prove({
        publicKey: publicKey,
        privateKey: privateKey,
        c1: c1,
        decryption: decryption,
    });

    return {
        proof: {
            a: proof[0],
            b: proof[1],
            c: proof[2],
        },
        decryption: decryption,
    }
}