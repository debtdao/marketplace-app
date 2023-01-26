import { BigNumber } from 'ethers';
import { BytesLike } from '@ethersproject/bytes/src.ts';
import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import _ from 'lodash';

import { AppDispatch, ThunkAPI } from '@frameworks/redux';
import {
  LineOfCredit,
  SecuredLine,
  SecuredLineWithEvents,
  TransactionOutcome,
  Address,
  Wei,
  TokenAllowance,
  GetLineArgs,
  GetLinesArgs,
  GetLineEventsArgs,
  GetLinePageArgs,
  AddCreditProps,
  UseCreditLinesParams,
  BorrowCreditProps,
  Network,
  DeploySecuredLineProps,
  DeploySecuredLineWithConfigProps,
  CreditPosition,
  RootState,
  PositionMap,
  Subscriptions,
  BaseLineFragResponse,
  GetLinesResponse,
  MarketPageData,
  GetLineEventsResponse,
} from '@types';
import {
  formatGetLinesData,
  formatLinePageData,
  formatLineWithEvents,
  formatUserPortfolioData,
  // validateLineDeposit,
  // validateLineWithdraw,
  // validateMigrateLineAllowance,
  // parseError,
} from '@utils';
import { unnullify, getNetwork } from '@utils';

import { TokensActions } from '../tokens/tokens.actions';
import { TokensSelectors } from '../tokens/tokens.selectors';
import { OnchainMetaDataActions } from '../metadata/metadata.actions';

import { LinesSelectors } from './lines.selectors';

/* -------------------------------------------------------------------------- */
/*                                   Setters                                  */
/* -------------------------------------------------------------------------- */

const setSelectedLineAddress = createAction<{ lineAddress?: string }>('lines/setSelectedLineAddress');
const setSelectedLinePosition = createAction<{ position?: string }>('lines/setSelectedLinePosition');
const setSelectedLinePositionProposal = createAction<{ position?: string; proposal?: string }>(
  'lines/setSelectedLinePositionProposal'
);
const setPosition = createAction<{ id: string; position: CreditPosition }>('lines/setPosition');

/* -------------------------------------------------------------------------- */
/*                                 Clear State                                */
/* -------------------------------------------------------------------------- */

const clearLinesData = createAction<void>('lines/clearLinesData');
const clearUserData = createAction<void>('lines/clearUserData');
const clearTransactionData = createAction<void>('lines/clearTransactionData');
const clearSelectedLine = createAction<void>('lines/clearSelectedLine');
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

const getLine = createAsyncThunk<{ lineData: SecuredLine | undefined }, GetLineArgs, ThunkAPI>(
  'lines/getLine',
  async (params, { getState, extra }) => {
    const { wallet } = getState();
    const network = getNetwork(wallet.networkVersion);
    const { creditLineService } = extra.services;
    const lineData = await creditLineService.getLine({ network: network, ...params });
    return { lineData };
  }
);

const getLines = createAsyncThunk<{ linesData: { [category: string]: SecuredLine[] } }, UseCreditLinesParams, ThunkAPI>(
  'lines/getLines',
  async (categories, { getState, extra, dispatch }) => {
    const {
      wallet,
      tokens: { tokensMap },
    } = getState();

    const { creditLineService, onchainMetaDataService } = extra.services;
    const network = getNetwork(wallet.networkVersion);
    const tokenPrices = Object.entries(tokensMap).reduce(
      (prices, [addy, { priceUsdc }]) => ({ ...prices, [addy]: BigNumber.from(priceUsdc) }),
      {}
    );

    // ensure consistent ordering of categories
    const categoryKeys = Object.keys(categories);
    const promises = await Promise.all(
      categoryKeys
        .map((k) => categories[k])
        .map((params: GetLinesArgs) => creditLineService.getLines({ network, ...params }))
    );

    const { linesData, allBorrowers } = categoryKeys.reduce(
      ({ linesData, allBorrowers }: MarketPageData, category: string, i: number): MarketPageData => {
        // @dev assumes `promises` is same order as `categories`
        if (!promises[i]) {
          return { linesData, allBorrowers };
        } else {
          const categoryLines = formatGetLinesData(promises[i]!, tokenPrices);
          return {
            linesData: { ...linesData, [category]: categoryLines },
            allBorrowers: [...allBorrowers, ...categoryLines.map((line) => line.borrower)],
          };
        }
      },
      { linesData: {}, allBorrowers: [] }
    );
    console.log('Lines Data: ', linesData);
    allBorrowers.map((b) => dispatch(OnchainMetaDataActions.getENS(b)));

    return { linesData };
  }
);

