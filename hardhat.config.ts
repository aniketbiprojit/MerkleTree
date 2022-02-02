import * as dotenv from 'dotenv'

import { HardhatUserConfig } from 'hardhat/types'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import '@typechain/hardhat'
import { readFileSync } from 'fs'

dotenv.config()

const getAccounts = () => {
	try {
		return [readFileSync(process.env.DEPLOYER_PRIVATE_KEY as string, 'utf-8').trim()]
	} catch (err) {
		console.error('file does not exist')
		return [process.env.DEPLOYER_PRIVATE_KEY as string]
	}
}

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.6',
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
		admin: {
			default: 1,
		},
	},
	paths: {
		sources: 'contracts',
	},
	networks: {
		rinkeby_testnet: {
			url: 'https://rinkeby.infura.io/v3/' + process.env.INFURA_APP_ID || '',
			chainId: 4,
			accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? getAccounts() : [],
		},
		ethereum_mainnet: {
			url: 'https://mainnet.infura.io/v3/' + process.env.INFURA_APP_ID || '',
			chainId: 1,
			accounts: process.env.DEPLOYER_PRIVATE_KEY !== undefined ? getAccounts() : [],
		},
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
	typechain: {
		outDir: 'typechain',
		target: 'ethers-v5',
	},
}

export default config
