import { createAction, createAsyncThunk, unwrapResult } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { ThunkAPI } from '@frameworks/redux';
import {
  Position,
  CreditLine,
  CreditLinePage,
  TransactionOutcome,
  // LinesUserSummary,
  UserPositionMetadata,
  Address,
  Wei,
  TokenAllowance,
  GetLinesArgs,
  GetLinePageArgs,
  PositionSummary,
} from '@types';
import {
  calculateSharesAmount,
  normalizeAmount,
  toBN,
  getNetwork,
  validateNetwork,
  // validateLineDeposit,
  // validateLineWithdraw,
  // validateMigrateLineAllowance,
  // parseError,
} from '@utils';
import { getConfig } from '@config';

import { TokensActions } from '../tokens/tokens.actions';

/* -------------------------------------------------------------------------- */
/*                                   Setters                                  */
/* -------------------------------------------------------------------------- */

const setSelectedLineAddress = createAction<{ lineAddress?: string }>('lines/setSelectedLineAddress');

/* -------------------------------------------------------------------------- */
/*                                 Clear State                                */
/* -------------------------------------------------------------------------- */

const clearLinesData = createAction<void>('lines/clearLinesData');
const clearUserData = createAction<void>('lines/clearUserData');
const clearTransactionData = createAction<void>('lines/clearTransactionData');
const clearSelectedLineAndStatus = createAction<void>('lines/clearSelectedLineAndStatus');
const clearLineStatus = createAction<{ lineAddress: string }>('lines/clearLineStatus');

/* -------------------------------------------------------------------------- */
/*                                 Fetch Data                                 */
/* -------------------------------------------------------------------------- */

// const initiateSaveLines = createAsyncThunk<void, string | undefined, ThunkAPI>(
//   'lines/initiateSaveLines',
//   async (_arg, { dispatch }) => {
//     await dispatch(getLines([]));
//   }
// );

const getLines = createAsyncThunk<{ linesData: (CreditLine[] | undefined)[] }, GetLinesArgs[], ThunkAPI>(
  'lines/getLines',
  async (categories, { getState, extra }) => {
    const { network } = getState();
    const { creditLineService } = extra.services;
    const linesData = await Promise.all(
      categories.map((params) => creditLineService.getLines({ network: network.current, params }))
    );
    return { linesData };
  }
);

const getLinePage = createAsyncThunk<{ linesDynamicData: CreditLinePage | undefined }, GetLinePageArgs, ThunkAPI>(
  'lines/getLinePage',
  async ({ id }, { getState, extra }) => {
    const { network } = getState();
    const { creditLineService } = extra.services;
    const linesDynamicData = await creditLineService.getLinePage({
      network: network.current,
      params: { id },
    });
    return { linesDynamicData };
  }
);

const getUserLinePositions = createAsyncThunk<
  { userLinesPositions: PositionSummary[] },
  { lineAddresses?: string[] },
  ThunkAPI
>('lines/getUserLinePositions', async ({ lineAddresses }, { extra, getState }) => {
  const { network, wallet } = getState();
  const { services } = extra;
  const userAddress = wallet.selectedAddress;
  if (!userAddress) {
    throw new Error('WALLET NOT CONNECTED');
  }
  const userLinesPositions = await services.creditLineService.getUserLinePositions({
    network: network.current,
    userAddress,
  });
  return { userLinesPositions };
});

export interface GetExpectedTransactionOutcomeProps {
  transactionType: 'DEPOSIT' | 'WITHDRAW';
  sourceTokenAddress: Address;
  sourceTokenAmount: Wei;
  targetTokenAddress: Address;
}

const getExpectedTransactionOutcome = createAsyncThunk<
  { txOutcome: TransactionOutcome },
  GetExpectedTransactionOutcomeProps,
  ThunkAPI