const getLinePage = createAsyncThunk<{ linePageData: SecuredLineWithEvents | undefined }, GetLinePageArgs, ThunkAPI>(
  'lines/getLinePage',
  async ({ id }, { getState, extra, dispatch }) => {
    const state: RootState = getState();
    const { creditLineService } = extra.services;
    // gets all primary + aux line data avaliable by default
    const selectedLine = LinesSelectors.selectSelectedLinePage(state);
    const tokenPrices = TokensSelectors.selectTokenPrices(state);
    const network = getNetwork(state.wallet.networkVersion);
    // query and add credit and collateral events to pre-existing line data
    if (selectedLine) {
      if (selectedLine.creditEvents.length === 0 && selectedLine.collateralEvents.length === 0) {
        const lineEvents = await creditLineService.getLineEvents({ network, id });
        console.log('selected line events: ', lineEvents, network, id);
        const selectedLineWithEvents = formatLineWithEvents(selectedLine, lineEvents, tokenPrices);
        console.log('selected line with events 1: ', selectedLineWithEvents);
        return { linePageData: selectedLineWithEvents };
      }
      return { linePageData: selectedLine };
    } else {
      try {
        const linePageData = formatLinePageData(await creditLineService.getLinePage({ network, id }), tokenPrices);
        console.log('selected line with events 2: ', linePageData);
        if (!linePageData) throw new Error();
        return { linePageData };
      } catch (e) {
        console.log('failed getting full line page data', e);
        return { linePageData: undefined };
      }
    }
  }
);

const getUserLinePositions = createAsyncThunk<
  { userLinesPositions: CreditPosition[] },
  { lineAddresses?: string[] },
  ThunkAPI
>('lines/getUserLinePositions', async ({ lineAddresses }, { extra, getState }) => {
  const { wallet } = getState();
  const { services } = extra;
  const userAddress = wallet.selectedAddress;
  const network = getNetwork(`${wallet.networkVersion}`);
  if (!userAddress) {
    throw new Error('WALLET NOT CONNECTED');
  }
  const userLinesPositions = await services.creditLineService.getUserLinePositions({
    network,
    userAddress,
  });
  return { userLinesPositions };
});

// TODO: Return borrowerLineOfCredits and arbiterLineOfCredits within response
// as SecuredLine[] type to consume in lines.reducer.ts
const getUserPortfolio = createAsyncThunk<
  { address: string; lines: { [address: string]: SecuredLineWithEvents }; lenderPositions: PositionMap },
  { user: string },
  ThunkAPI
