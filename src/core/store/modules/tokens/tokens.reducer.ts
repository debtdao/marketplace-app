import { createReducer } from '@reduxjs/toolkit';
import { union } from 'lodash';
import { utils } from 'ethers';

import { TokensState, UserTokenActionsMap, initialStatus, TokenFragRepsonse } from '@types';

import { TokensActions } from './tokens.actions';

export const initialUserTokenActionsMap: UserTokenActionsMap = {
  get: { ...initialStatus },
  getAllowances: { ...initialStatus },
};

export const tokensInitialState: TokensState = {
  tokensAddresses: [],
  supportedTokens: [],
  activeNetworkTokenAddresses: [],
  tokensMap: {},
  supportedTokensMap: {},
  selectedTokenAddress: undefined,
  user: {
    userTokensAddresses: [],
    userTokensMap: {},
    userTokensAllowancesMap: {},
  },
  statusMap: {
    getTokens: { ...initialStatus },
    getSupportedTokens: { ...initialStatus },
    user: {
      getUserTokens: { ...initialStatus },
      getUserTokensAllowances: { ...initialStatus },
      userTokensActionsMap: {},
    },
  },
};

const {
  getTokens,
  getSupportedOracleTokens,
  getTokensDynamicData,
  getUserTokens,
  setSelectedTokenAddress,
  setTokenAllowance,
  approve,
  getTokenAllowance,
  clearTokensData,
  clearUserTokenState,
} = TokensActions;

