// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVoter, ICounter, Point, Cipher, ISponsor} from "../base/interfaces.sol";
import {Groth16Verifier as VoteVerifier} from "../circuit/vote_verifier.sol";
import {Groth16Verifier as PublicKeyVerifier} from "../circuit/publickey_verifier.sol";
import {Groth16Verifier as DecryptVerifier} from "../circuit/decrypt_verifier.sol";

struct VoteValue {
    Point publicKey;
    Cipher cipher;
}

struct VoteInfo {
    address[] candidates;
    uint256 sponporEthers;
    uint16 state;
    Point[] counterPublicKeys;
    VoteValue[] votes;
    Point[] decryptPoints;
}

event VoteLog(VoteValue);
event SubmitPublicKeyLog(Point);
event DecryptLog(Point);
event InitiateLog(uint256 indexed id);

contract Avote is IVoter, ICounter, ISponsor {
    VoteVerifier voteVerifier;
    PublicKeyVerifier publicKeyVerifier;
    DecryptVerifier decryptVerifier;
    mapping (uint256=>VoteInfo) voteInfos;  // mapping vote id to voteInfo

    constructor(address _verifierAddr, address _publicKeyVerifier, address _decryptVerifier) {
        voteVerifier = VoteVerifier(_verifierAddr);
        publicKeyVerifier = PublicKeyVerifier(_publicKeyVerifier);
        decryptVerifier = DecryptVerifier(_decryptVerifier);
    }

    function Vote(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external {
        bool isVerified = voteVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isVerified, "verify proof failed");
        VoteValue memory vote = VoteValue({
            publicKey: Point({x: _pubSignals[0], y: _pubSignals[1]}),
            cipher: Cipher({
                c1: Point(_pubSignals[2], _pubSignals[3]),
                c2: Point(_pubSignals[4], _pubSignals[5])
            })
        });
        voteInfos[id].votes.push(vote);
        emit VoteLog(vote);
    }

    function Votes(uint256 id) external view returns (Cipher[] memory) {
        Cipher[] memory c = new Cipher[](voteInfos[id].votes.length);
        for (uint256 i = 0; i < voteInfos[id].votes.length; ++i) {
            c[i] = voteInfos[id].votes[i].cipher;
        }
        return c;
    }

    function SubmitPublicKey(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external payable {
        bool isVerified = publicKeyVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isVerified, "SubmitPublicKey proof failed");
        Point memory publicKey = Point({
            x: _pubSignals[0],
            y: _pubSignals[1]
        });
        voteInfos[id].counterPublicKeys.push(publicKey);
        emit SubmitPublicKeyLog(publicKey);
    }

    function Decrypt(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external {
        bool isVerified = decryptVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isVerified, "Decrypt proof failed");
        Point memory decrypt = Point({
            x: _pubSignals[4],
            y: _pubSignals[5]
        });
        voteInfos[id].decryptPoints.push(decrypt);
        emit DecryptLog(decrypt);
    }

    function CounterPublicKeys(uint256 id) external view returns (Point[] memory) {
        return voteInfos[id].counterPublicKeys;
    }

    function DecryptPoints(uint256 id) external view returns (Point[] memory) {
        return voteInfos[id].decryptPoints;
    }

    function Initiate(address[] calldata candidates, uint256 id) external payable {
        require(msg.value >= 1, "less value");
        require(voteInfos[id].state == 0, "id is existed");
        voteInfos[id] = VoteInfo({ 
            candidates: candidates,
            sponporEthers: msg.value,
            state: 1,
            counterPublicKeys: new Point[](0),
            votes: new VoteValue[](0),
            decryptPoints: new Point[](0)
        });
        emit InitiateLog(id);
    }
}
