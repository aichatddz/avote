import {Point, buildBabyjub, BabyJub} from "circomlibjs"
import {ethers} from "ethers"

export interface BigPoint {
    x: bigint;
    y: bigint;
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
        console.log("before: ", bigPoints[i])
        points.push(toPoint(curve, bigPoints[i]))
        console.log("after: ", toBigPoint(curve, points[i]))
    }
    let sum = sumPoints(curve, points);
    return toBigPoint(curve, sum);
}
// export async function decrypt(c1s: Point[], counterPrivateKey: bigint): Promise<Point> {
//     const curve = await buildBabyjub();
//     for (let i in c1s) {
//         c1s.push(c1s[i]);
//     }
//     let sumC1 = await sumPoints(c1s);
//     let dSumC1 = curve.mulPointEscalar(sumC1, counterPrivateKey);
//     let p: [bigint, bigint] = [
//         ethers.toBigInt(dSumC1[0]),
//         ethers.toBigInt(dSumC1[1]),
//     ]
//     let negDSumC1: Point = [curve.F.e(-p[0]), curve.F.e(p[1])];
//     return negDSumC1;
// }

export function decode(curve: BabyJub, dMulC1: BigPoint, c2: BigPoint): BigPoint {
    let negDSumC1: Point = [curve.F.e(-dMulC1.x), curve.F.e(dMulC1.y)];
    let plainPoint = curve.addPoint(toPoint(curve, c2), negDSumC1);
    return toBigPoint(curve, plainPoint)
}