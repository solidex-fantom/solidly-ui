import React, { useState, useEffect } from 'react';
import { Typography, Button, Paper, Grid } from "@material-ui/core";
import Gauges from '../../components/ssVotes';
import Unlock from '../../components/unlock';
import classes from './vote.module.css';

import stores from '../../stores';
import { ACTIONS } from '../../stores/constants';

function Vote({ changeTheme }) {
  const accountStore = stores.accountStore.getStore('account');
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
            <Gauges />                   
        </div>
        :
        <Paper className={classes.notConnectedContent}>
          
          <div className={classes.contentFloat}>
          <Typography className={classes.mainHeadingNC} variant='h1'>Vote</Typography>
          <Typography className={classes.mainDescNC} variant='body2'>
            Earn a share of your pool's transaction fees, bribes and emissions rewards for helping govern Équilibre
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

export default Vote;
