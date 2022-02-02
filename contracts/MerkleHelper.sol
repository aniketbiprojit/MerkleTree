// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

contract MerkleHelper {
    bytes32 public committedRoot;

    function commitRoot(bytes32 _committedRoot) public {
        committedRoot = _committedRoot;
    }

    function verifyProof(bytes32 leafToProve, bytes32[] memory proof)
        public
        view
    {
        // Verify the proof
        bytes32 lastUpdatedProof = leafToProve;
        for (uint256 index = 0; index < proof.length; index++) {
            lastUpdatedProof = keccak256(
                abi.encode(proof[index], lastUpdatedProof)
            );
        }
        require(
            lastUpdatedProof == committedRoot,
            "Proof does not match the committed root"
        );
    }
}
