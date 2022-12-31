import { Typography, Button, Paper, Grid } from "@material-ui/core";
import SwapComponent from "../../components/ssSwap";

import React, { useState, useEffect } from "react";
import { ACTIONS } from "../../stores/constants";
import stores from "../../stores";
import Unlock from "../../components/unlock";

import classes from "./swap.module.css";

function Swap({ changeTheme }) {
  const [account, setAccount] = useState(
    stores.accountStore.getStore("account")
  );
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const accountConfigure = () => {
      setAccount(stores.accountStore.getStore("account"));
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };

    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(ACTIONS.CONNECT_WALLET, connectWallet);
    return () => {
      stores.emitter.removeListener(
        ACTIONS.ACCOUNT_CONFIGURED,
        accountConfigure
      );
      stores.emitter.removeListener(ACTIONS.CONNECT_WALLET, connectWallet);
    };
  }, []);

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };


  const renderContainerConnect = () => {
    return (
      <>
          <Grid container alignItems="center" justifyContent="center" spacing={6}>
            <Paper className={classes.notConnectedContent}>
              <div className={classes.contentFloat}>
                <Typography className={classes.title} variant="h1">
                  
                </Typography>
                <Typography className={classes.subtitle} variant="body2">
                  
                </Typography>
                <Button
                  disableElevation
                  className={classes.buttonConnect}
                  variant="contained"
                  onClick={onAddressClicked}
                >
                  {account && account.address && (
                    <div
                      className={`${classes.accountIcon} ${classes.metamask}`}
                    ></div>
                  )}
                  <Typography>Connect Wallet</Typography>
                </Button>
              </div>
            </Paper>
          </Grid>
      </>
    )
  }

  const renderContainer = () => {
    return(

      <>
      <Grid container alignItems="center" justifyContent="center" spacing={0}>

          <Grid item alignItems="center" justifyContent="center" lg={6} xs={12}>                          
              <Typography className={classes.title} variant="h1">Swap</Typography>
              <Typography className={classes.subtitle}>Minimal slippage, low swapping fees & deep liquidity</Typography>
              <div className={classes.sphere}></div>                          
          </Grid>

          <Grid className={classes.swapContainer} item xs={12} lg={6}>
            
            <SwapComponent />
          </Grid>
          
        </Grid>
      </>

    )
  }

  return (
    <div className={classes.ffContainer}>
      {account && account.address ? renderContainer() : renderContainerConnect()}
      {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
    </div>
  );
}

export default Swap;
