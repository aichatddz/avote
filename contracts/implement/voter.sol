// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVoter, ICounter, Point, Cipher, ISponsor} from "../base/interfaces.sol";
import {Groth16Verifier as VoteVerifier} from "../circuit/vote_verifier.sol";
import {Groth16Verifier as ScalarMulGVerifier} from "../circuit/scalar_mul_g_verifier.sol";
import {Groth16Verifier as DecryptVerifier} from "../circuit/decrypt_verifier.sol";
import {Groth16Verifier as SumVerifier} from "../circuit/check_sum_verifier.sol";
import {Groth16Verifier as PublicKeyVerifier} from "../circuit/public_key_verifier.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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
    // Point decryptResultPoint;
    uint256[] tally;
}

struct Proof {
    uint[2] a;
    uint[2][2] b;
    uint[2] c;
}

struct SumProof {
    Proof proof;
    Point sum;
}

struct TallyProof {
    Proof proof;
    uint256[] tally;
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
    uint8 private constant STATE_PUBLISHED = 3;
    
    uint256 private constant WINDOW_SIZE = 32;
    uint256 private constant PUBLIC_SIGNAL_SIZE = WINDOW_SIZE * 2+ 2;
    Point private ZERO_POINT = Point({x: 0, y: 1});

    VoteVerifier voteVerifier;
    ScalarMulGVerifier scalarMulGVerifier;
    DecryptVerifier decryptVerifier;
    SumVerifier sumVerifier;
    PublicKeyVerifier publicKeyVerifier;
    address[] validCounters;
    mapping (uint256=>VoteInfo) voteInfos;  // mapping vote id to voteInfo

