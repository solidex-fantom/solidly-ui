import React, { useState, useEffect } from 'react';
import { useRouter } from "next/router";
import { Typography, Switch, Button, SvgIcon, Badge, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Grid, SwipeableDrawer, Divider } from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';
import ListIcon from '@material-ui/icons/List';
import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import DashboardOutlinedIcon from '@material-ui/icons/DashboardOutlined';
import Navigation from '../navigation'
import Unlock from '../unlock';
import TransactionQueue from '../transactionQueue';
import { ACTIONS } from '../../stores/constants';
import { styled } from '@material-ui/core/styles';
import stores from '../../stores';
import { formatAddress } from '../../utils';
import { walletlink } from '../../stores/connectors/connectors'
import classes from './header.module.css';
import MenuIcon from '@material-ui/icons/Menu'
import { ChevronLeft } from '@material-ui/icons';
import MobileNavigation from '../mobileNavigation/mobileNavigation';
import {formatCurrency} from "../../utils";

const { CONNECT_WALLET,CONNECTION_DISCONNECTED, ACCOUNT_CONFIGURED, ACCOUNT_CHANGED, FIXED_FOREX_BALANCES_RETURNED, FIXED_FOREX_CLAIM_VECLAIM, FIXED_FOREX_VECLAIM_CLAIMED, FIXED_FOREX_UPDATED, ERROR, HIDE_HEADER } = ACTIONS


function WrongNetworkIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0 0 64 64" strokeWidth="1" className={className}>
      <g strokeWidth="2" transform="translate(0, 0)"><path fill="none" stroke="#CD74CC" strokeWidth="2" strokeLinecap="square" strokeMiterlimit="10" d="M33.994,42.339 C36.327,43.161,38,45.385,38,48c0,3.314-2.686,6-6,6c-2.615,0-4.839-1.673-5.661-4.006" strokeLinejoin="miter"></path> <path fill="none" stroke="#CD74CC" strokeWidth="2" strokeLinecap="square" strokeMiterlimit="10" d="M47.556,32.444 C43.575,28.462,38.075,26,32,26c-6.075,0-11.575,2.462-15.556,6.444" strokeLinejoin="miter"></path> <path fill="none" stroke="#CD74CC" strokeWidth="2" strokeLinecap="square" strokeMiterlimit="10" d="M59.224,21.276 C52.256,14.309,42.632,10,32,10c-10.631,0-20.256,4.309-27.224,11.276" strokeLinejoin="miter"></path> <line data-color="color-2" fill="none" stroke="#CD74CC " strokeWidth="2" strokeLinecap="square" strokeMiterlimit="10" x1="10" y1="54" x2="58" y2="6" strokeLinejoin="miter"></line></g>
      </SvgIcon>
  );
}


const StyledMenu = withStyles({
  paper: {
    border: '1px solid rgba(126,153,176,0.2)',
    marginTop: '10px',
    minWidth: '230px',
  },
})((props) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
));

const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:focus': {
      backgroundColor: 'none',
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: '#FFF',
      },
    },
  },
}))(MenuItem);

const Img = styled('img')({
  margin: 'auto',
  display: 'block',
  maxWidth: '100%',
});


const StyledSwitch = withStyles((theme) => ({
  root: {
    width: 45,
    height: 26,
    padding: 0,
    margin: theme.spacing(1),
  },
  switchBase: {
    paddingTop: 1.5,
    width: '70%',
    margin: 'auto',
    borderRadius: '20px',
    '&$checked': {
      paddingTop: '6px',
      transform: 'translateX(18px)',
      color: 'rgba(128,128,128, 1)',
      width: '25px',
      height: '25px',
      '& + $track': {
        backgroundColor: 'rgba(0,0,0, 0.3)',
        opacity: 1,
      },
    },
    '&$focusVisible $thumb': {
      color: '#ffffff',
      border: '6px solid #fff',
    },
  },
  track: {
    borderRadius: 32 / 2,
    border: '1px solid rgba(104,108,122, 0.25)',
    backgroundColor: 'rgba(0,0,0, 0)',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  checked: {},
  focusVisible: {},
}))(({ classes, ...props }) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});


const StyledBadge = withStyles((theme) => ({
  badge: {
    background: '#FFBD59',
    color: '#000'
  },
}))(Badge);


