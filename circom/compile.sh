#!/bin/bash

set -x

circuits=( $(ls *.circom | awk -F "." '{print $1}') )
echo ${circuits}
for circuit in "${circuits[@]}"
do
    circom ./${circuit}.circom --r1cs --wasm -o ./compile
    snarkjs groth16 setup ./compile/${circuit}.r1cs ./init/pot14_final.ptau ./compile/${circuit}_0000.zkey
    openssl rand -base64 32 | snarkjs zkey contribute ./compile/${circuit}_0000.zkey ./${circuit}_0001.zkey --name="1st Contributor Name" -v
    snarkjs zkey export solidityverifier ./${circuit}_0001.zkey ../contracts/circuit/${circuit}_verifier.sol
done
