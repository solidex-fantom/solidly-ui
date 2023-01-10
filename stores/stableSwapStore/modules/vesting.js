import stores from "../../index";
import {ACTIONS, CONTRACTS, MAX_UINT256} from "../../constants";
import BigNumber from "bignumber.js";
import * as moment from "moment/moment";


async function _getVestAllowance(web3, token, account) {
  try {
    const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token.address)
    const allowance = await tokenContract.methods.allowance(account.address, CONTRACTS.VE_TOKEN_ADDRESS).call()
    return BigNumber(allowance).div(10**token.decimals).toFixed(token.decimals)
  } catch (ex) {
    console.error(ex)
    return null
  }
}


async function _updateVestNFTByID(context, id) {
  try {
    const vestNFTs = context.getStore('vestNFTs')
    let theNFT = vestNFTs.filter((vestNFT) => {
      return (vestNFT.id == id)
    })

    if(theNFT.length == 0) {
      return null
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

    const veToken = context.getStore('veToken')
    const govToken = context.getStore('govToken')

    const vestingContract = new web3.eth.Contract(CONTRACTS.VE_TOKEN_ABI, CONTRACTS.VE_TOKEN_ADDRESS)

    const locked = await vestingContract.methods.locked(id).call()
    const lockValue = await vestingContract.methods.balanceOfNFT(id).call()

    const newVestNFTs = vestNFTs.map((nft) => {
      if(nft.id == id) {
        return {
          id: id,
          lockEnds: locked.end,
          lockAmount: BigNumber(locked.amount).div(10**govToken.decimals).toFixed(govToken.decimals),
          lockValue: BigNumber(lockValue).div(10**veToken.decimals).toFixed(veToken.decimals)
        }
      }

      return nft
    })

    context.setStore({ vestNFTs: newVestNFTs })
    context.emitter.emit(ACTIONS.UPDATED)
    return null
  } catch(ex) {
    console.error(ex)
    return null
  }
}


export async function withdrawVest(payload) {
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
    const { tokenID } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let vestTXID = this.getTXUUID()
    let resetTXID = this.getTXUUID()

    const gasPrice = await stores.accountStore.getGasPrice()

    // SUBMIT INCREASE TRANSACTION
    const veTokenContract = new web3.eth.Contract(CONTRACTS.VE_TOKEN_ABI, CONTRACTS.VE_TOKEN_ADDRESS)

    let voted;

    try {
      voted = await veTokenContract.methods.voted(tokenID).call()
    } catch (err) {
      console.error(err)
      this.emitter.emit(ACTIONS.ERROR, "Couldn't check if veNFT is voted")
    }

    const transactions = [
      {
        uuid: vestTXID,
        description: `Withdrawing your expired tokens`,
        status: 'WAITING'
      }
    ]

    if (voted) {
      transactions.splice(0, 0, {
        uuid: resetTXID,
        description: 'Resetting voted tokens',
        status: 'WAITING'
      })
    }

    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Withdraw vest amount on token #${tokenID}`, type: 'Vest', verb: 'Vest Withdrawn', transactions})

    if (voted) {
      const voterContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS);
      await new Promise((resolve, reject) => {
        this._callContractWait(web3, voterContract, 'reset', [tokenID], account, gasPrice, null, null, resetTXID, err => {
          if (err) {
            reject()
            return
          }
          resolve()
        })
      })
    }

    this._callContractWait(web3, veTokenContract, 'withdraw', [tokenID], account, gasPrice, null, null, vestTXID, (err) => {
      if (err) {
        const errString = err.message || err.toString()
        if (errString.includes("attached")) {
          err = (
              "There are LP positions attached to this veNFT. "+
              "Please claim any remaining rewards for these LP positions "+
              "and unstake/withdraw the LP, then proceed"
          )
        }
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      _updateVestNFTByID(this, tokenID)

      this.emitter.emit(ACTIONS.WITHDRAW_VEST_RETURNED)
    })

  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function getVestNFTs(payload) {
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
    const govToken = this.getStore('govToken')

    if (!govToken) return;

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
    this.emitter.emit(ACTIONS.VEST_NFTS_RETURNED, nfts)

  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function createVest(payload) {
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
    const { amount, unlockTime } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowanceTXID = this.getTXUUID()
    let vestTXID = this.getTXUUID()

    const unlockString = moment().add(unlockTime, 'seconds').format('DD/MM/YYYY')
    

    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Vest ${govToken.symbol} until ${unlockString}`, type: 'Vest', verb: 'Vest Created', transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${govToken.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: vestTXID,
          description: `Vesting your tokens`,
          status: 'WAITING'
        }
      ]})


    // CHECK ALLOWANCES AND SET TX DISPLAY
    const allowance = await _getVestAllowance(web3, govToken, account)

    if(BigNumber(allowance).lt(amount)) {
      this.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allow the vesting contract to use your ${govToken.symbol}`
      })
    } else {
      this.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${govToken.symbol} sufficient`,
        status: 'DONE'
      })
    }

    const gasPrice = await stores.accountStore.getGasPrice()

    const allowanceCallsPromises = []

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if(BigNumber(allowance).lt(amount)) {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, govToken.address)

      const tokenPromise = new Promise((resolve, reject) => {
        this._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.VE_TOKEN_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowanceTXID, (err) => {
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

    // SUBMIT VEST TRANSACTION
    const sendAmount = BigNumber(amount).times(10**govToken.decimals).toFixed(0)

    const veTokenContract = new web3.eth.Contract(CONTRACTS.VE_TOKEN_ABI, CONTRACTS.VE_TOKEN_ADDRESS)

    this._callContractWait(web3, veTokenContract, 'create_lock', [sendAmount, unlockTime+''], account, gasPrice, null, null, vestTXID, (err) => {
      if (err) {
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      this._getGovTokenInfo(web3, account)
      this.getNFTByID('fetchAll')

      this.emitter.emit(ACTIONS.CREATE_VEST_RETURNED)
    })

  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function increaseVestAmount(payload) {
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
    const { amount, tokenID } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowanceTXID = this.getTXUUID()
    let vestTXID = this.getTXUUID()

    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Increase vest amount on token #${tokenID}`, type: 'Vest', verb: 'Vest Increased', transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${govToken.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: vestTXID,
          description: `Increasing your vest amount`,
          status: 'WAITING'
        }
      ]})


    // CHECK ALLOWANCES AND SET TX DISPLAY
    const allowance = await _getVestAllowance(web3, govToken, account)

    if(BigNumber(allowance).lt(amount)) {
      this.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allow vesting contract to use your ${govToken.symbol}`
      })
    } else {
      this.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${govToken.symbol} sufficient`,
        status: 'DONE'
      })
    }

    const gasPrice = await stores.accountStore.getGasPrice()

    const allowanceCallsPromises = []

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if(BigNumber(allowance).lt(amount)) {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, govToken.address)

      const tokenPromise = new Promise((resolve, reject) => {
        this._callContractWait(web3, tokenContract, 'approve', [CONTRACTS.VE_TOKEN_ADDRESS, MAX_UINT256], account, gasPrice, null, null, allowanceTXID, (err) => {
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

    // SUBMIT INCREASE TRANSACTION
    const sendAmount = BigNumber(amount).times(10**govToken.decimals).toFixed(0)

    const veTokenContract = new web3.eth.Contract(CONTRACTS.VE_TOKEN_ABI, CONTRACTS.VE_TOKEN_ADDRESS)

    this._callContractWait(web3, veTokenContract, 'increase_amount', [tokenID, sendAmount], account, gasPrice, null, null, vestTXID, (err) => {
      if (err) {
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      this._getGovTokenInfo(web3, account)
      _updateVestNFTByID(this, tokenID)

      this.emitter.emit(ACTIONS.INCREASE_VEST_AMOUNT_RETURNED)
    })

  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function increaseVestDuration(payload) {
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
    const { tokenID, unlockTime } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let vestTXID = this.getTXUUID()

    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Increase unlock time on token #${tokenID}`, type: 'Vest', verb: 'Vest Increased', transactions: [
        {
          uuid: vestTXID,
          description: `Increasing your vest duration`,
          status: 'WAITING'
        }
      ]})


    const gasPrice = await stores.accountStore.getGasPrice()

    // SUBMIT INCREASE TRANSACTION
    const veTokenContract = new web3.eth.Contract(CONTRACTS.VE_TOKEN_ABI, CONTRACTS.VE_TOKEN_ADDRESS)

    this._callContractWait(web3, veTokenContract, 'increase_unlock_time', [tokenID, unlockTime+''], account, gasPrice, null, null, vestTXID, (err) => {
      if (err) {
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      _updateVestNFTByID(this, tokenID)

      this.emitter.emit(ACTIONS.INCREASE_VEST_DURATION_RETURNED)
    })

  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}