>('lines/getUserPortfolio', async ({ user }, { extra, getState }) => {
  const { creditLineService } = extra.services;
  const tokenPrices = TokensSelectors.selectTokenPrices(getState());

  const userPortfolio = await creditLineService.getUserPortfolio({ user });
  if (!userPortfolio) return { address: user, lines: {}, lenderPositions: {} };

  const { lines, positions: lenderPositions } = formatUserPortfolioData(userPortfolio, tokenPrices);

  return { address: user, lines, lenderPositions };
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
    const { app, wallet } = getState();
    const { services } = extra;
    const { creditLineService } = services;
    const { transactionType, sourceTokenAddress, sourceTokenAmount, targetTokenAddress } = getExpectedTxOutcomeProps;

    const accountAddress = getState().wallet.selectedAddress;
    const network = getNetwork(`${wallet.networkVersion}`);
    if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

    const simulationsEnabled = app.servicesEnabled.tenderly;
    if (!simulationsEnabled) throw new Error('SIMULATIONS DISABLED');

    const txOutcome = await creditLineService.getExpectedTransactionOutcome({
      network,
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

const deploySecuredLine = createAsyncThunk<void, DeploySecuredLineProps, ThunkAPI>(
  'lines/deploySecredLine',
  async (deployData, { getState, extra }) => {
    const { lineFactoryService } = extra.services;
    const deployedLineData = await lineFactoryService.deploySecuredLine({
      ...deployData,
    });

    console.log('new secured line deployed. tx response', deployedLineData);
    // await dispatch(getLine(deployedLineData.))
  }
);

const deploySecuredLineWithConfig = createAsyncThunk<void, DeploySecuredLineWithConfigProps, ThunkAPI>(
  'lines/deploySecuredLineWithConfigProps',
  async (deployData, { getState, extra }) => {
    const { lineFactoryService } = extra.services;
    const deploySecuredLineWithConfigData = await lineFactoryService.deploySecuredLineWtihConfig({
      ...deployData,
    });

    console.log('new secured line with Config deployed. tx response', deploySecuredLineWithConfigData);
    // await dispatch(getLine(deployedLineData.))
  }
);

const approveDeposit = createAsyncThunk<
  void,
  {
    tokenAddress: string;
    amount: string;
    lineAddress: string;
    network: Network;
  },
  ThunkAPI
>('lines/approveDeposit', async ({ amount, lineAddress, tokenAddress, network }, { getState, dispatch, extra }) => {
  const { wallet } = getState();
  const { tokenService } = extra.services;

  const accountAddress = wallet.selectedAddress;
  if (!accountAddress) throw new Error('WALLET NOT CONNECTED');
  console.log('approve token', tokenAddress, accountAddress, lineAddress, amount);

  const approveDepositTx = await tokenService.approve({
    network,
    tokenAddress,
    accountAddress,
    spenderAddress: lineAddress,
    amount,
  });
  console.log('this is approval', approveDepositTx);
});

const borrowCredit = createAsyncThunk<void, BorrowCreditProps, ThunkAPI>(
  'lines/borrowCredit',
  async ({ positionId, amount, network, line }, { extra, getState }) => {
    const { wallet } = getState();
    const { services } = extra;
    console.log('look at borrow credit', wallet, positionId, amount, line);
    const { creditLineService } = services;

    const tx = await creditLineService.borrow({
      line: line,
      positionId: positionId,
      amount: amount,
      network: network,
      dryRun: false,
    });
    console.log(tx);
  }
);

const addCredit = createAsyncThunk<void, AddCreditProps, ThunkAPI>(
  'lines/addCredit',
  async ({ lineAddress, drate, frate, amount, token, lender, network }, { extra, getState }) => {
    const { wallet } = getState();
    const { services } = extra;
    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    // TODO: fix BigNumber type difference issues
    // const amountInWei = amount.multipliedBy(ONE_UNIT);
    const { creditLineService } = services;
    const tx = await creditLineService.addCredit({
      lineAddress: lineAddress,
      drate: drate,
      frate: frate,
      amount: amount,
      token: token,
      lender: lender,
      dryRun: true,
      network: network,
    });
    console.log(tx);
    // const notifyEnabled = app.servicesEnabled.notify;
    // await transactionService.handleTransaction({ tx, network: network.current, useExternalService: notifyEnabled });
  }
);

const depositAndRepay = createAsyncThunk<
  void,
  {
    lineAddress: string;
    amount: BigNumber;
    network: Network;
    slippageTolerance?: number;
  },
  ThunkAPI
>(
  'lines/depositAndRepay',

  async ({ lineAddress, amount, network }, { extra, getState }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    console.log('deposit in repay in state');

    const { creditLineService } = services;
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

    // TODO: fix BigNumber type difference issues
    // const amountInWei = amount.multipliedBy(ONE_UNIT);
    // const { creditLineService, transactionService } = services;
    console.log('line address', lineAddress, 'amount', amount, 'network', network);
    const tx = await creditLineService.depositAndRepay({
      lineAddress: lineAddress,
      amount: amount,
      network: network,
    });
    console.log(tx);
    // const notifyEnabled = app.servicesEnabled.notify;
    // await transactionService.handleTransaction({ tx, network: network.current, useExternalService: notifyEnabled });
    //dispatch(getLinePage({ id: lineAddress }));
    // dispatch(getUserLinesSummary());
    // dispatch(getUserLinesMetadata({ linesAddresses: [lineAddress] }));
    // dispatch(TokensActions.getUserTokens({ addresses: [tokenAddress, lineAddress] }));
  },
  {
    // serializeError: parseError,
  }
);

const claimAndRepay = createAsyncThunk<
  void,
  {
    lineAddress: Address;
    claimToken: Address;
    calldata: BytesLike;
    network: Network;
  },
  ThunkAPI
>(
  'lines/claimAndRepay',

  async ({ lineAddress, claimToken, calldata }, { extra, getState, dispatch }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    const network = getNetwork(`${wallet.networkVersion}`);
    if (!userAddress) throw new Error('Wallet not connected');

    const { creditLineService } = services;

    const tx = await creditLineService.claimAndRepay({
      lineAddress,
      claimToken,
      zeroExTradeData: calldata,
      network: network,
      dryRun: false,
    });
    console.log(tx);
  }
);

const claimAndTrade = createAsyncThunk<
  void,
  {
    lineAddress: Address;
    claimToken: Address;
    calldata: BytesLike;
    network: Network;
  },
  ThunkAPI
>(
  'lines/claimAndRepay',

  async ({ lineAddress, claimToken, calldata }, { extra, getState, dispatch }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    const network = getNetwork(`${wallet.networkVersion}`);
    if (!userAddress) throw new Error('Wallet not connected');

    const { creditLineService } = services;

    const tx = await creditLineService.claimAndTrade({
      lineAddress,
      claimToken,
      zeroExTradeData: calldata,
      network: network,
      dryRun: false,
    });
    console.log(tx);
  }
);

const useAndRepay = createAsyncThunk<
  void,
  {
    lineAddress: Address;
    amount: BigNumber;
    network: Network;
  },
  ThunkAPI
>(
  'lines/useAndRepay',

  async ({ lineAddress, amount }, { extra, getState, dispatch }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    const network = getNetwork(`${wallet.networkVersion}`);
    if (!userAddress) throw new Error('Wallet not connected');

    const { creditLineService } = services;

    const tx = await creditLineService.useAndRepay({
      lineAddress,
      amount,
      network: network,
      dryRun: false,
    });
    console.log(tx);
  }
);

const depositAndClose = createAsyncThunk<
  void,
  {
    lineAddress: Address;
    network: Network;
    id: string;
  },
  ThunkAPI
>(
  'lines/depositAndClose',

  async ({ lineAddress, network, id }, { extra, getState, dispatch }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('Wallet not connected');

    const { creditLineService } = services;

    const tx = await creditLineService.depositAndClose({
      lineAddress: lineAddress,
      network: network,
    });
    console.log(tx);
  }
);

const close = createAsyncThunk<
  void,
  {
    lineAddress: Address;
    network: Network;
    id: string;
  },
  ThunkAPI
>(
  'lines/depositAndClose',

  async ({ lineAddress, network, id }, { extra, getState, dispatch }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('Wallet not connected');

    const { creditLineService } = services;

    const tx = await creditLineService.close({
      lineAddress: lineAddress,
      id: id,
      network: network,
    });
    console.log(tx);
  }
);

const liquidate = createAsyncThunk<
  void,
  {
    lineAddress: string;
    amount: BigNumber;
    tokenAddress: string;
  },
  ThunkAPI
>(
  'lines/liquidate',
  async ({ lineAddress, tokenAddress, amount }, { extra, getState }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    const network = getNetwork(`${wallet.networkVersion}`);
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    const { collateralService } = services;
    // TODO get user collateral metadata
    // TODO assert metadata role === arbiter

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

    const tx = await collateralService.liquidate({
      // userPositionMetadata: ,
      lineAddress: lineAddress,
      amount: amount,
      token: tokenAddress,
      to: userAddress,
      network,
      dryRun: false,
    });
    console.log(tx);

    // const notifyEnabled = app.servicesEnabled.notify;
    // await transactionService.handleTransaction({ tx, network: network.current, useExternalService: notifyEnabled });
    // dispatch(getLinePage({ id: lineAddress }));
    // // dispatch(getUserLinesSummary());
    // // dispatch(getUserLinesMetadata({ linesAddresses: [lineAddress] }));
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
    network: Network;
    id: string;
  },
  ThunkAPI
>(
  'lines/withdrawLine',
  async ({ lineAddress, amount, network, id }, { extra, getState }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    //const { error: networkError } = validateNetwork({
    //  currentNetwork: network.current,
    //  walletNetwork: wallet.networkVersion ? getNetwork(wallet.networkVersion) : undefined,
    //});
    //if (networkError) throw networkError;

    //const userLineData = lines.user.linePositions[lineAddress];
    // selector for UserPositionMetadata to get available liquidity
    //const available = utils.parseUnits(userLineData.deposit, 'wei').sub(userLineData.principal);
    // if requesting more than available or max available
    //const withdrawAll = amount.eq(config.MAX_UINT256) || amount.gte(available);
    //const amountOfShares = withdrawAll ? available : amount;

    // const { error: withdrawError } = validateLineWithdraw({
    //   amount: toBN(normalizeAmount(amountOfShares, parseInt(tokenData.decimals))),
    //   line: userLineData.balance ?? '0',
    //   token: tokenData.decimals.toString() ?? '0', // check if its ok to use underlyingToken decimals as line decimals
    // });

    // const error = withdrawError;
    // if (error) throw new Error(error);
    // TODO: fix BigNumber type difference issues
    const { creditLineService } = services;
    console.log(lineAddress, 'lineaddress', amount, 'amount', network, 'network');
    const tx = await creditLineService.withdraw({
      id: id,
      amount: amount,
      lineAddress: lineAddress,
      network: network,
      dryRun: false,
    });
    console.log(tx);
    // const notifyEnabled = app.servicesEnabled.notify;
    // await transactionService.handleTransaction({ tx, network: network.current, useExternalService: notifyEnabled });
    //dispatch(getLinePage({ id: lineAddress }));
    // dispatch(getUserLinesSummary());
    // dispatch(getUserLinesMetadata({ linesAddresses: [lineAddress] }));
    //dispatch(TokensActions.getUserTokens({ addresses: [targetTokenAddress, lineAddress] }));
  },
  {
    // serializeError: parseError,
  }
);

const revokeConsent = createAsyncThunk<
  void,
  {
    lineAddress: string;
    lenderAddress: string;
    msgData: string;
    network: Network;
  },
  ThunkAPI
>(
  'lines/revokeConsent',
  async ({ lineAddress, lenderAddress, msgData, network }, { extra, getState }) => {
    const { wallet } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    const { creditLineService } = services;
    console.log(lineAddress, 'lineaddress', lenderAddress, 'lenderAddress', msgData, 'msgData', network, 'network');
    const tx = await creditLineService.revokeConsent({
      lineAddress: lineAddress,
      lenderAddress: lenderAddress,
      msgData: msgData,
      network: network,
    });
    console.log(tx);
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
  const { wallet } = getState();
  const accountAddress = wallet.selectedAddress;
  const network = getNetwork(`${wallet.networkVersion}`);
  if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

  const tokenAllowance = await creditLineService.getDepositAllowance({
    network,
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
    id: string;
    lineAddress: string;
  },
  ThunkAPI
>('lines/getWithdrawAllowance', async ({ lineAddress, id }, { extra, getState, dispatch }) => {
  const {
    services: { creditLineService },
  } = extra;
  const { network, wallet } = getState();
  const accountAddress = wallet.selectedAddress;

  if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

  const tokenAllowance = await creditLineService.getWithdrawAllowance({
    network: network.current,
    lineAddress,
    id,
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
  setSelectedLinePosition,
  setSelectedLinePositionProposal,
  setPosition,
  clearLinesData,
  clearUserData,
  clearSelectedLine,
  clearLineStatus,
  // initiateSaveLines,

  getLine,
  getLines,
  getLinePage,
  getUserLinePositions,
  getUserPortfolio,

  approveDeposit,
  addCredit,
  borrowCredit,
  deploySecuredLine,
  deploySecuredLineWithConfig,
  // approveZapOut,
  // signZapOut,
  withdrawLine,
  revokeConsent,
  close,
  depositAndRepay,
  depositAndClose,
  claimAndTrade,
  claimAndRepay,
  useAndRepay,

  liquidate,

  getDepositAllowance,
  getWithdrawAllowance,
  getExpectedTransactionOutcome,
  clearTransactionData,
};
