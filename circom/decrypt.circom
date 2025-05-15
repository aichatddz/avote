pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";
include "./util.circom";

template ECElGamalDecrypt(n) {
    signal input publicKey[2];    // public key
    signal input c1[2];
    signal input d[n];      // private key bits
    signal input dMulC1[2]; // d*C1

    component q = ManualScalarMul(n);
    q.k <== d;
    q.x <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    q.y <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    q.xout === publicKey[0];
    q.yout === publicKey[1];

    component mul = ManualScalarMul(n);
    mul.k <== d;
    mul.x <== c1[0];
    mul.y <== c1[1];

    mul.xout === dMulC1[0];
    mul.yout === dMulC1[1];
}

component main {public [publicKey, c1, dMulC1]} = ECElGamalDecrypt(256);