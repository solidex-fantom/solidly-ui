import React, { useState, useEffect, useCallback } from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  InputAdornment, 
  TextField, 
  MenuItem, 
  Select, 
  Grid, 
  Tooltip, 
  IconButton, 
  Popper, 
  Fade,
  Switch 
} from '@material-ui/core';
import BigNumber from 'bignumber.js';
import SearchIcon from '@material-ui/icons/Search';
import { useRouter } from "next/router";
import classes from './ssVotes.module.css';
import { formatCurrency } from '../../utils';
import GaugesTable from './ssVotesTable.js'
import stores from '../../stores'
import { styled, makeStyles } from '@material-ui/core/styles';
import { ACTIONS } from '../../stores/constants';
import FilterListIcon from '@material-ui/icons/FilterList';

export default function ssVotes() {
  const router = useRouter()

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [ gauges, setGauges ] = useState([])
  const [ voteLoading, setVoteLoading ] = useState(false)
  const [ votes, setVotes ] = useState([])
  const [ veToken, setVeToken ] = useState(null)
  const [ token, setToken ] = useState(null)
  const [ vestNFTs, setVestNFTs ] = useState([])
  const [search, setSearch] = useState('');


  

  
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const id = open ? 'transitions-popper' : undefined;  



  const getLocalToggles = () => {
    let localToggles = {
      toggleActive: true,
      toggleActiveGauge: true,
      toggleVariable: true,
      toggleStable: true
    }
    // get locally saved toggles
    try {
      const localToggleString = localStorage.getItem('solidly-votesToggle-v1')
      if(localToggleString && localToggleString.length > 0) {
        localToggles = JSON.parse(localToggleString)
      }
    } catch(ex) {
      console.log(ex)
    }
  
    return localToggles
  }

  const localToggles = getLocalToggles()
  const [toggleActive, setToggleActive] = useState(localToggles.toggleActive);
  const [toggleActiveGauge, setToggleActiveGauge] = useState(localToggles.toggleActiveGauge);
  const [toggleStable, setToggleStable] = useState(localToggles.toggleStable);
  const [toggleVariable, setToggleVariable] = useState(localToggles.toggleVariable);

  const ssUpdated = () => {
    setVeToken(stores.stableSwapStore.getStore('veToken'))
    const as = stores.stableSwapStore.getStore('pairs');

    const filteredAssets = as.filter((asset) => {
      return asset.gauge && asset.gauge.address
    })
    setGauges(filteredAssets)


    const nfts = stores.stableSwapStore.getStore('vestNFTs');
    setVestNFTs(nfts)

    if(nfts && nfts.length > 0) {
      setToken(nfts[0]);
    }

    if(nfts && nfts.length > 0 && filteredAssets && filteredAssets.length > 0) {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_VOTES, content: { tokenID: nfts[0].id } })
      stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_BALANCES, content: { tokenID: nfts[0].id } })
    }

    forceUpdate()
  }

  useEffect(() => {
    const vestVotesReturned = (vals) => {
      setVotes(vals.map((asset) => {
        return {
          address: asset?.address,
          value: BigNumber((asset && asset.votePercent) ? asset.votePercent : 0).toNumber(0)
        }
      }))
      forceUpdate()
    }

    const vestBalancesReturned = (vals) => {
      setGauges(vals)
      forceUpdate()
    }

    const stableSwapUpdated = () => {
      ssUpdated()
    }

    const voteReturned = () => {
      setVoteLoading(false)
    }

    ssUpdated()

    // stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_NFTS, content: {} })

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    stores.emitter.on(ACTIONS.VOTE_RETURNED, voteReturned);
    stores.emitter.on(ACTIONS.ERROR, voteReturned);
    stores.emitter.on(ACTIONS.VEST_VOTES_RETURNED, vestVotesReturned)
    // stores.emitter.on(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned)
    stores.emitter.on(ACTIONS.VEST_BALANCES_RETURNED, vestBalancesReturned)

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
      stores.emitter.removeListener(ACTIONS.VOTE_RETURNED, voteReturned);
      stores.emitter.removeListener(ACTIONS.ERROR, voteReturned);
      stores.emitter.removeListener(ACTIONS.VEST_VOTES_RETURNED, vestVotesReturned)
      // stores.emitter.removeListener(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned)
      stores.emitter.removeListener(ACTIONS.VEST_BALANCES_RETURNED, vestBalancesReturned)
    };
  }, []);

  const onVote = () => {
    setVoteLoading(true)
    stores.dispatcher.dispatch({ type: ACTIONS.VOTE, content: { votes, tokenID: token.id }})
  }

  let totalVotes = votes.reduce((acc, curr) => { return BigNumber(acc).plus(BigNumber(curr.value).lt(0) ? (curr.value*-1) : curr.value).toNumber() }, 0 )

  const handleChange = (event) => {
    setToken(event.target.value);
    stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_VOTES, content: { tokenID: event.target.value.id } })
  }

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onBribe = () => {
    router.push('/bribe/create')
  }

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  
 

  const useStyles = makeStyles((theme) => ({

    container: {
      marginTop: "10%",
    },
    formControl: {
      minWidth: 120,
    },
    label: {
      color: "#CD74CC",
      "&.Mui-focused": {
        color: "#CD74CC",
      },
    },
    select: {
      border: "none",      
      "&.Mui-focused": {
        backgroundColor: "none",
      },
      '&:hover': {
        backgroundColor: "none",
      },
      "&:after": {
        borderBottomColor: "#CD74CC",
      },
      "& .MuiSvgIcon-root": {
        color: "#CD74CC",
      },
    },


  }))
  
  

  const renderListFilterOptions = () => {
    return(
      <>

        <Popper id={id} open={open} anchorEl={anchorEl} transition placement="bottom-end">
                {({ TransitionProps }) => (
                  <Fade {...TransitionProps} timeout={350}>
                    <div className={classes.filterContainer}>

                      <Typography className={classes.filterListTitle} variant="h5">List Filters</Typography>


                      <Grid container className={classes.labelContainer}>
                        <Grid item lg={9} className={classes.labelColumn}>
                          <Typography className={classes.filterLabel} variant="body1">Show Inactive Pools</Typography>
                        </Grid>
                        <Grid item lg={3} className={classes.alignContentRight}>
                          <Switch
                            color="primary"
                            checked={ toggleActive }
                            name={ 'toggleActive' }
                            onChange={ onToggle }
                          />
                        </Grid>
                      </Grid>


                    </div>
                  </Fade>
                )}
                </Popper>
      </>
    )
  }

  const onToggle = (event) => {

    const localToggles = getLocalToggles()

    /*switch (event.target.name) {
      case 'toggleActive':
        setToggleActive(event.target.checked)
        props.setToggleActive(event.target.checked)
        localToggles.toggleActive = event.target.checked
        break;
      case 'toggleActiveGauge':
        setToggleActiveGauge(event.target.checked)
        props.setToggleActiveGauge(event.target.checked)
        localToggles.toggleActiveGauge = event.target.checked
        break;
      case 'toggleStable':
        setToggleStable(event.target.checked)
        props.setToggleStable(event.target.checked)
        localToggles.toggleStable = event.target.checked
        break;
      case 'toggleVariable':
        setToggleVariable(event.target.checked)
        props.setToggleVariable(event.target.checked)
        localToggles.toggleVariable = event.target.checked
        break;
      default:

    }*/

    // set locally saved toggles
    try {
      localStorage.setItem('solidly-pairsToggle-v1', JSON.stringify(localToggles))
    } catch(ex) {
      console.log(ex)
    }
  }


  
  const renderMediumInput = (value, options) => {
    return (
      <div className={ classes.textField}>
        <div className={ classes.mediumInputContainer}>

          <Grid container>
            
            <Grid item md={6}>
              <Typography variant="body2" className={ classes.smallText }>Please select your veVARA:</Typography>              
            </Grid>

            <Grid container md={6} sm={12} xs={12} justifyContent='flex-end'>
              <div className={ classes.mediumInputAmount }>
                <Select
                  fullWidth
                  value={ value }
                  onChange={handleChange}
                  className={classesSelect.select}
                  InputProps={{
                    className: classes.mediumInput,
                  }}
                >
                  { options && options.map((option) => {
                    return (
                      <MenuItem key={option.id} value={option}>
                        <div className={ classes.menuOption }>
                          <Typography>Token #{option.id}</Typography>
                          <div>
                            <Typography align='right' className={ classes.smallerText }>{ formatCurrency(option.lockValue) }</Typography>
                            <Typography color='textSecondary' className={ classes.smallerText }>{veToken?.symbol}</Typography>
                          </div>
                        </div>
                      </MenuItem>
                    )
                  })}
                </Select>
              </div>
            </Grid>


          </Grid>
        </div>
      </div>
    )
  }

  const classesSelect = useStyles();

  const renderTopBar = () => {
    return(
      <>                  
            <Grid container className={classes.gridBanner} xs={12}  justifyContent='space-between'>

              <Grid direction="column" spacing={6} xs={8}>    
                <Grid item xs={12} className={classes.toolbarInfo}><Typography className={classes.title} variant="h1">Vote</Typography></Grid>                                
                <Grid item xs={12} className={classes.toolbarInfo1}><Typography className={classes.subtitle} variant="h2">Select your veVARA and use <a  className={classes.subtitle1}>100%</a> of your votes for one or more pools to earn bribes and trading fees. </Typography></Grid>                                  
              </Grid>   

              <Grid item xs={4}>            
                <div className={classes.sphere}></div>  
              </Grid>                                            

          </Grid>
        
      </>
    )
  }

  const renderContainersCenter = () => {
    return(
      <>
        <Grid container className={classes.searchContainer}  justifyContent='space-evenly' spacing={2}>
              <Grid item xs={5}>

                <TextField
                  className={classes.searchVote}              
                  fullWidth
                  placeholder="KAVA, USDC, VARA..."
                  value={search}
                  onChange={onSearchChanged}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="center" className={classes.searchVote1}              >
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>  
                      
              <Grid item xs={6}>
                <div className={ classes.tokenIDContainer }>
                  { renderMediumInput(token, vestNFTs) }
                </div>
              </Grid>

              <Grid item xs={1}>      
            
                <Tooltip placement="top" title="Filter list">        
                  <IconButton onClick={handleClick} className={ classes.filterButton } aria-label="filter list">                                    
                      <FilterListIcon />              
                  </IconButton>          

                </Tooltip>
              </Grid>
            </Grid>

            <Grid container className={classes.gridInfoVote} xs={12} justifyContent="space-around" alignItems="center">                                    
                <Typography className={classes.toolbarText}>
                    Votes are due by Wendnesday at <a className={classes.toolbarSubText}>23:59 UTC</a>, when the next epoch begins. Each veNFT can only cast votes once per epoch.
                    Your vote will allocate <a className={classes.toolbarSubText}>100%</a> of that  veNFT's vote power. Each veNFT's votes will carry over into the next epoch.
                    Voters will earn bribes no matter when in the epoch the bribes are added.  <a className={ classes.disclaimerDocs1 }>For details refer</a><a href='https://equilibre-finance.gitbook.io/equilibre-finance/what-is-equilibre/trading-and-liquidity-marketplace' className={ classes.disclaimerDocs }>docs</a>
                </Typography>            
          </Grid> 
      </>
    )
  }


  const renderTable = () => {
    return(
      <>
          <Paper elevation={0} className={ classes.tableContainer }>
            <GaugesTable gauges={ gauges.filter((pair) => {
              if(!search || search === '') {
                return true
              }

              const searchLower = search.toLowerCase()

              if(pair.symbol.toLowerCase().includes(searchLower) || pair.address.toLowerCase().includes(searchLower) ||
                pair.token0.symbol.toLowerCase().includes(searchLower) || pair.token0.address.toLowerCase().includes(searchLower) || pair.token0.name.toLowerCase().includes(searchLower) ||
                pair.token1.symbol.toLowerCase().includes(searchLower) || pair.token1.address.toLowerCase().includes(searchLower) ||  pair.token1.name.toLowerCase().includes(searchLower)) {
                return true
              }

              return false

            }) } setParentSliderValues={setVotes} defaultVotes={votes} veToken={veToken} token={ token } />

          </Paper>
      </>
    )
  }

  const renderBottom = () => {
    return(
      <>
        <Paper elevation={10} className={ `${BigNumber(totalVotes).gt(0) ? classes.actionButtons : classes.actionButtons1}` }>
          <Grid container spacing={2}>
            <Grid item lg={6}>
              <div className={ classes.infoSection }>
                <Typography>Voting Power Used: </Typography>
                <Typography className={ `${BigNumber(totalVotes).gt(100) ? classes.errorText : classes.helpText}` }>{ totalVotes } %</Typography>
              </div>
            </Grid>
            <Grid item lg={6}>
              <Button
                className={ classes.buttonOverrideFixed }
                variant='contained'
                size='large'
                color='primary'
                disabled={ voteLoading || BigNumber(totalVotes).eq(0) || BigNumber(totalVotes).gt(100) }
                onClick={ onVote }
                >
                <Typography className={ classes.actionButtonText }>{ voteLoading ? `Casting Votes` : `Cast Votes` }</Typography>
                { voteLoading && <CircularProgress size={10} className={ classes.loadingCircle } /> }
              </Button>
            </Grid>
          </Grid>

          {renderListFilterOptions()}

        </Paper>
      </>
    )
  }

  return (

    <div className={ classes.container }>

      {renderTopBar()}
      {renderContainersCenter()}
      {renderTable()}
      {renderBottom()}
      
      
    </div>
  );
}
