import { Paper, Typography, Grid  } from '@material-ui/core';
import classes from "./ssVest.module.css";
import moment from 'moment';
import { formatCurrency } from '../../utils';
import BigNumber from "bignumber.js";

export default function VestingInfo({ currentNFT, futureNFT, veToken, govToken, showVestingStructure }) {
  return (
    <div className={ classes.vestInfoContainer }>
      { currentNFT &&
        <>
          <Typography className={ classes.title }>Your current voting power is:</Typography>
          <div className={ classes.mainSection }>
            <Typography className={ classes.amount }>{ formatCurrency(currentNFT?.lockValue) } { veToken?.symbol}</Typography>
            <div className={ classes.values }>
              <Typography color='textSecondary' align='right' className={ classes.val } >{ formatCurrency(currentNFT.lockAmount) } { govToken?.symbol } locked expires { moment.unix(currentNFT?.lockEnds).fromNow() } </Typography>
              <Typography color='textSecondary' align='right' className={ classes.val }>Locked until { moment.unix(currentNFT?.lockEnds).format('YYYY / MM / DD') }</Typography>
            </div>
          </div>
        </>
      }
      {
        futureNFT &&
        <>

        <Grid container>

                  <Grid container  className={classes.mrgTp20}>

                    <Grid lg={6} md={6} sm={6} xs={6} justifyContent="center" alignItems="center" >
                      <Typography className={ classes.voteText }>Your voting power will be:</Typography>          

                    </Grid>

                    <Grid  lg={6} md={6} sm={6} xs={6} justifyContent="center" alignItems="center"  className={classes.mrgTp20}>
                      <div className={ classes.values }>
                        <Typography color='textSecondary' align='right' className={ classes.val }>{ formatCurrency(futureNFT.lockAmount) } { govToken?.symbol }
                        </Typography>
                      </div>
                    </Grid>

                    <Grid lg={6} md={6} sm={6} xs={6} justifyContent="center" alignItems="center"  className={classes.mrgTp20}>
                      <Typography>Locked until:</Typography>          
                    </Grid>

                    <Grid  lg={6} md={6} sm={6} xs={6} justifyContent="center" alignItems="center"  className={classes.mrgTp20}>
                        <div className={ classes.values }>
                          <Typography color='textSecondary' align='right' className={ classes.val }> { moment.unix(futureNFT?.lockEnds).format('YYYY / MM / DD') }</Typography>
                        </div>
                    </Grid>

                </Grid>


              <Grid  lg={12} md={12} sm={12} xs={12} justifyContent="center" alignItems="center"  className={classes.mrgTp20}>
                <div className={ classes.values }>
                  <Typography align='center' className={ classes.lockedInfo}>{ formatCurrency(futureNFT.lockAmount) } { govToken?.symbol } locked expires { moment.unix(futureNFT?.lockEnds).fromNow() } </Typography>
                </div>
                <div className={ classes.lineLockedInfo }>

                </div>
              </Grid>              

        </Grid>

        

        
        </>
      }
      {
        showVestingStructure &&
        <div className={ classes.seccondSection }>
          <Typography className={ classes.info}>1 { govToken?.symbol } locked for 4 years = 1.00 { veToken?.symbol }</Typography>
          <Typography className={ classes.info}>1 { govToken?.symbol } locked for 3 years = 0.75 { veToken?.symbol }</Typography>
          <Typography className={ classes.info}>1 { govToken?.symbol } locked for 2 years = 0.50 { veToken?.symbol }</Typography>
          <Typography className={ classes.info}>1 { govToken?.symbol } locked for 1 years = 0.25 { veToken?.symbol }</Typography>
        </div>
      }
    </div>
  )
}