    constructor(address _voteVerifier, address _publicKeyVerifier, address _decryptVerifier) initializer {
        voteVerifier = VoteVerifier(_voteVerifier);
        scalarMulGVerifier = ScalarMulGVerifier(_publicKeyVerifier);
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
            sumVotes: Cipher({c1: ZERO_POINT, c2: ZERO_POINT}),
            // decryptResultPoint: Point({x: 0, y: 1})
            tally: new uint256[](0)
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

    function ChangeStateToVoting(uint256 id, SumProof[] calldata sumProofs) external {
        require(voteInfos[id].state == STATE_INITIATED, "state is not initiated");
        require(validCounters.length == voteInfos[id].counterPublicKeys.length || 
            voteInfos[id].expiredBlock <= block.number, "cannot change state yet");
        require((voteInfos[id].counterPublicKeys.length-1) / (WINDOW_SIZE-1) + 1 == sumProofs.length, "the proofs' length is not match with the counters' number");

        Point[] memory points = new Point[](voteInfos[id].counterPublicKeys.length);
        for (uint256 i = 0; i < voteInfos[id].counterPublicKeys.length; i++) {
            points[i] = voteInfos[id].counterPublicKeys[i];
        }
        require(verifySum(sumProofs, points), "check the sum of public key failed");

        voteInfos[id].state = STATE_VOTING;
        voteInfos[id].sumPublicKey = Point({
            x: sumProofs[sumProofs.length-1].sum.x,
            y: sumProofs[sumProofs.length-1].sum.y
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

    function ChangeStateToTallying(uint256 id, SumProof[] calldata proofsC1, SumProof[] calldata proofsC2) external {
        require(voteInfos[id].state == STATE_VOTING, "state is not voting");
        require(voteInfos[id].voters.length == voteInfos[id].ballots.length || 
            voteInfos[id].expiredBlock <= block.number, "cannot change state yet");
        require((voteInfos[id].ballots.length-1) / (WINDOW_SIZE-1) + 1 == proofsC1.length, "the length of proofs c1 is not match with the counters' number");
        require((voteInfos[id].ballots.length-1) / (WINDOW_SIZE-1) + 1 == proofsC2.length, "the length of proofs c2 is not match with the counters' number");

        Point[] memory c1Points = new Point[](voteInfos[id].ballots.length);
        Point[] memory c2Points = new Point[](voteInfos[id].ballots.length);
        for (uint256 i = 0; i < voteInfos[id].ballots.length; i++) {
            c1Points[i] = voteInfos[id].ballots[i].c1;
            c2Points[i] = voteInfos[id].ballots[i].c2;
        }
        require(verifySum(proofsC1, c1Points), "check the sum of c1 failed");
        require(verifySum(proofsC2, c2Points), "check the sum of c2 failed");

        voteInfos[id].state = STATE_TALLYING;
        voteInfos[id].sumVotes = Cipher({
            c1: Point({
                x: proofsC1[proofsC1.length-1].sum.x,
                y: proofsC1[proofsC1.length-1].sum.y
            }),
            c2: Point({
                x: proofsC2[proofsC2.length-1].sum.x,
                y: proofsC2[proofsC2.length-1].sum.y
            })
        });
        emit ChangeStateLog(id, STATE_TALLYING);
    }

    function ChangeStateToPublished(uint256 id, SumProof[] memory proofs, TallyProof memory tallyProof) external {
        require(voteInfos[id].state == STATE_TALLYING, "state is not tallying");
        require(validCounters.length == voteInfos[id].counterPublicKeys.length || 
            voteInfos[id].expiredBlock <= block.number, "cannot change state yet");
        require((voteInfos[id].decryptPoints.length-1) / (WINDOW_SIZE-1) + 1 == proofs.length, "the length of proofs is not match with the decryptPoints' number");
        require(tallyProof.tally.length == voteInfos[id].voters.length, "tally size is not equal to proof tally size");

        Point[] memory points = new Point[](voteInfos[id].decryptPoints.length + 1);
        points[0] = voteInfos[id].sumVotes.c2;
        for (uint256 i = 0; i < voteInfos[id].decryptPoints.length; i++) {
            points[i+1] = Point({
                x: 21888242871839275222246405745257275088548364400416034343698204186575808495617-voteInfos[id].decryptPoints[i].x,
                y: voteInfos[id].decryptPoints[i].y
            });
        }
        require(verifySum(proofs, points), "check the sum failed");

        uint256 scalar;
        for (uint256 i = 0; i < voteInfos[id].voters.length; i++) {
            scalar += tallyProof.tally[i] * (voteInfos[id].voters.length+1) ** (voteInfos[id].candidates.length-1-i);
        }
        require(scalarMulGVerifier.verifyProof(tallyProof.proof.a, tallyProof.proof.b, tallyProof.proof.c,
            [scalar, proofs[proofs.length-1].sum.x, proofs[proofs.length-1].sum.y]), string.concat("scalar mul G proof invalid: ",
             Strings.toString(proofs[proofs.length-1].sum.x), ",", Strings.toString(proofs[proofs.length-1].sum.y)));

        voteInfos[id].state = STATE_PUBLISHED;
        // voteInfos[id].decryptResultPoint = proofs[proofs.length-1].sum;
        voteInfos[id].tally = tallyProof.tally;

        emit ChangeStateLog(id, STATE_PUBLISHED);
    }

    function hasVotingRight(uint256 id, address sender) view internal returns (bool) {
        for (uint256 u = 0; u < voteInfos[id].candidates.length; u++) {
            if (sender == voteInfos[id].candidates[u]) {
                return true;
            }
        }
        return false;
    }

    function verifySum(SumProof[] memory sumProofs, Point[] memory points) view internal returns (bool) {
        uint256 lastX = 0;
        uint256 lastY = 1;
        for (uint256 i = 0; i < sumProofs.length; i++) {
            uint256[PUBLIC_SIGNAL_SIZE] memory publicSignal;
            publicSignal[0] = lastX;
            publicSignal[1] = lastY;
            for (uint256 j = 0; j < WINDOW_SIZE - 1; j++) {
                if (i*(WINDOW_SIZE - 1)+j < points.length) {
                    publicSignal[(j+1)*2] = points[i*(WINDOW_SIZE - 1)+j].x;
                    publicSignal[(j+1)*2+1] = points[i*(WINDOW_SIZE - 1)+j].y;
                } else {
                    publicSignal[(j+1)*2] = 0;
                    publicSignal[(j+1)*2+1] = 1;
                }
            }
            publicSignal[WINDOW_SIZE*2] = sumProofs[i].sum.x;
            publicSignal[WINDOW_SIZE*2+1] = sumProofs[i].sum.y;
            bool isVerified = sumVerifier.verifyProof(sumProofs[i].proof.a, sumProofs[i].proof.b, sumProofs[i].proof.c, publicSignal);
            if (!isVerified) {
                return false;
            }
            lastX = sumProofs[i].sum.x;
            lastY = sumProofs[i].sum.y;
        }
        return true;
    }

    function GetVoteInfo(uint256 id) view public returns(VoteInfo memory) {
        return voteInfos[id];
    }
}