>(
  'lines/getExpectedTransactionOutcome',
  async (getExpectedTxOutcomeProps, { getState, extra }) => {
    const { network, app } = getState();
    const { services } = extra;
    const { creditLineService } = services;
    const { transactionType, sourceTokenAddress, sourceTokenAmount, targetTokenAddress } = getExpectedTxOutcomeProps;

    const accountAddress = getState().wallet.selectedAddress;
    if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

    const simulationsEnabled = app.servicesEnabled.tenderly;
    if (!simulationsEnabled) throw new Error('SIMULATIONS DISABLED');

    const txOutcome = await creditLineService.getExpectedTransactionOutcome({
      network: network.current,
      transactionType,
      accountAddress,
      sourceTokenAddress,
      sourceTokenAmount,
      targetTokenAddress,
    });

    return { txOutcome };
  },
  {
    // serializeError: parseError,
  }
);

/* -------------------------------------------------------------------------- */
/*                             Transaction Methods                            */
/* -------------------------------------------------------------------------- */

const approveDeposit = createAsyncThunk<void, { lineAddress: string; tokenAddress: string }, ThunkAPI>(
  'lines/approveDeposit',
  async ({ lineAddress, tokenAddress }, { getState, dispatch, extra }) => {
    const { wallet, network } = getState();
    const { creditLineService, transactionService } = extra.services;
    const amount = extra.config.MAX_UINT256;

    const accountAddress = wallet.selectedAddress;
    if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

    const tx = await creditLineService.approveDeposit({
      network: network.current,
      accountAddress,
      tokenAddress,
      lineAddress,
      amount,
    });

    await transactionService.handleTransaction({ tx, network: network.current });

    await dispatch(getDepositAllowance({ tokenAddress, lineAddress }));
  },
  {
    // serializeError: parseError,
  }
);

/////
// øld yearn<>zapper code. Keep for future zaps re-integration
/////

// const approveZapOut = createAsyncThunk<void, { lineAddress: string; tokenAddress: string }, ThunkAPI>(
//   'lines/approveZapOut',
//   async ({ lineAddress, tokenAddress }, { getState, dispatch, extra }) => {
//     const { wallet, network } = getState();
//     const { creditLineService, transactionService } = extra.services;
//     const amount = extra.config.MAX_UINT256;

//     const accountAddress = wallet.selectedAddress;
//     if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

//     const tx = await creditLineService.approveZapOut({
//       network: network.current,
//       accountAddress,
//       amount,
//       lineAddress,
//       tokenAddress,
//     });

//     await transactionService.handleTransaction({ tx, network: network.current });

//     await dispatch(getWithdrawAllowance({ tokenAddress, lineAddress }));
//   },
//   {
//     // serializeError: parseError,
//   }
// );

// const signZapOut = createAsyncThunk<{ signature: string }, { lineAddress: string }, ThunkAPI>(
//   'lines/signZapOut',
//   async ({ lineAddress }, { getState, extra }) => {
//     const { network, wallet } = getState();
//     const { creditLineService } = extra.services;
//     const { CONTRACT_ADDRESSES } = extra.config;

//     // NOTE: this values are hardcoded on zappers zapOut contract
//     const amount = '79228162514260000000000000000'; // https://etherscan.io/address/0xd6b88257e91e4E4D4E990B3A858c849EF2DFdE8c#code#F8#L83
//     const deadline = '0xf000000000000000000000000000000000000000000000000000000000000000'; // https://etherscan.io/address/0xd6b88257e91e4E4D4E990B3A858c849EF2DFdE8c#code#F8#L80

//     const accountAddress = wallet.selectedAddress;
//     if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

//     const signature = await creditLineService.signPermit({
//       network: network.current,
//       accountAddress,
//       lineAddress,
//       spenderAddress: CONTRACT_ADDRESSES.zapOut,
//       amount,
//       deadline,
//     });

//     return { signature };
//   },
//   {
//     // serializeError: parseError,
//   }
// );

const depositLine = createAsyncThunk<
  void,
  {
    lineAddress: string;
    tokenAddress: string;
    amount: BigNumber;
    targetUnderlyingTokenAmount: string | undefined;
    slippageTolerance?: number;
  },
  ThunkAPI
