pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/babyjub.circom";

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
    signal input k[n];
    signal input qx, qy;
    signal input c1x, c1y;
    signal input c2x, c2y;
    signal input mx, my;

    component c1 = ManualScalarMul(n);
    c1.k <== k;
    c1.x <== 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    c1.y <== 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    component kQ = ManualScalarMul(n);
    kQ.k <== k;
    kQ.x <== qx;
    kQ.y <== qy;

    component c2 = BabyAdd();
    c2.x1 <== mx;
    c2.y1 <== my;
    c2.x2 <== kQ.xout;
    c2.y2 <== kQ.yout;

    c1.xout === c1x;
    c1.yout === c1y;
    c2.xout === c2x;
    c2.yout === c2y;
}

component main {public [qx, qy, c1x, c1y]} = ECElGamalEncryptBabyJubjub(256);