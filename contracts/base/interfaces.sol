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

interface ISponsor {
    function Initiate(address[] calldata candidates, uint256 id, uint256 initiateBlockNumbers) external payable;
}

interface IVoter {
    function Vote(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external;
    // function Votes(uint256 id) external view returns (Cipher[] memory);
}

interface ICounter {
    function SubmitPublicKey(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external payable;
    function Decrypt(uint256 id, uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external;
    // function CounterPublicKeys(uint256 id) external view returns (Point[] memory);
}
