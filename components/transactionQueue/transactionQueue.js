import React, { useState, useEffect, useRef } from "react";
import { Typography, Button, CircularProgress, DialogContent, Dialog, Slide, IconButton } from "@material-ui/core";
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CloseIcon from '@material-ui/icons/Close';

import Lottie from "lottie-react";
import successAnim from "../../public/lottiefiles/successAnim.json";
import swapSuccessAnim from "../../public/lottiefiles/swapSuccess.json";
import lockSuccessAnim from "../../public/lottiefiles/lockSuccess.json";
import pairSuccessAnim from "../../public/lottiefiles/pairSuccess.json";

import Transaction from './transaction'

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

import classes from './transactionQueue.module.css';
import stores from '../../stores'
import { ACTIONS, ETHERSCAN_URL } from '../../stores/constants';

export default function TransactionQueue({ setQueueLength }) {

  const [open, setOpen] = useState(false)
  const [ transactions, setTransactions ] = useState([])
  const [ purpose, setPurpose ] = useState(null)
  const [ type, setType ] = useState(null)
  const [ action, setAction ] = useState(null)

  const handleClose = () => {
    setOpen(false);
  };

  const fullScreen = window.innerWidth < 576;

  useEffect(() => {
    const clearTransactions = () => {
      setTransactions([])
      setQueueLength(0)
    }

    const openQueue = () => {
      setOpen(true)
    }

    const transactionAdded = (params) => {
      setPurpose(params.title)
      setType(params.type)
      setAction(params.verb)
      setOpen(true)
      const txs = [...params.transactions]
      setTransactions(txs)

      setQueueLength(params.transactions.length)
    }

    const transactionPending = (params) => {
      let txs = transactions.map((tx) => {
        if(tx.uuid === params.uuid) {
          tx.status = 'PENDING'
          tx.description = params.description ? params.description : tx.description
        }
        return tx
      })
      setTransactions(txs)
    }

    const transactionSubmitted = (params) => {
      let txs = transactions.map((tx) => {
        if(tx.uuid === params.uuid) {
          tx.status = 'SUBMITTED'
          tx.txHash = params.txHash
          tx.description = params.description ? params.description : tx.description
        }
        return tx
      })
      setTransactions(txs)
    }

    const transactionConfirmed = (params) => {
      let txs = transactions.map((tx) => {
        if(tx.uuid === params.uuid) {
          tx.status = 'CONFIRMED'
          tx.txHash = params.txHash
          tx.description = params.description ? params.description : tx.description
        }
        return tx
      })
      setTransactions(txs)
    }

    const transactionRejected = (params) => {
      let txs = transactions.map((tx) => {
        if(tx.uuid === params.uuid) {
          tx.status = 'REJECTED'
          tx.description = params.description ? params.description : tx.description
          tx.error = params.error
        }
        return tx
      })
      setTransactions(txs)
    }

    const transactionStatus = (params) => {
      let txs = transactions.map((tx) => {
        if(tx.uuid === params.uuid) {
          tx.status = params.status ? params.status : tx.status
          tx.description = params.description ? params.description : tx.description
        }
        return tx
      })
      setTransactions(txs)
    }

    stores.emitter.on(ACTIONS.CLEAR_TRANSACTION_QUEUE, clearTransactions)
    stores.emitter.on(ACTIONS.TX_ADDED, transactionAdded)
    stores.emitter.on(ACTIONS.TX_PENDING, transactionPending)
    stores.emitter.on(ACTIONS.TX_SUBMITTED, transactionSubmitted)
    stores.emitter.on(ACTIONS.TX_CONFIRMED, transactionConfirmed)
    stores.emitter.on(ACTIONS.TX_REJECTED, transactionRejected)
    stores.emitter.on(ACTIONS.TX_STATUS, transactionStatus)
    stores.emitter.on(ACTIONS.TX_OPEN, openQueue)

    return () => {
      stores.emitter.removeListener(ACTIONS.CLEAR_TRANSACTION_QUEUE, clearTransactions)
      stores.emitter.removeListener(ACTIONS.TX_ADDED, transactionAdded)
      stores.emitter.removeListener(ACTIONS.TX_PENDING, transactionPending)
      stores.emitter.removeListener(ACTIONS.TX_SUBMITTED, transactionSubmitted)
      stores.emitter.removeListener(ACTIONS.TX_CONFIRMED, transactionConfirmed)
      stores.emitter.removeListener(ACTIONS.TX_REJECTED, transactionRejected)
      stores.emitter.removeListener(ACTIONS.TX_STATUS, transactionStatus)
      stores.emitter.removeListener(ACTIONS.TX_OPEN, openQueue)
    };
  }, [transactions]);

  const renderDone = (txs) => {
    if(!(transactions && transactions.filter((tx) => { return ['DONE', 'CONFIRMED'].includes(tx.status) }).length === transactions.length)) {
      return null
    }

    let lottie = <img src="/images/Equilibot.png" className={classes.warningIcon} />

    if(type === 'Liquidity') 
      lottie = <img src="/images/Toboganes_7.png" className={classes.warningIcon} />
    
    else if (type === 'Swap') 
      lottie = <img src="/images/Balls_at_balance_-_Graphic.png" className={classes.warningIcon} />
    
    else if (type === 'Vest') 
      lottie = <img src="/images/Rainbow_clock_4.png" className={classes.warningIcon} />
    

    return (
      <div className={classes.successDialog}>
        { lottie }
        <Typography className={ classes.successTitle }>{ action ? action : 'Transaction Successful' }</Typography>        
        {
          txs && txs.length > 0 && txs.filter((tx) => {
            return tx.txHash != null
          }).map((tx, idx) => {
            return (<Typography className={ classes.viewDetailsText } key={`tx_key_${idx}`}>
              <a href={`${ETHERSCAN_URL}tx/${tx?.txHash}`} target="_blank">{ tx && tx.description ? tx.description : 'View in Explorer' } <OpenInNewIcon className={classes.newWindowIcon} /></a>
            </Typography>)
          })
        }
      </div>
    )
  }

  const renderTransactions = (transactions) => {
    if((transactions && transactions.filter((tx) => { return ['DONE', 'CONFIRMED'].includes(tx.status) }).length === transactions.length)) {
      return null
    }

    return (
      <>
        <div className={ classes.headingContainer }>
          <Typography className={ classes.heading }>{ purpose ? purpose : 'Pending Transactions'}</Typography>
        </div>
        <div className={ classes.transactionsContainer}>
          {
            transactions && transactions.map((tx, idx) => {
              return <Transaction transaction={tx} />
            })
          }
        </div>
      </>
    )
  }

  return (
    <Dialog
      className={classes.dialogScale}
      open={open}
      onClose={handleClose}
      fullWidth={true}
      maxWidth={"sm"}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
    >
      <DialogContent  className={classes.dialogScale1}>
        <IconButton className={ classes.closeIconbutton }
          onClick={handleClose}>
          <CloseIcon />
        </IconButton>
        { renderTransactions(transactions) }
        { renderDone(transactions) }
      </DialogContent>
    </Dialog>
  );
}
