import { createSelector, current } from '@reduxjs/toolkit';
import { memoize, sortBy, unionBy } from 'lodash';

import { getConfig } from '@config';
import { TokenView } from '@types';
import { testTokens } from '@src/config/constants';
import { isGoerli } from '@src/utils';

import { VaultsSelectors } from '../modules/vaults/vaults.selectors';
import { AppSelectors } from '../modules/app/app.selectors';
import { WalletSelectors } from '../modules/wallet/wallet.selectors';
import { TokensSelectors, createToken } from '../modules/tokens/tokens.selectors';
import { NetworkSelectors } from '../modules/network/network.selectors';

const { NETWORK, TOKEN_ADDRESSES, ETHEREUM_ADDRESS } = getConfig();
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
    memoize((allowEth: boolean = false): TokenView[] => {
      const { userTokensMap, userTokensAllowancesMap } = tokensUser;
      // console.log('select tokens', currentNetwork, supportedTokensMap, tokensMap);

      if (isGoerli(currentNetwork)) {
        return testTokens;
      } else if (currentNetwork === 'gnosis') {
        return testTokens;
      } else {
        const mainTokens = Object.values(TOKEN_ADDRESSES)
          .filter((address) => !!tokensMap[address] && (allowEth ? true : address !== ETHEREUM_ADDRESS))
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
        // console.log('tokens', mainTokens, subgraphTokens, sortedSubgraphTokens);

        // Return a list of supported tokens with mainTokens (e.g. ETH, WETH, DAI, etc.)
        // coming before subgraphTokens (e.g. AAVE, LINK, etc.) with both indepently sorted
        // from A-Z
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
