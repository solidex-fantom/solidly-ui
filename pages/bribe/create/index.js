import { Grid, Typography } from "@material-ui/core";
import React, { useState, useEffect, useCallback } from "react";
import BribeCreate from "../../../components/ssBribeCreate";

import classes from "./create.module.css";

function Bribe({ changeTheme }) {
  return (
    <Grid container className={classes.container} justifyContent="center" alignItems="center">
      <Grid
        container
        item
        alignItems="center"
        justifyContent="center"
        xs={12}
        lg={6}
      >
        <Grid item>
          <Typography className={classes.title} variant="h1">
            Bribes
          </Typography>
          <Typography className={classes.subtitle}>
            Add incentives to your LPs to attract voters to it
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.sphere}></div>
        </Grid>
      </Grid>

      <Grid item xs={12} lg={6}>
        <BribeCreate />
      </Grid>
    </Grid>
  );
}

export default Bribe;
