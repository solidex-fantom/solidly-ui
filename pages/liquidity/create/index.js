import React, { useState, useEffect, useCallback } from 'react';
import LiquidityCreate from '../../../components/ssLiquidityManage'
import { Grid, Typography } from '@material-ui/core';
import classes from './liquidity.module.css';

function Pair({ changeTheme }) {

  return (


    <Grid container alignItems="center" justifyContent="center" className={classes.container} spacing={5}>

      <Grid item xs={12} md={6} container>       

        <Grid item xs={12} className={classes.descTp} >              
            <Typography className={classes.title} variant='h1'>Add Liquidity</Typography>
            <Typography className={classes.subtitle}>Add liquidity and earn weekly rewards</Typography>
        </Grid>     

        <Grid item xs={12}>              
          <div className={classes.sphere}></div>                         
        </Grid>    

      </Grid>

      <Grid item xs={12} md={6} >       
          <LiquidityCreate />
      </Grid>    

    </Grid>
  );
}

export default Pair;
