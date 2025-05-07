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
