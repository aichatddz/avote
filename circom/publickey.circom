pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";

template CounterAddPublicKey(n) {
    signal input publicKey[2];    // public key
    signal input privateKey;

    signal isInRange <== LessThan(n)([privateKey, 2736030358979909402780800718157159386076813972158567259200215660948447373041]);
    isInRange === 1;

    component d = Num2Bits(n);
    d.in <== privateKey;

    component q = EscalarMulFix(n, [5299619240641551281634865583518297030282874472190772894086521144482721001553, 16950150798460657717958625567821834550301663161624707787222815936182638968203]);
    q.e <== d.out;
    q.out === publicKey;
}

component main {public [publicKey]} = CounterAddPublicKey(252);