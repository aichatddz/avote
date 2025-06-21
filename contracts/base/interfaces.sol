// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

struct Point {
    uint256 x;
    uint256 y;
}

struct Cipher {
    Point c1;
    Point c2;
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

// deprecated
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
    uint256[] tally;
}

struct Counter {
    address addr;
    Point publicKey;
    uint8 state;
    Point decryption;
    uint256[8] reversed;
}

struct Voter {
    address addr;
    uint8 state;
    Cipher ballot;
    uint256[8] reversed;
}

struct ActivityInfo {
    uint256 expiredInitiatingBlock;
    uint256 expiredVotingBlock;
    uint256 expiredTallyingBlock;
    uint256 sponporStateAmount;
    uint256 counterStateAmount;
    uint8 state;
    Point sumPublicKey;
    Cipher sumVotes;
    address[] candidates;
    Voter[] voters;
    Counter[] counters;
    uint256[] tally;
    uint256[16] reversed;
}

interface IAvote {
    function Initiate(
        address[] calldata candidates,
        address[] calldata voterAddresses,
        uint256 id,
        uint256 initiateStateBlockNumbers,
        uint256 votingStateBlockNumbers,
        uint256 tallyingStateBlockNumbers
    ) external payable;
    function Vote(uint256 id, Proof calldata proof, Cipher calldata cipher) external;
    function SubmitPublicKey(uint256 id, Proof calldata proof, Point calldata publicKey) external payable;
    function Decrypt(uint256 id, Proof calldata proof, Point calldata decryption) external;
    function ChangeStateToVoting(uint256 id, SumProof[] calldata sumProofs) external;
    function ChangeStateToTallying(uint256 id, SumProof[] calldata proofsC1, SumProof[] calldata proofsC2) external;
    function ChangeStateToPublished(uint256 id, SumProof[] memory proofs, TallyProof memory tallyProof) external;
    function GetVoteInfo(uint256 id) view external returns(VoteInfo memory);    // deprecated
    function GetActivityInfo(uint256 id) view external returns(ActivityInfo memory);

    function MigrateScalarMulGCircuit(address newAddress) external;
}
