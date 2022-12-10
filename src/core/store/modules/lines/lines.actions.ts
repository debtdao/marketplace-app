import { BigNumber } from 'ethers';
import { BytesLike } from '@ethersproject/bytes/src.ts';
import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { ThunkAPI } from '@frameworks/redux';
import {
  SecuredLine,
  SecuredLineWithEvents,
  TransactionOutcome,
  Address,
  Wei,
  TokenAllowance,
  GetLineArgs,
  GetLinesArgs,
  GetLinePageArgs,
  AddCreditProps,
  UseCreditLinesParams,
  BorrowCreditProps,
  Network,
  DeploySecuredLineProps,
  DeploySecuredLineWithConfigProps,
  GetUserPortfolioResponse,
  CreditPosition,
  RootState,
  PositionMap,
} from '@types';
import {
  formatGetLinesData,
  formatLinePageData,
  formatUserPortfolioData,
  // validateLineDeposit,
  // validateLineWithdraw,
  // validateMigrateLineAllowance,
  // parseError,
} from '@utils';
import { unnullify } from '@utils';

import { TokensActions } from '../tokens/tokens.actions';
import { TokensSelectors } from '../tokens/tokens.selectors';
import { CollateralActions } from '../collateral/collateral.actions';

import { LinesSelectors } from './lines.selectors';

/* -------------------------------------------------------------------------- */
/*                                   Setters                                  */
/* -------------------------------------------------------------------------- */

const setSelectedLineAddress = createAction<{ lineAddress?: string }>('lines/setSelectedLineAddress');
const setSelectedLinePosition = createAction<{ position?: string }>('lines/setSelectedLinePosition');
const setPosition = createAction<{ id: string; position: CreditPosition }>('lines/setPosition');

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

const getLine = createAsyncThunk<{ lineData: SecuredLine | undefined }, GetLineArgs, ThunkAPI>(
  'lines/getLine',
  async (params, { getState, extra }) => {
    const { network } = getState();
    const { creditLineService } = extra.services;
    const lineData = await creditLineService.getLine({ network: network.current, ...params });
    return { lineData };
  }
);

const getLines = createAsyncThunk<{ linesData: { [category: string]: SecuredLine[] } }, UseCreditLinesParams, ThunkAPI>(
  'lines/getLines',
  async (categories, { getState, extra }) => {
    const {
      network,
      tokens: { tokensMap },
    } = getState();

    const { creditLineService } = extra.services;

    const tokenPrices = Object.entries(tokensMap).reduce(
      (prices, [addy, { priceUsdc }]) => ({ ...prices, [addy]: priceUsdc }),
      {}
    );

    // ensure consistent ordering of categories
    const categoryKeys = Object.keys(categories);
    //@ts-ignore
    const promises = await Promise.all(
      categoryKeys
        .map((k) => categories[k])
        .map((params: GetLinesArgs) => creditLineService.getLines({ network: network.current, ...params }))
    );
    //@ts-ignore
    const linesData = categoryKeys.reduce(
      (all, category, i) =>
        // @dev assumes `promises` is same order as `categories`
        !promises[i] ? all : { ...all, [category]: formatGetLinesData(promises[i]!, tokenPrices) },
      {}
    );

    return { linesData };
  }
);

const getLinePage = createAsyncThunk<{ linePageData: SecuredLineWithEvents | undefined }, GetLinePageArgs, ThunkAPI>(
  'lines/getLinePage',
  async ({ id }, { getState, extra, dispatch }) => {
    const state: RootState = getState();
    const { creditLineService } = extra.services;
    // gets all primary + aux line data avaliable by defeault

    const selectedLine = LinesSelectors.selectSelectedLinePage(state);
    const tokenPrices = TokensSelectors.selectTokenPrices(state);

    // @TODO check if events exist to
    console.log('User Portfolio actions state: ', state);
    console.log('User Portfolio actions state: ', state);
    console.log('User Portfolio actions tokenPrices: ', tokenPrices);

    // debugger;
    if (selectedLine) {
      console.log('User Portfolio actions selectedLine: ', selectedLine);
      // console.log('user portfolio')
      return { linePageData: selectedLine };
    } else {
      try {
        const linePageData = formatLinePageData(
          await creditLineService.getLinePage({ network: state.network.current, id }),
          tokenPrices
        );

        console.log('user portfolio getLinePage data ', linePageData);

        // @TODO dispatch actions to save collateral and events
        // enable collateral or add collateral
        // save module to Map
        // dispatch(CollateralActions.saveModuleToMap(spigot.id, spigot ));
        // function does not exist in this file
        // save events to map
        // dispatch(LineActions.setCreditEvetntsModule(spigot.id, collateralEvents ));
        // save events to map
        // dispatch(CollateralActions.saveEventsToMap(spigot.id, collateralEvents ));

        if (!linePageData) throw new Error();
        return { linePageData };
      } catch (e) {
        console.log('failed getting full line page data', e);
        return { linePageData: undefined };
      }
    }
  }
);

