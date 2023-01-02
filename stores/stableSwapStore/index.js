import {
  MAX_UINT256,
  ZERO_ADDRESS,
  ACTIONS,
  CONTRACTS
} from "../constants"
import { v4 as uuidv4 } from 'uuid'

import * as moment from "moment"
import { formatCurrency } from '../../utils'
import stores from "../index"

import BigNumber from "bignumber.js"
import {LIQUIDITY_PAIRS} from "../constants/mocks";
import {quoteSwap, swap, wrap, unwrap} from "./modules/swap";
import {createVest, getVestNFTs, increaseVestAmount, increaseVestDuration, withdrawVest} from "./modules/vesting";
import {
  claimAllRewards,
  claimBribes,
  claimPairFees,
  claimRewards,
  claimVeDist,
  getRewardBalances
} from "./modules/rewards";
const fetch = require("node-fetch")

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher
    this.emitter = emitter

    this.store = {
      baseAssets: [],
      assets: [],
      govToken: null,
      veToken: null,
      pairs: [],
      vestNFTs: [],
      rewards: {
        bribes: [],
        fees: [],
        rewards: []
      },
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case ACTIONS.CONFIGURE_SS:
            this.configure(payload)
            break
          case ACTIONS.GET_BALANCES:
            this.getBalances(payload)
            break
          case ACTIONS.SEARCH_ASSET:
            this.searchBaseAsset(payload)
            break

          // LIQUIDITY
          case ACTIONS.CREATE_PAIR_AND_STAKE:
            this.createPairStake(payload)
            break
          case ACTIONS.CREATE_PAIR_AND_DEPOSIT:
            this.createPairDeposit(payload)
            break
          case ACTIONS.ADD_LIQUIDITY:
            this.addLiquidity(payload)
            break
          case ACTIONS.STAKE_LIQUIDITY:
            this.stakeLiquidity(payload)
            break
          case ACTIONS.ADD_LIQUIDITY_AND_STAKE:
            this.addLiquidityAndStake(payload)
            break
          case ACTIONS.QUOTE_ADD_LIQUIDITY:
            this.quoteAddLiquidity(payload)
            break
          case ACTIONS.GET_LIQUIDITY_BALANCES:
            this.getLiquidityBalances(payload)
            break
          case ACTIONS.REMOVE_LIQUIDITY:
            this.removeLiquidity(payload)
            break
          case ACTIONS.UNSTAKE_AND_REMOVE_LIQUIDITY:
            this.unstakeAndRemoveLiquidity(payload)
            break
          case ACTIONS.QUOTE_REMOVE_LIQUIDITY:
            this.quoteRemoveLiquidity(payload)
            break
          case ACTIONS.UNSTAKE_LIQUIDITY:
            this.unstakeLiquidity(payload)
            break
          case ACTIONS.CREATE_GAUGE:
            this.createGauge(payload)
            break;

          // SWAP
          case ACTIONS.QUOTE_SWAP:
            this.quoteSwap(payload)
            break
          case ACTIONS.SWAP:
            this.swap(payload)
            break
          case ACTIONS.WRAP:
            this.wrap(payload)
            break
          case ACTIONS.UNWRAP:
            this.unwrap(payload)
            break

          // VESTING
          case ACTIONS.GET_VEST_NFTS:
            this.getVestNFTs(payload)
            break
          case ACTIONS.CREATE_VEST:
            this.createVest(payload)
            break
          case ACTIONS.INCREASE_VEST_AMOUNT:
            this.increaseVestAmount(payload)
            break
          case ACTIONS.INCREASE_VEST_DURATION:
            this.increaseVestDuration(payload)
            break
          case ACTIONS.WITHDRAW_VEST:
            this.withdrawVest(payload)
            break

          //VOTE
          case ACTIONS.VOTE:
            this.vote(payload)
            break
          case ACTIONS.GET_VEST_VOTES:
            this.getVestVotes(payload)
            break
          case ACTIONS.CREATE_BRIBE:
            this.createBribe(payload)
            break
          case ACTIONS.GET_VEST_BALANCES:
            this.getVestBalances(payload)
            break

          //REWARDS
          case ACTIONS.GET_REWARD_BALANCES:
            this.getRewardBalances(payload)
            break
          case ACTIONS.CLAIM_BRIBE:
            this.claimBribes(payload)
            break
          case ACTIONS.CLAIM_PAIR_FEES:
            this.claimPairFees(payload)
            break
          case ACTIONS.CLAIM_REWARD:
            this.claimRewards(payload)
            break
          case ACTIONS.CLAIM_VE_DIST:
            this.claimVeDist(payload)
            break
          case ACTIONS.CLAIM_ALL_REWARDS:
            this.claimAllRewards(payload)
            break;

          //WHITELIST
          case ACTIONS.SEARCH_WHITELIST:
            this.searchWhitelist(payload)
            break;
          case ACTIONS.WHITELIST_TOKEN:
            this.whitelistToken(payload)
            break;

          default: {
          }
        }
      }.bind(this),
    )
  }

  getStore = (index) => {
    return this.store[index]
  }

  setStore = (obj) => {
    this.store = { ...this.store, ...obj }
    // console.log(this.store)
    return this.emitter.emit(ACTIONS.STORE_UPDATED)
  }


  // COMMON GETTER FUNCTIONS Assets, BaseAssets, Pairs etc
  getAsset = (address) => {
    const assets = this.store.assets
    if (!assets || assets.length === 0) {
      return null
    }

    let theAsset = assets.filter((ass) => {
      if (!ass) {
        return false
      }
      return ass.address.toLowerCase() === address.toLowerCase()
    })

    if (!theAsset || theAsset.length === 0) {
      return null
    }

    return theAsset[0]
  }

  getNFTByID = async (id) => {
    try {
      const vestNFTs = this.getStore('vestNFTs')
      let theNFT = vestNFTs.filter((vestNFT) => {
        return (vestNFT.id == id)
      })

      if(theNFT.length > 0) {
        return theNFT[0]
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const veToken = this.getStore('veToken')
      const govToken = this.getStore('govToken')

      const vestingContract = new web3.eth.Contract(CONTRACTS.VE_TOKEN_ABI, CONTRACTS.VE_TOKEN_ADDRESS)

      const nftsLength = await vestingContract.methods.balanceOf(account.address).call()
      const arr = Array.from({length: parseInt(nftsLength)}, (v, i) => i)

      const nfts = await Promise.all(
        arr.map(async (idx) => {

          const tokenIndex = await vestingContract.methods.tokenOfOwnerByIndex(account.address, idx).call()
          const locked = await vestingContract.methods.locked(tokenIndex).call()
          const lockValue = await vestingContract.methods.balanceOfNFT(tokenIndex).call()

          // probably do some decimals math before returning info. Maybe get more info. I don't know what it returns.
          return {
            id: tokenIndex,
            lockEnds: locked.end,
            lockAmount: BigNumber(locked.amount).div(10**govToken.decimals).toFixed(govToken.decimals),
            lockValue: BigNumber(lockValue).div(10**veToken.decimals).toFixed(veToken.decimals)
          }
        })
      )

      this.setStore({ vestNFTs: nfts })

      theNFT = nfts.filter((nft) => {
        return nft.id == id
      })

      if(theNFT.length > 0) {
        return theNFT[0]
      }

      return null
    } catch(ex) {
      console.log(ex)
      return null
    }
  }

  getPairByAddress = async (pairAddress) => {
    try {
      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const pairs = this.getStore('pairs')
      let thePair = pairs.filter((pair) => {
        return (pair.address.toLowerCase() == pairAddress.toLowerCase())
      })

      if(thePair.length > 0) {
        const pc = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pairAddress)

        const [ totalSupply, reserve0, reserve1, balanceOf ] = await Promise.all([
          pc.methods.totalSupply().call(),
          pc.methods.reserve0().call(),
          pc.methods.reserve1().call(),
          pc.methods.balanceOf(account.address).call(),
        ])

        const returnPair = thePair[0]
        returnPair.balance = BigNumber(balanceOf).div(10**returnPair.decimals).toFixed(parseInt(returnPair.decimals))
        returnPair.totalSupply = BigNumber(totalSupply).div(10**returnPair.decimals).toFixed(parseInt(returnPair.decimals))
        returnPair.reserve0 = BigNumber(reserve0).div(10**returnPair.token0.decimals).toFixed(parseInt(returnPair.token0.decimals))
        returnPair.reserve1 = BigNumber(reserve1).div(10**returnPair.token1.decimals).toFixed(parseInt(returnPair.token1.decimals))

        return returnPair
      }

      const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pairAddress)
      const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

      const [ totalWeight ] = await Promise.all([
        gaugesContract.methods.totalWeight().call()
      ])

      const [ token0, token1, totalSupply, symbol, reserve0, reserve1, decimals, balanceOf, stable, gaugeAddress, gaugeWeight, claimable0, claimable1 ] = await Promise.all([
        pairContract.methods.token0().call(),
        pairContract.methods.token1().call(),
        pairContract.methods.totalSupply().call(),
        pairContract.methods.symbol().call(),
        pairContract.methods.reserve0().call(),
        pairContract.methods.reserve1().call(),
        pairContract.methods.decimals().call(),
        pairContract.methods.balanceOf(account.address).call(),
        pairContract.methods.stable().call(),
        gaugesContract.methods.gauges(pairAddress).call(),
        gaugesContract.methods.weights(pairAddress).call(),
        pairContract.methods.claimable0(account.address).call(),
        pairContract.methods.claimable1(account.address).call()
      ])

      const token0Contract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token0)
      const token1Contract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token1)

      const [ token0Symbol, token0Decimals, token0Balance, token1Symbol, token1Decimals, token1Balance ] = await Promise.all([
        token0Contract.methods.symbol().call(),
        token0Contract.methods.decimals().call(),
        token0Contract.methods.balanceOf(account.address).call(),
        token1Contract.methods.symbol().call(),
        token1Contract.methods.decimals().call(),
        token1Contract.methods.balanceOf(account.address).call(),
      ])

      thePair = {
        address: pairAddress,
        symbol: symbol,
        decimals: parseInt(decimals),
        isStable: stable,
        token0: {
          address: token0,
          symbol: token0Symbol,
          balance: BigNumber(token0Balance).div(10**token0Decimals).toFixed(parseInt(token0Decimals)),
          decimals: parseInt(token0Decimals)
        },
        token1: {
          address: token1,
          symbol: token1Symbol,
          balance: BigNumber(token1Balance).div(10**token1Decimals).toFixed(parseInt(token1Decimals)),
          decimals: parseInt(token1Decimals)
        },
        balance: BigNumber(balanceOf).div(10**decimals).toFixed(parseInt(decimals)),
        totalSupply: BigNumber(totalSupply).div(10**decimals).toFixed(parseInt(decimals)),
        reserve0: BigNumber(reserve0).div(10**token0Decimals).toFixed(parseInt(token0Decimals)),
        reserve1: BigNumber(reserve1).div(10**token1Decimals).toFixed(parseInt(token1Decimals)),
        claimable0: BigNumber(claimable0).div(10**token0Decimals).toFixed(parseInt(token0Decimals)),
        claimable1: BigNumber(claimable1).div(10**token1Decimals).toFixed(parseInt(token1Decimals))
      }

      if(gaugeAddress !== ZERO_ADDRESS) {
        const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, gaugeAddress)

        const [ totalSupply, gaugeBalance, bribeAddress ] = await Promise.all([
          gaugeContract.methods.totalSupply().call(),
          gaugeContract.methods.balanceOf(account.address).call(),
          gaugesContract.methods.bribes(gaugeAddress).call()
        ])

        const bribeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, bribeAddress)

        const tokensLength = await bribeContract.methods.rewardsListLength().call()
        const arry = Array.from({length: parseInt(tokensLength)}, (v, i) => i)

        const bribes = await Promise.all(
          arry.map(async (idx) => {

            const tokenAddress = await bribeContract.methods.rewards(idx).call()
            const token = await this.getBaseAsset(tokenAddress)

            const [ rewardRate ] = await Promise.all([
              bribeContract.methods.rewardRate(tokenAddress).call(),
            ])

            return {
              token: token,
              rewardRate: BigNumber(rewardRate).div(10**token.decimals).toFixed(token.decimals),
              rewardAmount: BigNumber(rewardRate).times(604800).div(10**token.decimals).toFixed(token.decimals)
            }

          })
        )

        thePair.gauge = {
          address: gaugeAddress,
          bribeAddress: bribeAddress,
          decimals: 18,
          balance: BigNumber(gaugeBalance).div(10**18).toFixed(18),
          totalSupply: BigNumber(totalSupply).div(10**18).toFixed(18),
          weight: BigNumber(gaugeWeight).div(10**18).toFixed(18),
          weightPercent: BigNumber(gaugeWeight).times(100).div(totalWeight).toFixed(2),
          bribes: bribes,
        }
      }

      pairs.push(thePair)
      this.setStore({ pairs: pairs })

      return thePair
    } catch(ex) {
      console.log(ex)
      return null
    }
  }

  getPair = async (addressA, addressB, stab) => {
    try {
      if(addressA === 'KAVA') {
        addressA = CONTRACTS.WKAVA_ADDRESS
      }
      if(addressB === 'KAVA') {
        addressB = CONTRACTS.WKAVA_ADDRESS
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const pairs = this.getStore('pairs')
      let thePair = pairs.filter((pair) => {
        return ((pair.token0.address.toLowerCase() == addressA.toLowerCase() && pair.token1.address.toLowerCase() == addressB.toLowerCase() && pair.isStable == stab) ||
        (pair.token0.address.toLowerCase() == addressB.toLowerCase() && pair.token1.address.toLowerCase() == addressA.toLowerCase() && pair.isStable == stab))
      })
      if(thePair.length > 0) {

        const pc = new web3.eth.Contract(CONTRACTS.PAIR_ABI, thePair[0].address)

        const [ totalSupply, reserve0, reserve1, balanceOf ] = await Promise.all([
          pc.methods.totalSupply().call(),
          pc.methods.reserve0().call(),
          pc.methods.reserve1().call(),
          pc.methods.balanceOf(account.address).call(),
        ])

        const returnPair = thePair[0]
        returnPair.balance = BigNumber(balanceOf).div(10**returnPair.decimals).toFixed(parseInt(returnPair.decimals))
        returnPair.totalSupply = BigNumber(totalSupply).div(10**returnPair.decimals).toFixed(parseInt(returnPair.decimals))
        returnPair.reserve0 = BigNumber(reserve0).div(10**returnPair.token0.decimals).toFixed(parseInt(returnPair.token0.decimals))
        returnPair.reserve1 = BigNumber(reserve1).div(10**returnPair.token1.decimals).toFixed(parseInt(returnPair.token1.decimals))

        return returnPair
      }

      const factoryContract = new web3.eth.Contract(CONTRACTS.FACTORY_ABI, CONTRACTS.FACTORY_ADDRESS)
      const pairAddress = await factoryContract.methods.getPair(addressA, addressB, stab).call()

      if(pairAddress && pairAddress != ZERO_ADDRESS) {
        const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pairAddress)
        const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

        const [ totalWeight ] = await Promise.all([
          gaugesContract.methods.totalWeight().call()
        ])

        const [ token0, token1, totalSupply, symbol, reserve0, reserve1, decimals, balanceOf, stable, gaugeAddress, gaugeWeight, claimable0, claimable1 ] = await Promise.all([
          pairContract.methods.token0().call(),
          pairContract.methods.token1().call(),
          pairContract.methods.totalSupply().call(),
          pairContract.methods.symbol().call(),
          pairContract.methods.reserve0().call(),
          pairContract.methods.reserve1().call(),
          pairContract.methods.decimals().call(),
          pairContract.methods.balanceOf(account.address).call(),
          pairContract.methods.stable().call(),
          gaugesContract.methods.gauges(pairAddress).call(),
          gaugesContract.methods.weights(pairAddress).call(),
          pairContract.methods.claimable0(account.address).call(),
          pairContract.methods.claimable1(account.address).call()
        ])

        const token0Contract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token0)
        const token1Contract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token1)

        const [ token0Symbol, token0Decimals, token0Balance, token1Symbol, token1Decimals, token1Balance ] = await Promise.all([
          token0Contract.methods.symbol().call(),
          token0Contract.methods.decimals().call(),
          token0Contract.methods.balanceOf(account.address).call(),
          token1Contract.methods.symbol().call(),
          token1Contract.methods.decimals().call(),
          token1Contract.methods.balanceOf(account.address).call(),
        ])

        thePair = {
          address: pairAddress,
          symbol: symbol,
          decimals: parseInt(decimals),
          isStable: stable,
          token0: {
            address: token0,
            symbol: token0Symbol,
            balance: BigNumber(token0Balance).div(10**token0Decimals).toFixed(parseInt(token0Decimals)),
            decimals: parseInt(token0Decimals)
          },
          token1: {
            address: token1,
            symbol: token1Symbol,
            balance: BigNumber(token1Balance).div(10**token1Decimals).toFixed(parseInt(token1Decimals)),
            decimals: parseInt(token1Decimals)
          },
          balance: BigNumber(balanceOf).div(10**decimals).toFixed(parseInt(decimals)),
          totalSupply: BigNumber(totalSupply).div(10**decimals).toFixed(parseInt(decimals)),
          reserve0: BigNumber(reserve0).div(10**token0Decimals).toFixed(parseInt(token0Decimals)),
          reserve1: BigNumber(reserve1).div(10**token1Decimals).toFixed(parseInt(token1Decimals)),
          claimable0: BigNumber(claimable0).div(10**token0Decimals).toFixed(parseInt(token0Decimals)),
          claimable1: BigNumber(claimable1).div(10**token1Decimals).toFixed(parseInt(token1Decimals))
        }

        if(gaugeAddress !== ZERO_ADDRESS) {
          const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, gaugeAddress)

          const [ totalSupply, gaugeBalance, bribeAddress, feeAddress ] = await Promise.all([
            gaugeContract.methods.totalSupply().call(),
            gaugeContract.methods.balanceOf(account.address).call(),
            gaugesContract.methods.external_bribes(gaugeAddress).call(),
            gaugesContract.methods.internal_bribes(gaugeAddress).call()
          ])
          
          //External Bribes
          const bribeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, bribeAddress)
          
          let tokensLength = await bribeContract.methods.rewardsListLength().call()
          let arry = Array.from({length: parseInt(tokensLength)}, (v, i) => i)

          const bribes = await Promise.all(
            arry.map(async (idx) => {

              const tokenAddress = await bribeContract.methods.rewards(idx).call()
              const token = await this.getBaseAsset(tokenAddress)

              const [ rewardRate ] = await Promise.all([
                bribeContract.methods.rewardRate(tokenAddress).call(),
              ])

              return {
                token: token,
                rewardRate: BigNumber(rewardRate).div(10**token.decimals).toFixed(token.decimals),
                rewardAmount: BigNumber(rewardRate).times(604800).div(10**token.decimals).toFixed(token.decimals)
              }
            })
          )

          //Internal Bribes (FEES)
          const feeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, feeAddress)
          tokensLength = await feeContract.methods.rewardsListLength().call()
          arry = Array.from({length: parseInt(tokensLength)}, (v, i) => i)

          const fees = await Promise.all(
            arry.map(async (idx) => {

              const tokenAddress = await feeContract.methods.rewards(idx).call()
              const token = await this.getBaseAsset(tokenAddress)

              const [ rewardRate ] = await Promise.all([
                feeContract.methods.rewardRate(tokenAddress).call(),
              ])

              return {
                token: token,
                rewardRate: BigNumber(rewardRate).div(10**token.decimals).toFixed(token.decimals),
                rewardAmount: BigNumber(rewardRate).times(604800).div(10**token.decimals).toFixed(token.decimals)
              }
            })
          )

          thePair.gauge = {
            address: gaugeAddress,
            bribeAddress: bribeAddress,
            feeAddress: feeAddress,
            decimals: 18,
            balance: BigNumber(gaugeBalance).div(10**18).toFixed(18),
            totalSupply: BigNumber(totalSupply).div(10**18).toFixed(18),
            weight: BigNumber(gaugeWeight).div(10**18).toFixed(18),
            weightPercent: BigNumber(gaugeWeight).times(100).div(totalWeight).toFixed(2),
            bribes: bribes,
            fees: fees
          }
        }

        pairs.push(thePair)
        this.setStore({ pairs: pairs })

        return thePair
      }

      return null
    } catch(ex) {
      console.log(ex)
      return null
    }
  }

  removeBaseAsset = (asset) => {
    try {
      let localBaseAssets = []
      const localBaseAssetsString = localStorage.getItem('stableSwap-assets')

      if(localBaseAssetsString && localBaseAssetsString !== '') {
        localBaseAssets = JSON.parse(localBaseAssetsString)

        localBaseAssets = localBaseAssets.filter(function( obj ) {
          return obj.address.toLowerCase() !== asset.address.toLowerCase()
        })

        localStorage.setItem('stableSwap-assets', JSON.stringify(localBaseAssets))

        let baseAssets = this.getStore('baseAssets')
        baseAssets = baseAssets.filter(function( obj ) {
          return obj.address.toLowerCase() !== asset.address.toLowerCase() && asset.local === true
        })

        this.setStore({ baseAssets: baseAssets })
        this.emitter.emit(ACTIONS.BASE_ASSETS_UPDATED, baseAssets)
      }
    } catch(ex) {
      console.log(ex)
      return null
    }
  }

  getLocalAssets = () => {
    try {
      let localBaseAssets = []
      const localBaseAssetsString = localStorage.getItem('stableSwap-assets')

      if(localBaseAssetsString && localBaseAssetsString !== '') {
        localBaseAssets = JSON.parse(localBaseAssetsString)
      }

      return localBaseAssets
    } catch(ex) {
      console.log(ex)
      return []
    }
  }

  getBaseAsset = async (address, save, getBalance) => {
    try {
      const baseAssets = this.getStore('baseAssets')

      const theBaseAsset = baseAssets.filter((as) => {
        return as.address.toLowerCase() === address.toLowerCase()
      })
      if(theBaseAsset.length > 0) {
        return theBaseAsset[0]
      }

      // not found, so we search the blockchain for it.
      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const account = stores.accountStore.getStore("account")

      const [ symbol, decimals, name, balanceOf ] = await this._tryGetBaseAssetDetails(web3, address, getBalance, account)

      const newBaseAsset = {
        address: address,
        symbol: symbol,
        name: name,
        decimals: parseInt(decimals),
        logoURI: null,
        local: true,
        balance: balanceOf ? BigNumber(balanceOf).div(10**decimals).toFixed(parseInt(decimals)) : '0'
      }

      //only save when a user adds it. don't for when we lookup a pair and find he asset.
      if(save) {
        let localBaseAssets = this.getLocalAssets()
        localBaseAssets = [...localBaseAssets, newBaseAsset]
        localStorage.setItem('stableSwap-assets', JSON.stringify(localBaseAssets))

        const baseAssets = this.getStore('baseAssets')
        const storeBaseAssets = [...baseAssets, newBaseAsset]

        this.setStore({ baseAssets: storeBaseAssets })
        this.emitter.emit(ACTIONS.BASE_ASSETS_UPDATED, storeBaseAssets)
      }

      return newBaseAsset
    } catch(ex) {
      console.log(ex)
      // this.emitter.emit(ACTIONS.ERROR, ex)
      return null
    }
  }

  _tryGetBaseAssetDetails = async (web3, address, getBalance, account) => {
    try {
      const multicall = await stores.accountStore.getMulticall()
      const baseAssetDetails = await this._getBaseAssetDetails(web3, multicall, address, getBalance, account)
      return baseAssetDetails
    } catch(ex) {
      try {
        const multicall = await stores.accountStore.getMulticall(true)
        const baseAssetDetails = await this._getBaseAssetDetails(web3, multicall, address, getBalance, account)
        return baseAssetDetails
      } catch(ex) {
        throw ex
      }
    }
  }

  _getBaseAssetDetails = async (web3, multicall, address, getBalance, account) => {
    try {
      const baseAssetContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, address)
      const calls = [
        baseAssetContract.methods.symbol(),
        baseAssetContract.methods.decimals(),
        baseAssetContract.methods.name()
      ]

      if(getBalance) {
        calls.push(baseAssetContract.methods.balanceOf(account.address))
      }

      return multicall.aggregate(calls)
    } catch(ex) {
      console.log(ex)
      throw ex
    }
  }


  // DISPATCHER FUNCTIONS
  configure = async (payload) => {
    try {
      this.setStore({ govToken: this._getGovTokenBase() })
      this.setStore({ veToken: this._getVeTokenBase() })
      this.setStore({ baseAssets: await this._getBaseAssets() })
      this.setStore({ routeAssets: await this._getRouteAssets() })
      this.setStore({ pairs: await this._getPairs() })

      this.emitter.emit(ACTIONS.UPDATED)
      this.emitter.emit(ACTIONS.CONFIGURED_SS)

      setTimeout(() => {
        this.dispatcher.dispatch({ type: ACTIONS.GET_BALANCES })
      }, 1)
    } catch (ex) {
      console.log(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  _getBaseAssets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/v1/assets`, { method: 'get' })
      const res = await response.json()
      const baseAssets = Object.values(res.data);

      console.log('baseAssets', baseAssets)

      //const baseAssets = tokenlist;
      const nativeKAVA = {
        address: CONTRACTS.KAVA_ADDRESS,
        decimals: CONTRACTS.KAVA_DECIMALS,
        logoURI: CONTRACTS.KAVA_LOGO,
        name: CONTRACTS.KAVA_NAME,
        symbol: CONTRACTS.KAVA_SYMBOL
      }

      baseAssets.unshift(nativeKAVA)

      let localBaseAssets = this.getLocalAssets()

      return [...baseAssets, ...localBaseAssets]

    } catch(ex) {
      console.log(ex)
      return []
    }
  }

  _getRouteAssets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/v1/configuration`, { method: 'get' })
      const routeAssetsCall = await response.json()
      return routeAssetsCall.data
    } catch(ex) {
      console.log(ex)
      return []
    }
  }

  _getPairs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/v1/pairs`, { method: 'get' })
      const pairsCall = await response.json()
      return pairsCall.data
    } catch(ex) {
      console.log(ex)
      return LIQUIDITY_PAIRS || []
    }
  }

  _getGovTokenBase = () => {
    return {
      address: CONTRACTS.GOV_TOKEN_ADDRESS,
      name: CONTRACTS.GOV_TOKEN_NAME,
      symbol: CONTRACTS.GOV_TOKEN_SYMBOL,
      decimals: CONTRACTS.GOV_TOKEN_DECIMALS,
      logoURI: CONTRACTS.GOV_TOKEN_LOGO
    }
  }

  _getVeTokenBase = () => {
    return {
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      name: CONTRACTS.VE_TOKEN_NAME,
      symbol: CONTRACTS.VE_TOKEN_SYMBOL,
      decimals: CONTRACTS.VE_TOKEN_DECIMALS,
      logoURI: CONTRACTS.VE_TOKEN_LOGO,
    }
  }

  getBalances = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      this._getGovTokenInfo(web3, account)
      await this._getBaseAssetInfo(web3, account)
      await this._getPairInfo(web3, account)
    } catch(ex) {
      console.log(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  _getVestNFTs = async (web3, account) => {
    try {
      const veToken = this.getStore('veToken')
      const govToken = this.getStore('govToken')

      const vestingContract = new web3.eth.Contract(CONTRACTS.VE_TOKEN_ABI, CONTRACTS.VE_TOKEN_ADDRESS)

      const nftsLength = await vestingContract.methods.balanceOf(account.address).call()
      const arr = Array.from({length: parseInt(nftsLength)}, (v, i) => i)

      const nfts = await Promise.all(
        arr.map(async (idx) => {

          const tokenIndex = await vestingContract.methods.tokenOfOwnerByIndex(account.address, idx).call()
          const locked = await vestingContract.methods.locked(tokenIndex).call()
          const lockValue = await vestingContract.methods.balanceOfNFT(tokenIndex).call()

          // probably do some decimals math before returning info. Maybe get more info. I don't know what it returns.
          return {
            id: tokenIndex,
            lockEnds: locked.end,
            lockAmount: BigNumber(locked.amount).div(10**govToken.decimals).toFixed(govToken.decimals),
            lockValue: BigNumber(lockValue).div(10**veToken.decimals).toFixed(veToken.decimals)
          }
        })
      )

      this.setStore({ vestNFTs: nfts })
      this.emitter.emit(ACTIONS.UPDATED)

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  _getGovTokenInfo = async (web3, account) => {
    try {
      const govToken = this.getStore('govToken')
      if (!govToken) {
        console.warn('govToken not found')
        return null
      }

      const veTokenContract = new web3.eth.Contract(CONTRACTS.GOV_TOKEN_ABI, CONTRACTS.GOV_TOKEN_ADDRESS)

      const [ balanceOf ] = await Promise.all([
        veTokenContract.methods.balanceOf(account.address).call()
      ])

      govToken.balanceOf = balanceOf
      govToken.balance = BigNumber(balanceOf).div(10**govToken.decimals).toFixed(govToken.decimals)

      this.setStore({ govToken })
      this.emitter.emit(ACTIONS.UPDATED)

      this._getVestNFTs(web3, account)
    } catch (ex) {
      console.log(ex)
    }
  }

  _getPairInfo = async (web3, account, overridePairs) => {
    try {

      const start = moment()

      const multicall = await stores.accountStore.getMulticall()

      let pairs = []

      if(overridePairs) {
        pairs = overridePairs
      } else {
        pairs = this.getStore('pairs')
      }

      const factoryContract = new web3.eth.Contract(CONTRACTS.FACTORY_ABI, CONTRACTS.FACTORY_ADDRESS)
      const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

      const [ totalWeight ] = await Promise.all([
        gaugesContract.methods.totalWeight().call()
      ])

      const ps = await Promise.all(
        pairs.map(async (pair) => {
          try {

            const token0 = await this.getBaseAsset(pair.token0.address, false, true)
            const token1 = await this.getBaseAsset(pair.token1.address, false, true)

            const [ totalSupply, reserves, balanceOf, claimable0, claimable1 ] = await this._tryGetPairBalances(web3, pair, account)

            pair.token0 = token0 != null ? token0 : pair.token0
            pair.token1 = token1 != null ? token1 : pair.token1
            pair.balance = BigNumber(balanceOf).div(10**pair.decimals).toFixed(parseInt(pair.decimals))
            pair.totalSupply = BigNumber(totalSupply).div(10**pair.decimals).toFixed(parseInt(pair.decimals))
            pair.reserve0 = BigNumber(reserves[0]).div(10**pair.token0.decimals).toFixed(parseInt(pair.token0.decimals))
            pair.reserve1 = BigNumber(reserves[1]).div(10**pair.token1.decimals).toFixed(parseInt(pair.token1.decimals))
            pair.claimable0 = BigNumber(claimable0).div(10**pair.token0.decimals).toFixed(pair.token0.decimals)
            pair.claimable1 = BigNumber(claimable1).div(10**pair.token1.decimals).toFixed(pair.token1.decimals)

            return pair
          } catch (ex) {
            console.log('EXCEPTION 1')
            console.log(pair)
            console.log(ex)
            return pair
          }
        })
      )

      this.setStore({ pairs: ps })
      this.emitter.emit(ACTIONS.UPDATED)


      const ps1 = await Promise.all(
        ps.map(async (pair) => {
          try {
            if(pair.gauge && pair.gauge.address !== ZERO_ADDRESS) {

              const [ totalSupply, gaugeBalance, gaugeWeight ] = await this._tryGetGaugeBalances(web3, pair, account, gaugesContract)

              const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address)

              const bribes = await Promise.all(
                pair.gauge.bribes.map(async (bribe, idx) => {
                  const rewardRate = await gaugeContract.methods.rewardRate(bribe.token.address).call()

                  bribe.rewardRate = BigNumber(rewardRate).div(10**bribe.token.decimals).toFixed(bribe.token.decimals)
                  bribe.rewardAmount = BigNumber(rewardRate).times(604800).div(10**bribe.token.decimals).toFixed(bribe.token.decimals)

                  return bribe
                })
              )

              const feeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, pair.gauge.feeAddress)

              // const fees = await Promise.all(
              //   pair.gauge.fees.map(async (fee, idx) => {
              //
              //     const rewardRate = await feeContract.methods.rewardRate(fee.token.address).call()
              //
              //     fee.rewardRate = BigNumber(rewardRate).div(10**fee.token.decimals).toFixed(fee.token.decimals)
              //     fee.rewardAmount = BigNumber(rewardRate).times(604800).div(10**fee.token.decimals).toFixed(fee.token.decimals)
              //
              //     return fee
              //   })
              // )

              pair.gauge.balance = BigNumber(gaugeBalance).div(10**18).toFixed(18)
              pair.gauge.totalSupply = BigNumber(totalSupply).div(10**18).toFixed(18)
              pair.gauge.reserve0 = pair.totalSupply > 0 ? BigNumber(pair.reserve0).times(pair.gauge.totalSupply).div(pair.totalSupply).toFixed(pair.token0.decimals) : '0'
              pair.gauge.reserve1 = pair.totalSupply > 0 ? BigNumber(pair.reserve1).times(pair.gauge.totalSupply).div(pair.totalSupply).toFixed(pair.token1.decimals) : '0'
              pair.gauge.weight = BigNumber(gaugeWeight).div(10**18).toFixed(18)
              pair.gauge.weightPercent = BigNumber(gaugeWeight).times(100).div(totalWeight).toFixed(2)
              pair.gauge.bribes = bribes
              // pair.gauge.fees = fees
            }

            return pair

          } catch (ex) {
            console.log(pair)
            console.error(ex)
            return pair
          }
        })
      )

      const end = moment()
      const time = end.diff(start)
      console.log(`_getPairInfo took ${time} MS`)

      this.setStore({ pairs: ps1 })
      this.emitter.emit(ACTIONS.UPDATED)

    } catch (ex) {
      console.error(ex)
    }
  }

  _tryGetPairBalances = async (web3, pair, account) => {
    try {
      const multicall = await stores.accountStore.getMulticall()
      const pairBalances = await this._getPairBalances(web3, multicall, pair, account)
      return pairBalances
    } catch(ex) {
      try {
        const multicall = await stores.accountStore.getMulticall(true)
        const pairBalances = await this._getPairBalances(web3, multicall, pair, account)
        return pairBalances
      } catch(ex) {
        throw ex
      }
    }
  }

  _getPairBalances = async (web3, multicall, pair, account) => {
    try {
      const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pair.address)

      return multicall.aggregate([
        pairContract.methods.totalSupply(),
        pairContract.methods.getReserves(),
        pairContract.methods.balanceOf(account.address),
        pairContract.methods.claimable0(account.address),
        pairContract.methods.claimable1(account.address)
      ])
    } catch(ex) {
      console.log(ex)
      throw ex
    }
  }

  _tryGetGaugeBalances = async (web3, pair, account, gaugesContract) => {
    try {
      const multicall = await stores.accountStore.getMulticall()
      const gaugeBalance = await this._getGaugeBalances(web3, multicall, pair, account, gaugesContract)
      return gaugeBalance
    } catch(ex) {
      try {
        const multicall = await stores.accountStore.getMulticall(true)
        const gaugeBalance = await this._getGaugeBalances(web3, multicall, pair, account, gaugesContract)
        return gaugeBalance
      } catch(ex) {
        throw ex
      }
    }
  }

  _getGaugeBalances = async (web3, multicall, pair, account, gaugesContract) => {
    try {
      const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address)

      return multicall.aggregate([
        gaugeContract.methods.totalSupply(),
        gaugeContract.methods.balanceOf(account.address),
        gaugesContract.methods.weights(pair.address)
      ])
    } catch(ex) {
      console.log(ex)
      throw ex
    }
  }

  _getBaseAssetInfo = async (web3, account) => {
    try {
      const start = moment()

      const baseAssets = this.getStore("baseAssets")
      if (!baseAssets) {
        console.warn('baseAssets not found')
        return null
      }

      console.log("Getting balances of assets:,", baseAssets);
      const balanceOfs = await this._tryGetBalanceOfs(web3, baseAssets, account)
      const whitelists = await this._tryGetWhitelists(web3, baseAssets)

      for (let i = 0; i < baseAssets.length; i++) {
        baseAssets[i].balance = BigNumber(balanceOfs[i]).div(10 ** baseAssets[i].decimals).toFixed(baseAssets[i].decimals)
        baseAssets[i].isWhitelisted = whitelists[i]
      }

      const end = moment()
      const time = end.diff(start)
      console.log(`_getBaseAssetInfo took ${time} MS`)

      this.setStore({ baseAssets })
      this.emitter.emit(ACTIONS.UPDATED)
    } catch (ex) {
      console.log(ex)
    }
  }

  _tryGetBalanceOfs = async (web3, baseAssets, account) => {
    try {
      const multicall = await stores.accountStore.getMulticall()
      const balanceOfs = await this._getBalanceOfs(web3, multicall, baseAssets, account)
      return balanceOfs
    } catch(ex) {
      try {
        const multicall = await stores.accountStore.getMulticall(true)
        const balanceOfs = await this._getBalanceOfs(web3, multicall, baseAssets, account)
        return balanceOfs
      } catch(ex) {
        throw ex
      }
    }
  }

  _getBalanceOfs = async (web3, multicall, baseAssets, account) => {
    try {
      const balanceOfCalls = baseAssets.map((asset) => {
        if(asset.address === 'KAVA') {
          return multicall.getEthBalance(account.address)
        }

        const assetContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, asset.address)
        return assetContract.methods.balanceOf(account.address)
      })

      return multicall.aggregate(balanceOfCalls)
    } catch(ex) {
      console.log(ex)
      throw ex
    }
  }

  _tryGetWhitelists = async (web3, baseAssets) => {
    try {
      const multicall = await stores.accountStore.getMulticall()
      const whitelists = await this._getWhitelists(web3, multicall, baseAssets)
      return whitelists
    } catch(ex) {
      try {
        const multicall = await stores.accountStore.getMulticall(true)
        const whitelists = await this._getWhitelists(web3, multicall, baseAssets)
        return whitelists
      } catch(ex) {
        throw ex
      }
    }
  }

  _getWhitelists = async (web3, multicall, baseAssets) => {
    try {
      const voterContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

      const whitelistedCalls = baseAssets.map((asset) => {
        let addy = asset.address
        if(asset.address === 'KAVA') {
          addy = CONTRACTS.WKAVA_ADDRESS
        }

        return voterContract.methods.isWhitelisted(addy)
      })

      return multicall.aggregate(whitelistedCalls)
    } catch(ex) {
      console.log(ex)
      throw ex
    }
  }

  searchBaseAsset = async (payload) => {
    try {
      let localBaseAssets = []
      const localBaseAssetsString = localStorage.getItem('stableSwap-assets')

      if(localBaseAssetsString && localBaseAssetsString !== '') {
        localBaseAssets = JSON.parse(localBaseAssetsString)
      }

      const theBaseAsset = localBaseAssets.filter((as) => {
        return as.address.toLowerCase() === payload.content.address.toLowerCase()
      })
      if(theBaseAsset.length > 0) {
        this.emitter.emit(ACTIONS.ASSET_SEARCHED, theBaseAsset)
        return
      }

      const baseAssetContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, payload.content.address)

      const [ symbol, decimals, name ] = await Promise.all([
        baseAssetContract.methods.symbol().call(),
        baseAssetContract.methods.decimals().call(),
        baseAssetContract.methods.name().call(),
      ])

      const newBaseAsset = {
        address: payload.content.address,
        symbol: symbol,
        name: name,
        decimals: parseInt(decimals)
      }

      localBaseAssets = [...localBaseAssets, newBaseAsset]
      localStorage.setItem('stableSwap-assets', JSON.stringify(localBaseAssets))

      const baseAssets = this.getStore('baseAssets')
      const storeBaseAssets = [...baseAssets, ...localBaseAssets]

      this.setStore({ baseAssets: storeBaseAssets })

      this.emitter.emit(ACTIONS.ASSET_SEARCHED, newBaseAsset)
    } catch(ex) {
      console.log(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  createPairStake = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { token0, token1, amount0, amount1, isStable, token, slippage } = payload.content

      let toki0 = token0.address
      let toki1 = token1.address
      if(token0.address === 'KAVA') {
        toki0 = CONTRACTS.WKAVA_ADDRESS
      }
      if(token1.address === 'KAVA') {
        toki1 = CONTRACTS.WKAVA_ADDRESS
      }

      const factoryContract = new web3.eth.Contract(CONTRACTS.FACTORY_ABI, CONTRACTS.FACTORY_ADDRESS)
      const pairFor = await factoryContract.methods.getPair(toki0, toki1, isStable).call()

      if(pairFor && pairFor != ZERO_ADDRESS) {
        await context.updatePairsCall(web3, account)
        this.emitter.emit(ACTIONS.ERROR, 'Pair already exists')
        return null
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID()
      let allowance1TXID = this.getTXUUID()
      let depositTXID = this.getTXUUID()
      let createGaugeTXID = this.getTXUUID()
      let stakeAllowanceTXID = this.getTXUUID()
      let stakeTXID = this.getTXUUID()

      //DOD A CHECK FOR IF THE POOL ALREADY EXISTS

      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`, type: 'Liquidity', verb: 'Liquidity Pool Created', transactions: [
        {
          uuid: allowance0TXID,
          description: `Checking your ${token0.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: allowance1TXID,
          description: `Checking your ${token1.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: depositTXID,
          description: `Create liquidity pool`,
          status: 'WAITING'
        },
        {
          uuid: createGaugeTXID,
          description: `Create gauge`,
          status: 'WAITING'
        },
        {
          uuid: stakeAllowanceTXID,
          description: `Checking your pool allowance`,
          status: 'WAITING'
        },
        {
          uuid: stakeTXID,
          description: `Stake LP tokens in the gauge`,
          status: 'WAITING'
        }
      ]})

      let allowance0 = 0
      let allowance1 = 0

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if(token0.address !== 'KAVA') {
        allowance0 = await this._getDepositAllowance(web3, token0, account)
        if(BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`
          })
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: 'DONE'
          })
        }
      } else {
        allowance0 = MAX_UINT256
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: 'DONE'
        })
      }

      if(token1.address !== 'KAVA') {
        allowance1 = await this._getDepositAllowance(web3, token1, account)
        if(BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`
          })
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: 'DONE'
          })
        }
      } else {
        allowance1 = MAX_UINT256
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: 'DONE'
        })
      }

      const gasPrice = await stores.accountStore.getGasPrice()

      const allowanceCallsPromises = []

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if(BigNumber(allowance0).lt(amount0)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token0.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowance0TXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }


      if(BigNumber(allowance1).lt(amount1)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token1.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowance1TXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }

      const done = await Promise.all(allowanceCallsPromises)


      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100)
      const sendAmount0 = BigNumber(amount0).times(10**token0.decimals).toFixed(0)
      const sendAmount1 = BigNumber(amount1).times(10**token1.decimals).toFixed(0)
      const deadline = ''+moment().add(600, 'seconds').unix()
      const sendAmount0Min = BigNumber(amount0).times(sendSlippage).times(10**token0.decimals).toFixed(0)
      const sendAmount1Min = BigNumber(amount1).times(sendSlippage).times(10**token1.decimals).toFixed(0)


      let func = 'addLiquidity'
      let params = [token0.address, token1.address, isStable, sendAmount0, sendAmount1, sendAmount0Min, sendAmount1Min, account.address, deadline]
      let sendValue = null

      if(token0.address === 'KAVA') {
        func = 'addLiquidityETH'
        params = [token1.address, isStable, sendAmount1, sendAmount1Min, sendAmount0Min, account.address, deadline]
        sendValue = sendAmount0
      }
      if(token1.address === 'KAVA') {
        func = 'addLiquidityETH'
        params = [token0.address, isStable, sendAmount0, sendAmount0Min, sendAmount1Min, account.address, deadline]
        sendValue = sendAmount1
      }

      const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)
      this._callContractWait(web3, routerContract, func, params, account, gasPrice, null, null, depositTXID, async (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        // GET PAIR FOR NEWLY CREATED LIQUIDITY POOL
        let tok0 = token0.address
        let tok1 = token1.address
        if(token0.address === 'KAVA') {
          tok0 = CONTRACTS.WKAVA_ADDRESS
        }
        if(token1.address === 'KAVA') {
          tok1 = CONTRACTS.WKAVA_ADDRESS
        }
        const pairFor = await factoryContract.methods.getPair(tok0, tok1, isStable).call()

        // SUBMIT CREATE GAUGE TRANSACTION
        const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)
        this._callContractWait(web3, gaugesContract, 'createGauge', [pairFor], account, gasPrice, null, null, createGaugeTXID, async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err)
          }

          const gaugeAddress = await gaugesContract.methods.gauges(pairFor).call()

          const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pairFor)
          const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, gaugeAddress)

          const balanceOf = await pairContract.methods.balanceOf(account.address).call()

          const pair = await this.getPairByAddress(pairFor)
          const stakeAllowance = await this._getStakeAllowance(web3, pair, account)

          if(BigNumber(stakeAllowance).lt( BigNumber(balanceOf).div(10**pair.decimals).toFixed(pair.decimals) )) {
            this.emitter.emit(ACTIONS.TX_STATUS, {
              uuid: stakeAllowanceTXID,
              description: `Allow the router to spend your ${pair.symbol}`
            })
          } else {
            this.emitter.emit(ACTIONS.TX_STATUS, {
              uuid: stakeAllowanceTXID,
              description: `Allowance on ${pair.symbol} sufficient`,
              status: 'DONE'
            })
          }

          const allowanceCallsPromise = []

          if(BigNumber(stakeAllowance).lt( BigNumber(balanceOf).div(10**pair.decimals).toFixed(pair.decimals)  )) {
            const stakePromise = new Promise((resolve, reject) => {
              context._callContractWait(web3, pairContract, 'approve', [pair.gauge.address, MAX_UINT256], account, gasPrice, null, null, stakeAllowanceTXID, (err) => {
                if (err) {
                  reject(err)
                  return
                }

                resolve()
              })
            })

            allowanceCallsPromise.push(stakePromise)
          }

          const done = await Promise.all(allowanceCallsPromise)

          let sendTok = '0'
          if(token && token.id) {
            sendTok = token.id
          }

          this._callContractWait(web3, gaugeContract, 'deposit', [balanceOf, sendTok], account, gasPrice, null, null, stakeTXID, async (err) => {
            if (err) {
              return this.emitter.emit(ACTIONS.ERROR, err)
            }

            await context.updatePairsCall(web3, account)

            this.emitter.emit(ACTIONS.PAIR_CREATED, pairFor)
          })

        })
      }, null, sendValue)
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  createPairDeposit = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { token0, token1, amount0, amount1, isStable, slippage } = payload.content

      let toki0 = token0.address
      let toki1 = token1.address
      if(token0.address === 'KAVA') {
        toki0 = CONTRACTS.WKAVA_ADDRESS
      }
      if(token1.address === 'KAVA') {
        toki1 = CONTRACTS.WKAVA_ADDRESS
      }


      const factoryContract = new web3.eth.Contract(CONTRACTS.FACTORY_ABI, CONTRACTS.FACTORY_ADDRESS)
      const pairFor = await factoryContract.methods.getPair(toki0, toki1, isStable).call()

      if(pairFor && pairFor != ZERO_ADDRESS) {
        await context.updatePairsCall(web3, account)
        this.emitter.emit(ACTIONS.ERROR, 'Pair already exists')
        return null
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID()
      let allowance1TXID = this.getTXUUID()
      let depositTXID = this.getTXUUID()
      let createGaugeTXID = this.getTXUUID()

      //DOD A CHECK FOR IF THE POOL ALREADY EXISTS

      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`, type: 'Liquidity', verb: 'Liquidity Pool Created', transactions: [
        {
          uuid: allowance0TXID,
          description: `Checking your ${token0.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: allowance1TXID,
          description: `Checking your ${token1.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: depositTXID,
          description: `Create liquidity pool`,
          status: 'WAITING'
        },
        {
          uuid: createGaugeTXID,
          description: `Create gauge`,
          status: 'WAITING'
        }
      ]})

      let allowance0 = 0
      let allowance1 = 0

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if(token0.address !== 'KAVA') {
        allowance0 = await this._getDepositAllowance(web3, token0, account)
        if(BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`
          })
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: 'DONE'
          })
        }
      } else {
        allowance0 = MAX_UINT256
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: 'DONE'
        })
      }

      if(token1.address !== 'KAVA') {
        allowance1 = await this._getDepositAllowance(web3, token1, account)
        if(BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`
          })
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: 'DONE'
          })
        }
      } else {
        allowance1 = MAX_UINT256
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: 'DONE'
        })
      }

      const gasPrice = await stores.accountStore.getGasPrice()

      const allowanceCallsPromises = []


      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if(BigNumber(allowance0).lt(amount0)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token0.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowance0TXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }


      if(BigNumber(allowance1).lt(amount1)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token1.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowance1TXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }

      const done = await Promise.all(allowanceCallsPromises)


      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100)
      const sendAmount0 = BigNumber(amount0).times(10**token0.decimals).toFixed(0)
      const sendAmount1 = BigNumber(amount1).times(10**token1.decimals).toFixed(0)
      const deadline = ''+moment().add(600, 'seconds').unix()
      const sendAmount0Min = BigNumber(amount0).times(sendSlippage).times(10**token0.decimals).toFixed(0)
      const sendAmount1Min = BigNumber(amount1).times(sendSlippage).times(10**token1.decimals).toFixed(0)


      let func = 'addLiquidity'
      let params = [token0.address, token1.address, isStable, sendAmount0, sendAmount1, sendAmount0Min, sendAmount1Min, account.address, deadline]
      let sendValue = null

      if(token0.address === 'KAVA') {
        func = 'addLiquidityETH'
        params = [token1.address, isStable, sendAmount1, sendAmount1Min, sendAmount0Min, account.address, deadline]
        sendValue = sendAmount0
      }
      if(token1.address === 'KAVA') {
        func = 'addLiquidityETH'
        params = [token0.address, isStable, sendAmount0, sendAmount0Min, sendAmount1Min, account.address, deadline]
        sendValue = sendAmount1
      }

      const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)
      this._callContractWait(web3, routerContract, func, params, account, gasPrice, null, null, depositTXID, async (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        // GET PAIR FOR NEWLY CREATED LIQUIDITY POOL
        let tok0 = token0.address
        let tok1 = token1.address
        if(token0.address === 'KAVA') {
          tok0 = CONTRACTS.WKAVA_ADDRESS
        }
        if(token1.address === 'KAVA') {
          tok1 = CONTRACTS.WKAVA_ADDRESS
        }
        const pairFor = await factoryContract.methods.getPair(tok0, tok1, isStable).call()

        // SUBMIT CREATE GAUGE TRANSACTION
        const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)
        this._callContractWait(web3, gaugesContract, 'createGauge', [pairFor], account, gasPrice, null, null, createGaugeTXID, async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err)
          }

          await context.updatePairsCall(web3, account)

          this.emitter.emit(ACTIONS.PAIR_CREATED, pairFor)
        })
      }, null, sendValue)
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  updatePairsCall = async (web3, account) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/v1/updatePairs`, {
        method: 'get',
        headers: {
          'Authorization': `Basic ${process.env.NEXT_PUBLIC_API_TOKEN}`,
        }
      })
      const pairsCall = await response.json()
      this.setStore({ pairs: pairsCall.data })

      await this._getPairInfo(web3, account, pairsCall.data)

    } catch(ex) {
      console.log(ex)
    }
  }

  sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getTXUUID = () => {
    return uuidv4()
  }

  addLiquidity = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { token0, token1, amount0, amount1, minLiquidity, pair, slippage } = payload.content

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID()
      let allowance1TXID = this.getTXUUID()
      let depositTXID = this.getTXUUID()

      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Add liquidity to ${pair.symbol}`, verb: 'Liquidity Added', type: 'Liquidity', transactions: [
        {
          uuid: allowance0TXID,
          description: `Checking your ${token0.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: allowance1TXID,
          description: `Checking your ${token1.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: depositTXID,
          description: `Deposit tokens in the pool`,
          status: 'WAITING'
        },
      ]})

      let allowance0 = 0
      let allowance1 = 0

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if(token0.address !== 'KAVA') {
        allowance0 = await this._getDepositAllowance(web3, token0, account)
        if(BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`
          })
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: 'DONE'
          })
        }
      } else {
        allowance0 = MAX_UINT256
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: 'DONE'
        })
      }

      if(token1.address !== 'KAVA') {
        allowance1 = await this._getDepositAllowance(web3, token1, account)
        if(BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`
          })
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: 'DONE'
          })
        }
      } else {
        allowance1 = MAX_UINT256
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: 'DONE'
        })
      }

      const gasPrice = await stores.accountStore.getGasPrice()

      const allowanceCallsPromises = []


      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if(BigNumber(allowance0).lt(amount0)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token0.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowance0TXID, (err) => {
            if (err) {
              console.log(err)
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }


      if(BigNumber(allowance1).lt(amount1)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token1.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowance1TXID, (err) => {
            if (err) {
              console.log(err)
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }

      const done = await Promise.all(allowanceCallsPromises)

      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100)
      const sendAmount0 = BigNumber(amount0).times(10**token0.decimals).toFixed(0)
      const sendAmount1 = BigNumber(amount1).times(10**token1.decimals).toFixed(0)
      const deadline = ''+moment().add(600, 'seconds').unix()
      const sendAmount0Min = BigNumber(amount0).times(sendSlippage).times(10**token0.decimals).toFixed(0)
      const sendAmount1Min = BigNumber(amount1).times(sendSlippage).times(10**token1.decimals).toFixed(0)

      const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)

      let func = 'addLiquidity'
      let params = [token0.address, token1.address, pair.isStable, sendAmount0, sendAmount1, sendAmount0Min, sendAmount1Min, account.address, deadline]
      let sendValue = null

      if(token0.address === 'KAVA') {
        func = 'addLiquidityETH'
        params = [token1.address, pair.isStable, sendAmount1, sendAmount1Min, sendAmount0Min, account.address, deadline]
        sendValue = sendAmount0
      }
      if(token1.address === 'KAVA') {
        func = 'addLiquidityETH'
        params = [token0.address, pair.isStable, sendAmount0, sendAmount0Min, sendAmount1Min, account.address, deadline]
        sendValue = sendAmount1
      }

      this._callContractWait(web3, routerContract, func, params, account, gasPrice, null, null, depositTXID, (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        this._getPairInfo(web3, account)

        this.emitter.emit(ACTIONS.LIQUIDITY_ADDED)
      }, null, sendValue)

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  stakeLiquidity = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { pair, token } = payload.content

      let stakeAllowanceTXID = this.getTXUUID()
      let stakeTXID = this.getTXUUID()


      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Stake ${pair.symbol} in the gauge`, type: 'Liquidity', verb: 'Liquidity Staked', transactions: [
        {
          uuid: stakeAllowanceTXID,
          description: `Checking your ${pair.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: stakeTXID,
          description: `Stake LP tokens in the gauge`,
          status: 'WAITING'
        }
      ]})

      const stakeAllowance = await this._getStakeAllowance(web3, pair, account)

      const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pair.address)
      const balanceOf = await pairContract.methods.balanceOf(account.address).call()

      if(BigNumber(stakeAllowance).lt( BigNumber(balanceOf).div(10**pair.decimals).toFixed(pair.decimals) )) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`
        })
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: 'DONE'
        })
      }


      const gasPrice = await stores.accountStore.getGasPrice()

      const allowanceCallsPromises = []

      if(BigNumber(stakeAllowance).lt( BigNumber(balanceOf).div(10**pair.decimals).toFixed(pair.decimals)  )) {
        const stakePromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, pairContract, 'approve', [pair.gauge.address, MAX_UINT256], account, gasPrice, null, null, stakeAllowanceTXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(stakePromise)
      }

      const done = await Promise.all(allowanceCallsPromises)


      const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address)

      let sendTok = '0'
      if(token && token.id) {
        sendTok = token.id
      }

      this._callContractWait(web3, gaugeContract, 'deposit', [balanceOf, sendTok], account, gasPrice, null, null, stakeTXID, (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        this._getPairInfo(web3, account)

        this.emitter.emit(ACTIONS.LIQUIDITY_STAKED)
      })

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  addLiquidityAndStake = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { token0, token1, amount0, amount1, minLiquidity, pair, token, slippage } = payload.content

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID()
      let allowance1TXID = this.getTXUUID()
      let stakeAllowanceTXID = this.getTXUUID()
      let depositTXID = this.getTXUUID()
      let stakeTXID = this.getTXUUID()


      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Add liquidity to ${pair.symbol}`, type: 'Liquidity', verb: 'Liquidity Added', transactions: [
        {
          uuid: allowance0TXID,
          description: `Checking your ${token0.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: allowance1TXID,
          description: `Checking your ${token1.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: stakeAllowanceTXID,
          description: `Checking your ${pair.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: depositTXID,
          description: `Deposit tokens in the pool`,
          status: 'WAITING'
        },
        {
          uuid: stakeTXID,
          description: `Stake LP tokens in the gauge`,
          status: 'WAITING'
        }
      ]})

      let allowance0 = 0
      let allowance1 = 0

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if(token0.address !== 'KAVA') {
        allowance0 = await this._getDepositAllowance(web3, token0, account)
        if(BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`
          })
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: 'DONE'
          })
        }
      } else {
        allowance0 = MAX_UINT256
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: 'DONE'
        })
      }

      if(token1.address !== 'KAVA') {
        allowance1 = await this._getDepositAllowance(web3, token1, account)
        if(BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`
          })
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: 'DONE'
          })
        }
      } else {
        allowance1 = MAX_UINT256
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: 'DONE'
        })
      }


      const stakeAllowance = await this._getStakeAllowance(web3, pair, account)

      if(BigNumber(stakeAllowance).lt(minLiquidity)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`
        })
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: 'DONE'
        })
      }

      const gasPrice = await stores.accountStore.getGasPrice()

      const allowanceCallsPromises = []


      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if(BigNumber(allowance0).lt(amount0)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token0.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowance0TXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }


      if(BigNumber(allowance1).lt(amount1)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token1.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowance1TXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }


      if(BigNumber(stakeAllowance).lt(minLiquidity)) {
        const pairContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.address)

        const stakePromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, pairContract, 'approve', [pair.gauge.address, MAX_UINT256], account, gasPrice, null, null, stakeAllowanceTXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(stakePromise)
      }

      const done = await Promise.all(allowanceCallsPromises)


      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100)
      const sendAmount0 = BigNumber(amount0).times(10**token0.decimals).toFixed(0)
      const sendAmount1 = BigNumber(amount1).times(10**token1.decimals).toFixed(0)
      const deadline = ''+moment().add(600, 'seconds').unix()
      const sendAmount0Min = BigNumber(amount0).times(sendSlippage).times(10**token0.decimals).toFixed(0)
      const sendAmount1Min = BigNumber(amount1).times(sendSlippage).times(10**token1.decimals).toFixed(0)

      const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)
      const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address)
      const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pair.address)

      let func = 'addLiquidity'
      let params = [token0.address, token1.address, pair.isStable, sendAmount0, sendAmount1, sendAmount0Min, sendAmount1Min, account.address, deadline]
      let sendValue = null

      if(token0.address === 'KAVA') {
        func = 'addLiquidityETH'
        params = [token1.address, pair.isStable, sendAmount1, sendAmount1Min, sendAmount0Min, account.address, deadline]
        sendValue = sendAmount0
      }
      if(token1.address === 'KAVA') {
        func = 'addLiquidityETH'
        params = [token0.address, pair.isStable, sendAmount0, sendAmount0Min, sendAmount1Min, account.address, deadline]
        sendValue = sendAmount1
      }

      this._callContractWait(web3, routerContract, func, params, account, gasPrice, null, null, depositTXID, async (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        const balanceOf = await pairContract.methods.balanceOf(account.address).call()

        let sendTok = '0'
        if(token && token.id) {
          sendTok = token.id
        }

        this._callContractWait(web3, gaugeContract, 'deposit', [balanceOf, sendTok], account, gasPrice, null, null, stakeTXID, (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err)
          }

          this._getPairInfo(web3, account)

          this.emitter.emit(ACTIONS.ADD_LIQUIDITY_AND_STAKED)
        })
      }, null, sendValue)

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  _getDepositAllowance = async (web3, token, account) => {
    try {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token.address)
      const allowance = await tokenContract.methods.allowance(account.address, CONTRACTS.ROUTER_ADDRESS).call()
      return BigNumber(allowance).div(10**token.decimals).toFixed(token.decimals)
    } catch (ex) {
      console.error(ex)
      return null
    }
  }

  _getStakeAllowance = async (web3, pair, account) => {
    try {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.address)
      const allowance = await tokenContract.methods.allowance(account.address, pair.gauge.address).call()
      return BigNumber(allowance).div(10**pair.decimals).toFixed(pair.decimals)
    } catch (ex) {
      console.error(ex)
      return null
    }
  }

  _getWithdrawAllowance = async (web3, pair, account) => {
    try {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.address)
      const allowance = await tokenContract.methods.allowance(account.address, CONTRACTS.ROUTER_ADDRESS).call()
      return BigNumber(allowance).div(10**pair.decimals).toFixed(pair.decimals)
    } catch (ex) {
      console.error(ex)
      return null
    }
  }

  quoteAddLiquidity = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { pair, token0, token1, amount0, amount1 } = payload.content

      if(!pair || !token0 || !token1 || amount0 == '' || amount1 == '') {
        return null
      }

      const gasPrice = await stores.accountStore.getGasPrice()
      const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)

      const sendAmount0 = BigNumber(amount0).times(10**token0.decimals).toFixed(0)
      const sendAmount1 = BigNumber(amount1).times(10**token1.decimals).toFixed(0)

      let addy0 = token0.address
      let addy1 = token1.address

      if(token0.address === 'KAVA') {
        addy0 = CONTRACTS.WKAVA_ADDRESS
      }
      if(token1.address === 'KAVA') {
        addy1 = CONTRACTS.WKAVA_ADDRESS
      }

      const res = await routerContract.methods.quoteAddLiquidity(addy0, addy1, pair.isStable, sendAmount0, sendAmount1).call()

      const returnVal = {
        inputs: {
          token0,
          token1,
          amount0,
          amount1,
        },
        output: BigNumber(res.liquidity).div(10**(pair.decimals)).toFixed(pair.decimals)
      }
      this.emitter.emit(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, returnVal)

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  getLiquidityBalances = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { pair } = payload.content

      if(!pair) {
        return
      }

      const token0Contract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.token0.address)
      const token1Contract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.token1.address)
      const pairContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.address)

      const balanceCalls = [
        token0Contract.methods.balanceOf(account.address).call(),
        token1Contract.methods.balanceOf(account.address).call(),
        pairContract.methods.balanceOf(account.address).call()
      ]

      if(pair.gauge) {
        const gaugeContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.gauge.address)
        balanceCalls.push(gaugeContract.methods.balanceOf(account.address).call())
        // balanceCalls.push(gaugeContract.methods.earned(incentiveAddress, account.address).call())
      }

      const [ token0Balance, token1Balance, poolBalance, gaugeBalance/*, earned*/ ] = await Promise.all(balanceCalls)

      const returnVal = {
        token0: BigNumber(token0Balance).div(10**pair.token0.decimals).toFixed(pair.token0.decimals),
        token1: BigNumber(token1Balance).div(10**pair.token1.decimals).toFixed(pair.token1.decimals),
        pool: BigNumber(poolBalance).div(10**18).toFixed(18),
      }

      if(pair.gauge) {
        returnVal.gauge = gaugeBalance ? BigNumber(gaugeBalance).div(10**18).toFixed(18) : null
        // returnVal.earned = BigNumber(earned).div(10**incentiveAsset.decimals).toFixed(incentiveAsset.decimals),
      }

      this.emitter.emit(ACTIONS.GET_LIQUIDITY_BALANCES_RETURNED, returnVal)
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  removeLiquidity = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { token0, token1, pair, slippage } = payload.content

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID()
      let withdrawTXID = this.getTXUUID()

      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Remove liquidity from ${pair.symbol}`, type: 'Liquidity', verb: 'Liquidity Removed', transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${pair.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: withdrawTXID,
          description: `Withdraw tokens from the pool`,
          status: 'WAITING'
        },
      ]})

      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getWithdrawAllowance(web3, pair, account)

      if(BigNumber(allowance).lt(pair.balance)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`
        })
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: 'DONE'
        })
      }

      const gasPrice = await stores.accountStore.getGasPrice()

      const allowanceCallsPromises = []


      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if(BigNumber(allowance).lt(pair.balance)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowanceTXID, (err) => {
            if (err) {
              console.log(err)
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }


      const done = await Promise.all(allowanceCallsPromises)

      // SUBMIT WITHDRAW TRANSACTION
      const sendAmount = BigNumber(pair.balance).times(10**pair.decimals).toFixed(0)

      const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)

      const quoteRemove = await routerContract.methods.quoteRemoveLiquidity(token0.address, token1.address, pair.isStable, sendAmount).call()

      const sendSlippage = BigNumber(100).minus(slippage).div(100)
      const deadline = ''+moment().add(600, 'seconds').unix()
      const sendAmount0Min = BigNumber(quoteRemove.amountA).times(sendSlippage).toFixed(0)
      const sendAmount1Min = BigNumber(quoteRemove.amountB).times(sendSlippage).toFixed(0)


      this._callContractWait(web3, routerContract, 'removeLiquidity', [token0.address, token1.address, pair.isStable, sendAmount, sendAmount0Min, sendAmount1Min, account.address, deadline], account, gasPrice, null, null, withdrawTXID, (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        this._getPairInfo(web3, account)

        this.emitter.emit(ACTIONS.LIQUIDITY_REMOVED)
      })

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  unstakeAndRemoveLiquidity = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { token0, token1, amount, amount0, amount1, pair, slippage } = payload.content

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID()
      let withdrawTXID = this.getTXUUID()
      let unstakeTXID = this.getTXUUID()


      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Remove liquidity from ${pair.symbol}`, type: 'Liquidity', verb: 'Liquidity Removed', transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${pair.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: unstakeTXID,
          description: `Unstake LP tokens from the gauge`,
          status: 'WAITING'
        },
        {
          uuid: withdrawTXID,
          description: `Withdraw tokens from the pool`,
          status: 'WAITING'
        }
      ]})


      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getWithdrawAllowance(web3, pair, account)

      if(BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`
        })
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: 'DONE'
        })
      }

      const gasPrice = await stores.accountStore.getGasPrice()

      const allowanceCallsPromises = []


      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if(BigNumber(allowance).lt(amount)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, pair.address)

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowanceTXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }

      const done = await Promise.all(allowanceCallsPromises)


      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100)
      const sendAmount = BigNumber(amount).times(10**pair.decimals).toFixed(0)
      const deadline = ''+moment().add(600, 'seconds').unix()
      const sendAmount0Min = BigNumber(amount0).times(sendSlippage).times(10**token0.decimals).toFixed(0)
      const sendAmount1Min = BigNumber(amount1).times(sendSlippage).times(10**token1.decimals).toFixed(0)

      const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)
      const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address)
      const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pair.address)

      this._callContractWait(web3, gaugeContract, 'withdraw', [sendAmount], account, gasPrice, null, null, unstakeTXID, async (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        const balanceOf = await pairContract.methods.balanceOf(account.address).call()

        this._callContractWait(web3, routerContract, 'removeLiquidity', [token0.address, token1.address, pair.isStable, balanceOf, sendAmount0Min, sendAmount1Min, account.address, deadline], account, gasPrice, null, null, withdrawTXID, (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err)
          }

          this._getPairInfo(web3, account)

          this.emitter.emit(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED)
        })
      })
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  unstakeLiquidity = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { token0, token1, amount, amount0, amount1, pair } = payload.content

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let unstakeTXID = this.getTXUUID()


      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Unstake liquidity from gauge`, type: 'Liquidity', verb: 'Liquidity Unstaked', transactions: [
        {
          uuid: unstakeTXID,
          description: `Unstake LP tokens from the gauge`,
          status: 'WAITING'
        }
      ]})

      const gasPrice = await stores.accountStore.getGasPrice()


      // SUBMIT DEPOSIT TRANSACTION
      const sendAmount = BigNumber(amount).times(10**pair.decimals).toFixed(0)

      const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address)

      this._callContractWait(web3, gaugeContract, 'withdraw', [sendAmount], account, gasPrice, null, null, unstakeTXID, async (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        this._getPairInfo(web3, account)

        this.emitter.emit(ACTIONS.LIQUIDITY_UNSTAKED)
      })
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  quoteRemoveLiquidity = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { pair, token0, token1, withdrawAmount } = payload.content

      if(!pair || !token0 || !token1 || withdrawAmount == '') {
        return null
      }

      const gasPrice = await stores.accountStore.getGasPrice()
      const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)

      const sendWithdrawAmount = BigNumber(withdrawAmount).times(10**pair.decimals).toFixed(0)

      const res = await routerContract.methods.quoteRemoveLiquidity(token0.address, token1.address, pair.isStable, sendWithdrawAmount).call()

      const returnVal = {
        inputs: {
          token0,
          token1,
          withdrawAmount
        },
        output: {
          amount0: BigNumber(res.amountA).div(10**(token0.decimals)).toFixed(token0.decimals),
          amount1: BigNumber(res.amountB).div(10**(token1.decimals)).toFixed(token1.decimals)
        }
      }
      this.emitter.emit(ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED, returnVal)

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  createGauge = async (payload) => {
    try {
      const context = this

      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { pair } = payload.content

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let createGaugeTXID = this.getTXUUID()

      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Create liquidity gauge for ${pair.token0.symbol}/${pair.token1.symbol}`, type: 'Liquidity', verb: 'Gauge Created', transactions: [
        {
          uuid: createGaugeTXID,
          description: `Create gauge`,
          status: 'WAITING'
        }
      ]})

      const gasPrice = await stores.accountStore.getGasPrice()

      const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)
      this._callContractWait(web3, gaugesContract, 'createGauge', [pair.address], account, gasPrice, null, null, createGaugeTXID, async (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        await this.updatePairsCall(web3, account)

        this.emitter.emit(ACTIONS.CREATE_GAUGE_RETURNED)
      })

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  _getSpecificAssetInfo = async (web3, account, assetAddress) => {
    try {
      const baseAssets = this.getStore("baseAssets")
      if (!baseAssets) {
        console.warn('baseAssets not found')
        return null
      }

      const ba = await Promise.all(
          baseAssets.map(async (asset) => {
            if(asset.address.toLowerCase() === assetAddress.toLowerCase()) {
              if(asset.address === 'KAVA') {
                let bal = await web3.eth.getBalance(account.address)
                asset.balance = BigNumber(bal).div(10 ** asset.decimals).toFixed(asset.decimals)
              } else {
                const assetContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, asset.address)

                const [ balanceOf ] = await Promise.all([
                  assetContract.methods.balanceOf(account.address).call(),
                ])

                asset.balance = BigNumber(balanceOf).div(10 ** asset.decimals).toFixed(asset.decimals)
              }
            }

            return asset
          })
      )

      this.setStore({ baseAssets: ba })
      this.emitter.emit(ACTIONS.UPDATED)

    } catch (ex) {
      console.log(ex)
      return null
    }
  }

  // Swapping
  quoteSwap = quoteSwap
  swap = swap
  wrap = wrap
  unwrap = unwrap

  // Vesting
  getVestNFTs = getVestNFTs
  createVest = createVest
  increaseVestAmount = increaseVestAmount
  increaseVestDuration = increaseVestDuration
  withdrawVest = withdrawVest

  vote = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const govToken = this.getStore('govToken')
      const { tokenID, votes } = payload.content

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let voteTXID = this.getTXUUID()

      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Cast vote using token #${tokenID}`, verb: 'Votes Cast', transactions: [
        {
          uuid: voteTXID,
          description: `Cast votes`,
          status: 'WAITING'
        }
      ]})

      const gasPrice = await stores.accountStore.getGasPrice()

      // SUBMIT INCREASE TRANSACTION
      const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

      let onlyVotes = votes.filter((vote) => {
        return (BigNumber(vote.value).gt(0) || BigNumber(vote.value).lt(0))
      })

      let tokens = onlyVotes.map((vote) => {
        return vote.address
      })

      let voteCounts = onlyVotes.map((vote) => {
        return BigNumber(vote.value).times(100).toFixed(0)
      })

      this._callContractWait(web3, gaugesContract, 'vote', [tokenID, tokens, voteCounts], account, gasPrice, null, null, voteTXID, (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        this.emitter.emit(ACTIONS.VOTE_RETURNED)
      })

    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  getVestVotes = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { tokenID } = payload.content
      const pairs = this.getStore('pairs')

      if(!pairs) {
        return null
      }

      if(!tokenID) {
        return
      }

      const filteredPairs = pairs.filter((pair) => {
        return pair && pair.gauge && pair.gauge.address
      })

      const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

      const multicall = await stores.accountStore.getMulticall()

      const calls = filteredPairs.map((pair) => {
        return gaugesContract.methods.votes(tokenID, pair.address)
      })

      const voteCounts = await multicall.aggregate(calls);

      let votes = []

      const totalVotes = voteCounts.reduce((curr, acc) => {
        let num = BigNumber(acc).gt(0) ? acc : BigNumber(acc).times(-1).toNumber(0)
        return BigNumber(curr).plus(num)
      }, 0)

      for(let i = 0; i < voteCounts.length; i++) {
        votes.push({
          address: filteredPairs[i].address,
          votePercent: (BigNumber(totalVotes).gt(0) || BigNumber(totalVotes).lt(0)) ? BigNumber(voteCounts[i]).times(100).div(totalVotes).toFixed(0) : '0'
        })
      }

      this.emitter.emit(ACTIONS.VEST_VOTES_RETURNED, votes)
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  createBribe = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { asset, amount, gauge } = payload.content;
      let bribeAddress = gauge.gauge.bribeAddress;

      let bribeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, bribeAddress)

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let bribeTXID = this.getTXUUID();
      let wxBribeTXID = this.getTXUUID();

      const gasPrice = await stores.accountStore.getGasPrice()

      this.emitter.emit(ACTIONS.TX_ADDED, { title: `Create bribe on ${gauge.token0.symbol}/${gauge.token1.symbol}`, verb: 'Bribe Created', transactions: [
        {
          uuid: wxBribeTXID,
          description: `Create Wrapped Bribe`,
          status: 'WAITING',
        },
        {
          uuid: allowanceTXID,
          description: `Checking your ${asset.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: bribeTXID,
          description: `Create bribe`,
          status: 'WAITING'
        }
      ]})

      // CREATE WRAPPED EXTERNAL BRIBE
      console.log('old bribe', bribeAddress)
      try {
        bribeAddress = await this._createWrappedBribe(
            wxBribeTXID,
            web3,
            bribeAddress,
            account,
            gasPrice,
        );
      } catch (e) {
        this.emitter.emit(ACTIONS.ERROR, e.message);
        return;
      }
      console.log('new bribe', bribeAddress)
      // CHECK ALLOWANCES AND SET TX DISPLAY
      const allowance = await this._getBribeAllowance(web3, asset, gauge, account)

      if(BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the bribe contract to spend your ${asset.symbol}`
        })
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${asset.symbol} sufficient`,
          status: 'DONE'
        })
      }

      const allowanceCallsPromises = []

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if(BigNumber(allowance).lt(amount)) {
        const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, asset.address)

        const tokenPromise = new Promise((resolve, reject) => {
          this._callContractWait(web3, tokenContract, 'approve', [bribeAddress, MAX_UINT256], account, gasPrice, null, null, allowanceTXID, (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        allowanceCallsPromises.push(tokenPromise)
      }

      const done = await Promise.all(allowanceCallsPromises)

      // SUBMIT BRIBE TRANSACTION

      const sendAmount = BigNumber(amount).times(10**asset.decimals).toFixed(0)
      bribeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, bribeAddress)
      this._callContractWait(web3, bribeContract, 'notifyRewardAmount', [asset.address, sendAmount], account, gasPrice, null, null, bribeTXID, async (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        await this.updatePairsCall(web3, account)

        this.emitter.emit(ACTIONS.BRIBE_CREATED)
      })
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  _createWrappedBribe = async (txid, web3, bribeAddress, account, gasPrice) => {
    const wxBribeFactoryContract = new web3.eth.Contract(
        CONTRACTS.WRAPPED_EXTERNAL_BRIBE_FACTORY_ABI,
        CONTRACTS.WRAPPED_EXTERNAL_BRIBE_FACTORY_ADDRESS,
    );

    return await new Promise((resolve, reject) => {
      this._callContractWait(
        web3,
        wxBribeFactoryContract,
        'createBribe',
        [bribeAddress],
        account,
        gasPrice,
        null,
        null,
        txid,
        null,
        async (err) => {
          if (!err?.message?.toLowerCase().includes("already created")) {
            // TODO: this should stop all transactions
            reject(err);
            throw err;
          }
          this.emitter.emit(
              ACTIONS.TX_CONFIRMED,
              { uuid: txid }
          )
          resolve()
        }
      )
    }).then(() => wxBribeFactoryContract.methods.oldBribeToNew(bribeAddress).call())
  }

  _getBribeAllowance = async (web3, token, pair, account) => {
    try {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token.address)
      const allowance = await tokenContract.methods.allowance(account.address, pair.gauge.bribeAddress).call()
      return BigNumber(allowance).div(10**token.decimals).toFixed(token.decimals)
    } catch (ex) {
      console.error(ex)
      return null
    }
  }

  getVestBalances = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { tokenID } = payload.content
      const pairs = this.getStore('pairs')

      if(!pairs) {
        return null
      }

      if(!tokenID) {
        return
      }

      const filteredPairs = pairs.filter((pair) => {
        return pair && pair.gauge
      })

      const bribesEarned = await Promise.all(
        filteredPairs.map(async (pair) => {

          const bribesEarned = await Promise.all(
            pair.gauge.bribes.map(async (bribe) => {
              const bribeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, pair.gauge.bribeAddress)

              const [ earned ] = await Promise.all([
                bribeContract.methods.earned(bribe.token.address, tokenID).call(),
              ])

              return {
                earned: BigNumber(earned).div(10**bribe.token.decimals).toFixed(bribe.token.decimals),
              }
            })
          )

          // const feesEarned = await Promise.all(
          //   pair.gauge.fees.map(async (fee) => {
          //     const feeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, pair.gauge.feeAddress)
          //
          //     const [ earned ] = await Promise.all([
          //       feeContract.methods.earned(fee.token.address, tokenID).call(),
          //     ])
          //
          //     return {
          //       earned: BigNumber(earned).div(10**fee.token.decimals).toFixed(fee.token.decimals),
          //     }
          //   })
          // )

          pair.gauge.bribesEarned = bribesEarned
          // pair.gauge.feesEarned = feesEarned

          return pair
        })
      )

      this.emitter.emit(ACTIONS.VEST_BALANCES_RETURNED, bribesEarned)
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  // Rewards
  getRewardBalances = getRewardBalances
  claimBribes = claimBribes
  claimAllRewards = claimAllRewards
  claimRewards = claimRewards
  claimVeDist = claimVeDist
  claimPairFees = claimPairFees

  searchWhitelist = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }
      const veToken = this.getStore('veToken')

      const { search } = payload.content


      const voterContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

      const [ isWhitelisted, listingFee ] = await Promise.all([
        voterContract.methods.isWhitelisted(search).call(),
        voterContract.methods.listing_fee().call()
      ])

      const token = await this.getBaseAsset(search)
      token.isWhitelisted = isWhitelisted
      token.listingFee = BigNumber(listingFee).div(10**veToken.decimals).toFixed(veToken.decimals)

      this.emitter.emit(ACTIONS.SEARCH_WHITELIST_RETURNED, token)
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  whitelistToken = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account")
      if (!account) {
        console.warn('account not found')
        return null
      }

      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }

      const { token, nft } = payload.content

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let whitelistTXID = this.getTXUUID()

      this.emitter.emit(ACTIONS.TX_ADDED, { title: `WHITELIST ${token.symbol}`, verb: 'Token Whitelisted', transactions: [
        {
          uuid: whitelistTXID,
          description: `Whitelisting ${token.symbol}`,
          status: 'WAITING'
        }
      ]})

      const gasPrice = await stores.accountStore.getGasPrice()

      // SUBMIT WHITELIST TRANSACTION
      const voterContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

      this._callContractWait(web3, voterContract, 'whitelist', [token.address, nft.id], account, gasPrice, null, null, whitelistTXID, async (err) => {
        if (err) {
          return this.emitter.emit(ACTIONS.ERROR, err)
        }

        window.setTimeout(() => {
          this.dispatcher.dispatch({ type: ACTIONS.SEARCH_WHITELIST, content: { search: token.address } })
        }, 2)

        this.emitter.emit(ACTIONS.WHITELIST_TOKEN_RETURNED)
      })
    } catch(ex) {
      console.error(ex)
      this.emitter.emit(ACTIONS.ERROR, ex)
    }
  }

  _callContractWait = (web3, contract, method, params, account, gasPrice, dispatchEvent, dispatchContent, uuid, callback, errorHandler, sendValue = null) => {
    if (!errorHandler) {
      // Error handler deals with errors in the first call to the contract
      // by default, it's a noop
      errorHandler = (error) => {throw error}
    }

    if (!callback) {
      // Callback deals with errors after computing gas and trying to write
      // and unhandled errors in the first call to the contract
      callback = console.error
    }

    //estimate gas
    this.emitter.emit(ACTIONS.TX_PENDING, { uuid })

    const gasCost = contract.methods[method](...params)
      .estimateGas({ from: account.address, value: sendValue })
      .then((gasAmount) => {
        const context = this

        let sendGasAmount = BigNumber(gasAmount).times(1.5).toFixed(0)
        let sendGasPrice = BigNumber(gasPrice).times(1.5).toFixed(0)
        
        
        contract.methods[method](...params)
          .send({
            from: account.address,
            gasPrice: web3.utils.toWei(sendGasPrice, 'gwei'),
            gas: sendGasAmount,
            value: sendValue,
            // maxFeePerGas: web3.utils.toWei(gasPrice, "gwei"),
            // maxPriorityFeePerGas: web3.utils.toWei("2", "gwei"),
          })
          .on("transactionHash", function (txHash) {
            context.emitter.emit(ACTIONS.TX_SUBMITTED, { uuid, txHash })
          })
          .on("receipt", function (receipt) {
            context.emitter.emit(ACTIONS.TX_CONFIRMED, { uuid, txHash: receipt.transactionHash })
            callback(null, receipt.transactionHash)
            if (dispatchEvent) {
              context.dispatcher.dispatch({ type: dispatchEvent, content: dispatchContent })
            }
          })
          .on("error", (error) => {
            if (!error.toString().includes("-32601")) {
              if (error.message) {
                context.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: error.message })
                return callback(error.message)
              }
              context.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: error })
              callback(error)
            }
          })
          .catch((error) => {
            if (!error.toString().includes("-32601")) {
              if (error.message) {
                context.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: error.message })
                return callback(error.message)
              }
              context.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: error })
              callback(error)
            }
          })
      })
      .catch(errorHandler)
      .catch((ex) => {
        if (ex.message) {
          this.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: ex.message })
          return callback(ex.message)
        }
        this.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: 'Error estimating gas' })
        callback(ex)
      })
  }

  _makeBatchRequest = (web3, callFrom, calls) => {
    let batch = new web3.BatchRequest();

    let promises = calls.map(call => {
      return new Promise((res, rej) => {
        let req = call.request({from: callFrom}, (err, data) => {
          if(err) rej(err);
          else res(data)
        });
        batch.add(req)
      })
    })
    batch.execute()

    return Promise.all(promises)
  }
  //
  // _getMulticallWatcher = (web3, calls) => {
  //
  // }
}

export default Store
