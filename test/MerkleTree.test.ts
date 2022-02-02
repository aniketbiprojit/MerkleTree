import { assert } from 'chai'
import { ethers } from 'ethers'
import { generateEVMCompatibleMerkleFromLeaves, hashing, summation } from '../src/index'
describe('MerkleTree.ts', () => {
	const data = Array.from({ length: 4 }, (_, idx) => {
		return [1, 20, Math.floor(1000), ethers.constants.AddressZero, 2 + idx, 2 * 30 * 24 * 3600]
	})

	const encoded = data
		.map((data) =>
			ethers.utils.defaultAbiCoder.encode(
				['uint256', 'uint256', 'uint256', 'address', 'uint256', 'uint256'],
				data
			)
		)
		.sort((a, b) => (ethers.BigNumber.from(a).sub(b).gt(0) ? 1 : -1))

	const tree = generateEVMCompatibleMerkleFromLeaves({ leafValues: encoded })

	for (let index = 0; index < encoded.length; index++) {
		it('initial test ' + index, async () => {
			const leafToProve = encoded[index]
			let leafIndex = index
			const proof = tree.getInclusionProof(leafToProve)
			console.log(
				index,
				proof.map((elem) => elem.value)
			)
			let updatedRoot = hashing(leafToProve)

			for (let idx = 0; idx < proof.length; idx += 1) {
				if (leafIndex <= proof[idx].value) {
					updatedRoot = hashing(summation(updatedRoot, proof[idx].hash))
				} else {
					updatedRoot = hashing(summation(proof[idx].hash, updatedRoot))
				}
				leafIndex = proof[idx].value
			}

			assert.equal(tree.depth(), proof.length + 1, 'Proof length must be equal to the depth of the tree')

			assert.equal(tree.root().hash, updatedRoot)
		})
	}
})
