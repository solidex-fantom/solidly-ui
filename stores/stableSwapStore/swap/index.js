import stores from "../../index";
import {ACTIONS, CONTRACTS, MAX_UINT256} from "../../constants";
import BigNumber from "bignumber.js";
import {formatCurrency} from "../../../utils";
import * as moment from "moment/moment";

export async function quoteSwap(payload) {
  try {
    const web3 = await stores.accountStore.getWeb3Provider()
    if (!web3) {
      console.warn('web3 not found')
      return null
    }

    // some path logic. Have a base asset (KAVA) swap from start asset to KAVA, swap from KAVA back to out asset. Don't know.
    const routeAssets = this.getStore('routeAssets')
    const { fromAsset, toAsset, fromAmount } = payload.content

    const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)
    const sendFromAmount = BigNumber(fromAmount).times(10**fromAsset.decimals).toFixed()

    if (!fromAsset || !toAsset || !fromAmount || !fromAsset.address || !toAsset.address || fromAmount === '') {
      return null
    }

    let addy0 = fromAsset.address
    let addy1 = toAsset.address

    if(fromAsset.address === 'KAVA') {
      addy0 = CONTRACTS.WKAVA_ADDRESS
    }
    if(toAsset.address === 'KAVA') {
      addy1 = CONTRACTS.WKAVA_ADDRESS
    }

    const includesRouteAddress = routeAssets.filter((asset) => {
      return (asset.address.toLowerCase() == addy0.toLowerCase() || asset.address.toLowerCase() == addy1.toLowerCase())
    })

    let amountOuts = []

    if(includesRouteAddress.length === 0) {
      amountOuts = routeAssets.map((routeAsset) => {
        return [
          {
            routes: [{
              from: addy0,
              to: routeAsset.address,
              stable: true
            },{
              from: routeAsset.address,
              to: addy1,
              stable: true
            }],
            routeAsset: routeAsset
          },
          {
            routes: [{
              from: addy0,
              to: routeAsset.address,
              stable: false
            },{
              from: routeAsset.address,
              to: addy1,
              stable: false
            }],
            routeAsset: routeAsset
          },
          {
            routes: [{
              from: addy0,
              to: routeAsset.address,
              stable: true
            },{
              from: routeAsset.address,
              to: addy1,
              stable: false
            }],
            routeAsset: routeAsset
          },
          {
            routes: [{
              from: addy0,
              to: routeAsset.address,
              stable: false
            },{
              from: routeAsset.address,
              to: addy1,
              stable: true
            }],
            routeAsset: routeAsset
          }
        ]
      }).flat()
    }

    amountOuts.push({
      routes: [{
        from: addy0,
        to: addy1,
        stable: true
      }],
      routeAsset: null
    })

    amountOuts.push({
      routes: [{
        from: addy0,
        to: addy1,
        stable: false
      }],
      routeAsset: null
    })

    console.log("amountsOut:", amountOuts)
    const multicall = await stores.accountStore.getMulticall()
    const receiveAmounts = await multicall.aggregate(amountOuts.map((route) => {
      return routerContract.methods.getAmountsOut(sendFromAmount, route.routes)
    }))

    console.log("receiveAmounts",receiveAmounts)

    for(let i = 0; i < receiveAmounts.length; i++) {
      amountOuts[i].receiveAmounts = receiveAmounts[i]
      amountOuts[i].finalValue = BigNumber(receiveAmounts[i][receiveAmounts[i].length-1]).div(10**toAsset.decimals).toFixed(toAsset.decimals)
    }

    const bestAmountOut = amountOuts.filter((ret) => {
      return ret != null
    }).reduce((best, current) => {
      if(!best) {
        return current
      }
      return (BigNumber(best.finalValue).gt(current.finalValue) ? best : current)
    }, 0)

    if(!bestAmountOut) {
      this.emitter.emit(ACTIONS.ERROR, 'No valid route found to complete swap')
      return null
    }

    const libraryContract = new web3.eth.Contract(CONTRACTS.LIBRARY_ABI, CONTRACTS.LIBRARY_ADDRESS)
    let totalRatio = 1

    for(let i = 0; i < bestAmountOut.routes.length; i++) {
      let amountIn = bestAmountOut.receiveAmounts[i]
      let amountOut = bestAmountOut.receiveAmounts[i+1]

      const res = await libraryContract.methods.getTradeDiff(amountIn, bestAmountOut.routes[i].from, bestAmountOut.routes[i].to, bestAmountOut.routes[i].stable).call()

      const ratio = BigNumber(res.b).div(res.a)
      totalRatio = BigNumber(totalRatio).times(ratio).toFixed(18)
    }

    const priceImpact = BigNumber(1).minus(totalRatio).times(100).toFixed(18)

    const returnValue = {
      inputs: {
        fromAmount: fromAmount,
        fromAsset: fromAsset,
        toAsset: toAsset
      },
      output: bestAmountOut,
      priceImpact: priceImpact
    }

    this.emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, returnValue)

  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, null)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}

