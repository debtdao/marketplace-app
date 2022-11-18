import styled from 'styled-components';
import { useEffect } from 'react';

import { useAppSelector, useAppTranslation, useIsMounting, useAppDispatch } from '@hooks';
import {
  TokensSelectors,
  VaultsSelectors,
  WalletSelectors,
  NetworkSelectors,
  AppSelectors,
  ModalSelectors,
  LinesActions,
  LinesSelectors,
} from '@store';
import { SummaryCard, ViewContainer, NoWalletCard, Amount } from '@components/app';
import { SpinnerLoading } from '@components/common';
import { toBN, halfWidthCss } from '@utils';
import { getConfig } from '@config';

const StyledViewContainer = styled(ViewContainer)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: min-content;
`;

const HeaderCard = styled(SummaryCard)`
  grid-column: 1 / 3;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  grid-gap: ${({ theme }) => theme.layoutPadding};
  flex-wrap: wrap;
  grid-column: 1 / 3;
`;

const StyledNoWalletCard = styled(NoWalletCard)`
  grid-column: 1 / 3;
  ${halfWidthCss}
`;

const StyledSummaryCard = styled(SummaryCard)`
  width: 100%;
  grid-column: 1 / 3;
  ${halfWidthCss};
`;

const StyledSpinnerLoading = styled(SpinnerLoading)`
  grid-column: 1 / 3;
  flex: 1;
  margin: 10rem 0;
`;

export const Portfolio = () => {
  const { t } = useAppTranslation(['common', 'home']);
  const { NETWORK_SETTINGS } = getConfig();
  const isMounting = useIsMounting();
  const dispatch = useAppDispatch();
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);

  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const currentNetworkSettings = NETWORK_SETTINGS[currentNetwork];
  const vaultsSummary = useAppSelector(VaultsSelectors.selectSummaryData);
  // const labsSummary = useAppSelector(LabsSelectors.selectSummaryData);
  const walletSummary = useAppSelector(TokensSelectors.selectSummaryData);
  const userTokens = useAppSelector(TokensSelectors.selectUserTokens);
  const activeModal = useAppSelector(ModalSelectors.selectActiveModal);
  const appStatus = useAppSelector(AppSelectors.selectAppStatus);
  const tokensListStatus = useAppSelector(TokensSelectors.selectWalletTokensStatus);
  const generalLoading = (appStatus.loading || tokensListStatus.loading || isMounting) && !activeModal;
  const userTokensLoading = generalLoading && !userTokens.length;

  const defaultLineCategories = {
    'market:featured.newest': {
      first: 15,
      orderBy: 'start', // NOTE: theoretically gets lines that start in the future, will have to refine query
      orderDirection: 'desc',
    },
  };

  const fetchMarketData = () => dispatch(LinesActions.getUserLines(defaultLineCategories));
  const lineCategoriesForDisplay = useAppSelector(LinesSelectors.selectLinesForCategories);
  const getLinesStatus = useAppSelector(LinesSelectors.selectLinesStatusMap).getLines;

  const netWorth = toBN(vaultsSummary.totalDeposits)
    .plus(walletSummary.totalBalance)
    // .plus(labsSummary.totalDeposits)
    .toString();

  const summaryCardItems = [
    { header: t('dashboard.total-net-worth'), Component: <Amount value={netWorth} input="usdc" /> },
  ];
  if (walletIsConnected) {
    summaryCardItems.push({
      header: t('dashboard.available-deposit'),
      Component: <Amount value={walletSummary.totalBalance} input="usdc" />,
    });
  }
  if (currentNetworkSettings.earningsEnabled) {
    summaryCardItems.push(
      {
        header: t('dashboard.vaults-earnings'),
        Component: <Amount value={vaultsSummary.totalEarnings} input="usdc" />,
      },
      {
        header: t('dashboard.vaults-est-yearly-yield'),
        Component: <Amount value={vaultsSummary.estYearlyYeild} input="usdc" />,
      }
    );
  }

  return (
    <StyledViewContainer>
      <HeaderCard items={summaryCardItems} cardSize="small" />

      {walletIsConnected && (
        <>
          <Row>
            <StyledSummaryCard
              header={t('navigation.vaults')}
              items={[
                {
                  header: t('dashboard.holdings'),
                  Component: <Amount value={vaultsSummary.totalDeposits} input="usdc" />,
                },
                {
                  header: t('dashboard.apy'),
                  Component: <Amount value={vaultsSummary.apy} input="percent" />,
                },
              ]}
              redirectTo="vaults"
              cardSize="small"
            />

            {/*  {currentNetworkSettings.labsEnabled && (
              <StyledSummaryCard
                header={t('navigation.labs')}
                items={[
                  {
                    header: t('dashboard.holdings'),
                    Component: <Amount value={labsSummary.totalDeposits} input="usdc" />,
                  },
                  {
                    header: t('dashboard.apy'),
                    Component: <Amount value={labsSummary.estYearlyYield} input="percent" />,
                  },
                ]}
                redirectTo="labs"
                cardSize="small"
              />
            )} */}
          </Row>
        </>
      )}

      {!walletIsConnected && <StyledNoWalletCard />}

      {userTokensLoading && <StyledSpinnerLoading />}

      {/* {!userTokensLoading && (
        <TokensCard
          header={t('components.list-card.wallet')}
          metadata={[
            {
              key: 'balanceUsdc',
              header: t('components.list-card.value'),
              format: ({ balanceUsdc }) => humanize('usd', balanceUsdc),
              sortable: true,
              width: '11rem',
              className: 'col-value',
            },
            {
              key: 'displayName',
              header: t('components.list-card.asset'),
              transform: ({ displayIcon, displayName, symbol }) => (
                <>
                  <TokenIcon icon={displayIcon} symbol={symbol} />
                  <Text ellipsis>{displayName}</Text>
                </>
              ),
              width: '23rem',
              sortable: true,
              className: 'col-name',
            },
            {
              key: 'tokenBalance',
              header: t('components.list-card.balance'),
              format: ({ balance, decimals }) => humanize('amount', balance, decimals, 2),
              sortable: true,
              width: '13rem',
              className: 'col-balance',
            },
            {
              key: 'priceUsdc',
              header: t('components.list-card.price'),
              format: ({ priceUsdc }) => humanize('usd', priceUsdc),
              sortable: true,
              width: '11rem',
              className: 'col-price',
            },

            {
              key: 'invest',
              transform: ({ address }) => <ActionButtons actions={[...investButton(address, false)]} />,
              align: 'flex-end',
              width: 'auto',
              grow: '1',
            },
          ]}
          data={userTokens.map((token) => ({
            ...token,
            displayName: token.symbol,
            displayIcon: token.icon ?? '',
            tokenBalance: normalizeAmount(token.balance, token.decimals),
            invest: null,
          }))}
          initialSortBy="balanceUsdc"
          wrap
          filterBy={filterDustTokens}
          filterLabel="Show dust"
        />
      )} */}
    </StyledViewContainer>
  );
};
