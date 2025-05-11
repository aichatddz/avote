// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVoter, ICounter, Point, Cipher} from "../base/interfaces.sol";
import {Groth16Verifier as VoteVerifier} from "../circuit/vote_verifier.sol";
import {Groth16Verifier as PublicKeyVerifier} from "../circuit/publickey_verifier.sol";
import {Groth16Verifier as DecryptVerifier} from "../circuit/decrypt_verifier.sol";

struct VoteValue {
    Point publicKey;
    Cipher cipher;
}

event VoteLog(VoteValue);
event SubmitPublicKeyLog(Point);
event DecryptLog(Point);

contract Voter is IVoter, ICounter {
    VoteVerifier voteVerifier;
    PublicKeyVerifier publicKeyVerifier;
    DecryptVerifier decryptVerifier;
    VoteValue[] votes;
    Point[] counterPublicKeys;
    Point[] decryptPoints;

    constructor(address _verifierAddr, address _publicKeyVerifier, address _decryptVerifier) {
        voteVerifier = VoteVerifier(_verifierAddr);
        publicKeyVerifier = PublicKeyVerifier(_publicKeyVerifier);
        decryptVerifier = DecryptVerifier(_decryptVerifier);
    }

    function Vote(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external {
        bool isVerified = voteVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isVerified, "verify proof failed");
        VoteValue memory vote = VoteValue({
            publicKey: Point({x: _pubSignals[0], y: _pubSignals[1]}),
            cipher: Cipher({
                c1: Point(_pubSignals[2], _pubSignals[3]),
                c2: Point(_pubSignals[4], _pubSignals[5])
            })
        });
        votes.push(vote);
        emit VoteLog(vote);
    }

    function Votes() external view returns (Cipher[] memory) {
        Cipher[] memory c = new Cipher[](votes.length);
        for (uint256 i = 0; i < votes.length; ++i) {
            c[i] = votes[i].cipher;
        }
        return c;
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
        Point memory decrypt = Point({
            x: _pubSignals[4],
            y: _pubSignals[5]
        });
        decryptPoints.push(decrypt);
        emit DecryptLog(decrypt);
    }

    function CounterPublicKeys() external view returns (Point[] memory) {
        return counterPublicKeys;
    }

    function DecryptPoints() external view returns (Point[] memory) {
        return decryptPoints;
    }
}
