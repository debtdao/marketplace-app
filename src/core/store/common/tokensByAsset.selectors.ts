import { createSelector, current } from '@reduxjs/toolkit';
import { memoize, sortBy, unionBy } from 'lodash';

import { getConfig } from '@config';
import { TokenView } from '@types';
import { testTokens } from '@src/config/constants';

import { VaultsSelectors } from '../modules/vaults/vaults.selectors';
import { AppSelectors } from '../modules/app/app.selectors';
import { WalletSelectors } from '../modules/wallet/wallet.selectors';
import { TokensSelectors, createToken } from '../modules/tokens/tokens.selectors';
import { NetworkSelectors } from '../modules/network/network.selectors';
const { NETWORK, TOKEN_ADDRESSES } = getConfig();
// import { Token } from 'graphql';

const { selectVaultsMap } = VaultsSelectors;
const { selectTokenAddresses, selectSupportedTokens, selectSupportedTokensMap, selectTokensMap, selectTokensUser } =
  TokensSelectors;
const { selectServicesEnabled } = AppSelectors;
const { selectCurrentNetwork } = NetworkSelectors;
const { selectWalletNetwork } = WalletSelectors;

export const selectDepositTokenOptionsByAsset = createSelector(
  [
    selectSupportedTokens,
    selectSupportedTokensMap,
    selectTokenAddresses,
    selectTokensMap,
    selectTokensUser,
    selectServicesEnabled,
    selectWalletNetwork,
  ],
  (
    supportedTokens,
    supportedTokensMap,
    tokenAddresses,
    tokensMap,
    tokensUser,
    servicesEnabled,
    currentNetwork = NETWORK
  ) =>
    memoize((assetAddress?: string): TokenView[] => {
      console.log('TokenService selectDepositTokenOptionsByAsset', currentNetwork, tokensMap, testTokens);
      const { userTokensMap, userTokensAllowancesMap } = tokensUser;
      if (currentNetwork === 'goerli') {
        // TODO: fill in token values appropriately with values from subgraph
        // const tokens: TokenView[] = supportedTokens.map((address: string) => {
        //   return {
        //     address: address,
        //     ...supportedTokensMap[address],
        //     icon: '',
        //     balance: '0',
        //     balanceUsdc: '0',
        //     priceUsdc: '0',
        //     categories: [],
        //     description: '',
        //     website: '',
        //     allowanceMap: {},
        //   };
        // });
        // const allTestTokens = testTokens.concat(tokens);
        // return allTestTokens;
        return testTokens;
      } else {
        console.log('use mainnet tokens ', TOKEN_ADDRESSES, tokensMap);
        const mainTokens = Object.values(TOKEN_ADDRESSES)
          .filter((address) => !!tokensMap[address])
          .map((address) => {
            const tokenData = tokensMap[address];
            const userTokenData = userTokensMap[address];
            const allowancesMap = userTokensAllowancesMap[address] ?? {};
            return createToken({ tokenData, userTokenData, allowancesMap });
          });
        const subgraphTokens: TokenView[] = supportedTokens
          .filter((address) => !!tokensMap[address])
          .map((address) => {
            const tokenData = tokensMap[address];
            const userTokenData = userTokensMap[address];
            const allowancesMap = userTokensAllowancesMap[address] ?? {};
            return createToken({ tokenData, userTokenData, allowancesMap });
          });
        const sortedSubgraphTokens = sortBy(subgraphTokens, (o) => o.symbol);
        // Return a list of supported tokens with mainTokens (e.g. ETH, WETH, DAI, etc.)
        // coming before subgraphTokens (e.g. AAVE, LINK, etc.) with both indepently sorted
        // from A-Z
        console.log('use mainnet tokens ', sortedSubgraphTokens, subgraphTokens, mainTokens);
        return unionBy(mainTokens, sortedSubgraphTokens, (o) => o.symbol);
      }
    })
);

export const selectWithdrawTokenOptionsByAsset = createSelector(
  [selectVaultsMap, selectTokensMap, selectTokensUser, selectServicesEnabled, selectCurrentNetwork],
  (vaultsMap, tokensMap, tokensUser, servicesEnabled, currentNetwork) =>
    memoize((assetAddress?: string): TokenView[] => {
      if (!assetAddress) return [];

      const { userTokensMap, userTokensAllowancesMap } = tokensUser;
      const assetData = vaultsMap[assetAddress] ? vaultsMap[assetAddress] : null;
      if (!assetData) return [];

      const zapperDisabled =
        (!servicesEnabled.zapper && assetData.metadata.zapOutWith === 'zapperZapOut') || currentNetwork !== 'mainnet';
      const mainVaultTokenAddress = zapperDisabled ? assetData.token : assetData.metadata.defaultDisplayToken;
      const withdrawTokenAddresses = [mainVaultTokenAddress];
      if (!zapperDisabled) {
        const { ZAP_OUT_TOKENS } = getConfig();
        if (assetData.token !== mainVaultTokenAddress) withdrawTokenAddresses.push(assetData.token);
        withdrawTokenAddresses.push(...ZAP_OUT_TOKENS.filter((address) => !withdrawTokenAddresses.includes(address)));
      }

      const tokens = withdrawTokenAddresses
        .filter((address) => !!tokensMap[address])
        .map((address) => {
          const tokenData = tokensMap[address];
          const userTokenData = userTokensMap[address];
          const allowancesMap = userTokensAllowancesMap[address] ?? {};
          return createToken({ tokenData, userTokenData, allowancesMap });
        });
      return tokens.filter(
        (token) => token.address === assetData.token || token.address === assetData.metadata.defaultDisplayToken
      );
    })
);
