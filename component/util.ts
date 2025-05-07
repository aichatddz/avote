import {Point, buildBabyjub} from "circomlibjs"

export async function getPublicKey(publicKeys: Point[]): Promise<Point> {
    const curve = await buildBabyjub();
    let publicKey: Point = [curve.F.zero, curve.F.one];
    for (let i = 0; i < publicKeys.length; i++) {
        publicKey = curve.addPoint(publicKey, publicKeys[i]);
    }
    return publicKey;
}