>(
  'lines/depositLine',
  async (
    { lineAddress, tokenAddress, amount, targetUnderlyingTokenAmount, slippageTolerance },
    { extra, getState, dispatch }
  ) => {
    const { network, wallet, lines, tokens, app } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    const { error: networkError } = validateNetwork({
      currentNetwork: network.current,
      walletNetwork: wallet.networkVersion ? getNetwork(wallet.networkVersion) : undefined,
    });
    if (networkError) throw networkError;

    const lineData = lines.linesMap[lineAddress];
    const tokenData = tokens.tokensMap[tokenAddress];
    const userTokenData = tokens.user.userTokensMap[tokenAddress];
    const decimals = toBN(tokenData.decimals);
    const ONE_UNIT = toBN('10').pow(decimals);

    // const { error: depositError } = validateLineDeposit({
    //   sellTokenAmount: amount,
    //   depositLimit: lineData?.metadata.depositLimit ?? '0',
    //   emergencyShutdown: lineData?.metadata.emergencyShutdown || false,
    //   sellTokenDecimals: tokenData?.decimals ?? '0',
    //   userTokenBalance: userTokenData?.balance ?? '0',
    //   lineUnderlyingBalance: lineData?.underlyingTokenBalance.amount ?? '0',
    //   targetUnderlyingTokenAmount,
    // });

    // const error = depositError;
    // if (error) throw new Error(error);

    const amountInWei = amount.multipliedBy(ONE_UNIT);
    const { creditLineService, transactionService } = services;
    const tx = await creditLineService.deposit({
      network: network.current,
      accountAddress: userAddress,
      tokenAddress,
      lineAddress,
      amount: amountInWei.toString(),
      slippageTolerance,
    });
    const notifyEnabled = app.servicesEnabled.notify;
    await transactionService.handleTransaction({ tx, network: network.current, useExternalService: notifyEnabled });
    dispatch(getLinePage({ id: lineAddress }));
    // dispatch(getUserLinesSummary());
    dispatch(getUserLinePositions({ lineAddresses: [lineAddress] }));
    // dispatch(getUserLinesMetadata({ linesAddresses: [lineAddress] }));
    dispatch(TokensActions.getUserTokens({ addresses: [tokenAddress, lineAddress] }));
  },
  {
    // serializeError: parseError,
  }
);

const withdrawLine = createAsyncThunk<
  void,
  {
    lineAddress: string;
    amount: BigNumber;
    targetTokenAddress: string;
    slippageTolerance?: number;
    signature?: string;
  },
  ThunkAPI
>(
  'lines/withdrawLine',
  async ({ lineAddress, amount, targetTokenAddress, slippageTolerance, signature }, { extra, getState, dispatch }) => {
    const { network, wallet, lines, tokens, app } = getState();
    const { services, config } = extra;

    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    const { error: networkError } = validateNetwork({
      currentNetwork: network.current,
      walletNetwork: wallet.networkVersion ? getNetwork(wallet.networkVersion) : undefined,
    });
    if (networkError) throw networkError;

    const lineData = lines.linesMap[lineAddress];
    const userLineData = lines.user.linePositions[lineAddress];
    // selector for UserPositionMetadata to get available liquidity
    const available = userLineData.deposit - userLineData.principal;
    // if requesting more than available or max available
    const withdrawAll = amount.eq(config.MAX_UINT256) || amount.gte(available);
    const amountOfShares = withdrawAll ? available : amount;

    // const { error: withdrawError } = validateLineWithdraw({
    //   amount: toBN(normalizeAmount(amountOfShares, parseInt(tokenData.decimals))),
    //   line: userLineData.balance ?? '0',
    //   token: tokenData.decimals.toString() ?? '0', // check if its ok to use underlyingToken decimals as line decimals
    // });

    // const error = withdrawError;
    // if (error) throw new Error(error);

    const { creditLineService, transactionService } = services;
    const tx = await creditLineService.withdraw({
      network: network.current,
      accountAddress: userAddress,
      tokenAddress: targetTokenAddress,
      lineAddress,
      amountOfShares,
      slippageTolerance,
      signature,
    });
    const notifyEnabled = app.servicesEnabled.notify;
    await transactionService.handleTransaction({ tx, network: network.current, useExternalService: notifyEnabled });
    dispatch(getLinePage({ id: lineAddress }));
    // dispatch(getUserLinesSummary());
    dispatch(getUserLinePositions({ lineAddresses: [lineAddress] }));
    // dispatch(getUserLinesMetadata({ linesAddresses: [lineAddress] }));
    dispatch(TokensActions.getUserTokens({ addresses: [targetTokenAddress, lineAddress] }));
  },
  {
    // serializeError: parseError,
  }
);

