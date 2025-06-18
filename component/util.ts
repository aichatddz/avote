import {Point, BabyJub} from "circomlibjs"
import {ethers} from "ethers"

export interface BigPoint {
    x: bigint;
    y: bigint;
}

export interface Proof {
    a: [bigint, bigint];
    b: [[bigint, bigint], [bigint, bigint]];
    c: [bigint, bigint];
}

export interface VoteProof {
    proof: Proof;
    cipher: BigCipher;
}

export interface SumProof {
    proof: Proof;
    sum: BigPoint;
}

export interface PublishProof {
    proof: Proof;
    tally: bigint[];
}

export function toBigPoint(curve: BabyJub, p: Point): BigPoint {
    return {
        x: ethers.toBigInt(curve.F.toString(p[0])),
        y: ethers.toBigInt(curve.F.toString(p[1])),
    }
}

export function toPoint(curve: BabyJub, b: BigPoint): Point {
    return [
        curve.F.e(b.x),
        curve.F.e(b.y),
    ]
}

export function mulBigPointEscalar(curve: BabyJub, point: BigPoint, scalar: bigint): BigPoint {
    return toBigPoint(curve, curve.mulPointEscalar(toPoint(curve, point), scalar));
}
  
export interface Cipher {
    c1: Point;
    c2: Point;
}

export interface BigCipher {
    c1: BigPoint;
    c2: BigPoint;
}

export function sumPoints(curve: BabyJub, points: Point[]): Point {
    let publicKey: Point = [curve.F.zero, curve.F.one];
    for (let i = 0; i < points.length; i++) {
        publicKey = curve.addPoint(publicKey, points[i]);
    }
    return publicKey;
}

export function sumBigPoints(curve: BabyJub, bigPoints: readonly BigPoint[]): BigPoint {
    let points: Point[] = [];

    for (let i in bigPoints) {
        points.push(toPoint(curve, bigPoints[i]))
    }
    let sum = sumPoints(curve, points);
    return toBigPoint(curve, sum);
}

export function decode(curve: BabyJub, dMulC1: BigPoint, c2: BigPoint): BigPoint {
    let negDSumC1: Point = [curve.F.e(-dMulC1.x), curve.F.e(dMulC1.y)];
    let plainPoint = curve.addPoint(toPoint(curve, c2), negDSumC1);
    return toBigPoint(curve, plainPoint)
}

export function randomScalar(curve: BabyJub): bigint {
    return ethers.toBigInt(ethers.randomBytes(32)) % curve.subOrder;
}

function search(curve: BabyJub, target: Point, base: bigint, voterNumber: bigint, remainVoters: bigint, state: bigint[]): bigint[] {

    if (base == 1n) {
        state.push(remainVoters);
        // console.log(state);
        let cur = toBigPoint(curve, curve.mulPointEscalar(curve.Base8, remainVoters));
        let t = toBigPoint(curve, target);
        if (t.x == cur.x && t.y == cur.y) {
            return state
        } else {
            state.pop();
            return []
        }
    }

    for (let v = 0n; v <= remainVoters; v = v + 1n) {
        let subtracter = base * v;
        let point = toBigPoint(curve, curve.mulPointEscalar(curve.Base8, subtracter));
        let negPoint: BigPoint = {
            x: -point.x,
            y: point.y
        }
        let remainPoint: Point = curve.addPoint(target, toPoint(curve, negPoint))
        let nextBase: bigint = base / (voterNumber+1n)
        state.push(v)
        if (search(curve, remainPoint, nextBase, voterNumber, remainVoters-v, state).length > 0) {
            return state;
        }
        state.pop();
    }
    return [];
}

export function DecodePointToScalar(curve: BabyJub, target: Point, voters: bigint, counters: bigint): bigint[] {
    let base = (voters+1n) ** (counters-1n);
    // console.log(toBigPoint(curve, target));
    return search(curve, target, base, voters, voters, [])
}