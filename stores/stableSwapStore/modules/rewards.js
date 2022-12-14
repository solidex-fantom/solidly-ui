import stores from "../../index";
import {ACTIONS, CONTRACTS} from "../../constants";
import BigNumber from "bignumber.js";
import bribe from "../../../pages/bribe";


async function getBribes(tokenID, pairs, web3) {
  pairs = JSON.parse(JSON.stringify(pairs))

  return await Promise.all(
    pairs
      .filter(pair => pair.gauge.wrapped_bribe_address)
      .map(async (pair) => {
        pair.gauge.bribesEarned = await Promise.all(
          pair.gauge.bribes.map(async (bribe) => {
            const bribeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, pair.gauge.wrapped_bribe_address)

            const [earned] = await Promise.all([
              bribeContract.methods.earned(bribe.token.address, tokenID).call(),
            ])

            bribe.earned = BigNumber(earned).div(10 ** bribe.token.decimals).toFixed(bribe.token.decimals)
            return bribe
          })
        )

        pair.rewardType = 'Bribe'

        return pair
      })
  ).then(pairs => pairs.filter(
          pair => pair.gauge &&
              pair.gauge.bribesEarned &&
              pair.gauge.bribesEarned.some(bribe => BigNumber(bribe.earned).gt(0))
      )
  )
}

async function getFees(context, tokenID, pairs, web3) {
  pairs = JSON.parse(JSON.stringify(pairs))

  return await Promise.all(
    pairs.map(async (pair) => {
      const this_ = context;

      const bribeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, pair.gauge.feesAddress)

      const rewardsListLength = await bribeContract.methods.rewardsListLength().call()
      const feesEarned = await Promise.all(
        Array.from(
        {length: rewardsListLength},
        (_, index) => bribeContract.methods.rewards(index).call()
        )
      )

      const assets = []
      let asset;
      for (let address of feesEarned) {
        asset = JSON.parse(JSON.stringify(await this_.getBaseAsset(address)));

        asset.earned = await bribeContract.methods.earned(asset.address, tokenID).call()
        asset.earned = BigNumber(asset.earned).div(10 ** pair.decimals).toFixed(pair.decimals)

        assets.push(asset)
      }

      pair.gauge.feesEarned = assets
      pair.rewardType = 'Fees'
      return pair
    })
  ).then(pairs => pairs.filter(
      pair => pair.gauge &&
        pair.gauge.feesEarned &&
        pair.gauge.feesEarned.some(fee => BigNumber(fee.earned).gt(0))
    )
  )
}

async function getDistribution(context, tokenID, web3) {
  const veToken = context.getStore('veToken')
  const govToken = context.getStore('govToken')

  const veDistContract = new web3.eth.Contract(CONTRACTS.VE_DIST_ABI, CONTRACTS.VE_DIST_ADDRESS)
  const veDistEarned = await veDistContract.methods.claimable(tokenID).call()
  const vestNFTs = context.getStore('vestNFTs')

  let theNFT = vestNFTs.filter((vestNFT) => {
    return (vestNFT.id == tokenID)
  })

  const veDistReward = []
  if(BigNumber(veDistEarned).gt(0)) {
    veDistReward.push({
      token: theNFT[0],
      lockToken: veToken,
      rewardToken: govToken,
      earned: BigNumber(veDistEarned).div(10**govToken.decimals).toFixed(govToken.decimals),
      rewardType: 'Distribution'
    })
  }

  return veDistReward;
}

async function getRewards(tokenID, account, pairs, web3) {
  pairs = JSON.parse(JSON.stringify(pairs))

  return await Promise.all(
      pairs.map(async (pair) => {

        const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address)

        const [ earned ] = await Promise.all([
          gaugeContract.methods.earned(CONTRACTS.GOV_TOKEN_ADDRESS, account.address).call(),
        ])

        pair.gauge.rewardsEarned = BigNumber(earned).div(10**18).toFixed(18)
        pair.rewardType = 'Reward'
        return pair
      })
  ).then(pairs => pairs.filter(
      pair => pair.gauge &&
        pair.gauge.rewardsEarned &&
        BigNumber(pair.gauge.rewardsEarned).gt(0)
    )
  )
}