export async function swap(payload) {
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

    const { fromAsset, toAsset, fromAmount, toAmount, quote, slippage } = payload.content

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowanceTXID = this.getTXUUID()
    let swapTXID = this.getTXUUID()


    this.emitter.emit(ACTIONS.TX_ADDED, { title: `Swap ${fromAsset.symbol} for ${toAsset.symbol}`, type: 'Swap', verb: 'Swap Successful', transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${fromAsset.symbol} allowance`,
          status: 'WAITING'
        },
        {
          uuid: swapTXID,
          description: `Swap ${formatCurrency(fromAmount)} ${fromAsset.symbol} for ${toAsset.symbol}`,
          status: 'WAITING'
        }
      ]})

    let allowance = 0

    // CHECK ALLOWANCES AND SET TX DISPLAY
    if(fromAsset.address !== 'KAVA') {
      allowance = await this._getSwapAllowance(web3, fromAsset, account)

      if(BigNumber(allowance).lt(fromAmount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the router to spend your ${fromAsset.symbol}`
        })
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${fromAsset.symbol} sufficient`,
          status: 'DONE'
        })
      }
    } else {
      allowance = MAX_UINT256
      this.emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${fromAsset.symbol} sufficient`,
        status: 'DONE'
      })
    }


    const gasPrice = await stores.accountStore.getGasPrice()

    const allowanceCallsPromises = []

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if(BigNumber(allowance).lt(fromAmount)) {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, fromAsset.address)

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

    // SUBMIT SWAP TRANSACTION
    const sendSlippage = BigNumber(100).minus(slippage).div(100)
    const sendFromAmount = BigNumber(fromAmount).times(10**fromAsset.decimals).toFixed(0)
    const sendMinAmountOut = BigNumber(quote.output.finalValue).times(10**toAsset.decimals).times(sendSlippage).toFixed(0)
    const deadline = ''+moment().add(600, 'seconds').unix()

    const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)


    let func = 'swapExactTokensForTokens'
    let params = [sendFromAmount, sendMinAmountOut, quote.output.routes, account.address, deadline]
    let sendValue = null

    if(fromAsset.address === 'KAVA') {
      func = 'swapExactETHForTokens'
      params = [sendMinAmountOut, quote.output.routes, account.address, deadline]
      sendValue = sendFromAmount
    }
    if(toAsset.address === 'KAVA') {
      func = 'swapExactTokensForETH'
    }

    this._callContractWait(web3, routerContract, func, params, account, gasPrice, null, null, swapTXID, (err) => {
      if (err) {
        return this.emitter.emit(ACTIONS.ERROR, err)
      }

      this._getSpecificAssetInfo(web3, account, fromAsset.address)
      this._getSpecificAssetInfo(web3, account, toAsset.address)
      this._getPairInfo(web3, account)

      this.emitter.emit(ACTIONS.SWAP_RETURNED)
    }, null, sendValue)

  } catch(ex) {
    console.error(ex)
    this.emitter.emit(ACTIONS.ERROR, ex)
  }
}
