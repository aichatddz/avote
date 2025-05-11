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

interface IVoter {
    function Vote(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external;
    function Votes() external view returns (Cipher[] memory);
}

interface ICounter {
    function SubmitPublicKey(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external payable;
    function Decrypt(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external;
    function CounterPublicKeys() external view returns (Point[] memory);
}
