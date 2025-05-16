pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "./util.circom";

template ECElGamalDecrypt(n) {
    signal input publicKey[2];    // public key
    signal input c1[2];
    signal input privateKey;      // private key
    signal input dMulC1[2]; // d*C1

    component d = Num2Bits(n);
    d.in <== privateKey;

    component q = EscalarMulFix(n, [5299619240641551281634865583518297030282874472190772894086521144482721001553, 16950150798460657717958625567821834550301663161624707787222815936182638968203]);
    q.e <== d.out;

    // component q = ManualScalarMul(n);
    // q.k <== d.out;
    // q.x <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    // q.y <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    q.out[0] === publicKey[0];
    q.out[1] === publicKey[1];

    component mul = EscalarMulAny(n);
    mul.e <== d.out;
    mul.p[0] <== c1[0];
    mul.p[1] <== c1[1];
    // component mul = ManualScalarMul(n);
    // mul.k <== d;
    // mul.x <== c1[0];
    // mul.y <== c1[1];

    mul.out[0] === dMulC1[0];
    mul.out[1] === dMulC1[1];
}

component main {public [publicKey, c1, dMulC1]} = ECElGamalDecrypt(256);