pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";
include "./util.circom";

template ECElGamalPublicKey(n) {
    signal input publicKey[2];    // public key
    // signal input d[n];      // private key bits
    signal input privateKey;

    component d = Num2Bits(n);
    d.in <== privateKey;

    // component q = ManualScalarMul(n);
    // q.k <== d.out;
    // q.x <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    // q.y <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;
    component q = EscalarMulFix(n, [5299619240641551281634865583518297030282874472190772894086521144482721001553, 16950150798460657717958625567821834550301663161624707787222815936182638968203]);
    q.e <== d.out;
    q.out[0] === publicKey[0];
    q.out[1] === publicKey[1];
}

component main {public [publicKey]} = ECElGamalPublicKey(256);