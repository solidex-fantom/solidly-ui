import stores from "../../index";
import {ACTIONS, CONTRACTS, MAX_UINT256, ROUTE_MAX_LENGTH} from "../../constants";
import BigNumber from "bignumber.js";
import {formatCurrency} from "../../../utils";
import * as moment from "moment/moment";

function quoteForWETH(context, from, to, amount) {
  context.emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, {
    inputs: {
      fromAmount: amount,
      fromAsset: from,
      toAsset: to
    },
    output: {
      routes: [{
        from: from,
        to: to,
        stable: true
      }],
      routeAsset: null,
      finalValue: amount,
    },
    priceImpact: 0
  })
}

function isWETHSwap(from, to) {
  const addresses = [CONTRACTS.WKAVA_ADDRESS, CONTRACTS.KAVA_ADDRESS].map(addr => addr.toLowerCase());

  return (
      addresses.includes(to.address.toLowerCase()) &&
      addresses.includes(from.address.toLowerCase())
  )
}

function _computeRoutesForToken(fromAddress, toAddress, pairs, maxLength, currentPath, allPaths) {
  for (let pair of pairs) {
    if (
        currentPath.indexOf(pair.address) !== -1 ||
        !(pair.token0?.address === fromAddress || pair.token1?.address === fromAddress)
    ) continue;

    const newFromAddress = pair.token0.address === fromAddress ? pair.token1.address : pair.token0.address;

    if (newFromAddress === toAddress) {
      allPaths.push([...currentPath, pair])
    } else if (maxLength > 1) {
      _computeRoutesForToken(
          newFromAddress,
          toAddress,
          pairs,
          maxLength - 1,
          [...currentPath, pair],
          allPaths
      )
    }
  }
}

function discoverRoutesForTokens(pairs, from, to) {
  const paths = []

  _computeRoutesForToken(
      from.address,
      to.address,
      pairs,
      ROUTE_MAX_LENGTH,
      [],
      paths
  )

  const routes = []
  let fromAsset, toAsset, route, routeRich;

  for (let path of paths) {
    fromAsset = from;
    route = []
    routeRich = []
    for (let step of path) {
      toAsset = step.token0.address === fromAsset.address ? step.token1 : step.token0
      route.push({
        from: fromAsset.address,
        to: toAsset.address,
        stable: step.stable
      })
      routeRich.push({
        from: fromAsset,
        to: toAsset,
        stable: step.stable
      })
      fromAsset = toAsset
    }
    routes.push({raw: route, rich: routeRich})
  }

  return routes;
}


async function _getSwapAllowance(web3, token, account) {
  try {
    const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token.address)
    const allowance = await tokenContract.methods.allowance(account.address, CONTRACTS.ROUTER_ADDRESS).call()
    return BigNumber(allowance).div(10**token.decimals).toFixed(token.decimals)
  } catch (ex) {
    console.error(ex)
    return null
  }
}

export async function quoteSwap(payload) {
  try {
    const web3 = await stores.accountStore.getWeb3Provider()
    if (!web3) {
      console.warn('web3 not found')
      return null
    }

    // some path logic. Have a base asset (KAVA) modules from start asset to KAVA, modules from KAVA back to out asset. Don't know.
    const pairs = this.getStore('pairs')
    const { fromAsset, toAsset, fromAmount } = payload.content

    const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS)
    const sendFromAmount = BigNumber(fromAmount).times(10**fromAsset.decimals).toFixed()

    if (!fromAsset || !toAsset || !fromAmount || !fromAsset.address || !toAsset.address || fromAmount === '') {
      return null
    }

    if (isWETHSwap(fromAsset, toAsset)) {
      return quoteForWETH(this, fromAsset, toAsset, fromAmount);
    }

    let addy0 = fromAsset.address
    let addy1 = toAsset.address

    if(fromAsset.address === CONTRACTS.KAVA_ADDRESS || toAsset.address === CONTRACTS.KAVA_ADDRESS) {
      return this.emitter.emit(ACTIONS.ERROR, 'No valid route found to complete modules')
    }

    const routes = discoverRoutesForTokens(pairs, fromAsset, toAsset)
    const amountsOut = []

    const multicall = await stores.accountStore.getMulticall()
    const receiveAmounts = await multicall.aggregate(routes.map((route) => {
      return routerContract.methods.getAmountsOut(sendFromAmount, route.raw)
    }))

    for(let i = 0; i < receiveAmounts.length; i++) {
      amountsOut.push({
        receiveAmounts: receiveAmounts[i],
        finalValue: BigNumber(receiveAmounts[i][receiveAmounts[i].length - 1])
            .div(10 ** toAsset.decimals)
            .toFixed(toAsset.decimals),
        routes: routes[i].rich,
        raw: routes[i].raw,
      })
    }

    const bestAmountOut = amountsOut.filter((ret) => {
      return ret != null
    }).reduce((best, current) => {
      if(!best) {
        return current
      }
      return (BigNumber(best.finalValue).gt(current.finalValue) ? best : current)
    }, 0)

    if(!bestAmountOut) {
      this.emitter.emit(ACTIONS.ERROR, 'No valid route found to complete modules')
      return null
    }

    const libraryContract = new web3.eth.Contract(CONTRACTS.LIBRARY_ABI, CONTRACTS.LIBRARY_ADDRESS)
    let totalRatio = 1

    for(let i = 0; i < bestAmountOut.raw.length; i++) {
      let amountIn = bestAmountOut.receiveAmounts[i]

      const res = await libraryContract.methods.getTradeDiff(amountIn, bestAmountOut.raw[i].from, bestAmountOut.raw[i].to, bestAmountOut.raw[i].stable).call()

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
          description: `Swap ${fromAsset.symbol} for ${toAsset.symbol}`,
          status: 'WAITING'
        }
      ]})

    let allowance = 0

    // CHECK ALLOWANCES AND SET TX DISPLAY
    if(fromAsset.address !== 'KAVA') {
      allowance = await _getSwapAllowance(web3, fromAsset, account)

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
    let params = [sendFromAmount, sendMinAmountOut, quote.output.raw, account.address, deadline]
    let sendValue = null

    if(fromAsset.address === 'KAVA') {
      func = 'swapExactETHForTokens'
      params = [sendMinAmountOut, quote.output.raw, account.address, deadline]
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
