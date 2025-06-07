// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

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
    Point decryptResultPoint;
}

interface IAvote {
    function Initiate(address[] calldata candidates, address[] calldata voters, uint256 id, uint256 initiateBlockNumbers) external payable;
    function Vote(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external;
    function SubmitPublicKey(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external payable;
    function Decrypt(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external;
    function ChangeStateToVoting(uint256 id, SumProof[] calldata sumProofs) external;
    function ChangeStateToTallying(uint256 id, SumProof[] calldata proofsC1, SumProof[] calldata proofsC2) external;
    function ChangeStateToPublished(uint256 id, SumProof[] memory proofs) external;
    function GetVoteInfo(uint256 id) view external returns(VoteInfo memory);
}
