import { keyBy } from 'lodash';

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

  let fullTokensOptions = sellTokensOptions.concat(testTokens); // @cleanup remove

  const sellTokensOptionsMap = keyBy(fullTokensOptions, 'address');
  let selectedSellToken: TokenView | undefined = selectedSellTokenAddress
    ? sellTokensOptionsMap[selectedSellTokenAddress]
    : undefined;

  const sourceAssetOptions = selectedSellToken && allowTokenSelect === false ? [selectedSellToken] : sellTokensOptions;

  return { selectedSellToken, sourceAssetOptions };
};
