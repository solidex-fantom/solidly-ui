import { Typography, Button, Paper, Grid } from "@material-ui/core";
import SwapComponent from '../../components/ssSwap';

import React, { useState, useEffect } from 'react';
import { ACTIONS } from '../../stores/constants';
import stores from '../../stores';
import Unlock from '../../components/unlock';

import classes from './swap.module.css';

function Swap({ changeTheme }) {

  const [account, setAccount] = useState(stores.accountStore.getStore('account'));
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const accountConfigure = () => {
      setAccount(stores.accountStore.getStore('account'));
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


          <Grid container alignItems="center" justifyContent="center">

              <Grid item lg={6} md={6} sm={6} xs={6} className={classes.endAsset}>       

                <Grid className={classes.descTp}>              
                    <Typography className={classes.mainHeadingSwap} variant='h1'>Swap</Typography>
                    <Typography className={classes.mainDescNC} variant='body2'>Enjoy minimal slippage, low swapping fees and deep liquidity</Typography>
                </Grid>     

                <Grid>              
                  <div className={classes.sphere}></div>                         
                </Grid>    

              </Grid>
              
              <Grid item>
                <SwapComponent />
              </Grid>    

         </Grid>
              
         :

         <Paper className={classes.notConnectedContent}>

            <div className={classes.contentFloat}>
                <Typography className={classes.mainHeadingNC} variant='h1'>Swap</Typography>
                <Typography className={classes.mainDescNC} variant='body2'>
                  Enjoy minimal slippage, low swapping fees and deep liquidity.
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

export default Swap;
