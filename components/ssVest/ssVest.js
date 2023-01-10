import React, { useState, useEffect,  useCallback } from "react";
import { useRouter } from 'next/router';
import BigNumber from "bignumber.js";
import classes from "./ssVest.module.css";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import moment from "moment";
import ExistingLock from "./existingLock";
import Unlock from "./unlock";
import Lock from './lock';
import { Grid, Typography, IconButton, Link } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

export default function ssVest() {

  const router = useRouter();

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [govToken, setGovToken] = useState(null);
  const [veToken, setVeToken] = useState(null);
  const [nft, setNFT] = useState(null);

  const ssUpdated = async () => {
    setGovToken(stores.stableSwapStore.getStore("govToken"));
    setVeToken(stores.stableSwapStore.getStore("veToken"));

    const nft = await stores.stableSwapStore.getNFTByID(router.query.id)
    setNFT(nft)
    forceUpdate()
  };

  const onBack = () => {
    router.push('/vest')
  }

  useEffect(() => {
    ssUpdated()

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
    };
  }, []);

  useEffect(async () => {
    ssUpdated()
  }, [router.query.id])

  const renderIconArrowLeft = () => {
    return(
      <div className={ classes.backIconContainer }>
        <div className={ classes.vestIconSubContainer }>
          <Link
            color='textPrimary'
            variant='button'
            underline='none'
            href="/vest"
            >
            <ArrowBackIcon className={ classes.backIcon } />
          </Link>
          
        </div>      
      </div>
    )
  }
 
  const renderLock = () =>  {

    return(
      <>
        <Grid container xs={12} justifyContent="space-between" alignItems="center">

          <Grid item xs={12} md={6} justifyContent="center" alignItems="center" container>       

            <Grid item xs={12} className={classes.descTp} direction="column" >              
              <Typography className={classes.title}>Create Lock</Typography>
              <Typography className={classes.subtitle}>Amount of tokens locked <a className={classes.yellow}>+</a> vesting period length <a className={classes.yellow}>=</a> Voting Power Size</Typography>
              <Typography className={classes.subtitle1}>With great voting power come great rewards.</Typography>                
            </Grid>     

            <Grid item xs={12}>              
              <div className={classes.sphere}></div>                         
            </Grid>    

          </Grid>

          <Grid item xs={12} md={6} className={classes.retain}>     
              {renderIconArrowLeft()}  
              <Lock nft={nft} govToken={govToken} veToken={veToken} />          
          </Grid>    

        </Grid>  

      </>
    )
      
  }

  const renderUnlock = () => {
    return (
      <>
      <Grid container xs={12} justifyContent="center" alignItems="center">
        
        <Unlock nft={nft} govToken={govToken} veToken={veToken} />
      </Grid>  
      </>
    )
  }

  return (
    <div className={ classes.vestContainer }>
      { router.query.id === 'create' && (renderLock())}                
      { router.query.id !== 'create' && (renderUnlock())}
    </div>
  );
}
