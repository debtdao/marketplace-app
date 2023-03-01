import _ from 'lodash';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';
import { utils } from 'ethers';

import { device, sharedTheme } from '@themes/default';
import { useAppSelector, useAppDispatch, useAppTranslation, useQueryParams } from '@hooks';
import {
  ModalsActions,
  LinesActions,
  LinesSelectors,
  WalletActions,
  WalletSelectors,
  OnchainMetaDataActions,
  OnchainMetaDataSelector,
  NetworkSelectors,
  TokensActions,
  TokensSelectors,
} from '@store';
import { RecommendationsCard, SliderCard, ViewContainer } from '@components/app';
import { SpinnerLoading, Text, Button } from '@components/common';
import { SecuredLine, UseCreditLinesParams, Item } from '@src/core/types';
import { DebtDAOBanner } from '@assets/images';
import { getEnv } from '@config/env';
import { getDefaultLineCategories, getENS } from '@src/utils';
import { getConstants } from '@src/config/constants';

const { SUPPORTED_NETWORKS } = getConstants();

const StyledRecommendationsCard = styled(RecommendationsCard)``;

const StyledSliderCard = styled(SliderCard)`
  width: 100%;
  padding: ${({ theme }) => theme.card.padding};
  box-shadow: none;
`;

const BannerCtaButton = styled(Button)`
  width: 80%;
  max-width: 20rem;
  margin-top: 2rem;
  @media ${device.mobile} {
    padding: ${({ theme }) => theme.card.padding};
  }
`;

interface VaultsQueryParams {
  search: string;
}

export const Market = () => {
  const { t } = useAppTranslation(['common', 'vaults', 'market']);
  const { NETWORK } = getEnv();
  const history = useHistory();
  const queryParams = useQueryParams<VaultsQueryParams>();
  const dispatch = useAppDispatch();
  // const { isTablet, isMobile, width: DWidth } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));
  const ensMap = useAppSelector(OnchainMetaDataSelector.selectENSPairs);
  const tokensMap = useAppSelector(TokensSelectors.selectTokensMap);

  // TODO not neeed here
  const addCreditStatus = useAppSelector(LinesSelectors.selectLinesActionsStatusMap);

  const defaultLineCategories = getDefaultLineCategories();
  const fetchMarketData = () => {
    if (tokensMap === undefined) {
      dispatch(TokensActions.getTokens()).then(() => dispatch(LinesActions.getLines(defaultLineCategories)));
    } else {
      dispatch(LinesActions.getLines(defaultLineCategories));
    }
  };
  const lineCategoriesForDisplay = useAppSelector(LinesSelectors.selectLinesForCategories);
  const getLinesStatus = useAppSelector(LinesSelectors.selectLinesStatusMap).getLines;

  useEffect(() => {
    setSearch(queryParams.search ?? '');

    const expectedCategories = _.keys(defaultLineCategories);
    const currentCategories = _.keys(lineCategoriesForDisplay);
    // const shouldFetch = expectedCategories.reduce((bool, cat) => bool && cuirrentCategories.includes(cat), true);
    let shouldFetch: boolean = false;
    expectedCategories.forEach((cat) => (shouldFetch = shouldFetch || !currentCategories.includes(cat)));

    if (shouldFetch) {
      fetchMarketData();
    }
  }, []);

  const onLenderCtaClick = () => {
    window.open('https://docs.debtdao.finance/products/introduction/line-of-credit', '_blank');
  };

  const onBorrowerCtaClick = () => {
    if (!userWallet) {
      connectWallet();
    } else {
      dispatch(ModalsActions.openModal({ modalName: 'createLine' }));
    }
  };

  let ctaButtonText = userWallet ? `${t('market:banner.cta-borrower')}` : `${t('components.connect-button.connect')}`;

  return (
    <ViewContainer>
      {addCreditStatus.loading && (
        <div>
          <p>.... loading......</p>
        </div>
      )}
      {addCreditStatus.error && (
        <div>
          <p>.... ERROR: {addCreditStatus.error}</p>
        </div>
      )}
      <StyledSliderCard
        header={t('market:banner.title')}
        Component={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Text>
              <p>{t('market:banner.body')}</p>
            </Text>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '2.4rem', // match grid-gap in Market Page
              }}
            >
              <BannerCtaButton styling="primary" onClick={onBorrowerCtaClick}>
                {ctaButtonText}
              </BannerCtaButton>
              <BannerCtaButton styling="secondary" outline onClick={onLenderCtaClick}>
                {t('market:banner.cta-lender')}
              </BannerCtaButton>
            </div>
          </div>
        }
        background={<img src={DebtDAOBanner} alt={'Debt DAO Banner?'} />}
      />

      {getLinesStatus.loading ||
      (_.isEmpty(lineCategoriesForDisplay) && SUPPORTED_NETWORKS.includes(currentNetwork)) ? (
        <SpinnerLoading flex="1" width="100%" />
      ) : (
        Object.entries(lineCategoriesForDisplay!).map(([key, val]: [string, SecuredLine[]], i: number) => {
          return (
            <StyledRecommendationsCard
              header={t(key)}
              key={key}
              items={
                val.map(({ id, ...stuff }) => ({
                  ...stuff,
                  icon: '',
                  onAction: () => history.push(`/${currentNetwork}/lines/${id}`),
                })) as Item[]
              }
            />
          );
        })
      )}
      {/**/}
      {/* TODO keep this UI but populate with state.lines.linesMap */}
    </ViewContainer>
  );
};
