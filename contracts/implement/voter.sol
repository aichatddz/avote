// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVoter, ICounter, Point} from "../base/interfaces.sol";
import {Groth16Verifier as VoteVerifier} from "../circuit/vote_verifier.sol";
import {Groth16Verifier as PublicKeyVerifier} from "../circuit/publickey_verifier.sol";
import {Groth16Verifier as DecryptVerifier} from "../circuit/decrypt_verifier.sol";

struct VoteValue {
    uint256 qx;
    uint256 qy;
    uint256 c1x;
    uint256 c1y;
}

struct DecryptValue {
    Point dMulC1;
}

event VoteLog(VoteValue);
event SubmitPublicKeyLog(Point);
event DecryptLog(DecryptValue);

contract Voter is IVoter, ICounter {
    VoteVerifier voteVerifier;
    PublicKeyVerifier publicKeyVerifier;
    DecryptVerifier decryptVerifier;
    VoteValue[] public votes;
    Point[] counterPublicKeys;
    DecryptValue[] public decryptValues;

    constructor(address _verifierAddr, address _publicKeyVerifier, address _decryptVerifier) {
        voteVerifier = VoteVerifier(_verifierAddr);
        publicKeyVerifier = PublicKeyVerifier(_publicKeyVerifier);
        decryptVerifier = DecryptVerifier(_decryptVerifier);
    }

    function Vote(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals) external {
        bool isVerified = voteVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isVerified, "verify proof failed");
        VoteValue memory vote = VoteValue({
            qx: _pubSignals[0],
            qy: _pubSignals[1],
            c1x: _pubSignals[2],
            c1y: _pubSignals[3]
        });
        votes.push(vote);
        emit VoteLog(vote);
    }

    function SubmitPublicKey(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external payable {
        bool isVerified = publicKeyVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isVerified, "SubmitPublicKey proof failed");
        Point memory publicKey = Point({
            x: _pubSignals[0],
            y: _pubSignals[1]
        });
        counterPublicKeys.push(publicKey);
        emit SubmitPublicKeyLog(publicKey);
    }

    function Decrypt(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external {
        bool isVerified = decryptVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isVerified, "Decrypt proof failed");
        DecryptValue memory decrypt = DecryptValue({
            dMulC1: Point({
                x: _pubSignals[4],
                y: _pubSignals[5]
            })
        });
        decryptValues.push(decrypt);
        emit DecryptLog(decrypt);
    }

    function PublicKeys() external view returns (Point[] memory) {
        return counterPublicKeys;
    }
}