export async function getRewardBalances(payload) {
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

    const filteredPairs = [...pairs.filter((pair) => {
      return pair && pair.gauge
    })]

    let distributionEarned = []
    let bribesEarned = []
    let feesEarned = []

    if(tokenID) {
      bribesEarned = await getBribes(tokenID, filteredPairs, web3);
      distributionEarned = await getDistribution(this, tokenID, web3)
      feesEarned = await getFees(this, tokenID, filteredPairs, web3);
    }

    const rewardsEarned = await getRewards(tokenID, account, filteredPairs, web3);

    const rewards = {
      bribes: bribesEarned,
      fees: feesEarned,
      rewards: rewardsEarned,
      veDist: distributionEarned
    }

    this.setStore({
      rewards
    })

    this.emitter.emit(ACTIONS.REWARD_BALANCES_RETURNED, rewards)
  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function claimBribes(payload) {
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

    const { pair, tokenID } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = this.getTXUUID()

    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`, verb: 'Rewards Claimed', transactions: [
        {
          uuid: claimTXID,
          description: `Claiming your bribes`,
          status: 'WAITING'
        }
      ]})

    const gasPrice = await stores.accountStore.getGasPrice()

    // SUBMIT CLAIM TRANSACTION
    const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

    const sendGauges = [ pair.gauge.bribeAddress ]
    const sendTokens = [ pair.gauge.bribesEarned.map((bribe) => {
      return bribe.token.address
    }) ]

    this._callContractWait(web3, gaugesContract, 'claimBribes', [sendGauges, sendTokens, tokenID], account, gasPrice, null, null, claimTXID, async (err) => {
      if (err) {
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      this.getRewardBalances({ content: { tokenID } })
      this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED)
    })
  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function claimAllRewards(payload) {
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

    const { pairs, tokenID } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = this.getTXUUID()
    let feeClaimTXIDs = []
    let rewardClaimTXIDs = []
    let distributionClaimTXIDs = []


    let bribePairs = pairs.filter((pair) => {
      return pair.rewardType === 'Bribe'
    })

    let feePairs = pairs.filter((pair) => {
      return pair.rewardType === 'Fees'
    })

    let rewardPairs = pairs.filter((pair) => {
      return pair.rewardType === 'Reward'
    })

    let distribution = pairs.filter((pair) => {
      return pair.rewardType === 'Distribution'
    })

    const sendGauges = bribePairs.map((pair) => {
      return pair.gauge.bribeAddress
    })
    const sendTokens = bribePairs.map((pair) => {
      return pair.gauge.bribesEarned.map((bribe) => {
        return bribe.token.address
      })
    })

    if(bribePairs.length == 0 && feePairs.length == 0 && rewardPairs.length == 0) {
      this.emitter.emit(ACTIONS.ERROR, 'Nothing to claim')
      this.emitter.emit(ACTIONS.CLAIM_ALL_REWARDS_RETURNED)
      return
    }

    let sendOBJ = { title: `Claim all rewards`, verb: 'Rewards Claimed', transactions: [ ]}

    if(bribePairs.length > 0) {
      sendOBJ.transactions.push({
        uuid: claimTXID,
        description: `Claiming all your available bribes`,
        status: 'WAITING'
      })
    }

    if(feePairs.length > 0) {
      for(let i = 0; i < feePairs.length; i++) {
        const newClaimTX = this.getTXUUID()

        feeClaimTXIDs.push(newClaimTX)
        sendOBJ.transactions.push({
          uuid: newClaimTX,
          description: `Claiming fees for ${feePairs[i].symbol}`,
          status: 'WAITING'
        })
      }
    }

    if(rewardPairs.length > 0) {
      for(let i = 0; i < rewardPairs.length; i++) {
        const newClaimTX = this.getTXUUID()

        rewardClaimTXIDs.push(newClaimTX)
        sendOBJ.transactions.push({
          uuid: newClaimTX,
          description: `Claiming reward for ${rewardPairs[i].symbol}`,
          status: 'WAITING'
        })
      }
    }

    if(distribution.length > 0) {
      for(let i = 0; i < distribution.length; i++) {
        const newClaimTX = this.getTXUUID()

        distributionClaimTXIDs.push(newClaimTX)
        sendOBJ.transactions.push({
          uuid: newClaimTX,
          description: `Claiming distribution for NFT #${distribution[i].token.id}`,
          status: 'WAITING'
        })
      }
    }

    this.emitter.emit(ACTIONS.TX_ADDED, sendOBJ)

    const gasPrice = await stores.accountStore.getGasPrice()

    if(bribePairs.length > 0) {
      // SUBMIT CLAIM TRANSACTION
      const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

      const claimPromise = new Promise((resolve, reject) => {
        context._callContractWait(web3, gaugesContract, 'claimBribes', [sendGauges, sendTokens, tokenID], account, gasPrice, null, null, claimTXID, (err) => {
          if (err) {
            reject(err)
            return
          }

          resolve()
        })
      })

      await Promise.all([claimPromise])
    }

    if(feePairs.length > 0) {
      for(let i = 0; i < feePairs.length; i++) {
        const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

        const sendGauges = [ pair.gauge.feeAddress ]
        const sendTokens = [ pair.gauge.feesEarned.map((fee) => {
          return fee.token.address
        }) ]

        this._callContractWait(web3, gaugesContract, 'claimFees', [sendGauges, sendTokens, tokenID], account, gasPrice, null, null, feeClaimTXIDs[i], (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err)
          }

          this.getRewardBalances({ content: { tokenID } })
          this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED)
        })
        // const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, feePairs[i].address)

        // const claimPromise = new Promise((resolve, reject) => {
        //   context._callContractWait(web3, pairContract, 'claimFees', [], account, gasPrice, null, null, feeClaimTXIDs[i], (err) => {
        //     if (err) {
        //       reject(err)
        //       return
        //     }

        //     resolve()
        //   })
        // })

        await Promise.all([claimPromise])
      }
    }

    if(rewardPairs.length > 0) {
      for(let i = 0; i < rewardPairs.length; i++) {
        const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, rewardPairs[i].gauge.address)
        const sendTok = [ CONTRACTS.GOV_TOKEN_ADDRESS ]

        const rewardPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, gaugeContract, 'getReward', [account.address, sendTok], account, gasPrice, null, null, rewardClaimTXIDs[i], (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        await Promise.all([rewardPromise])
      }
    }

    if(distribution.length > 0) {
      const veDistContract = new web3.eth.Contract(CONTRACTS.VE_DIST_ABI, CONTRACTS.VE_DIST_ADDRESS)
      for(let i = 0; i < distribution.length; i++) {

        const rewardPromise = new Promise((resolve, reject) => {
          context._callContractWait(web3, veDistContract, 'claim', [tokenID], account, gasPrice, null, null, distributionClaimTXIDs[i], (err) => {
            if (err) {
              reject(err)
              return
            }

            resolve()
          })
        })

        await Promise.all([rewardPromise])
      }
    }

    this.getRewardBalances({ content: { tokenID } })
    this.emitter.emit(ACTIONS.CLAIM_ALL_REWARDS_RETURNED)

  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function claimRewards(payload) {
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

    const { pair, tokenID } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = this.getTXUUID()

    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`, verb: 'Rewards Claimed', transactions: [
        {
          uuid: claimTXID,
          description: `Claiming your rewards`,
          status: 'WAITING'
        }
      ]})

    const gasPrice = await stores.accountStore.getGasPrice()

    // SUBMIT CLAIM TRANSACTION
    const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address)

    const sendTokens = [ CONTRACTS.GOV_TOKEN_ADDRESS ]

    this._callContractWait(web3, gaugeContract, 'getReward', [account.address, sendTokens], account, gasPrice, null, null, claimTXID, async (err) => {
      if (err) {
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      this.getRewardBalances({ content: { tokenID } })
      this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED)
    })
  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function claimVeDist(payload) {
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

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = this.getTXUUID()

    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Claim distribution for NFT #${tokenID}`, verb: 'Rewards Claimed', transactions: [
        {
          uuid: claimTXID,
          description: `Claiming your distribution`,
          status: 'WAITING'
        }
      ]})

    const gasPrice = await stores.accountStore.getGasPrice()

    // SUBMIT CLAIM TRANSACTION
    const veDistContract = new web3.eth.Contract(CONTRACTS.VE_DIST_ABI, CONTRACTS.VE_DIST_ADDRESS)

    this._callContractWait(web3, veDistContract, 'claim', [tokenID], account, gasPrice, null, null, claimTXID, async (err) => {
      if (err) {
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      this.getRewardBalances({ content: { tokenID } })
      this.emitter.emit(ACTIONS.CLAIM_VE_DIST_RETURNED)
    })
  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function claimPairFees(payload) {
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

    const { pair, tokenID } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = this.getTXUUID()

    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Claim fees for ${pair.token0.symbol}/${pair.token1.symbol}`, verb: 'Fees Claimed', transactions: [
        {
          uuid: claimTXID,
          description: `Claiming your fees`,
          status: 'WAITING'
        }
      ]})

    const gasPrice = await stores.accountStore.getGasPrice()

    // SUBMIT CLAIM TRANSACTION
    const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS)

    const sendGauges = [ pair.gauge.feesAddress ]
    const sendTokens = [ pair.gauge.feesEarned.map((fee) => {
      return fee.address
    }) ]

    this._callContractWait(web3, gaugesContract, 'claimFees', [sendGauges, sendTokens, tokenID], account, gasPrice, null, null, claimTXID, async (err) => {
      if (err) {
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      this.getRewardBalances({ content: { tokenID } })
      this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED)
    })

    // SUBMIT CLAIM TRANSACTION (OLD)
    // const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pair.address)

    // this._callContractWait(web3, pairContract, 'claimFees', [], account, gasPrice, null, null, claimTXID, async (err) => {
    //   if (err) {
    //     return this.emitter.emit(ACTIONS.ERROR, err)
    //   }

    //   this.getRewardBalances({ content: { tokenID } })
    //   this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED)
    // })
  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}
