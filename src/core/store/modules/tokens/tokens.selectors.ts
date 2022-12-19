import { createSelector } from '@reduxjs/toolkit';
import _, { memoize } from 'lodash';
import { BigNumber } from 'ethers';

import { AllowancesMap, Balance, RootState, Status, Token, TokenView } from '@types';
import { toBN, unnullify } from '@utils';

/* ---------------------------------- State --------------------------------- */
const selectTokensState = (state: RootState) => state.tokens;
const selectTokenAddresses = (state: RootState) => state.tokens.tokensAddresses;
const selectSupportedTokens = (state: RootState) => state.tokens.supportedTokens;
const selectSupportedTokensMap = (state: RootState) => state.tokens.supportedTokensMap;
const selectTokensMap = (state: RootState) => state.tokens.tokensMap;
const selectSelectedTokenAddress = (state: RootState) => state.tokens.selectedTokenAddress;
const selectTokensUser = (state: RootState) => state.tokens.user;
const selectUserTokensStatusMap = (state: RootState) => state.tokens.statusMap;
const selectGetTokensStatus = (state: RootState) => state.tokens.statusMap.getTokens;
const selectGetUserTokensStatus = (state: RootState) => state.tokens.statusMap.user.getUserTokens;

/* ----------------------------- Main Selectors ----------------------------- */
const selectUserTokens = createSelector([selectTokensMap, selectTokensUser], (tokensMap, user): TokenView[] => {
  const { userTokensAddresses, userTokensMap, userTokensAllowancesMap } = user;
  const tokens = userTokensAddresses
    .filter((address) => !!tokensMap[address])
    .map((address) => {
      const tokenData = tokensMap[address];
      const userTokenData = userTokensMap[address];
      const allowancesMap = userTokensAllowancesMap[address] ?? {};
      return createToken({ tokenData, userTokenData, allowancesMap });
    });
  return tokens.filter((token) => toBN(token.balance).gt(0));
});

const selectCollateralTokens = createSelector([selectTokensMap, selectTokensUser], (tokensMap, user): TokenView[] => {
  const { userTokensAddresses, userTokensMap, userTokensAllowancesMap } = user;
  const tokens = userTokensAddresses
    .filter((address) => !!tokensMap[address])
    .map((address) => {
      const tokenData = tokensMap[address];
      const userTokenData = userTokensMap[address];
      const allowancesMap = userTokensAllowancesMap[address] ?? {};
      return createToken({ tokenData, userTokenData, allowancesMap });
    });
  return tokens.filter((token) => toBN(token.balance).gt(0));
});

const selectSummaryData = createSelector([selectUserTokens], (userTokens) => {
  let totalBalance = toBN('0');
  userTokens.forEach((userToken) => (totalBalance = totalBalance.plus(userToken.balanceUsdc)));

  return {
    totalBalance: totalBalance?.toString() ?? '0',
    tokensAmount: userTokens.length.toString(),
  };
});

const selectToken = createSelector([selectTokensMap, selectTokensUser], (tokensMap, user) =>
  memoize((tokenAddress: string): TokenView => {
    const { userTokensMap, userTokensAllowancesMap } = user; // use specific selectors, is not a big performance improvement in this case
    const tokenData = tokensMap[tokenAddress];
    const userTokenData = userTokensMap[tokenAddress];
    const allowancesMap = userTokensAllowancesMap[tokenAddress] ?? {};
    return createToken({ tokenData, userTokenData, allowancesMap });
  })
);

const selectTokenPrices = createSelector([selectTokensMap], (tokensMap): { [address: string]: BigNumber } =>
  Object.entries(tokensMap).reduce(
    (prices, [addy, { priceUsdc }]) => ({ ...prices, [addy]: unnullify(priceUsdc, true) }),
    {}
  )
);

/* -------------------------------- Statuses -------------------------------- */
const selectWalletTokensStatus = createSelector(
  [selectGetTokensStatus, selectGetUserTokensStatus],
  (getTokensStatus, getUserTokensStatus): Status => {
    return {
      loading: getTokensStatus.loading || getUserTokensStatus.loading,
      error: getTokensStatus.error || getUserTokensStatus.error,
    };
  }
);

/* --------------------------------- Helper --------------------------------- */
interface CreateTokenProps {
  tokenData: Token;
  userTokenData: Balance;
  allowancesMap: AllowancesMap;
}

export function createToken(props: CreateTokenProps): TokenView {
  const { tokenData, userTokenData, allowancesMap } = props;
  return {
    address: tokenData?.address,
    name: tokenData?.name,
    symbol: tokenData?.symbol,
    decimals: parseInt(tokenData?.decimals),
    icon: tokenData?.icon,
    balance: userTokenData?.balance ?? '0',
    balanceUsdc: userTokenData?.balanceUsdc ?? '0',
    priceUsdc: tokenData?.priceUsdc ?? '0',
    categories: tokenData?.metadata?.categories ?? [],
    description: tokenData?.metadata?.description ?? '',
    website: tokenData?.metadata?.website ?? '',
    allowancesMap: allowancesMap ?? {},
  };
}

/* --------------------------------- Exports -------------------------------- */
export const TokensSelectors = {
  selectTokensState,
  selectTokenAddresses,
  selectSupportedTokens,
  selectSupportedTokensMap,
  selectTokensMap,
  selectSelectedTokenAddress,
  selectTokensUser,
  selectCollateralTokens,
  selectUserTokensStatusMap,
  selectUserTokens,
  selectSummaryData,
  selectWalletTokensStatus,
  selectToken,
  selectTokenPrices,
};
