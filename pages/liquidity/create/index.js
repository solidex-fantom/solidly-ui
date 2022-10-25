import React, { useState, useEffect, useCallback } from 'react';
import LiquidityCreate from '../../../components/ssLiquidityManage'
import { Grid, Typography } from '@material-ui/core';
import classes from './liquidity.module.css';

function Pair({ changeTheme }) {

  return (
    <div className={classes.container}>

          <Grid container alignItems="center" justifyContent="center">

          <Grid item>       

            <Grid className={classes.descTp} >              
                <Typography className={classes.mainHeadingSwap} variant='h1'>Add Liquidity</Typography>
                <Typography className={classes.mainDescNC}>Add liquidity and earn weekly rewards</Typography>
            </Grid>     

            <Grid>              
              <div className={classes.sphere}></div>                         
            </Grid>    

          </Grid>

              <Grid item lg={6} md={6} sm={6} xs={6}>       
                    <LiquidityCreate />
              </Grid>    

          </Grid>

      
    </div>
  );
}

export default Pair;
