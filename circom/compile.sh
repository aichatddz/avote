set -x
circom ./vote.circom --r1cs --wasm -o ./compile
snarkjs groth16 setup ./compile/vote.r1cs ./init/pot14_final.ptau ./compile/vote_0000.zkey
openssl rand -base64 32 | snarkjs zkey contribute ./compile/vote_0000.zkey ./vote_0001.zkey --name="1st Contributor Name" -v
# snarkjs zkey export verificationkey ./vote_0001.zkey ./vote_verification_key.json
snarkjs zkey export solidityverifier ./vote_0001.zkey ../contracts/circuit/vote_verifier.sol

circom ./decrypt.circom --r1cs --wasm -o ./compile
snarkjs groth16 setup ./compile/decrypt.r1cs ./init/pot14_final.ptau ./compile/decrypt_0000.zkey
openssl rand -base64 32 | snarkjs zkey contribute ./compile/decrypt_0000.zkey ./decrypt_0001.zkey --name="1st Contributor Name" -v
# snarkjs zkey export verificationkey ./decrypt_0001.zkey ./decrypt_verification_key.json
snarkjs zkey export solidityverifier ./decrypt_0001.zkey ../contracts/circuit/decrypt_verifier.sol

circom ./publickey.circom --r1cs --wasm -o ./compile
snarkjs groth16 setup ./compile/publickey.r1cs ./init/pot14_final.ptau ./compile/publickey_0000.zkey
openssl rand -base64 32 | snarkjs zkey contribute ./compile/publickey_0000.zkey ./publickey_0001.zkey --name="1st Contributor Name" -v
# snarkjs zkey export verificationkey ./publickey_0001.zkey ./publickey_verification_key.json
snarkjs zkey export solidityverifier ./publickey_0001.zkey ../contracts/circuit/publickey_verifier.sol
