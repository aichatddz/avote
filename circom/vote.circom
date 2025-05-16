pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";

template MulAdd() {
    signal input rx;
    signal input ry;
    signal input x;
    signal input y;
    signal input kBit;

    signal output xout;
    signal output yout;

    component dbl = BabyDbl();
    dbl.x <== rx;
    dbl.y <== ry;

    component add = BabyAdd();
    add.x1 <== dbl.xout;
    add.y1 <== dbl.yout;
    add.x2 <== x;
    add.y2 <== y;

    xout <== (add.xout - dbl.xout) * kBit + dbl.xout;
    yout <== (add.yout - dbl.yout) * kBit + dbl.yout;
}

template ManualScalarMul(n) {
    signal input k[n];
    signal input x;
    signal input y;
    signal output xout;
    signal output yout;

    component mulAdd[n];
    mulAdd[0] = MulAdd();
    mulAdd[0].rx <== 0;
    mulAdd[0].ry <== 1;
    mulAdd[0].x <== x;
    mulAdd[0].y <== y;
    mulAdd[0].kBit <== k[0];
    for (var i = 1; i < n; i++) {
        mulAdd[i] = MulAdd();
        mulAdd[i].rx <== mulAdd[i-1].xout;
        mulAdd[i].ry <== mulAdd[i-1].yout;
        mulAdd[i].x <== x;
        mulAdd[i].y <== y;
        mulAdd[i].kBit <== k[i];
    }

    xout <== mulAdd[n-1].xout;
    yout <== mulAdd[n-1].yout;
}

template ECElGamalEncryptBabyJubjub(n) {
    signal input k2[n];
    signal input publicKey[2];
    signal input c1[2];
    signal input c2[2];
    signal input m[2];
    signal input randomK;

    signal isInRange <== LessThan(n)([randomK, 2736030358979909402780800718157159386076813972158567259200215660948447373041]);
    isInRange === 1;

    component k = Num2Bits(n);
    k.in <== randomK;

    for (var i = 0; i < n; i++) {
        k.out[i] === k2[n-1-i];
    }

    component kMulG = EscalarMulFix(n, [5299619240641551281634865583518297030282874472190772894086521144482721001553, 16950150798460657717958625567821834550301663161624707787222815936182638968203]);
    kMulG.e <== k.out;

    // component kMulG = ManualScalarMul(n);
    // kMulG.k <== k;
    // kMulG.x <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    // kMulG.y <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    component kMulPublickey = EscalarMulAny(n);
    kMulPublickey.e <== k.out;
    kMulPublickey.p[0] <== publicKey[0];
    kMulPublickey.p[1] <== publicKey[1];

    // component kMulPublickey = ManualScalarMul(n);
    // kMulPublickey.k <== k;
    // kMulPublickey.x <== publicKey[0];
    // kMulPublickey.y <== publicKey[1];

    component calculateC2 = BabyAdd();
    calculateC2.x1 <== m[0];
    calculateC2.y1 <== m[1];
    calculateC2.x2 <== kMulPublickey.out[0];
    calculateC2.y2 <== kMulPublickey.out[1];

    kMulG.out[0] === c1[0];
    kMulG.out[1] === c1[1];
    calculateC2.xout === c2[0];
    calculateC2.yout === c2[1];
}

component main {public [publicKey, c1, c2]} = ECElGamalEncryptBabyJubjub(252);
