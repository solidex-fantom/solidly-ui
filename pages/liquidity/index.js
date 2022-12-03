import { Typography, Button, Paper, Grid } from "@material-ui/core"
import LiquidityPairs from '../../components/ssLiquidityPairs'
import React, { useState, useEffect } from 'react';
import { ACTIONS } from '../../stores/constants';
import stores from '../../stores';
import { useRouter } from "next/router";
import Unlock from '../../components/unlock';
import classes from './liquidity.module.css';


function Liquidity({ changeTheme }) {

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
          <LiquidityPairs />              
        </div>
         :
        <Paper className={classes.notConnectedContent}>
          
          <div className={classes.contentFloat}>
            
            <Typography className={classes.title} variant="h1">Pools</Typography>
            <Typography className={classes.subtitle} variant="h2">Add liquidity and earn weekly rewards</Typography>

            <Button disableElevation className={classes.buttonConnect} variant="contained" onClick={onAddressClicked}>
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

export default Liquidity;
