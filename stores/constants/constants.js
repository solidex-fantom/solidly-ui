import BigNumber from 'bignumber.js'
import * as contractsTestnet from './contractsTestnet'
import * as contracts from './contracts'
import * as actions from './actions'

let isTestnet = process.env.NEXT_PUBLIC_CHAINID == 2221

// URLS
let scan = 'https://explorer.kava.io/'
let cont = contracts

if(isTestnet) {
  scan = 'https://explorer.testnet.kava.io/'
  cont = contractsTestnet
}

export const ETHERSCAN_URL = scan

export const CONTRACTS = cont
export const ACTIONS = actions

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0)
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const FALLBACK_RPC = 'https://evm2.kava.io'

export const ROUTE_MAX_LENGTH = Number(process.env.NEXT_PUBLIC_ROUTE_MAX_LENGTH) || 2
