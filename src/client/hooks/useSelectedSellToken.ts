import { keyBy } from 'lodash';

import { useAppSelector } from '@hooks';
import { selectDepositTokenOptionsByAsset } from '@store';
import { GeneralLabView, GeneralVaultView, TokenView } from '@types';
import { testTokens } from '@config/constants';

interface SelectedSellTokenProps {
  selectedSellTokenAddress?: string;
  selectedVaultOrLab?: GeneralVaultView | GeneralLabView; // TODO: types
  allowTokenSelect?: boolean;
}

interface SelectedSellToken {
  selectedSellToken?: TokenView;
  sourceAssetOptions: TokenView[];
}

export const useSelectedSellToken = ({
  selectedSellTokenAddress,
  selectedVaultOrLab,
  allowTokenSelect,
}: SelectedSellTokenProps): SelectedSellToken => {
  const sellTokensOptions = useAppSelector(selectDepositTokenOptionsByAsset)(selectedVaultOrLab?.address);

  let fullTokensOptions = sellTokensOptions.concat(testTokens);

  const sellTokensOptionsMap = keyBy(fullTokensOptions, 'address');
  let selectedSellToken: TokenView | undefined = selectedSellTokenAddress
    ? sellTokensOptionsMap[selectedSellTokenAddress]
    : undefined;

  const sourceAssetOptions = selectedSellToken && allowTokenSelect === false ? [selectedSellToken] : sellTokensOptions;

  return { selectedSellToken, sourceAssetOptions };
};
