import React, { useState, useEffect, useCallback } from 'react';
import { styled, makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment,
  Popper,
  Fade,
  Grid,
  Switch,
  Select,
  MenuItem
} from '@material-ui/core';
import classes from './ssRewards.module.css';

import FilterListIcon from '@material-ui/icons/FilterList';
import SearchIcon from '@material-ui/icons/Search';
import RewardsTable from './ssRewardsTable.js'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';

import { formatCurrency } from '../../utils';
import stores from '../../stores'
import { ACTIONS } from '../../stores/constants';

export default function ssRewards() {

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [ rewards, setRewards ] = useState([])
  const [ vestNFTs, setVestNFTs ] = useState([])
  const [ search, setSearch ] = useState('')
  const [ anchorEl, setAnchorEl ] = useState(null)
  const [ token, setToken ] = useState(null)
  const [ veToken, setVeToken ] = useState(null)
  const [ loading, setLoading ] = useState(false)

  const stableSwapUpdated = (rew) => {
    const nfts = stores.stableSwapStore.getStore('vestNFTs')
    setVestNFTs(nfts)
    setVeToken(stores.stableSwapStore.getStore('veToken'))

    if(nfts && nfts.length > 0) {
      if(!token) {
        setToken(nfts[0])
        window.setTimeout(() => {
          stores.dispatcher.dispatch({ type: ACTIONS.GET_REWARD_BALANCES, content: { tokenID: nfts[0].id } })
        })
      } else {
        window.setTimeout(() => {
          stores.dispatcher.dispatch({ type: ACTIONS.GET_REWARD_BALANCES, content: { tokenID: token.id } })
        })
      }
    } else {
      window.setTimeout(() => {
        stores.dispatcher.dispatch({ type: ACTIONS.GET_REWARD_BALANCES, content: { tokenID: 0 } })
      })
    }

    forceUpdate()
  }

  const rewardBalancesReturned = (rew) => {
    if(rew) {
      if(rew && rew.bribes && rew.fees && rew.rewards && rew.veDist && rew.bribes.length >= 0 && rew.fees.length >= 0 && rew.rewards.length >= 0) {
        setRewards([...rew.bribes, ...rew.fees, ...rew.rewards, ...rew.veDist])
      }
    } else {
      let re = stores.stableSwapStore.getStore('rewards')
      if(re && re.bribes && re.fees && re.rewards && re.veDist && re.bribes.length >= 0 && re.fees.length >= 0 && re.rewards.length >= 0) {
        setRewards([...re.bribes, ...re.fees, ...re.rewards, ...re.veDist])
      }
    }
  }

  useEffect(() => {
    rewardBalancesReturned()
    stableSwapUpdated()

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    stores.emitter.on(ACTIONS.REWARD_BALANCES_RETURNED, rewardBalancesReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
      stores.emitter.removeListener(ACTIONS.REWARD_BALANCES_RETURNED, rewardBalancesReturned);
    };
  }, [token]);

  useEffect(() => {

    const claimReturned = () => {
      setLoading(false)
    }

    const claimAllReturned = () => {
      setLoading(false)
    }

    stableSwapUpdated()

    stores.emitter.on(ACTIONS.CLAIM_BRIBE_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_REWARD_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_PAIR_FEES_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_VE_DIST_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_ALL_REWARDS_RETURNED, claimAllReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.CLAIM_BRIBE_RETURNED, claimReturned);
      stores.emitter.removeListener(ACTIONS.CLAIM_REWARD_RETURNED, claimReturned);
      stores.emitter.removeListener(ACTIONS.CLAIM_PAIR_FEES_RETURNED, claimReturned);
      stores.emitter.removeListener(ACTIONS.CLAIM_VE_DIST_RETURNED, claimReturned);
      stores.emitter.removeListener(ACTIONS.CLAIM_ALL_REWARDS_RETURNED, claimAllReturned);
    };
  }, [])

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onClaimAll = () => {
    setLoading(true)
    let sendTokenID = 0
    if(token && token.id) {
      sendTokenID = token.id
    }
    stores.dispatcher.dispatch({ type: ACTIONS.CLAIM_ALL_REWARDS, content: { pairs: rewards, tokenID: sendTokenID } })
  }

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleChange = (event) => {
    setToken(event.target.value);
    stores.dispatcher.dispatch({ type: ACTIONS.GET_REWARD_BALANCES, content: { tokenID: event.target.value.id } })
  }

  const open = Boolean(anchorEl);
  const id = open ? 'transitions-popper' : undefined;

  const useStyles = makeStyles((theme) => ({
  }))

  const Img = styled('img')({
    position: 'relative',
    marginLeft: '10px',    
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    
  });
  

  const renderMediumInput = (value, options) => {
    return (
      <div className={ classes.textField}>
        <div className={ classes.mediumInputContainer}>
          <Grid container>
            <Grid item lg='auto' md='auto' sm={12} xs={12}>
              <Typography variant="body2" className={ classes.helpText }>Please select your veVARA:</Typography>
            </Grid>
            <Grid item lg={6} md={6} sm={12} xs={12}>
            <div className={ classes.mediumInputAmount }>
              <Select
                fullWidth
                value={ value }
                onChange={handleChange}
                InputProps={{
                  className: classes.mediumInput,
                }}
              >
                { options && options.map((option) => {
                  return (
                    <MenuItem key={option.id} value={option}>
                      <div className={ classes.menuOption }>
                        <Typography>Token #{option.id}</Typography>
                        <div>
                          <Typography align='right' className={ classes.smallerText }>{ formatCurrency(option.lockValue) }</Typography>
                          <Typography color='textSecondary' className={ classes.smallerText }>{veToken?.symbol}</Typography>
                        </div>
                      </div>
                    </MenuItem>
                  )
                })}
              </Select>
            </div>
            </Grid>
          </Grid>
        </div>
      </div>
    )
  }

  return (
    <div className={ classes.container}>
      <div className={ classes.toolbarContainer }>
        <Grid container spacing={2}>


        <Grid container className={classes.gridBanner} lg={12} md={12} sm={12} xs={12} justifyContent="center" alignItems="center">

            <Grid direction="column" lg={8} md={8} sm={8} xs={8}>            
            
              <Grid className={classes.toolbarInfo}><Typography className={classes.title} variant="h1">Rewards</Typography></Grid>    
              <Grid className={classes.toolbarInfo}><Typography className={classes.subtitle}  variant="h2">Claim rewards for locking tokens, including new token emissions, bribes and a slice of the transaction fees from your pools</Typography></Grid>                                  
            </Grid>   

            <Grid item lg={4} md={4} sm={4} xs={4} justifyContent="center" alignItems="center">            
              <div className={classes.sphere}></div>  
            </Grid>
                                
          </Grid>   


          <Grid item lg={8} md={8} sm={8} xs={8}>
            <div className={ classes.tokenIDContainer }>
              { renderMediumInput(token, vestNFTs) }
            </div>
          </Grid>
          
          <Grid item lg={4} md={4} sm={4} xs={4}>
        
            <Button className={ classes.buttonOverride } onClick={ onClaimAll }>
              <Img alt="complex" src="/images/Small_Button.png" width={'50%'}  />
              <Typography className={ classes.actionButtonText }>Claim All</Typography>
            </Button>   

        </Grid> 
        

          <Grid item lg={12} md={12} sm={12} xs={12}>
            <div className={ classes.disclaimerContainer }>
              <Typography className={ classes.disclaimerMain }>Rewards displayed are an estimation of the trading fees, voting rewards are rebases that you can claim.</Typography>
              <Typography className={ classes.disclaimer }>For details refer to our <a className={ classes.disclaimerDocs }>docs</a></Typography>              
            </div>
          </Grid>

        </Grid>

      </div>
      <RewardsTable rewards={rewards} vestNFTs={ vestNFTs } tokenID={ token?.id } />
    </div>
  );
}