const getDepositAllowance = createAsyncThunk<
  TokenAllowance,
  {
    tokenAddress: string;
    lineAddress: string;
  },
  ThunkAPI
>('lines/getDepositAllowance', async ({ lineAddress, tokenAddress }, { extra, getState, dispatch }) => {
  const {
    services: { creditLineService },
  } = extra;
  const { network, wallet } = getState();
  const accountAddress = wallet.selectedAddress;

  if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

  const tokenAllowance = await creditLineService.getDepositAllowance({
    network: network.current,
    lineAddress,
    tokenAddress,
    accountAddress,
  });

  await dispatch(
    TokensActions.setTokenAllowance({
      tokenAddress,
      spenderAddress: tokenAllowance.spender,
      allowance: tokenAllowance.amount,
    })
  );

  return tokenAllowance;
});

const getWithdrawAllowance = createAsyncThunk<
  TokenAllowance,
  {
    tokenAddress: string;
    lineAddress: string;
  },
  ThunkAPI
>('lines/getWithdrawAllowance', async ({ lineAddress, tokenAddress }, { extra, getState, dispatch }) => {
  const {
    services: { creditLineService },
  } = extra;
  const { network, wallet } = getState();
  const accountAddress = wallet.selectedAddress;

  if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

  const tokenAllowance = await creditLineService.getWithdrawAllowance({
    network: network.current,
    lineAddress,
    tokenAddress,
    accountAddress,
  });

  await dispatch(
    TokensActions.setTokenAllowance({
      tokenAddress: tokenAllowance.token,
      spenderAddress: tokenAllowance.spender,
      allowance: tokenAllowance.amount,
    })
  );

  return tokenAllowance;
});

/* -------------------------------------------------------------------------- */
/*                                Subscriptions                               */
/* -------------------------------------------------------------------------- */

// const initSubscriptions = createAsyncThunk<void, void, ThunkAPI>(
//   'lines/initSubscriptions',
//   async (_arg, { extra, dispatch }) => {
//     const { subscriptionService } = extra.services;
//     subscriptionService.subscribe({
//       module: 'lines',
//       event: 'getDynamic',
//       action: (linesAddresses: string[]) => {
//         dispatch(getLinePage({ addresses: linesAddresses }));
//       },
//     });
//     subscriptionService.subscribe({
//       module: 'lines',
//       event: 'positionsOf',
//       action: (lineAddresses: string[]) => {
//         dispatch(getUserLinesSummary());
//         dispatch(getUserLinePositions({ lineAddresses }));
//         dispatch(getUserLinesMetadata({ linesAddresses: lineAddresses }));
//       },
//     });
//   }
// );

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export const LinesActions = {
  setSelectedLineAddress,
  // initiateSaveLines,
  getLines,
  approveDeposit,
  depositLine,
  // approveZapOut,
  // signZapOut,
  withdrawLine,
  // migrateLine,
  getLinePage,
  getUserLinePositions,
  // initSubscriptions,
  clearLinesData,
  clearUserData,
  getExpectedTransactionOutcome,
  clearTransactionData,
  // getUserLinesSummary,
  // getUserLinesMetadata,
  clearSelectedLineAndStatus,
  clearLineStatus,
  getDepositAllowance,
  getWithdrawAllowance,
};
