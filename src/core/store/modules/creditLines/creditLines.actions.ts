import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { ThunkAPI } from '@frameworks/redux';
import { TokenDynamicData, CreditLine, Balance, Integer, GetCreditLinesProps, AddCreditProps, Address } from '@types';
import { borrowerLenderHelper } from '@utils';

/* -------------------------------------------------------------------------- */
/*                                   Setters                                  */
/* -------------------------------------------------------------------------- */

const setSelectedCreditLineAddress = createAction<{ creditLineAddress?: string }>(
  'creditLines/setSelectedCreditLineAddress'
);

/* -------------------------------------------------------------------------- */
/*                                 Clear State                                */
/* -------------------------------------------------------------------------- */

const clearSelectedCreditLine = createAction<void>('creditLines/clearSelectedCreditLines');
const clearCreditLinesData = createAction<void>('creditLines/clearCreditLinesData');

/* -------------------------------------------------------------------------- */
/*                                 Fetch Data                                 */
/* -------------------------------------------------------------------------- */

const getCreditLines = createAsyncThunk<{ creditLinesData: CreditLine[] }, { params: GetCreditLinesProps }, ThunkAPI>(
  'creditLines/getCreditLines',
  async ({ params }, { getState, extra }) => {
    const { network } = getState();
    const { creditLineService } = extra.services;
    const creditLinesData: CreditLine[] = await creditLineService.getCreditLines(params);
    return { creditLinesData };
  }
);

// todo: put this in constant file once we have deployed contracts on mainnet
const borrowerProps = {
  creditLineAddress: '0xAc913906c6d858BbE39Cfa774282C0143715E638',
  spigotedLineAddress: '0x910116b3FB14D968eAF69292F23EA52A456F4183',
  escrowAddress: '0xfaffe74894e36C6534Cc13b73af015b5666b4EA9',
  interestRateCredit: '0x9B85812b22543Eb1A9e5Eed5F279d8160953c113',
};

const addCredit = createAsyncThunk<{ tx: string }, { params: AddCreditProps }, ThunkAPI>(
  'creditLines/addCredit',
  async ({ params }, { extra }) => {
    const { creditLineService, spigotedLineService, escrowService, interestRateCreditService } = extra.services;
    const helper = borrowerLenderHelper(
      creditLineService,
      interestRateCreditService,
      spigotedLineService,
      escrowService,
      borrowerProps
    );
    const tx = await helper.addCredit(params);
    return { tx };
  }
);

// const getTokensDynamicData = createAsyncThunk<
//   { tokensDynamicData: TokenDynamicData[] },
//   { addresses: string[] },
//   ThunkAPI
// >('tokens/getTokensDynamic', async ({ addresses }, { getState, extra }) => {
//   const { network } = getState();
//   const { tokenService } = extra.services;
//   const tokensDynamicData = await tokenService.getTokensDynamicData({ network: network.current, addresses });
//   return { tokensDynamicData };
// });

/* -------------------------------------------------------------------------- */
/*                             Transaction Methods                            */
/* -------------------------------------------------------------------------- */

// const approve = createAsyncThunk<
//   { amount: string },
//   { tokenAddress: string; spenderAddress: string; amountToApprove?: string },
//   ThunkAPI
// >('tokens/approve', async ({ tokenAddress, spenderAddress, amountToApprove }, { extra, getState }) => {
//   const { network, wallet, app } = getState();
//   const { tokenService, transactionService } = extra.services;
//   const amount = amountToApprove ?? extra.config.MAX_UINT256;

//   const accountAddress = wallet.selectedAddress;
//   if (!accountAddress) throw new Error('WALLET NOT CONNECTED');

//   const tx = await tokenService.approve({
//     network: network.current,
//     accountAddress,
//     tokenAddress,
//     spenderAddress,
//     amount,
//   });
//   const notifyEnabled = app.servicesEnabled.notify;
//   await transactionService.handleTransaction({ tx, network: network.current, useExternalService: notifyEnabled });

//   return { amount };
// });

/* -------------------------------------------------------------------------- */
/*                                Subscriptions                               */
/* -------------------------------------------------------------------------- */

// const initSubscriptions = createAsyncThunk<void, void, ThunkAPI>(
//   'tokens/initSubscriptions',
//   async (_arg, { extra, dispatch }) => {
//     const { subscriptionService } = extra.services;
//     subscriptionService.subscribe({
//       module: 'tokens',
//       event: 'priceUsdc',
//       action: (tokenAddresses: string[]) => {
//         dispatch(getTokensDynamicData({ addresses: tokenAddresses }));
//       },
//     });
//     subscriptionService.subscribe({
//       module: 'tokens',
//       event: 'balances',
//       action: (tokenAddresses: string[]) => {
//         dispatch(getUserTokens({ addresses: tokenAddresses }));
//       },
//     });
//     subscriptionService.subscribe({
//       module: 'tokens',
//       event: 'getAllowance',
//       action: (tokenAddress: string, spenderAddress: string) => {
//         dispatch(getTokenAllowance({ tokenAddress, spenderAddress }));
//       },
//     });
//   }
// );

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export const CreditLinesActions = {
  setSelectedCreditLineAddress,
  getCreditLines,
  clearSelectedCreditLine,
  clearCreditLinesData,
  addCredit,
  // initSubscriptions,
};
