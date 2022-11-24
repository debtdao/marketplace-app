import { createSelector, current } from '@reduxjs/toolkit';
import { memoize } from 'lodash';

import { getConfig } from '@config';
import { TokenView } from '@types';
import { testTokens } from '@src/config/constants';

import { VaultsSelectors } from '../modules/vaults/vaults.selectors';
import { AppSelectors } from '../modules/app/app.selectors';
import { WalletSelectors } from '../modules/wallet/wallet.selectors';
import { TokensSelectors, createToken } from '../modules/tokens/tokens.selectors';
import { NetworkSelectors } from '../modules/network/network.selectors';

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
  (supportedTokens, supportedTokensMap, tokenAddresses, tokensMap, tokensUser, servicesEnabled, currentNetwork) =>
    memoize((assetAddress?: string): TokenView[] => {
      console.log('selectDepositTokenOptionsByAsset', currentNetwork, tokensMap, testTokens);
      console.log('supportedTokens: ', supportedTokens);
      console.log('supported tokens map: ', supportedTokensMap);
      console.log('token addresses: ', tokenAddresses);
      console.log('TokensUser: ', tokensUser);
      console.log('TokensMap: ', tokensMap);
      const { userTokensMap, userTokensAllowancesMap } = tokensUser;
      const address = '0x3730954eC1b5c59246C1fA6a20dD6dE6Ef23aEa6'; // SEEROcoin
      const tokenData = tokensMap[address];
      const userTokenData = userTokensMap[address];
      const allowancesMap = userTokensAllowancesMap[address] ?? {};
      console.log('tokenData:', tokenData);
      console.log('userTokenData:', userTokenData);
      console.log('allowancesMap:', userTokenData);
      if (currentNetwork === 'goerli') {
        return testTokens;
      } else {
        const { TOKEN_ADDRESSES } = getConfig();
        const { userTokensMap, userTokensAllowancesMap } = tokensUser;

        const tokens = Object.values(TOKEN_ADDRESSES)
          .filter((address) => !!tokensMap[address])
          .map((address) => {
            const tokenData = tokensMap[address];
            const userTokenData = userTokensMap[address];
            const allowancesMap = userTokensAllowancesMap[address] ?? {};
            return createToken({ tokenData, userTokenData, allowancesMap });
          });

        return tokens;
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
