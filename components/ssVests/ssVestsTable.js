import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { styled, makeStyles } from '@material-ui/core/styles';
import Skeleton from '@material-ui/lab/Skeleton';
import { Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, Typography, Toolbar, Grid } from '@material-ui/core';
import { useRouter } from "next/router";
import { formatCurrency } from '../../utils';
import moment from 'moment';

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: 'NFT', numeric: false, disablePadding: false, label: 'Pair' },
  {
    id: 'Locked Amount',
    numeric: true,
    disablePadding: false,
    label: 'Vest Amount',
  },
  {
    id: 'Lock Value',
    numeric: true,
    disablePadding: false,
    label: 'Vest Value',
  },
  {
    id: 'Lock Expires',
    numeric: true,
    disablePadding: false,
    label: 'Vest Expires',
  },
  {
    id: '',
    numeric: true,
    disablePadding: false,
    label: 'Actions',
  },
];

function EnhancedTableHead(props) {
  const { classes, order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            className={classes.overrideTableHead}
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : 'asc'} onClick={createSortHandler(headCell.id)}>
              <Typography variant='h5' className={ classes.headerText }>{headCell.label}</Typography>
              {orderBy === headCell.id ? <span className={classes.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span> : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  assetTableRow: {
    '&:hover': {
      background: 'rgba(104,108,122,0.05)',
    },
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  inline: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    marginRight: '12px',
  },
  textSpaced: {
    fontFamily:  'Righteous !important',
    lineHeight: '1.5',
    fontWeight: '200',
    fontSize: '12px'
  },
  textSpaced1: {
    fontFamily:  'Arista !important',
    lineHeight: '1.5',
    fontWeight: '200',
    fontSize: '12px'
  },
  
  headerText: {
    fontWeight: '200',
    fontSize: '12px'
  },
  cell: {},
  cellSuccess: {
    color: '#4eaf0a',
  },
  cellAddress: {
    cursor: 'pointer',
  },
  aligntRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  skelly: {
    marginBottom: '12px',
    marginTop: '12px',
  },
  skelly1: {
    marginBottom: '12px',
    marginTop: '24px',
  },
  skelly2: {
    margin: '12px 6px',
  },
  tableBottomSkelly: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  assetInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    padding: '24px',
    width: '100%',
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(104, 108, 122, 0.25)',
    background: 'radial-gradient(circle, rgba(63,94,251,0.7) 0%, rgba(47,128,237,0.7) 48%) rgba(63,94,251,0.7) 100%',
  },
  assetInfoError: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    padding: '24px',
    width: '100%',
    flexWrap: 'wrap',
    borderBottom: '1px rgba(104, 108, 122, 0.25)',
    background: '#dc3545',
  },
  infoField: {
    flex: 1,
  },
  flexy: {
    padding: '6px 0px',
  },
  overrideCell: {
    padding: '0px',
  },
  hoverRow: {
    cursor: 'pointer',
  },
  statusLiquid: {
    color: '#dc3545',
  },
  statusWarning: {
    color: '#FF9029',
  },
  statusSafe: {
    color: 'green',
  },
  img1Logo: {
    position: 'absolute',
    left: '0px',
    top: '0px',
    borderRadius: '30px'
  },
  img2Logo: {
    position: 'absolute',
    left: '20px',
    zIndex: '1',
    top: '0px'
  },
  overrideTableHead: {
    borderBottom: '1px solid rgba(104,108,122,0.2) !important',
  },
  doubleImages: {
    display: 'flex',
    position: 'relative',
    width: '70px',
    height: '35px'
  },

  buttonOverride: {   
    background: 'linear-gradient(to right, #CD74CC, #FFBD59, #70DD88)',
    borderRadius: '30px',
    color: '#0D142E',
    fontWeight: '700',
    width: '220px',
    position: 'relative',
    height: '40px',
    marginLeft: '15px',
    '&:hover': {
      background: 'rgb(19, 44, 60)'
    },
  },
  toolbar: {
    margin: '24px 0px',
    padding: '0px',
  },
  tableContainer: {    
    borderRadius: '30px',    
    border: '1px solid transparent',
    background: 'linear-gradient(#141d40 0 0) padding-box, linear-gradient(to bottom, #CD74CC, #FFBD59 , #70DD88) border-box;',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  actionButtonText: {
    fontSize: '15px',
    fontWeight: '700',
  },
  gridBanner: {          
    height: '220px',
    margin: '10px',
    padding: '18px',    
    // marginTop: '80px',    
    borderRadius: '30px',        
    border: '1px solid transparent',
    background: 'linear-gradient(#141d40 0 0) padding-box, linear-gradient(to bottom, #CD74CC, #FFBD59 , #70DD88) border-box;',
  },
  title: {
    fontFamily: 'Righteous !important',
    fontSize: '32px',
    color: '#FFFFFF',        
    fontStyle: 'normal',
    fontWeight: '800',
    lineHeight: '62px',
    letterSpacing: '0.13em'    
  },
  subtitle: {            
    fontFamily: 'Arista !important',    
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: '15px',
    lineHeight: '27px',
    letterSpacing: '0.13em',
    color: '#FFFFFF'
  },
  textEqual: {            
    color: '#FFBD59'
  },
  sphere: {        
    width: '100%',
    height: '200px',
    background: 'url(\'/images/Rainbow_clock_4.png\') no-repeat right',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',    
    position: 'relative',
    bottom: '40px',        
  },
  toolbarInfo: {
    margin: '15px',
    letterSpacing: '6px'    
  }
}));


