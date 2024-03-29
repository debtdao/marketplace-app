import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getAddress } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

import { ThunkAPI } from '@frameworks/redux';
import {
  EnableCollateralAssetProps,
  AddCollateralProps,
  AddSpigotProps,
  CollateralModule,
  CollateralEvent,
  Address,
  RootState,
  ClaimRevenueProps,
  ReleaseCollateraltProps,
  TradeableProps,
  ClaimOperatorTokensProps,
  TokenFragRepsonse,
  EscrowDeposit,
  TokenView,
} from '@src/core/types';
import { TxActionButton } from '@src/client/components/app';
import { formatEscrowDeposit } from '@src/utils/collateral';

import { TokensSelectors } from '../tokens/tokens.selectors';

const setSelectedEscrow = createAction<{ escrowAddress?: string }>('collateral/setSelectedEscrow');
const setSelectedSpigot = createAction<{ spigotAddress?: string }>('collateral/setSelectedSpigot');
const setSelectedRevenueContract = createAction<{ contractAddress?: string }>('collateral/setSelectedRevenueContract');
const setSelectedCollateralAsset = createAction<{ assetAddress?: string }>('collateral/setSelectedCollateralAsset');

// util function to set collateral to state from getLine responses
const saveModuleToMap = createAsyncThunk<
  { moduleAddress: Address; module: CollateralModule },
  { moduleAddress: Address; module: CollateralModule },
  ThunkAPI
>('collateral/saveModuleToMap', async (props) => props);

const saveEventsToMap = createAsyncThunk<
  { moduleAddress: Address; events: CollateralEvent[] },
  { moduleAddress: Address; events: CollateralEvent[] },
  ThunkAPI
>('collateral/saveEventsToMap', async (props) => props);

const enableCollateral = createAsyncThunk<
  { escrowDeposit: EscrowDeposit; lineAddress: string; contract: string; token: TokenView; success: boolean },
  EnableCollateralAssetProps,
  ThunkAPI
>('collateral/enableCollateral', async (props, { extra, getState, dispatch }) => {
  const { wallet } = getState();
  const { services } = extra;
  const userAddress = wallet.selectedAddress;
  if (!userAddress) throw new Error('WALLET NOT CONNECTED');

  // TODO chekc that they are arbiter on line that owns Escrowbeforethey send tx
  const { collateralService } = services;
  const tx = await collateralService.enableCollateral(props);
  const escrowDeposit = formatEscrowDeposit(props.token);
  if (!tx) {
    throw new Error('failed to enable collateral');
  }
  return {
    ...props,
    escrowDeposit: escrowDeposit,
    contract: props.escrowAddress,
    success: !!tx,
  };
});

const addCollateral = createAsyncThunk<
  { contract: string; token: string; amount: BigNumber; success: boolean },
  AddCollateralProps,
  ThunkAPI
>('collateral/addCollateral', async (props, { extra, getState, dispatch }) => {
  const { wallet } = getState();
  const { services } = extra;
  const userAddress = wallet.selectedAddress;
  if (!userAddress) throw new Error('WALLET NOT CONNECTED');
  const { token, amount, escrowAddress } = props;

  console.log('addCollateral action props', props);
  // TODO chekc that they are arbiter on line that owns Escrowbeforethey send tx
  const { collateralService } = services;
  const tx = await collateralService.addCollateral(props);
  console.log('addCollateral tx', tx);

  if (!tx) {
    throw new Error('failed to add collateral');
  }

  return {
    contract: escrowAddress,
    token: token,
    amount: amount,
    success: !!tx,
  };
});

const releaseCollateral = createAsyncThunk<
  { contract: string; token: string; amount: BigNumber; success: boolean },
  ReleaseCollateraltProps,
  ThunkAPI
>('collateral/releaseCollateral', async (props, { extra, getState, dispatch }) => {
  const { wallet } = getState();
  const { services } = extra;
  const userAddress = wallet.selectedAddress;
  if (!userAddress) throw new Error('WALLET NOT CONNECTED');
  const { token, amount, escrowAddress } = props;

  console.log('addCollateral action props', props);
  // TODO chekc that they are arbiter on line that owns Escrowbeforethey send tx
  const { collateralService } = services;
  const tx = await collateralService.releaseCollateral(props);
  console.log('addCollateral tx', tx);

  if (!tx) {
    throw new Error('failed to add collateral');
  }

  return {
    contract: escrowAddress,
    token: token,
    amount: amount,
    success: !!tx,
  };
});

