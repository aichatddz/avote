// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./voter.sol";
import {Groth16Verifier as SumVerifier} from "../circuit/check_sum_verifier.sol";

contract AvoteForTest is Avote {
    constructor(address _verifierAddr, address _publicKeyVerifier, address _decryptVerifier) Avote(_verifierAddr, _publicKeyVerifier, _decryptVerifier) {
        sumVerifier = new SumVerifier();
        publicKeyVerifier = new PublicKeyVerifier();
    }

    function SetTestState(uint256 id, VoteInfo memory stateInfo) external {
        voteInfos[id] = stateInfo;
    }
}