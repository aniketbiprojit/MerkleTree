import assert from 'assert'

type HashingType<T> = (a: T) => T
type SummationType<T> = (a: T, b: T) => T

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
	position: number
	parent: MerkleNode<T> | null = null

	constructor({
		left,
		right,
		value,
		position,
		hash,
		hashing,
		summation,
	}: {
		left: MerkleNode<T> | null
		right: MerkleNode<T> | null
		value?: T
		position: number
		hash?: boolean
		hashing: HashingType<T>
		summation: SummationType<T>
	}) {
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
			this.value = summation(left!.hash, right!.hash)
		}
		if (hash !== false) {
			this.hash = hashing(this.value)
		} else {
			this.hash = this.value
		}
		this.position = position
	}

	isLeaf() {
		return this.left === null && this.right === null
	}

	setParent(parent: MerkleNode<T>) {
		this.parent = parent
	}

	getOtherNode() {
		const parent = this.parent

		if (parent) {
			if (parent.left?.hash === this.hash) {
				return parent.right
			} else {
				return parent.left
			}
		} else {
			throw new RangeError('Parent is null. Are you trying to get the other node of a root node?')
		}
	}
}

export class MerkleTree<T> {
	leaves: MerkleNode<T>[]
	postOrderNodes: MerkleNode<T>[][] = []
	hashing: HashingType<T>
	summation: SummationType<T>

	constructor({
		leafValues,
		hashing,
		summation,
		hashLeaves,
	}: {
		leafValues: T[]
		hashing: HashingType<T>
		summation: SummationType<T>
		hashLeaves?: boolean
	}) {
		this.hashing = hashing
		this.summation = summation

		leafValues = Array.from(new Set(leafValues))
		if (leafValues.length % 2 !== 0) {
			leafValues.push(leafValues[leafValues.length - 1])
		}

		this.leaves = leafValues.map(
			(value, idx) =>
				new MerkleNode({ left: null, right: null, value, position: idx, hash: hashLeaves, hashing, summation })
		)
		this.postOrderNodes.push(this.leaves)
		this.buildMerkleTree()
	}

	buildMerkleTree() {
		let lastLevelPostOrder = this.leaves

		let nextLevelPostOrder = []
		let counter = lastLevelPostOrder.length
		while (lastLevelPostOrder.length > 1) {
			if (lastLevelPostOrder.length % 2 !== 0) {
				// make even for next iteration
				// position not updated for duplicated non-leaf node
				lastLevelPostOrder.push(lastLevelPostOrder[lastLevelPostOrder.length - 1])
			}

			for (let i = 0; i < lastLevelPostOrder.length; i += 2) {
				const [left, right] = [lastLevelPostOrder[i], lastLevelPostOrder[i + 1]]
				const parentNode = new MerkleNode({
					left,
					right,
					position: counter++,
					hashing: this.hashing,
					summation: this.summation,
				})

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
		return this.postOrderNodes[this.postOrderNodes.length - 1][0]
	}

	depth() {
		return this.postOrderNodes.length
	}

	getInclusionProof(value: T, proofLength: number = this.depth()) {
		assert(
			proofLength >= this.depth() - 1,
			'Proof length for leaf must be greater or equal to the depth of the tree'
		)
		assert(
			proofLength <= this.leaves.length,
			'Proof length for leaf must be lesser or equal to the depth of the tree'
		)

		const leaf = this.leaves.find((leaf) => leaf.value === value)
		if (leaf) {
			// const leafIndex = this.leaves.indexOf(leaf)
			const root = this.root()

			const branch = []
			const proof = []
			let testElement = leaf
			// get smallest path from leaf to root
			while (testElement.hash !== root.hash) {
				branch.push(testElement)
				const otherNode = testElement.getOtherNode()
				if (otherNode) {
					proof.push(otherNode)
				}
				testElement = testElement.parent!
			}

			return proof
				.sort((a, b) => a.position - b.position)
				.map((elem) => ({
					hash: elem.hash,
					value: elem.position,
				}))
		} else {
			throw new RangeError('Value not found in tree')
		}
	}
}