function Header(props) {

  const accountStore = stores.accountStore.getStore('account');
  const router = useRouter();

  const [account, setAccount] = useState(accountStore);
  const [darkMode, setDarkMode] = useState(props.theme.palette.type === 'dark' ? true : false);
  const [hiddenMode, setHidden] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [chainInvalid, setChainInvalid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactionQueueLength, setTransactionQueueLength] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountBalance, setAccountBalance] = useState(0);
  const [accountToken, setAccountToken] = useState('KAVA');

  const [darkBackground, setBackground] = useState(false);

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account');
      setAccount(accountStore);            
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };
    const accountChanged = () => {
      const invalid = stores.accountStore.getStore('chainInvalid');
      setChainInvalid(invalid)
    }

    const invalid = stores.accountStore.getStore('chainInvalid');
    setChainInvalid(invalid)  

    const hiddenHeader = () => {
      setHidden(true);
    }
     
    getBalance()
    setHidden(false);

    stores.emitter.on(HIDE_HEADER, hiddenHeader);

    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(CONNECT_WALLET, connectWallet);
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    return () => {
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(CONNECT_WALLET, connectWallet);
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(HIDE_HEADER, hiddenHeader);
    };
  }, []);



  const listenScrollEvent = e => {    
    
    if (window && window.scrollY > 150) {      
      setBackground(true);
    } else {      
      setBackground(false);
    }
  }

  window.addEventListener('scroll', listenScrollEvent)




  const handleToggleChange = (event, val) => {
    setDarkMode(val);
    props.changeTheme(val);
  };

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  useEffect(function () {
    const localStorageDarkMode = window.localStorage.getItem('yearn.finance-dark-mode');
    setDarkMode(localStorageDarkMode ? localStorageDarkMode === 'dark' : false);
  }, []);

  const navigate = (url) => {
    router.push(url)
  }

  const callClaim = () => {
    setLoading(true)
    stores.dispatcher.dispatch({ type: FIXED_FOREX_CLAIM_VECLAIM, content: {} })
  }

  async function getBalance() {
    try {
      const web3 = await stores.accountStore.getWeb3Provider()
      if (!web3) {
        console.warn('web3 not found')
        return null
      }
                
      const balanceWei = await web3.eth.getBalance(accountStore.address);
      const balance = web3.utils.fromWei(balanceWei, 'ether');
      setAccountBalance(balance);
      setAccountToken(' KAVA')
              
    }
    catch {      
      setAccountBalance(0);
    }

  }

  const switchChain = async () => {
    let hexChain = '0x'+Number(process.env.NEXT_PUBLIC_CHAINID).toString(16)
    console.log('hexChain', hexChain)

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChain }],
      });
    } catch (err) {
        
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainName: 'Kava EVM Co-Chain',
              chainId: hexChain,
              nativeCurrency: { name: 'KAVA', decimals: 18, symbol: 'KAVA' },
              rpcUrls: [walletlink.url]
            }
          ]
        });
      }
    }

  }

  const setQueueLength = (length) => {
    setTransactionQueueLength(length)
  }

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const renderTestNet = () => {
    
    return (
      <>
        { process.env.NEXT_PUBLIC_CHAINID == '4001' &&
          <div className={ classes.testnetDisclaimer}>
            <Typography className={ classes.testnetDisclaimerText}>Testnet</Typography>
          </div>
        }
      </>
    )
  }

  const renderTransactionsQueue = () => {
    
    return (
      <>
        { transactionQueueLength > 0 &&
          <IconButton
            className={classes.transactionButton}
            variant="contained"
            color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
            onClick={ () => {
                stores.emitter.emit(ACTIONS.TX_OPEN)
              }
            }>
            <StyledBadge badgeContent={transactionQueueLength} color="secondary" overlap="circular" >
              <ListIcon className={ classes.iconColor}/>
            </StyledBadge>
          </IconButton>
        }
      </>
    )
  }

  

  const renderWalletInfo = () => {

    return (
      <>
      {account && account.address ?

        <div>
           
            <Grid container className={classes.containerMenu} alignItems="center">

                <Grid item xs={4} className={classes.headAccountBalance}>
                  <Typography className={classes.headBtnTxt}>{formatCurrency(accountBalance)}{accountToken}</Typography>
                </Grid>

                <Grid item xs={8}>

                  <Button 
                      disableElevation
                      className={classes.accountButton}
                      variant="contained"                      
                      aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                      {account && account.address && <div className={`${classes.accountIcon}`}></div>}
                      <Typography className={classes.headBtnTxt}>{account && account.address ? formatAddress(account.address) : 'Connect Wallet'}</Typography>

                      <IconButton onClick={handleClick}  aria-label="Wallet" className={ classes.walletButton }>                      
                        <Img alt="complex" src="/images/Wallet_Icon.svg" className={ classes.walletIcon }/>                        
                      </IconButton>          

                    </Button>
                </Grid>                       
            </Grid>                     
                                                                

            <StyledMenu
              id="customized-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
              className={classes.userMenu}
            >
              <StyledMenuItem className={classes.hidden} onClick={() => router.push('/dashboard')}>
                <ListItemIcon className={classes.userMenuIcon}>
                  <DashboardOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText className={classes.userMenuText} primary="Dashboard" />
              </StyledMenuItem>
              <StyledMenuItem onClick={onAddressClicked}>
                <ListItemIcon className={classes.userMenuIcon}>
                  <AccountBalanceWalletOutlinedIcon fontSize="small" className={classes.iconWalletSmall} />
                </ListItemIcon>
                <ListItemText className={classes.userMenuText} primary="Switch Wallet Provider" />
              </StyledMenuItem>

            </StyledMenu>

            </div>
          :
            <Button
              disableElevation
              className={classes.accountButton}
              variant="contained"
              color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
              onClick={onAddressClicked}>
              {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
              <Typography className={classes.headBtnTxt}>{account && account.address ? formatAddress(account.address) : 'Connect Wallet'}</Typography>

              <IconButton onClick={handleClick} className={ classes.filterButton } aria-label="filter list">                      
                  <Img alt="complex" className={ classes.imgIconList } src="/images/Wallet_Icon.svg" />
              </IconButton>    
            </Button>
          }
              
      </>
    )
  }

  const renderModal = () => {
    return (
      <>
        {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
          <TransactionQueue setQueueLength={ setQueueLength } />
      </>
    )
  }

  const renderRightMenuWallet = () => {
    return (
      <>   
        {renderTestNet()}        
        {renderWalletInfo()}
        {renderModal()}   
        {renderSocialMenu()}
      </>
    )
  } 

  const renderSocialMenu = () => {
    
    return (
      <>                
          <IconButton  href="https://linktr.ee/equilibrefinance" aria-label="social list" className={classes.socialButton} >                      
              <Img alt="complex" src="/images/Linktree_icon.svg" width={"70%"}/>
          </IconButton>                                                             
          
      </>
    )
  }


  const renderNotConnected = () => {
    return (
      <>
          {chainInvalid ? (
            <div className={classes.chainInvalidError}>
              <div className={classes.ErrorContent}>
                <WrongNetworkIcon className={ classes.networkIcon } />
                <Typography className={classes.ErrorTxt}>
                  The chain you're connected to isn't supported.
                </Typography>
                <Button className={classes.switchNetworkBtn} variant="contained" onClick={()=>switchChain()} >Switch to { process.env.NEXT_PUBLIC_CHAINID == '2221' ? 'KAVA Testnet' : 'KAVA EVM' }</Button>
              </div>
            </div>
          ) : null}
      </>
    )
  }

  const renderMobileMenu = () => {
    
    return (
      <>
          <IconButton sx={{ display: { xl: 'none', xs: 'block' } }}>
              <MenuIcon onClick={() => setMobileMenuOpen(true)} />
            </IconButton>          

          <SwipeableDrawer sx={{ display: { xl: 'none', xs: 'block' } }}
              anchor='left' 
              open={mobileMenuOpen} 
              onOpen={() => setMobileMenuOpen(true)} 
              onClose={() => setMobileMenuOpen(false)}
              width="50%"
            >
            <Grid>
              <IconButton>
                <ChevronLeft onClick={() => setMobileMenuOpen(false)}/>
              </IconButton>
            </Grid>
            <Divider />
            <MobileNavigation  />
          </SwipeableDrawer>
        </>
    )
  }

  return (
    <> {hiddenMode ? null : (
          <div>


            <Grid container className={classes.headerContainer} alignItems='center' justifyContent='space-between' 
                      style={{background : `${darkBackground ? '#0D142E' : ''}`}}>

            <Grid item justifyContent={'flex-start'} className={classes.containerMobile}>
                  {renderMobileMenu()};
              </Grid>
                        
              <Grid item sm={3} justifyContent={'flex-start'} className={classes.containerLogo}>            
                <a onClick={() => router.push('/home')}> <Img className={classes.appLogo}  alt="complex" src="/images/Logo.png" /></a>                                  
              </Grid>          

              <Grid item justifyContent={'center'} className={classes.containerNav} >
                  <Navigation changeTheme={props.changeTheme} />
              </Grid>          
                                    
              <Grid item sm={3} alignItems="center" justifyContent={'flex-end'} className={classes.containerMenuWallet}>
                    {renderRightMenuWallet()}                               
              </Grid>

            </Grid>

            {renderNotConnected()}

        <div>
                        
      </div>    
      
      </div>    
    )}

    </>
  )
}

export default withTheme(Header);
