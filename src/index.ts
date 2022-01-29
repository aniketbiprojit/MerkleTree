import { MerkleTree } from './MerkleTree'

const tree = new MerkleTree<number>(
	[1, 2, 3, 4, 5, 6, 7],
	(a) => a % 256,
	(a, b) => a + b
)

for (let index = 0; index < tree.postOrderNodes.length; index++) {
	const element = tree.postOrderNodes[index]
	console.log(element.map((elem) => elem.value))
}
