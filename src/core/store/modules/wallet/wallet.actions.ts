import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { AppDispatch, ThunkAPI } from '@frameworks/redux';
import { getEthersProvider, ExternalProvider } from '@frameworks/ethers';
import { Theme, RootState, DIContainer, Subscriptions, Network, EVENT_LOGIN } from '@types';
import { isValidAddress, getProviderType, getNetwork, getNetworkId } from '@utils';
import { useAppSelector } from '@src/client/hooks';

import { NetworkActions } from '../network/network.actions';
import { AppActions } from '../app/app.actions';
import { TokensSelectors } from '../tokens/tokens.selectors';
import { TokensActions } from '../tokens/tokens.actions';

const walletChange = createAction<{ walletName: string }>('wallet/walletChange');
const addressChange = createAction<{ address: string }>('wallet/addressChange');
const networkChange = createAction<{ network: number }>('wallet/networkChange');
const balanceChange = createAction<{ balance: string }>('wallet/balanceChange');

const getSubscriptions = (dispatch: AppDispatch, customSubscriptions?: Subscriptions) => ({
  wallet: (wallet: any) => {
    dispatch(walletChange({ walletName: wallet.name }));
    if (customSubscriptions && customSubscriptions.wallet) customSubscriptions.wallet(wallet);
  },
  address: (address: string) => {
    dispatch(addressChange({ address }));
    if (address) dispatch(getAddressEnsName({ address }));
    if (customSubscriptions && customSubscriptions.address) customSubscriptions.address(address);
  },
  network: (network: number) => {
    dispatch(networkChange({ network }));
    if (customSubscriptions && customSubscriptions.network) customSubscriptions.network(network);
  },
  balance: (balance: string) => {
    dispatch(balanceChange({ balance }));
    if (customSubscriptions && customSubscriptions.balance) customSubscriptions.balance(balance);
  },
});

const getAddressEnsName = createAsyncThunk<{ addressEnsName: string }, { address: string }, ThunkAPI>(
  'wallet/getAddressEnsName',
  async ({ address }, { extra }) => {
    const { userService } = extra.services;
    const addressEnsName = await userService.getAddressEnsName({ address });
    return { addressEnsName };
  }
);

interface WalletSelectProps {
  network: Network;
  walletName?: string;
}

const walletSelect = createAsyncThunk<{ isConnected: boolean }, WalletSelectProps, ThunkAPI>(
  'wallet/walletSelect',
  async ({ walletName, network }, { dispatch, getState, extra }) => {
    const { context, config } = extra;
    //Yearn SDK to be removed;
    const { wallet, web3Provider, yearnSdk } = context;
    const { NETWORK, ALLOW_DEV_MODE, SUPPORTED_NETWORKS, NETWORK_SETTINGS } = config;
    const { theme, settings } = getState();

    if (!wallet.isCreated) {
      const customSubscriptions: Subscriptions = {
        wallet: (wallet) => {
          web3Provider.register('wallet', getEthersProvider(wallet.provider));
          const providerType = getProviderType(network);
          const sdkInstance = yearnSdk.getInstanceOf(network);
          sdkInstance.context.setProvider({
            read: web3Provider.getInstanceOf(providerType),
            write: web3Provider.getInstanceOf('wallet'),
          });
        },
        address: () => {
          if (ALLOW_DEV_MODE && settings.devMode.enabled && isValidAddress(settings.devMode.walletAddressOverride)) {
            dispatch(addressChange({ address: settings.devMode.walletAddressOverride }));
            dispatch(getAddressEnsName({ address: settings.devMode.walletAddressOverride }));
          }
        },
        network: (networkId) => {
          // console.log('subgraph wallet select: ', network);
          const supportedNetworkSettings = SUPPORTED_NETWORKS.find(
            (network) => NETWORK_SETTINGS[network].networkId === networkId
          );

          // Handle unsupported networks
          const supportedNetworkIds = SUPPORTED_NETWORKS.map((network) => getNetworkId(network));
          if (!supportedNetworkIds.includes(networkId)) {
            web3Provider.register('wallet', getEthersProvider(wallet.provider as ExternalProvider));
            const unsupportedNetwork = getNetwork(networkId);
            dispatch(NetworkActions.changeNetwork({ network: unsupportedNetwork }));
          }

          // Add Web3 provider to Yearn context for supported networks
          else if (wallet.isConnected && supportedNetworkSettings) {
            web3Provider.register('wallet', getEthersProvider(wallet.provider as ExternalProvider));
            const network = getNetwork(networkId);
            const providerType = getProviderType(network);
            const sdkInstance = yearnSdk.getInstanceOf(network);
            sdkInstance.context.setProvider({
              read: web3Provider.getInstanceOf(providerType),
              write: web3Provider.getInstanceOf('wallet'),
            });
            // console.log('subgraph - wallet select change network', network);
            dispatch(NetworkActions.changeNetwork({ network }));
          }
        },
      };
      const subscriptions = getSubscriptions(dispatch, customSubscriptions);
      wallet.create(network ?? NETWORK, subscriptions, theme.current);
    }
    const isConnected = await wallet.connect({ name: walletName });

    // @analytics
    dispatch(AppActions.logAppAnalytics({ type: 'id', data: {} }));
    dispatch(
      AppActions.logAppAnalytics({
        type: 'track',
        data: { eventName: EVENT_LOGIN },
      })
    );

    // Generate User Tokens Map in state with supported tokens from subgraph
    const supportedTokens = TokensSelectors.selectSupportedTokens(getState());
    dispatch(TokensActions.getUserTokens({ addresses: supportedTokens }));
    return { isConnected };
  }
);

const changeWalletTheme =
  (theme: Theme) => async (dispatch: AppDispatch, getState: () => RootState, container: DIContainer) => {
    const { wallet } = container.context;
    if (wallet.isCreated && wallet.changeTheme) {
      wallet.changeTheme(theme);
    }
  };

// export interface ChangeWalletNetworkResult {
//   networkChanged: boolean;
//   networkId: number;
// }

// const changeWalletNetwork = createAsyncThunk<ChangeWalletNetworkResult, { network: Network }, ThunkAPI>(
//   'wallet/changeWalletNetwork',
//   async ({ network }, { extra }) => {
//     const { wallet } = extra.context;
//     console.log('subgraph changeWalletNetwork network: ', network);
//     console.log('subgraph changeWalletNetwork wallet: ', wallet);
//     let networkChanged = false;
//     if (wallet.isCreated && wallet.changeNetwork) {
//       networkChanged = await wallet.changeNetwork(network);
//     }
//     const networkId = 1;
//     return { networkChanged, networkId };
//   }
// );

export interface ChangeWalletNetworkResult {
  networkChanged: boolean;
  network: Network;
}

const changeWalletNetwork = createAsyncThunk<ChangeWalletNetworkResult, { network: Network }, ThunkAPI>(
  'wallet/changeWalletNetwork',
  async ({ network }, { extra }) => {
    const { wallet } = extra.context;

    let networkChanged = true;
    // let networkChanged = false;
    // if (wallet.isCreated && wallet.changeNetwork) {
    //   networkChanged = await wallet.changeNetwork(network);
    // }
    // console.log('subgraph change wallet network: ', networkChanged);
    // console.log('subgraph network: ', network);
    return { networkChanged, network };
  }
);

export const WalletActions = {
  walletChange,
  addressChange,
  networkChange,
  balanceChange,
  walletSelect,
  changeWalletTheme,
  changeWalletNetwork,
  getAddressEnsName,
};
