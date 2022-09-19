import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { NetworkConnector } from "@web3-react/network-connector";

const POLLING_INTERVAL = 12000;
const RPC_URLS = {
  2222: "https://evm.kava.io",
  2221: "https://evm.testnet.kava.io"
};


let obj = {}
if(process.env.NEXT_PUBLIC_CHAINID == 2222) {
  obj = { 2222: RPC_URLS[2222] }
} else {
  obj = { 2221: RPC_URLS[2221] }
}

export const network = new NetworkConnector({ urls: obj });

export const injected = new InjectedConnector({
  supportedChainIds: [parseInt(process.env.NEXT_PUBLIC_CHAINID)]
});

export const walletconnect = new WalletConnectConnector({
  rpc: {
    2222: RPC_URLS[2222],
    2221: RPC_URLS[2221]
  },
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAINID),
  bridge: "https://bridge.walletconnect.org",
  qrcode: true,
  pollingInterval: POLLING_INTERVAL
});

export const walletlink = new WalletLinkConnector({
  url: RPC_URLS[process.env.NEXT_PUBLIC_CHAINID],
  appName: "Équilibre",
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAINID),
});
