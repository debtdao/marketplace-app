// v1
// import Onboard from 'bnc-onboard';
// import { API } from 'bnc-onboard/dist/src/interfaces';
// v2
import Onboard2 from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import { ethers, utils } from 'ethers';
import { init } from '@web3-onboard/react';
import _ from 'lodash';

// import gnosisModule from '@web3-onboard/gnosis'
// import walletConnectModule from '@web3-onboard/walletconnect'
// import trezorModule from '@web3-onboard/trezor'
// import ledgerModule from '@web3-onboard/ledger'
// import coinbaseModule from '@web3-onboard/coinbase'
// import portisModule from '@web3-onboard/portis'
// import fortmaticModule from '@web3-onboard/fortmatic'
// import torusModule from '@web3-onboard/torus'
// import mewWalletModule from '@web3-onboard/mew-wallet'
// import trustModule from '@web3-onboard/trust'

import { getConfig } from '@config';
import { getNetworkId, getNetworkRpc } from '@utils';
import { Wallet, Subscriptions, Network, Theme, BlocknativeWalletState } from '@types';

import ledgerIframeWallet from './IframeWallet';

export class BlocknativeWalletImpl implements Wallet {
  private onboard?: any;
  private _networkVersion?: number;
  private _provider?: any;
  private _nativeBalance?: string;
  private _walletName?: string;
  private _selectedAddress?: string;

  private async hydrateWallet(): Promise<BlocknativeWalletState | undefined> {
    const wallets = await this.onboard.connectWallet();
    if (wallets[0]) {
      const wallet = wallets[0];
      this._walletName = wallet.label;
      this._networkVersion = getNetworkId(wallet.chains[0].id);
      this._nativeBalance = wallet.accounts[0].balance['ETH'];
      this._provider = wallet.provider;
      this._selectedAddress = wallet.accounts[0].address;
      return wallet;
    }
  }

  async connectedWallet(): Promise<BlocknativeWalletState | undefined> {
    try {
      const wallet = await this.hydrateWallet();
      console.log('get selected wallet', wallet);
      return wallet ? wallet : undefined;
    } catch (e) {
      console.log('get wallet accounts failed', e);
    }
  }

  get selectedAddress() {
    return this._selectedAddress ? utils.getAddress(this._selectedAddress) : undefined;
  }

  get networkVersion() {
    return this._networkVersion;
  }

  get balance() {
    return this._nativeBalance;
  }

  get name() {
    return this._walletName;
  }

  get provider() {
    return this._provider;
  }

  get isCreated(): boolean {
    console.log('is wallet created?', !!this.onboard);

    return !!this.onboard;
  }

  get isConnected(): Promise<boolean> {
    console.log('is wallet connected?', this.onboard?.connectWallet());
    console.log('wallet state?', this.onboard?.connectedWallet());

    return this.onboard
      .connectWallet()
      .then((wallets: any[]) => {
        if (wallets[0]) {
          // this.hydrateWallet();
          return !!wallets[0];
        }
      })
      .catch(() => false);
  }

  public create(network: Network, subscriptions: Subscriptions, theme?: Theme): boolean {
    console.log('create wallet', network);

    const networkId = getNetworkId(network);
    const { NETWORK_SETTINGS, BLOCKNATIVE_KEY, FORTMATIC_KEY, PORTIS_KEY } = getConfig();

    const rpcUrl = getNetworkRpc(network);
    const appName = 'Debt DAO';

    // const portis = portisModule({ apiKey: PORTIS_KEY || '' });
    // const fortmatic = fortmaticModule({ apiKey: FORTMATIC_KEY || '' });
    // const walletConnect = walletConnectModule({
    //   version: 2,
    //   handleUri: (uri) => {
    //     console.log(uri);
    //     return Promise.resolve(null);
    //   },
    //   projectId: '67a220622b8b90f197fbde2435a36ed3'
    // });
    // const trezor = trezorModule({
    //   email: 'help+wallet@debtdao.finance',
    //   appUrl: 'https://debtdao.finance'
    // });

    const wallets = [
      injectedModule(),
      // coinbaseModule(),
      // gnosisModule(),
      // ledgerModule(),
      // trustModule(),
      // torusModule(),
      // coinbaseModule(),

      // walletConnect,
      // portis,
      // fortmatic,
      // trezor,
    ];

    const chains = _.values(NETWORK_SETTINGS).map((net: any) => ({
      id: net.networkId,
      label: net.name,
      token: net.nativeCurrency.symbol,
      rpcUrl: net.rpcUrl,
    }));

    try {
      this.onboard = init({
        apiKey: BLOCKNATIVE_KEY,
        wallets,
        chains,
        accountCenter: {
          desktop: {
            enabled: false, // no annoying HUD for users
          },
          mobile: {
            enabled: false,
          },
        },
        appMetadata: {
          name: 'Debt DAO Cryptonative Credit Marketplace',
          // icon: blocknativeIcon,
          description:
            'The one stop shop for trustless onchain credit providing secured lending solutions for revenue-based financing to cryptonative entities',
          recommendedInjectedWallets: [
            { name: 'Frame', url: 'https://https://frame.sh/' },
            { name: 'MetaMask', url: 'https://metamask.io' },
          ],
          // agreement: {
          //   version: '1.0.0',
          //   termsUrl: 'https://www.blocknative.com/terms-conditions',
          //   privacyUrl: 'https://www.blocknative.com/privacy-policy'
          // },
          gettingStartedGuide: 'https://debtdao.org',
          explore: 'https://debtdao.org',
        },
        connect: {
          // configures the modal users see
          autoConnectAllPreviousWallet: true,
          showSidebar: false,
          autoConnectLastWallet: true,
        },
      });
    } catch (e) {
      console.log('failed to create wallet', e);
    }

    console.log('onboard v2 obj', this.onboard);

    return !!this.onboard;
  }

  public async walletCheck(theme: Theme) {
    const darkMode = theme !== 'light';
    if (this.onboard) {
      this.onboard.config({ darkMode });
    }
  }

  public async connect(args?: any): Promise<boolean> {
    console.log('connect onboard v2', await this.onboard.connectWallet());
    // console.log('wallet state?', this.onboard?.connectedWallet());
    try {
      return this.onboard
        .connectWallet()
        .then((wallets: any[]) => !!wallets[0])
        .catch(() => false);
    } catch (error) {
      console.log('error', error);
      return false;
    }
  }

  public async changeTheme(theme: Theme) {
    const darkMode = theme !== 'light';
    if (this.onboard) {
      this.onboard.config({ darkMode });
    }
  }

  public async addToken(
    tokenAddress: string,
    tokenSymbol: string,
    tokenDecimals: number,
    tokenImage: string
  ): Promise<boolean> {
    try {
      await this._provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private isMetaMask(): boolean {
    return this.name?.toUpperCase() === 'MetaMask'.toUpperCase();
  }
}
