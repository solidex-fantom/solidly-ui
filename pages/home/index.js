import { Typography, Button, Grid } from "@material-ui/core";
import classes from './home.module.css';
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/router";
import { styled } from '@material-ui/core/styles';
import { ACTIONS } from '../../stores/constants';
import stores from "../../stores";

function Home({ changeTheme }) {

  const emitter = stores.emitter;

  const Img = styled('img')({
    margin: 'auto',
    display: 'block',
    maxWidth: '100%',
  });  

  function handleLinkTree(){
    openInNewTab("https://linktr.ee/equilibrefinance");
  }

  const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const router = useRouter();

  emitter.emit(ACTIONS.HIDE_HEADER);

  const renderTop = () => {

    return (
      <>  
    <Grid container className={classes.headerContainer} alignItems='center' justifyContent='space-between'>
          
          <Grid item xs={2} justifyContent={{md:"flex-start"}} >                        
          
          </Grid>     
          
          <Grid item xs={2} justifyContent={{md:"flex-end"}}>                

                <Button className={ classes.buttonOverride } onClick={() => router.push('/swap')}>
                    <Img alt="complex" src="/images/Linktree_icon.svg" width={50} onClick={handleLinkTree}/>
                </Button>   
                   
          </Grid>

        </Grid>
    </> )

  }

  const renderCenter = () => {
    return (
      <>
         <Grid container alignItems='center' justifyContent='flex-start' className={ classes.centerContainer }>
              <a href="https://www.equilibrefinance.com/swap">
                  <img src="/images/Logo.png" alt="Équilibre" />    
              </a>        
        </Grid>

        <Grid container direction="column" alignItems='center' justifyContent='flex-end' className={ classes.centerContainer }>
            <Grid className={ classes.centerContainer1 }>

            </Grid>
        </Grid>
      </>
    )
  }

  const renderBottom = () => {
    return (
      <>
       <Grid container alignItems='center' justifyContent='center' className={ classes.footerContainer }>        
            <Typography className={ classes.footerTitle }>AMM and Liquidity Marketplace on the Kava Blockchain</Typography>            
        </Grid>
      </>
    )
  }


  return (
    <div className={classes.ffContainer}>
          {renderTop()}
          {renderCenter()}
          {renderBottom()}
    </div>
  );
}

export default Home;