const addSpigot = createAsyncThunk<{ contract: string; asset: string; success: boolean }, AddSpigotProps, ThunkAPI>(
  'collateral/addSpigot',
  async (props, { extra, getState, dispatch }) => {
    const { wallet } = getState();
    const { services } = extra;
    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    // TODO check that they are arbiter on line that owns Escrowbeforethey send tx

    const { collateralService } = services;
    console.log('col service props', props);
    const tx = await collateralService.addSpigot(props);
    console.log('addSpigot tx', tx);

    if (!tx) {
      throw new Error('failed to enable spigot');
    }

    return {
      contract: props.lineAddress,
      asset: props.spigotAddress,
      success: !!tx,
    };
  }
);

const claimRevenue = createAsyncThunk<{ contract: string; success: boolean }, ClaimRevenueProps, ThunkAPI>(
  'collateral/claimRevenue',
  async (props, { extra, getState, dispatch }) => {
    const { wallet } = getState();
    const { services } = extra;
    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    console.log('collat svc: claimRevenue action props', props);
    // TODO chekc that they are arbiter on line that owns Escrowbeforethey send tx
    const { collateralService } = services;
    const tx = await collateralService.claimRevenue(props);
    console.log('addCollateral tx', tx);

    if (!tx) {
      throw new Error('failed to add collateral');
    }

    return {
      contract: props.revenueContract,
      success: !!tx,
    };
  }
);

const claimOperatorTokens = createAsyncThunk<{ claimed: string | undefined }, ClaimOperatorTokensProps, ThunkAPI>(
  'collateral/claimOperatorTokens',
  async (props, { extra }) => {
    const { collateralService } = extra.services;
    const tx = await collateralService.claimOperatorTokens(props);
    return {
      claimed: tx.value?.toString(),
    };
  }
);
// TODO: Do Optimistic State update for all Line Actions

const tradeable = createAsyncThunk<
  {
    tokenAddressMap: { unusedTokens: string; ownerTokens: string; operatorTokens: string };
    spigotAddress: string;
    tokenPrices: {
      [address: string]: BigNumber;
    };
    tokenAddress: string;
    lineAddress: string;
    success: boolean;
  },
  TradeableProps,
  ThunkAPI
>('collateral/tradeable', async (props, { extra, getState }) => {
  const { lineAddress, network, tokenAddress, spigotAddress } = props;
  const { collateralService } = extra.services;

  const tradeableTxn = await collateralService.getTradeableTokens(lineAddress, tokenAddress);
  const ownerTokenTxn = await collateralService.getOwnerTokens(spigotAddress, tokenAddress);
  const operatorTokenTxn = await collateralService.getOperatorTokens(spigotAddress, tokenAddress);

  if (!tradeableTxn || !ownerTokenTxn || !operatorTokenTxn) {
    throw new Error('failed to view tradeable tokens');
  }

  const tokenAddressMap = {
    unusedTokens: tradeableTxn.sub(ownerTokenTxn).toString(),
    ownerTokens: ownerTokenTxn.toString(),
    operatorTokens: operatorTokenTxn.toString(),
  };

  const state: RootState = getState();
  const tokenPrices = TokensSelectors.selectTokenPrices(state);

  return {
    tokenAddressMap,
    spigotAddress,
    tokenPrices,
    tokenAddress: getAddress(tokenAddress),
    lineAddress: lineAddress,
    success: !!tradeableTxn && !!ownerTokenTxn && !!operatorTokenTxn,
  };
});

export const CollateralActions = {
  setSelectedEscrow,
  setSelectedSpigot,
  setSelectedRevenueContract,
  setSelectedCollateralAsset,
  enableCollateral,
  addCollateral,
  releaseCollateral,
  addSpigot,
  claimRevenue,
  tradeable,
  saveModuleToMap,
  saveEventsToMap,
  claimOperatorTokens,
};