// const getLinePage = createAsyncThunk<{ linePageData: SecuredLineWithEvents | undefined }, GetLinePageArgs, ThunkAPI>(
//   'lines/getLinePage',
//   async ({ id }, { getState, extra, dispatch }) => {
//     const state: RootState = getState();
//     const { creditLineService } = extra.services;
//     // gets all primary + aux line data avaliable by defeault

//     // const selectedLine = LinesSelectors.selectSelectedLinePage(state);
//     const tokenPrices = TokensSelectors.selectTokenPrices(state);
//     console.log('User Portfolio actions state: ', state);
//     console.log('User Portfolio actions tokenPrices: ', tokenPrices);
//     // debugger;
//     const linePageResponse = await creditLineService.getLinePage({
//       network: state.network.current,
//       id,
//     });
//     console.log('User Portfolio actions do I make it?: ', linePageResponse);

//     if (!linePageResponse) {
//       return { linePageData: undefined };
//     }
//     const linePageData = linePageResponse ? formatLinePageData(linePageResponse, tokenPrices) : undefined;
//     console.log('User Portfolio actions linepagedata: ', linePageResponse);
//     console.log('User Portfolio actions linepagedata: ', linePageData);
//     return { linePageData: linePageData };
//   }
// );

const getUserLinePositions = createAsyncThunk<
  { userLinesPositions: CreditPosition[] },
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

// TODO: Return borrowerLineOfCredits and arbiterLineOfCredits within response
// as SecuredLine[] type to consume in lines.reducer.ts
const getUserPortfolio = createAsyncThunk<
  { address: string; lines: { [address: string]: SecuredLineWithEvents }; positions: PositionMap },
  { user: string },
  ThunkAPI
>('lines/getUserPortfolio', async ({ user }, { extra, getState }) => {
  const { creditLineService } = extra.services;
  const tokenPrices = TokensSelectors.selectTokenPrices(getState());

  const userPortfolio = await creditLineService.getUserPortfolio({ user });
  if (!userPortfolio) return { address: user, lines: {}, positions: {} };

  const { lines, positions } = formatUserPortfolioData(userPortfolio, tokenPrices);

  return { address: user, lines, positions };
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
  //@ts-ignore
>('lines/approveDeposit', async ({ amount, spenderAddress, tokenAddress, network }, { getState, dispatch, extra }) => {
  const { wallet } = getState();
  const { tokenService } = extra.services;

  const accountAddress = wallet.selectedAddress;
  if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

  const approveDepositTx = await tokenService.approve({
    network,
    tokenAddress,
    accountAddress,
    spenderAddress: spenderAddress,
    amount: unnullify(amount, true),
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
    //dispatch(TokensActions.getUserTokens({ addresses: [tokenAddress, lineAddress] }));
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
    const { wallet, network } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('Wallet not connected');

    const { collateralService } = services;

    const tx = await collateralService.claimAndRepay({
      lineAddress,
      claimToken,
      zeroExTradeData: calldata,
      network: network.current,
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
    const { wallet, network } = getState();
    const { services } = extra;

    const userAddress = wallet.selectedAddress;
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
      network: network.current,
      dryRun: false,
    });
    console.log(tx);

    // const notifyEnabled = app.servicesEnabled.notify;
    // await transactionService.handleTransaction({ tx, network: network.current, useExternalService: notifyEnabled });
    // dispatch(getLinePage({ id: lineAddress }));
    // // dispatch(getUserLinesSummary());
    // // dispatch(getUserLinesMetadata({ linesAddresses: [lineAddress] }));
    // dispatch(TokensActions.getUserTokens({ addresses: [tokenAddress, lineAddress] }));
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
  setPosition,
  // initiateSaveLines,
  getLine,
  getLines,
  getLinePage,
  getUserLinePositions,
  getUserPortfolio,
  approveDeposit,
  addCredit,
  depositAndRepay,
  depositAndClose,
  borrowCredit,
  deploySecuredLine,
  deploySecuredLineWithConfig,
  // approveZapOut,
  // signZapOut,
  withdrawLine,
  liquidate,
  // migrateLine,
  // initSubscriptions,
  clearLinesData,
  clearUserData,
  getExpectedTransactionOutcome,
  claimAndRepay,
  clearTransactionData,
  // getUserLinesSummary,
  // getUserLinesMetadata,
  clearSelectedLineAndStatus,
  clearLineStatus,
  getDepositAllowance,
  getWithdrawAllowance,
};
