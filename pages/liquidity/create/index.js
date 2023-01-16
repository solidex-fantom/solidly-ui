import React, { useState, useEffect, useCallback, Link } from 'react';
import LiquidityCreate from '../../../components/ssLiquidityManage'
import { Grid, Typography } from '@material-ui/core';
import classes from './liquidity.module.css';


function Pair({ changeTheme }) {
 
  return (
    <Grid container alignItems="center" justifyContent="center" className={classes.container}>      
      <LiquidityCreate />
    </Grid>
  );
}

export default Pair;
