import { keyBy } from 'lodash';
import { ethers } from 'ethers';

import { useAppSelector } from '@hooks';
import { LinesSelectors, selectDepositTokenOptionsByAsset } from '@store';
import { GeneralLabView, GeneralVaultView, TokenView } from '@types';
import { testTokens } from '@config/constants';

interface SelectedSellTokenProps {
  selectedSellTokenAddress?: string;
  selectedVaultOrLab?: GeneralVaultView | GeneralLabView; // TODO: types
  allowTokenSelect?: boolean;
  allowEth?: boolean;
}

interface SelectedSellToken {
  selectedSellToken?: TokenView;
  sourceAssetOptions: TokenView[];
}

export const useSelectedSellToken = ({
  selectedSellTokenAddress,
  selectedVaultOrLab,
  allowTokenSelect,
  allowEth,
}: SelectedSellTokenProps): SelectedSellToken => {
  const sellTokensOptions = useAppSelector(selectDepositTokenOptionsByAsset)(allowEth);
  const sellTokensOptionsMap = keyBy(sellTokensOptions, 'address');

  const selectedSellToken: TokenView | undefined = selectedSellTokenAddress
    ? sellTokensOptionsMap[ethers.utils.getAddress(selectedSellTokenAddress)]
    : undefined;

  console.log('use selected sell token options', selectedSellToken, selectedSellTokenAddress, sellTokensOptionsMap);
  const sourceAssetOptions = selectedSellToken && allowTokenSelect === false ? [selectedSellToken] : sellTokensOptions;

  return { selectedSellToken, sourceAssetOptions };
};
