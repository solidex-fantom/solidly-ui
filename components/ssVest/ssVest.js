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
import { Grid, Typography } from '@material-ui/core';

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

  return (
    <div className={ classes.vestContainer }>
      

      <Grid container lg={12} md={12} sm={12} xs={12} justifyContent="center" alignItems="center" spacing={6}>

              <Grid item lg={6} md={6} sm={6} xs={6} justifyContent="center" alignItems="center">       

                <Grid className={classes.descTp} direction="column" >              
                    <Typography className={classes.title} variant='h1'>Create Lock</Typography>
                    <Typography className={classes.subtitle}>More tokens locked for longer = greater voting power = higher rewards</Typography>
                </Grid>     

                <Grid>              
                    <div className={classes.sphere}></div>                         
                  </Grid>    

              </Grid>

              <Grid item lg={6} md={6} sm={6} xs={6} justifyContent="center" alignItems="center">     
                

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
