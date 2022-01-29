import assert from 'assert'
import { ethers } from 'ethers'
import { MerkleTree } from './MerkleTree'

const data = Array.from({ length: 50 }, (_, idx) => {
	return [1, 20, Math.floor(Date.now() / 1000), ethers.constants.AddressZero, 2 + idx, 2 * 30 * 24 * 3600]
})

const encoded = data
	.map((data) =>
		ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256', 'uint256', 'address', 'uint256', 'uint256'], data)
	)
	.sort((a, b) => (ethers.BigNumber.from(a).sub(b).gt(0) ? 1 : -1))

const hashing = (a: string): string => ethers.utils.keccak256(a)
const summation = (a: string, b: string): string => ethers.BigNumber.from(a).add(b).toHexString()

const tree = new MerkleTree({ leafValues: encoded, hashing, summation })

for (let index = 0; index < encoded.length; index++) {
	const leafToProve = encoded[index]
	const proof = tree.getInclusionProof(leafToProve)

	let updatedRoot = hashing(leafToProve)
	for (let idx = 0; idx < proof.length; idx += 1) {
		updatedRoot = hashing(summation(updatedRoot, proof[idx].hash))
	}
	assert.equal(tree.depth(), proof.length + 1, 'Proof length must be equal to the depth of the tree')

	assert.equal(tree.root().hash, updatedRoot)
}

export * from './MerkleTree'
