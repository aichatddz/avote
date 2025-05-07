pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";
include "./util.circom";

template ECElGamalDecrypt(n) {
    signal input qx, qy;    // public key
    signal input c1x, c1y;
    signal input d[n];      // private key bits
    signal input dc1x, dc1y; // d*C1

    component q = ManualScalarMul(n);
    q.k <== d;
    q.x <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    q.y <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    q.xout === qx;
    q.yout === qy;

    component c1 = ManualScalarMul(n);
    c1.k <== d;
    c1.x <== c1x;
    c1.y <== c1y;

    c1.xout === dc1x;
    c1.yout === dc1y;
}

component main {public [qx, qy, c1x, c1y, dc1x, dc1y]} = ECElGamalDecrypt(256);