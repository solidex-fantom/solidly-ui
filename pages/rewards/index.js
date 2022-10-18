import { Typography, Button, Paper, Grid } from "@material-ui/core"
import SSRewards from '../../components/ssRewards'

import React, { useState, useEffect } from 'react';
import { ACTIONS } from '../../stores/constants';

import stores from '../../stores';
import { useRouter } from "next/router";
import Unlock from '../../components/unlock';

import classes from './rewards.module.css';

function Rewards({ changeTheme }) {

  const accountStore = stores.accountStore.getStore('account');
  const router = useRouter();
  const [account, setAccount] = useState(accountStore);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account');
      setAccount(accountStore);
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };

    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(ACTIONS.CONNECT_WALLET, connectWallet);
    return () => {
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(ACTIONS.CONNECT_WALLET, connectWallet);
    };
  }, []);

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  return (
    <div className={classes.ffContainer}>
      {account && account.address ?
        <div className={classes.connected}>

          <Grid container alignItems="center" justifyContent="center">

          <Grid item lg={12} md={12} sm={12} xs={12}>
            <div  className={classes.gridBanner}></div>
          </Grid>    
                    
          <Grid item lg={12} md={12} sm={12} xs={12}>
            <SSRewards />
          </Grid>

          </Grid>         
          
        </div>
         :
        <Paper className={classes.notConnectedContent}>
          
          <div className={classes.contentFloat}>
            <Typography className={classes.mainHeadingNC} variant='h1'>Rewards</Typography>
            <Typography className={classes.mainDescNC} variant='body2'>
              Claim your share of rewards!
            </Typography>
            <Button
            disableElevation
            className={classes.buttonConnect}
            variant="contained"
            onClick={onAddressClicked}>
            {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
            <Typography>Connect Wallet to Continue</Typography>
            </Button>
          </div>
        </Paper>
       }
       {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}

    </div>
  );
}

export default Rewards;
