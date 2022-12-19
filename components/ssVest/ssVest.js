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

  return (
    <div className={ classes.vestContainer }>
      

      <Grid container xs={12} justifyContent="space" alignItems="center">

              <Grid item xs={12} md={6} justifyContent="center" alignItems="center" container>       

                <Grid item xs={12} className={classes.descTp} direction="column" >              
                    <Typography className={classes.title}>Create Lock</Typography>
                    <Typography className={classes.subtitle}>More tokens locked for longer = greater voting power = higher rewards</Typography>
                </Grid>     

                <Grid item xs={12}>              
                    <div className={classes.sphere}></div>                         
                  </Grid>    

              </Grid>
              
              <Grid item xs={12} md={6} className={classes.retain}>     
              {renderIconArrowLeft()}  
              
              { router.query.id === 'create' && (
                  <Lock
                    nft={nft}
                    govToken={govToken}
                    veToken={veToken}
                  />
                )}
                { router.query.id !== 'create' && nft && BigNumber(nft.lockEnds).gte(moment().unix()) && BigNumber(nft.lockEnds).gt(0) && (
                  <ExistingLock
                    nft={nft}
                    govToken={govToken}
                    veToken={veToken}
                  />
                )}
                { router.query.id !== 'create' && nft && BigNumber(nft.lockEnds).lt(moment().unix()) && BigNumber(nft.lockEnds).gt(0) && (
                    <Unlock
                      nft={nft}
                      govToken={govToken}
                      veToken={veToken}
                    />
                  )
                }
              </Grid>    

          </Grid>      
    </div>
  );
}
