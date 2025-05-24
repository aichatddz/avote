import {Point, buildBabyjub, BabyJub} from "circomlibjs"
import {ethers} from "ethers"
import { bigint } from "hardhat/internal/core/params/argumentTypes";

export interface BigPoint {
    x: bigint;
    y: bigint;
}

export interface Proof {
    a: [bigint, bigint];
    b: [[bigint, bigint], [bigint, bigint]];
    c: [bigint, bigint];
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
  
export interface Cipher {
    c1: Point;
    c2: Point;
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