const Img = styled('img')({
  margin: 'auto',
  display: 'block',
  maxWidth: '100%',
  maxHeight: '100%',
});


const EnhancedTableToolbar = (props) => {
  const classes = useStyles()
  const router = useRouter()

  const [search, setSearch] = useState('');

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onCreate = () => {
    router.push('/vest/create')
  }

  return (
    <Toolbar className={ classes.toolbar }>

      <Grid container spacing={2}>

        <Grid container className={classes.gridBanner} xs={12} spacing={6} alignItems="flex-start">

            <Grid direction="column" spacing={6} xs={8}>       

              <Grid className={classes.toolbarInfo}><Typography className={classes.title}>Vest</Typography></Grid>                  
              <Grid className={classes.toolbarInfo}><Typography className={classes.subtitle}>More tokens locked for longer <a className={classes.textEqual}>=</a> greater voting power <a className={classes.textEqual}>=</a> higher rewards</Typography></Grid>                    

              <Grid item xs={4}>
                <Button className={ classes.buttonOverride } onClick={ onCreate }>
                  <Typography className={ classes.actionButtonText }>Create Lock</Typography>
                </Button>   
              </Grid> 

            </Grid>   

            
            <Grid item display='flex' xs={4}>            
              <div className={classes.sphere}></div>  
            </Grid>
                                
          </Grid>  

      </Grid>   
      
    </Toolbar>
  );
};

export default function EnhancedTable({ vestNFTs, govToken, veToken }) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('balance');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (!vestNFTs) {
    return (
      <div className={classes.root}>
        <Skeleton variant="rect" width={'100%'} height={40} className={classes.skelly1} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
      </div>
    );
  }

  const onView = (nft) => {

    
    router.push(`/vest/${nft.id}`);
  };

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, vestNFTs.length - page * rowsPerPage);

  return (
    <div className={classes.root}>
      <EnhancedTableToolbar />
      <Paper elevation={0} className={ classes.tableContainer}>
        <TableContainer>
          <Table className={classes.table} aria-labelledby='tableTitle' size={'medium'} aria-label='enhanced table'>
            <EnhancedTableHead classes={classes} order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
            <TableBody>
              {stableSort(vestNFTs, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                if (!row) {
                  return null;
                }
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    key={labelId}
                    className={classes.assetTableRow}
                  >
                    <TableCell className={classes.cell}>
                      <div className={classes.inline}>
                        <div className={ classes.doubleImages}>
                          <img
                            className={classes.img1Logo}
                            src={ govToken?.logoURI }
                            width='35'
                            height='35'
                            alt=''
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/tokens/unknown-logo.png';
                            }}
                          />
                        </div>
                        <div>
                          <Typography variant='h2' className={classes.textSpaced}>
                            {row.id}
                          </Typography>
                          <Typography variant='h5' className={classes.textSpaced1} color='textSecondary'>
                            NFT ID
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={classes.cell} align='right'>
                      <Typography variant='h2' className={classes.textSpaced}>
                        {formatCurrency(row.lockAmount)}
                      </Typography>
                      <Typography variant='h5' className={classes.textSpaced1} color='textSecondary'>
                        { govToken?.symbol }
                      </Typography>
                    </TableCell>
                    <TableCell className={classes.cell} align='right'>
                      <Typography variant='h2' className={classes.textSpaced}>
                        {formatCurrency(row.lockValue)}
                      </Typography>
                      <Typography variant='h5' className={classes.textSpaced1} color='textSecondary'>
                        { veToken?.symbol }
                      </Typography>
                    </TableCell>
                    <TableCell className={classes.cell} align='right'>
                      <Typography variant="h2" className={classes.textSpaced}>
                        { moment.unix(row.lockEnds).format('DD/MM/YYYY') }
                      </Typography>
                      <Typography variant="h5" className={classes.textSpaced1} color='textSecondary'>
                        Expires <a className={classes.textSpaced}>{ moment.unix(row.lockEnds).fromNow() }</a> 
                      </Typography>
                    </TableCell>
                    <TableCell className={classes.cell} align='right'>
                      <Button
                        variant='outlined'
                        color='primary'
                        onClick={() => {
                          onView(row);
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={vestNFTs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
}