const tokensReducer = createReducer(tokensInitialState, (builder) => {
  builder

    /* -------------------------------------------------------------------------- */
    /*                                   Setters                                  */
    /* -------------------------------------------------------------------------- */
    .addCase(setSelectedTokenAddress, (state, { payload: { tokenAddress } }) => {
      state.selectedTokenAddress = tokenAddress;
    })
    .addCase(setTokenAllowance, (state, { payload: { tokenAddress, spenderAddress, allowance } }) => {
      state.user.userTokensAllowancesMap[tokenAddress] = {
        ...state.user.userTokensAllowancesMap[tokenAddress],
        [spenderAddress]: allowance,
      };
    })

    /* -------------------------------------------------------------------------- */
    /*                                 Clear State                                */
    /* -------------------------------------------------------------------------- */
    .addCase(clearTokensData, (state) => {
      state.tokensMap = {};
      state.tokensAddresses = [];
      state.supportedTokens = [];
    })
    .addCase(clearUserTokenState, (state) => {
      state.user.userTokensAddresses = [];
      state.user.userTokensAllowancesMap = {};
      state.user.userTokensMap = {};
    })

    /* -------------------------------------------------------------------------- */
    /*                                 Fetch Data                                 */
    /* -------------------------------------------------------------------------- */

    /* -------------------------------- getTokens ------------------------------- */
    .addCase(getTokens.pending, (state) => {
      state.statusMap.getTokens = { loading: true };
    })
    .addCase(getTokens.fulfilled, (state, { payload: { tokensData } }) => {
      const tokenAddresses: string[] = [];
      tokensData.forEach((token) => {
        const checkSumAddress = utils.getAddress(token.address);
        state.tokensMap[checkSumAddress] = token;
        tokenAddresses.push(checkSumAddress);
      });
      state.tokensAddresses = union(state.tokensAddresses, tokenAddresses);
      state.statusMap.getTokens = {};
    })
    .addCase(getTokens.rejected, (state, { error }) => {
      state.statusMap.getTokens = { error: error.message };
    })

    /* -------------------------------- getSupportedTokens ------------------------------- */
    .addCase(getSupportedOracleTokens.pending, (state) => {
      state.statusMap.getSupportedTokens = { loading: true };
    })
    .addCase(getSupportedOracleTokens.fulfilled, (state, { payload: { tokensData } }) => {
      const tokenAddresses: string[] = [];
      tokensData.supportedTokens.forEach((supportedToken: { token: TokenFragRepsonse }) => {
        const checkSumAddress = utils.getAddress(supportedToken.token.id);
        state.supportedTokensMap[checkSumAddress] = supportedToken.token;
        tokenAddresses.push(checkSumAddress);
      });
      state.supportedTokens = union(state.supportedTokens, tokenAddresses);
      state.statusMap.getSupportedTokens = { error: 'no error!' };
    })
    .addCase(getSupportedOracleTokens.rejected, (state, { error }) => {
      state.statusMap.getSupportedTokens = { error: error.message };
    })

    /* ------------------------------ getUserTokens ----------------------------- */
    .addCase(getUserTokens.pending, (state, { meta }) => {
      const tokenAddresses = meta.arg.addresses;
      tokenAddresses?.forEach((address) => {
        checkAndInitUserTokenStatus(state, address);
        state.statusMap.user.userTokensActionsMap[address].get = { loading: true };
      });
      state.statusMap.user.getUserTokens = { loading: true };
    })
    .addCase(getUserTokens.fulfilled, (state, { meta, payload: { userTokens } }) => {
      const tokenAddresses = meta.arg.addresses;
      tokenAddresses?.forEach((address) => {
        state.statusMap.user.userTokensActionsMap[address].get = {};
      });

      const fetchedTokenAddesses: string[] = [];
      userTokens.forEach((userToken) => {
        fetchedTokenAddesses.push(userToken.address);
        state.user.userTokensMap[userToken.address] = userToken;
      });

      state.user.userTokensAddresses = union(state.user.userTokensAddresses, fetchedTokenAddesses);
      state.statusMap.user.getUserTokens = {};
    })
    .addCase(getUserTokens.rejected, (state, { meta, error }) => {
      const tokenAddresses = meta.arg.addresses;
      tokenAddresses?.forEach((address) => {
        state.statusMap.user.userTokensActionsMap[address].get = { error: error.message };
      });
      state.statusMap.user.getUserTokens = { error: error.message };
    })

    /* -------------------------- getTokensDynamicData -------------------------- */
    // getTokensDynamicData pending and reject are not implemented because for now we dont support individual token statuses
    .addCase(getTokensDynamicData.fulfilled, (state, { payload: { tokensDynamicData } }) => {
      tokensDynamicData.forEach((tokenDynamicData) => {
        const address = tokenDynamicData.address;
        state.tokensMap[address] = { ...state.tokensMap[address], ...tokenDynamicData };
      });
    })

    /* ---------------------------- getTokenAllowance --------------------------- */
    .addCase(getTokenAllowance.pending, (state, { meta }) => {
      const { tokenAddress } = meta.arg;
      checkAndInitUserTokenStatus(state, tokenAddress);
      state.statusMap.user.userTokensActionsMap[tokenAddress].getAllowances = { loading: true };
      state.statusMap.user.getUserTokensAllowances = { loading: true };
    })
    .addCase(getTokenAllowance.fulfilled, (state, { meta, payload: { allowance } }) => {
      const { tokenAddress, spenderAddress } = meta.arg;
      state.user.userTokensAllowancesMap[tokenAddress] = {
        ...state.user.userTokensAllowancesMap[tokenAddress],
        [spenderAddress]: allowance,
      };
      state.statusMap.user.userTokensActionsMap[tokenAddress].getAllowances = {};
      state.statusMap.user.getUserTokensAllowances = {};
    })
    .addCase(getTokenAllowance.rejected, (state, { meta, error }) => {
      const { tokenAddress } = meta.arg;
      state.statusMap.user.userTokensActionsMap[tokenAddress].getAllowances = { error: error.message };
      state.statusMap.user.getUserTokensAllowances = { error: error.message };
    })

    /* -------------------------------------------------------------------------- */
    /*                                Transactions                                */
    /* -------------------------------------------------------------------------- */

    /* --------------------------------- approve -------------------------------- */
    // Note: approve pending/rejected statuses are handled on each asset (vault/ironbank/...) approve action.
    .addCase(approve.fulfilled, (state, { meta, payload: { amount } }) => {
      const { tokenAddress, spenderAddress } = meta.arg;
      state.user.userTokensAllowancesMap[tokenAddress] = {
        ...state.user.userTokensAllowancesMap[tokenAddress],
        [spenderAddress]: amount,
      };
    });
});

export default tokensReducer;

function checkAndInitUserTokenStatus(state: TokensState, tokenAddress: string) {
  const actionsMap = state.statusMap.user.userTokensActionsMap[tokenAddress];
  if (actionsMap) return;
  state.statusMap.user.userTokensActionsMap[tokenAddress] = { ...initialUserTokenActionsMap };
}
