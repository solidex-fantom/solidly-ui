import React, { useState, useEffect } from 'react';
import { Typography, Button, TextField, CircularProgress } from '@material-ui/core';
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';
import { formatCurrency } from '../../utils';
import classes from "./ssVest.module.css";
import stores from '../../stores'
import { styled } from '@material-ui/core/styles';
import { ACTIONS } from '../../stores/constants';
export default function ffLockAmount({ nft, govToken, updateLockAmount }) {

  const [ approvalLoading, setApprovalLoading ] = useState(false)
  const [ lockLoading, setLockLoading ] = useState(false)

  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);

  const router = useRouter();
  

  const Img = styled('img')({
    margin: 'auto',
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
  });

  useEffect(() => {
    const lockReturned = () => {
      setLockLoading(false)
      router.push('/vest')
    }

    const errorReturned = () => {
      setApprovalLoading(false)
      setLockLoading(false)
    }

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.INCREASE_VEST_AMOUNT_RETURNED, lockReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.INCREASE_VEST_AMOUNT_RETURNED, lockReturned);
    };
  }, []);

  const setAmountPercent = (percent) => {
    const val = BigNumber(govToken.balance).times(percent).div(100).toFixed(govToken.decimals)
    setAmount(val);
    updateLockAmount(val)
  }

  const onLock = () => {
    setLockLoading(true)
    stores.dispatcher.dispatch({ type: ACTIONS.INCREASE_VEST_AMOUNT, content: { amount, tokenID: nft.id } })
  }

  const amountChanged = (event) => {
    setAmount(event.target.value);
    updateLockAmount(event.target.value)
  }

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, balance, logo) => {
    return (
      <div className={ classes.textField}>
        <div className={ classes.inputTitleContainer }>
          <div className={ classes.inputBalance }>
            <Typography className={ classes.inputBalanceText } noWrap onClick={ () => {
              setAmountPercent(100)
            }}>
              Balance: { balance ? ' ' + formatCurrency(balance) : '' }
            </Typography>
          </div>
        </div>
        <div className={ `${classes.massiveInputContainer} ${ (amountError) && classes.error }` }>
          <div className={ classes.massiveInputAssetSelect }>
            <div className={ classes.displaySelectContainer }>
              <div className={ classes.assetSelectMenuItem }>
                <div className={ classes.displayDualIconContainer }>
                  {
                    logo &&
                    <img
                      className={ classes.displayAssetIcon }
                      alt=""
                      src={ logo }
                      height='100px'
                      onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}}
                    />
                  }
                  {
                    !logo &&
                    <img
                      className={ classes.displayAssetIcon }
                      alt=""
                      src={ '/tokens/unknown-logo.png' }
                      height='100px'
                      onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}}
                    />
                  }
                </div>
              </div>
            </div>
          </div>
          <div className={ classes.massiveInputAmount }>
            <TextField
              placeholder='0.00'
              fullWidth
              error={ amountError }
              helperText={ amountError }
              value={ amountValue }
              onChange={ amountChanged }
              disabled={ lockLoading }
              InputProps={{
                className: classes.largeInput
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={ classes.someContainer }>
      <div className={ classes.inputsContainer3 }>
        { renderMassiveInput('lockAmount', amount, amountError, amountChanged, govToken?.balance, govToken?.logoURI) }
      </div>
      <div className={ classes.actionsContainer3 }>
        <Button
          className={classes.buttonOverride}
          fullWidth
          variant='contained'
          size='large'
          color='primary'
          disabled={ lockLoading }
          onClick={ onLock }
          >

          <Img alt="complex" src="/images/Small_Button.png" width={'70%'}/>

          <Typography className={ classes.actionButtonText }>{ lockLoading ? `Increasing Lock Amount` : `Increase Lock Amount` }</Typography>
          { lockLoading && <CircularProgress size={10} className={ classes.loadingCircle } /> }
          

        </Button>
      </div>
    </div>
  );
}
