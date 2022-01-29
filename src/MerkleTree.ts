import assert from 'assert'
import 'reflect-metadata'

type HashingType<T> = (a: T) => T
type SummationType<T> = (a: T, b: T) => T

class MerkleSetupValues {
	static hashing: HashingType<any>
	static summation: SummationType<any>
}

export type MerkleLeafConstructor<T> = {
	left?: MerkleNode<T>
	right?: MerkleNode<T>
	hash?: T
	value?: T
}

export class MerkleNode<T> {
	left: MerkleNode<T> | null = null
	right: MerkleNode<T> | null = null
	hash: T
	value: T

	parent: MerkleNode<T> | null = null

	constructor(left: MerkleNode<T> | null, right: MerkleNode<T> | null, value?: T) {
		if (left === null && right === null) {
			assert(value !== undefined, 'Value must be defined as it is a leaf')
			this.left = left
			this.right = right

			this.value = value
		} else {
			assert(value === undefined, 'Value must not be defined as it is not a leaf')
			assert(left !== null && right !== null, 'Left and right must be defined as it is not a leaf')

			this.left = left
			this.right = right
			/**
			 * left and right are not null, so we can calculate the hash
			 */
			this.value = MerkleSetupValues.summation(left!.value, right!.value)
		}
		this.hash = MerkleSetupValues.hashing(this.value)
	}

	isLeaf() {
		return this.left === null && this.right === null
	}

	setParent(parent: MerkleNode<T>) {
		this.parent = parent
	}
}

export class MerkleTree<T> {
	leaves: MerkleNode<T>[]
	postOrderNodes: MerkleNode<T>[][] = []

	constructor(leafValues: T[], hashing: HashingType<T>, summation: SummationType<T>) {
		MerkleSetupValues.hashing = hashing
		MerkleSetupValues.summation = summation

		if (leafValues.length % 2 !== 0) {
			leafValues.push(leafValues[leafValues.length - 1])
		}

		this.leaves = leafValues.map((value) => new MerkleNode(null, null, value))
		this.postOrderNodes.push(this.leaves)
		this.buildMerkleTree()
	}

	buildMerkleTree() {
		let lastLevelPostOrder = this.leaves

		let nextLevelPostOrder = []
		while (lastLevelPostOrder.length > 1) {
			if (lastLevelPostOrder.length % 2 !== 0) {
				// make even for next iteration
				lastLevelPostOrder.push(lastLevelPostOrder[lastLevelPostOrder.length - 1])
			}

			for (let i = 0; i < lastLevelPostOrder.length; i += 2) {
				const [left, right] = [lastLevelPostOrder[i], lastLevelPostOrder[i + 1]]
				const parentNode = new MerkleNode(left, right)

				left.setParent(parentNode)
				right.setParent(parentNode)
				// create next level post order
				nextLevelPostOrder.push(parentNode)
			}

			this.postOrderNodes.push(nextLevelPostOrder)
			lastLevelPostOrder = nextLevelPostOrder
			nextLevelPostOrder = []
		}
		assert(lastLevelPostOrder.length === 1, 'Last level must have only one node')
	}

	root() {
		// return last post order node
		this.postOrderNodes[this.postOrderNodes.length - 1][0]
	}
}
