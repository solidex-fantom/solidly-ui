import abis from "../abis";

export const GOV_TOKEN_ADDRESS = "0xBfB032e2a9564e50E970c6aEf4C1E664d1F98D36";
export const GOV_TOKEN_NAME = "Équilibre";
export const GOV_TOKEN_SYMBOL = "VARA";
export const GOV_TOKEN_DECIMALS = 18;
export const GOV_TOKEN_LOGO = "https://github.com/equilibre-finance.png";
export const GOV_TOKEN_ABI = abis.tokenABI;

//VotingEscrow
export const VE_TOKEN_ADDRESS = "0xb25b44233bA8F5f9A59f67855BaD4821564bAE82";
export const VE_TOKEN_NAME = "veVARA";
export const VE_TOKEN_SYMBOL = "veVARA";
export const VE_TOKEN_DECIMALS = 18;
export const VE_TOKEN_LOGO = "https://github.com/equilibre-finance.png";
export const VE_TOKEN_ABI = abis.veTokenABI;

export const WKAVA_ADDRESS = "0xFa95D53e0B6e82b2137Faa70FD7E4a4DC70Da449";
export const WKAVA_NAME = "Wrapped Kava";
export const WKAVA_SYMBOL = "wKAVA";
export const WKAVA_DECIMALS = 18;
export const WKAVA_ABI = abis.wftmABI;
export const WKAVA_LOGO =
    "https://assets.coingecko.com/coins/images/9761/large/kava.png";

export const KAVA_ADDRESS = "KAVA";
export const KAVA_NAME = "Kava";
export const KAVA_SYMBOL = "KAVA";
export const KAVA_DECIMALS = 18;
export const KAVA_LOGO =
  "https://assets.coingecko.com/coins/images/9761/large/kava.png";

// PairFactory
export const FACTORY_ADDRESS = "0x5Ba67865851e5918b31BFD010F50cf1d47164c58";
export const FACTORY_ABI = abis.factoryABI;
// Classic Router
export const ROUTER_ADDRESS = "0x0754f8a15bD635dB8C47107Ae16c3aaa373593E1";
export const ROUTER_ABI = abis.routerABI;
//RewardsDistributor
export const VE_DIST_ADDRESS = "0xB3EECC89f4F2c30ed455199F49e898aA18Add483";
//export const VE_DIST_ADDRESS_FTM = "0xA5CEfAC8966452a78d6692837b2ba83d19b57d07";
export const VE_DIST_ABI = abis.veDistABI;

export const VOTER_ADDRESS = "0x3b487BD74d6A7369cD41a65776cd8F9af43878a6";
export const VOTER_ABI = abis.voterABI;

export const LIBRARY_ADDRESS = "0x0754f8a15bD635dB8C47107Ae16c3aaa373593E1";
export const LIBRARY_ABI = abis.solidlyLibraryABI;

export const WRAPPED_EXTERNAL_BRIBE_FACTORY_ADDRESS = "0x6b261830725123a390909DBdca767C8252d3411D";

export const ERC20_ABI = abis.erc20ABI;
export const PAIR_ABI = abis.pairABI;
export const GAUGE_ABI = abis.gaugeABI;
export const BRIBE_ABI = abis.bribeABI;
export const TOKEN_ABI = abis.tokenABI;
export const WRAPPED_EXTERNAL_BRIBE_FACTORY_ABI = abis.wrappedBribeFactoryABI;

//!This is not used anywhere, meanwhile we are researching we leave it
export const MULTICALL_ADDRESS = "0x1Af096bFA8e495c2F5Eeb56141E7E2420066Cf78";
