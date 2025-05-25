// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVoter, ICounter, Point, Cipher, ISponsor} from "../base/interfaces.sol";
import {Groth16Verifier as VoteVerifier} from "../circuit/vote_verifier.sol";
import {Groth16Verifier as PublicKeyVerifier} from "../circuit/publickey_verifier.sol";
import {Groth16Verifier as DecryptVerifier} from "../circuit/decrypt_verifier.sol";
import {Groth16Verifier as SumVerifier} from "../circuit/check_sum_verifier.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// struct VoteValue {
//     Point publicKey;
//     Cipher cipher;
// }

struct VoteInfo {
    address[] candidates;
    address[] voters;
    uint256 sponporEthers;
    uint8 state;
    Point[] counterPublicKeys;
    Cipher[] ballots;
    Point[] decryptPoints;
    uint256 expiredBlock;
    Point sumPublicKey;
    Cipher sumVotes;
}

struct Proof {
    uint[2] a;
    uint[2][2] b;
    uint[2] c;
}

event VoteLog(address voter);
event SubmitPublicKeyLog(Point);
event DecryptLog(Point);
// event InitiateLog(uint256 indexed id);
event ChangeStateLog(uint256 indexed id, uint8 state);

event VerifierChangedLog(string name, address newAddress);

contract Avote is IVoter, ICounter, ISponsor, Initializable, OwnableUpgradeable  {
    uint8 private constant STATE_INITIATED = 1;
    uint8 private constant STATE_VOTING = 2;
    uint8 private constant STATE_TALLYING = 3;
    uint256 private constant WINDOW_SIZE = 32;
    uint256 private constant PUBLIC_SIGNAL_SIZE = WINDOW_SIZE * 2+ 2;
    Point private ZERO_POINT = Point({x: 0, y: 1});

    VoteVerifier voteVerifier;
    PublicKeyVerifier publicKeyVerifier;
    DecryptVerifier decryptVerifier;
    SumVerifier sumVerifier;
    address[] validCounters;
    mapping (uint256=>VoteInfo) voteInfos;  // mapping vote id to voteInfo

    constructor(address _voteVerifier, address _publicKeyVerifier, address _decryptVerifier) initializer {
        voteVerifier = VoteVerifier(_voteVerifier);
        publicKeyVerifier = PublicKeyVerifier(_publicKeyVerifier);
        decryptVerifier = DecryptVerifier(_decryptVerifier);

        __Ownable_init(_msgSender());
    }

    function SetSumVerifier(address verifier) public onlyOwner {
        sumVerifier = SumVerifier(verifier);
        emit VerifierChangedLog("sum", verifier);
    }

    function Vote(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external {
        require(voteInfos[id].state == STATE_VOTING, "state is not voting");
        require(hasVoteRight(id, msg.sender), "no voter right");
        bool isVerified = voteVerifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isVerified, "verify proof failed");
        Cipher memory vote = Cipher({
            c1: Point(_pubSignals[2], _pubSignals[3]),
            c2: Point(_pubSignals[4], _pubSignals[5])
        });
        voteInfos[id].ballots.push(vote);
        emit VoteLog(msg.sender);
    }

    function SubmitPublicKey(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external payable {
        require(isValidCounter(msg.sender), string.concat("invalid counter: ", Strings.toHexString(uint256(uint160(msg.sender)), 20)));
        require(voteInfos[id].state == STATE_INITIATED, "state is not initiated");
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

    function Initiate(address[] calldata candidates, address[] calldata voters, uint256 id, uint256 initiateStateBlockNumbers) external payable {
        require(msg.value >= 1, "less value");
        // require(voteInfos[id].state == 0, "id is existed");
        voteInfos[id] = VoteInfo({ 
            candidates: candidates,
            voters: voters,
            sponporEthers: msg.value,
            state: STATE_INITIATED,
            counterPublicKeys: new Point[](0),
            ballots: new Cipher[](0),
            decryptPoints: new Point[](0),
            expiredBlock: block.number + initiateStateBlockNumbers,
            sumPublicKey: Point({x: 0, y: 1}),
            sumVotes: Cipher({c1: ZERO_POINT, c2: ZERO_POINT})
        });
        emit ChangeStateLog(id, STATE_INITIATED);
    }

    function hasVoteRight(uint256 id, address voter) view internal returns (bool) {
        for (uint256 i = 0; i < voteInfos[id].voters.length; i++) {
            if (voteInfos[id].voters[i] == voter) {
                return true;
            }
        }
        return false;
    }

    function isValidCounter(address counter) view internal returns (bool) {
        for (uint256 i = 0; i < validCounters.length; i++) {
            if (validCounters[i] == counter) {
                return true;
            }
        }
        return false;
    }

    function AddCounter(address counter) external onlyOwner {
        require(!isValidCounter(counter), "counter existed");
        validCounters.push(counter);
    }

    function ChangeStateToVoting(uint256 id, Proof[] calldata proofs, Point[] calldata windowSums) external {
        require(voteInfos[id].state == STATE_INITIATED, "state is not initiated");
        require(validCounters.length == voteInfos[id].counterPublicKeys.length || 
            voteInfos[id].expiredBlock <= block.number, "cannot change state yet");
        require(proofs.length == windowSums.length, "the proofs' length is not equal as the windowSums' length");
        require((voteInfos[id].counterPublicKeys.length-1) / (WINDOW_SIZE-1) + 1 == proofs.length, "the proofs' length is not match with the counters' number");

        uint256 lastX = 0;
        uint256 lastY = 1;
        for (uint256 i = 0; i < proofs.length; i++) {
            uint256[PUBLIC_SIGNAL_SIZE] memory publicSignal;
            publicSignal[0] = lastX;
            publicSignal[1] = lastY;
            for (uint256 j = 0; j < WINDOW_SIZE - 1; j++) {
                if (i*(WINDOW_SIZE - 1)+j < voteInfos[id].counterPublicKeys.length) {
                    publicSignal[(j+1)*2] = voteInfos[id].counterPublicKeys[i*(WINDOW_SIZE - 1)+j].x;
                    publicSignal[(j+1)*2+1] = voteInfos[id].counterPublicKeys[i*(WINDOW_SIZE - 1)+j].y;
                } else {
                    publicSignal[(j+1)*2] = 0;
                    publicSignal[(j+1)*2+1] = 1;
                }
            }
            publicSignal[WINDOW_SIZE*2] = windowSums[i].x;
            publicSignal[WINDOW_SIZE*2+1] = windowSums[i].y;
            bool isVerified = sumVerifier.verifyProof(proofs[i].a, proofs[i].b, proofs[i].c, publicSignal);
            require(isVerified, "check the sum of public key failed");
            lastX = windowSums[i].x;
            lastY = windowSums[i].y;
        }

        voteInfos[id].state = STATE_VOTING;
        voteInfos[id].sumPublicKey = Point({
            x: windowSums[windowSums.length-1].x,
            y: windowSums[windowSums.length-1].y
        });
        emit ChangeStateLog(id, STATE_VOTING);
    }

    function ballotsPoint(uint256 id, uint256 index, uint256 c) view internal returns (Point memory) {
        if (c == 0) {
            return voteInfos[id].ballots[index].c1;
        } else if (c == 1) {
            return voteInfos[id].ballots[index].c2;
        }
        return ZERO_POINT;
    }

    function ChangeStateToTallying(uint256 id, Proof[][2] calldata proofs, Point[][2] calldata windowSums) external {
        require(voteInfos[id].state == STATE_VOTING, "state is not voting");
        require(voteInfos[id].voters.length == voteInfos[id].ballots.length || 
            voteInfos[id].expiredBlock <= block.number, "cannot change state yet");
        require(proofs[0].length == windowSums[0].length, "the proofs' length is not equal as the windowSumsC1' length");
        require(proofs[1].length == windowSums[1].length, "the proofs' length is not equal as the windowSumsC1' length");
        require((voteInfos[id].ballots.length-1) / (WINDOW_SIZE-1) + 1 == proofs[0].length, "the length of proofs c1 is not match with the counters' number");
        require((voteInfos[id].ballots.length-1) / (WINDOW_SIZE-1) + 1 == proofs[1].length, "the length of proofs c2 is not match with the counters' number");

        for (uint256 t = 0; t < 2; t++) {
            uint256 lastX = 0;
            uint256 lastY = 1;
            for (uint256 i = 0; i < proofs[t].length; i++) {
                uint256[PUBLIC_SIGNAL_SIZE] memory publicSignal;
                publicSignal[0] = lastX;
                publicSignal[1] = lastY;
                for (uint256 j = 0; j < WINDOW_SIZE - 1; j++) {
                    if (i*(WINDOW_SIZE - 1)+j < voteInfos[id].ballots.length) {
                        publicSignal[(j+1)*2] = ballotsPoint(id, i*(WINDOW_SIZE - 1)+j, t).x; // voteInfos[id].ballots[i*(WINDOW_SIZE - 1)+j].c1.x;
                        publicSignal[(j+1)*2+1] = ballotsPoint(id, i*(WINDOW_SIZE - 1)+j, t).y; // voteInfos[id].ballots[i*(WINDOW_SIZE - 1)+j].c1.y;
                    } else {
                        publicSignal[(j+1)*2] = 0;
                        publicSignal[(j+1)*2+1] = 1;
                    }
                }
                publicSignal[WINDOW_SIZE*2] = windowSums[t][i].x;
                publicSignal[WINDOW_SIZE*2+1] = windowSums[t][i].y;
                bool isVerified = sumVerifier.verifyProof(proofs[t][i].a, proofs[t][i].b, proofs[t][i].c, publicSignal);
                require(isVerified, "check the sum of public key failed");
                lastX = windowSums[t][i].x;
                lastY = windowSums[t][i].y;
            }
        }
        voteInfos[id].state = STATE_TALLYING;
        voteInfos[id].sumVotes = Cipher({
            c1: Point({
                x: windowSums[0][windowSums[0].length-1].x,
                y: windowSums[0][windowSums[0].length-1].y
            }),
            c2: Point({
                x: windowSums[1][windowSums[1].length-1].x,
                y: windowSums[1][windowSums[1].length-1].y
            })
        });
        emit ChangeStateLog(id, STATE_TALLYING);
    }

    function hasVotingRight(uint256 id, address sender) view internal returns (bool) {
        for (uint256 u = 0; u < voteInfos[id].candidates.length; u++) {
            if (sender == voteInfos[id].candidates[u]) {
                return true;
            }
        }
        return false;
    }

    function GetVoteInfo(uint256 id) view public returns(VoteInfo memory) {
        return voteInfos[id];
    }
}
