// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAvote, Cipher, Point, VoteInfo, Proof, SumProof, TallyProof, ActivityInfo, Voter, Counter} from "../base/interfaces.sol";
import {Groth16Verifier as VoteVerifier} from "../circuit/vote_verifier.sol";
import {Groth16Verifier as ScalarMulGVerifier} from "../circuit/scalar_mul_g_verifier.sol";
import {Groth16Verifier as DecryptVerifier} from "../circuit/decrypt_verifier.sol";
import {Groth16Verifier as SumVerifier} from "../circuit/check_sum_verifier.sol";
import {Groth16Verifier as PublicKeyVerifier} from "../circuit/public_key_verifier.sol";

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

event Action(string name, uint256 id);

event VoteLog(address voter);
event ChangeStateLog(uint256 indexed id, uint8 state);
event VerifierChangedLog(string name, address newAddress);
event UpgradedLog(address newImplementation);

contract Avote is IAvote, Initializable, OwnableUpgradeable, UUPSUpgradeable  {
    uint8 private constant STATE_INITIATINT = 1;
    uint8 private constant STATE_VOTING = 2;
    uint8 private constant STATE_TALLYING = 3;
    uint8 private constant STATE_PUBLISHED = 4;

    uint8 private constant COUNTER_STATE_NONE = 0;
    uint8 private constant COUNTER_STATE_PUBLIC_KEY_SUBMITTED = 1;
    uint8 private constant COUNTER_STATE_DECRYPTION_SUBMITTED = 2;
    
    uint8 private constant VOTER_STATE_NONE = 0;
    uint8 private constant VOTER_STATE_INIT = 1;
    uint8 private constant VOTER_STATE_ENCRYPTION_SUBMITTED = 2;

    uint256 private constant WINDOW_SIZE = 32;
    uint256 private constant PUBLIC_SIGNAL_SIZE = WINDOW_SIZE * 2+ 2;

    VoteVerifier public voteVerifier;
    ScalarMulGVerifier public scalarMulGVerifier;
    DecryptVerifier public decryptVerifier;
    SumVerifier public sumVerifier;
    PublicKeyVerifier public publicKeyVerifier;
    address[] public validCounters;
    mapping (uint256=>VoteInfo) voteInfos;  // deprecated. mapping vote id to voteInfo
    mapping (uint256=>ActivityInfo) activityInfos;  // mapping vote id to ActivityInfo

    function getZeroPoint() public pure returns (Point memory) {
        return Point(0, 1);
    }

    function initialize(address _voteVerifier, address _publicKeyVerifier, address _decryptVerifier, address _sumVerifier, address _scalarMulGVerifier) public initializer {
        voteVerifier = VoteVerifier(_voteVerifier);
        publicKeyVerifier = PublicKeyVerifier(_publicKeyVerifier);
        decryptVerifier = DecryptVerifier(_decryptVerifier);
        sumVerifier = SumVerifier(_sumVerifier);
        scalarMulGVerifier = ScalarMulGVerifier(_scalarMulGVerifier);
        __Ownable_init(_msgSender());
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        require(newImplementation != address(0), "Invalid address");
        emit UpgradedLog(newImplementation);
    }

    function SetSumVerifier(address verifier) public onlyOwner {
        sumVerifier = SumVerifier(verifier);
        emit VerifierChangedLog("sum", verifier);
    }

    function Initiate(
        address[] calldata candidates,
        address[] calldata voterAddresses,
        uint256 id,
        uint256 initiateStateBlockNumbers,
        uint256 votingStateBlockNumbers,
        uint256 tallyingStateBlockNumbers
    ) external payable {
        require(msg.value >= 1, "less value");
        require(activityInfos[id].state == 0, "id is existed");

        for (uint256 u = 0; u < voterAddresses.length; u++) {
            Voter memory voter;
            voter.addr = voterAddresses[u];
            voter.state = VOTER_STATE_INIT;
            voter.ballot = Cipher({c1: getZeroPoint(), c2: getZeroPoint()});
            activityInfos[id].voters.push(voter);
        }

        activityInfos[id].candidates = candidates;
        activityInfos[id].sponporStateAmount = msg.value;
        activityInfos[id].state = STATE_INITIATINT;
        activityInfos[id].expiredInitiatingBlock = block.number + initiateStateBlockNumbers;
        activityInfos[id].expiredVotingBlock = activityInfos[id].expiredInitiatingBlock + votingStateBlockNumbers;
        activityInfos[id].expiredTallyingBlock = activityInfos[id].expiredVotingBlock + tallyingStateBlockNumbers;
        activityInfos[id].sumPublicKey = getZeroPoint();
        activityInfos[id].sumVotes = Cipher({c1: getZeroPoint(), c2: getZeroPoint()});
        activityInfos[id].tally = new uint256[](0);

        emit ChangeStateLog(id, STATE_INITIATINT);
    }

    function SubmitPublicKey(uint256 id, Proof calldata proof, Point calldata publicKey) external payable {
        require(isValidCounter(msg.sender), string.concat("invalid counter: ", Strings.toHexString(uint256(uint160(msg.sender)), 20)));
        require(activityInfos[id].state == STATE_INITIATINT, "state is not initiated");        
        Counter storage counter = getCounter(id, _msgSender());
        require(counter.state == COUNTER_STATE_NONE, "duplicated submitting public key");
        bool isVerified = publicKeyVerifier.verifyProof(proof.a, proof.b, proof.c, [publicKey.x, publicKey.y]);
        require(isVerified, "SubmitPublicKey proof failed");
        counter.state = COUNTER_STATE_PUBLIC_KEY_SUBMITTED;
        counter.publicKey = publicKey;
        emit Action("submit_public_key", id);
    }

    function Vote(uint256 id, Proof calldata proof, Cipher calldata cipher) external {
        require(activityInfos[id].state == STATE_VOTING, "state is not voting");
        require(isValidVoter(id, msg.sender), "no voter right");
        Voter storage voter = getVoter(id, msg.sender);
        require(voter.state == VOTER_STATE_INIT, "duplicated submitting ballot or no voting right");
        uint[6] memory pubSignals;
        pubSignals[0] = activityInfos[id].sumPublicKey.x;
        pubSignals[1] = activityInfos[id].sumPublicKey.y;
        pubSignals[2] = cipher.c1.x;
        pubSignals[3] = cipher.c1.y;
        pubSignals[4] = cipher.c2.x;
        pubSignals[5] = cipher.c2.y;
        bool isVerified = voteVerifier.verifyProof(proof.a, proof.b, proof.c, pubSignals);
        require(isVerified, "verify proof failed");
        voter.state = VOTER_STATE_ENCRYPTION_SUBMITTED;
        voter.ballot = Cipher({
            c1: cipher.c1,
            c2: cipher.c2
        });
        emit Action("vote", id);
    }

    function Decrypt(uint256 id, Proof calldata proof, Point calldata decryption) external {
        require(activityInfos[id].state == STATE_TALLYING, "state is not initiated");        
        Counter storage counter = getCounter(id, _msgSender());
        require(counter.state == COUNTER_STATE_PUBLIC_KEY_SUBMITTED, "duplicated submitting decryption");
        bool isVerified = decryptVerifier.verifyProof(proof.a, proof.b, proof.c, [
            counter.publicKey.x, counter.publicKey.y,
            activityInfos[id].sumVotes.c1.x, activityInfos[id].sumVotes.c1.y,
            decryption.x, decryption.y
        ]);
        require(isVerified, "Decrypt proof failed");
        counter.state = COUNTER_STATE_DECRYPTION_SUBMITTED;
        counter.decryption = decryption;
        emit Action("decrypt", id);
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
        uint256 submittedPublicKeyCount = getPublicKeySubmittedCount(id);

        require(activityInfos[id].state == STATE_INITIATINT, "state is not initiated");
        require(submittedPublicKeyCount == validCounters.length || 
            activityInfos[id].expiredInitiatingBlock <= block.number, "cannot change state yet");
        require((submittedPublicKeyCount-1) / (WINDOW_SIZE-1) + 1 == sumProofs.length, "the proofs' length is not match with the counters' number");

        Point[] memory points = new Point[](submittedPublicKeyCount);
        for (uint256 i = 0; i < activityInfos[id].counters.length; i++) {
            if (activityInfos[id].counters[i].state != COUNTER_STATE_PUBLIC_KEY_SUBMITTED) {
                continue;
            }
            points[i] = activityInfos[id].counters[i].publicKey;
        }
        require(verifySum(sumProofs, points), "check the sum of public key failed");

        activityInfos[id].state = STATE_VOTING;
        activityInfos[id].sumPublicKey = Point({
            x: sumProofs[sumProofs.length-1].sum.x,
            y: sumProofs[sumProofs.length-1].sum.y
        });
        emit ChangeStateLog(id, STATE_VOTING);
    }

    function ChangeStateToTallying(uint256 id, SumProof[] calldata proofsC1, SumProof[] calldata proofsC2) external {
        uint256 votedCount = getVotedCount(id);

        require(activityInfos[id].state == STATE_VOTING, "state is not voting");
        require(activityInfos[id].voters.length == votedCount || 
            activityInfos[id].expiredVotingBlock <= block.number, "cannot change state yet");
        require((votedCount-1) / (WINDOW_SIZE-1) + 1 == proofsC1.length, "the length of proofs c1 is not match with the counters' number");
        require((votedCount-1) / (WINDOW_SIZE-1) + 1 == proofsC2.length, "the length of proofs c2 is not match with the counters' number");

        Point[] memory c1Points = new Point[](votedCount);
        Point[] memory c2Points = new Point[](votedCount);
        for (uint256 i = 0; i < activityInfos[id].voters.length; i++) {
            if (activityInfos[id].voters[i].state != VOTER_STATE_ENCRYPTION_SUBMITTED) {
                continue;
            }
            c1Points[i] = activityInfos[id].voters[i].ballot.c1;
            c2Points[i] = activityInfos[id].voters[i].ballot.c2;
        }
        require(verifySum(proofsC1, c1Points), "check the sum of c1 failed");
        require(verifySum(proofsC2, c2Points), "check the sum of c2 failed");

        activityInfos[id].state = STATE_TALLYING;
        activityInfos[id].sumVotes = Cipher({
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
        uint256 decryptedCount = getDecryptedCount(id);
        require(activityInfos[id].state == STATE_TALLYING, "state is not tallying");
        require(decryptedCount == activityInfos[id].counters.length || 
            activityInfos[id].expiredTallyingBlock <= block.number, "cannot change state yet");
        require((decryptedCount-1) / (WINDOW_SIZE-1) + 1 == proofs.length, "the length of proofs is not match with the decryptPoints' number");
        require(tallyProof.tally.length == activityInfos[id].voters.length, "tally size is not equal to proof tally size");

        Point[] memory points = new Point[](decryptedCount + 1);
        points[0] = activityInfos[id].sumVotes.c2;
        for (uint256 i = 0; i < activityInfos[id].counters.length; i++) {
            if (activityInfos[id].counters[i].state != COUNTER_STATE_DECRYPTION_SUBMITTED) {
                continue;
            }
            points[i+1] = Point({
                x: 21888242871839275222246405745257275088548364400416034343698204186575808495617-activityInfos[id].counters[i].decryption.x,
                y: activityInfos[id].counters[i].decryption.y
            });
        }
        require(verifySum(proofs, points), "check the sum failed");

        uint256 scalar;
        for (uint256 i = 0; i < activityInfos[id].voters.length; i++) {
            scalar += tallyProof.tally[i] * (activityInfos[id].voters.length+1) ** (activityInfos[id].candidates.length-1-i);
        }
        require(scalarMulGVerifier.verifyProof(tallyProof.proof.a, tallyProof.proof.b, tallyProof.proof.c,
            [scalar, proofs[proofs.length-1].sum.x, proofs[proofs.length-1].sum.y]), string.concat("scalar mul G proof invalid: ",
             Strings.toString(proofs[proofs.length-1].sum.x), ",", Strings.toString(proofs[proofs.length-1].sum.y)));

        activityInfos[id].state = STATE_PUBLISHED;
        activityInfos[id].tally = tallyProof.tally;

        emit ChangeStateLog(id, STATE_PUBLISHED);
    }

    function hasVotingRight(uint256 id, address sender) view internal returns (bool) {
        for (uint256 u = 0; u < activityInfos[id].candidates.length; u++) {
            if (sender == activityInfos[id].candidates[u]) {
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

    // deprecated. use GetActivityInfo
    function GetVoteInfo(uint256 id) view external returns(VoteInfo memory) {
        return voteInfos[id];
    }

    function GetActivityInfo(uint256 id) view external returns(ActivityInfo memory) {
        return activityInfos[id];
    }

    function ballotsPoint(uint256 id, uint256 index, uint256 c) view internal returns (Point memory) {
        if (c == 0) {
            return activityInfos[id].voters[index].ballot.c1;
        } else if (c == 1) {
            return activityInfos[id].voters[index].ballot.c2;
        }
        return getZeroPoint();
    }

    function MigrateScalarMulGCircuit(address newAddress) external onlyOwner {
        scalarMulGVerifier = ScalarMulGVerifier(newAddress);
    }

    function MigratePublicKeyCircuit(address newAddress) external onlyOwner {
        publicKeyVerifier = PublicKeyVerifier(newAddress);
    }

    function isValidVoter(uint256 id, address addr) view internal returns (bool) {
        for (uint256 i = 0; i < activityInfos[id].voters.length; i++) {
            if (activityInfos[id].voters[i].addr == addr) {
                return true;
            }
        }
        return false;
    }

    function isValidCounter(uint256 id, address addr) view internal returns (bool) {
        for (uint256 i = 0; i < activityInfos[id].counters.length; i++) {
            if (activityInfos[id].counters[i].addr == addr) {
                return true;
            }
        }
        return false;
    }

    function getVoter(uint256 id, address addr) view internal returns (Voter storage) {
        for (uint256 i = 0; i < activityInfos[id].voters.length; i++) {
            if (activityInfos[id].voters[i].addr == addr) {
                return activityInfos[id].voters[i];
            }
        }
        revert("voter is invalid");
    }

    function getCounter(uint256 id, address addr) internal returns (Counter storage) {
        for (uint256 i = 0; i < activityInfos[id].counters.length; i++) {
            if (activityInfos[id].counters[i].addr == addr) {
                return activityInfos[id].counters[i];
            }
        }
        Counter memory counter;
        counter.addr = addr;
        counter.publicKey = getZeroPoint();
        counter.state = COUNTER_STATE_NONE;
        counter.decryption = getZeroPoint();

        activityInfos[id].counters.push(counter);
        return activityInfos[id].counters[activityInfos[id].counters.length-1];
    }

    function getPublicKeySubmittedCount(uint256 id) view internal returns (uint256) {
        uint256 result = 0;
        for (uint256 i = 0; i < activityInfos[id].counters.length; i++) {
            if (activityInfos[id].counters[i].state == COUNTER_STATE_PUBLIC_KEY_SUBMITTED) {
                result++;
            }
        }
        return result;
    }

    function getDecryptedCount(uint256 id) view internal returns (uint256) {
        uint256 result = 0;
        for (uint256 i = 0; i < activityInfos[id].counters.length; i++) {
            if (activityInfos[id].counters[i].state == COUNTER_STATE_DECRYPTION_SUBMITTED) {
                result++;
            }
        }
        return result;
    }

    function getVotedCount(uint256 id) view internal returns (uint256) {
        uint256 result = 0;
        for (uint256 i = 0; i < activityInfos[id].voters.length; i++) {
            if (activityInfos[id].voters[i].state == VOTER_STATE_ENCRYPTION_SUBMITTED) {
                result ++;
            }
        }
        return result;
    }
}
