// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./voter.sol";
import {Groth16Verifier as SumVerifier} from "../circuit/check_sum_verifier.sol";

contract AvoteForTest is Avote {
    constructor(address _verifierAddr, address _publicKeyVerifier, address _decryptVerifier) {
        SumVerifier _sumVerifier = new SumVerifier();
        ScalarMulGVerifier _scalarMulGVerifier = new ScalarMulGVerifier();
        initialize(_verifierAddr, _publicKeyVerifier, _decryptVerifier, address(_sumVerifier), address(_scalarMulGVerifier));
    }

    function SetTestState(uint256 id, ActivityInfo memory stateInfo) external {
        activityInfos[id] = stateInfo;
    }
}