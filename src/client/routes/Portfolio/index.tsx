import styled from 'styled-components';
import { useState } from 'react';

import { useAppSelector, useAppTranslation, useIsMounting } from '@hooks';
import {
  TokensSelectors,
  VaultsSelectors,
  WalletSelectors,
  NetworkSelectors,
  AppSelectors,
  ModalSelectors,
} from '@store';
import { SummaryCard, ViewContainer, NoWalletCard, Amount } from '@components/app';
import { SpinnerLoading, CardContent, Card } from '@components/common';
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

const StyledSpinnerLoading = styled(SpinnerLoading)`
  grid-column: 1 / 3;
  flex: 1;
  margin: 10rem 0;
`;

const SettingsCardContent = styled(CardContent)`
  flex-direction: column;
  align-items: flex-start;
`;

const SettingsCard = styled(Card)`
  display: grid;
  padding: ${({ theme }) => theme.card.padding} 0;
  width: 100%;
`;

const SettingsSection = styled.div`
  display: grid;
  grid-template-columns: 18rem 1fr;
  padding: 0 ${({ theme }) => theme.card.padding};
  grid-gap: ${({ theme }) => theme.layoutPadding};
`;

const SectionContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  grid-gap: ${({ theme }) => theme.layoutPadding};
  align-items: center;

  ${SettingsSection}:not(:first-child) & {
    padding-top: ${({ theme }) => theme.card.padding};
  }
`;

const SectionTitle = styled.div<{ centerText?: boolean }>`
  display: flex;
  align-items: ${({ centerText }) => (centerText ? 'center' : 'flex-start')};
  fill: currentColor;

  ${SettingsSection}:not(:first-child) & {
    padding-top: ${({ theme }) => theme.card.padding};
  }
`;

const SectionHeading = styled.h3`
  color: ${({ theme }) => theme.colors.titles};
  display: inline-block;
  font-size: 1.6rem;
  font-weight: 500;
  margin: 0;
  padding: 0;
`;

const SlippageOption = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8rem;
  height: 8rem;
  border: 2px solid transparent;
  color: ${({ theme }) => theme.colors.titles};
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.globalRadius};
  font-weight: 700;
  cursor: pointer;

  ${({ active, theme }) =>
    active &&
    `
    background-color: ${theme.colors.backgroundVariant};
    color: ${theme.colors.titlesVariant};
    border-color: ${theme.colors.primary};
  `}
`;

export const Portfolio = () => {
  const { t } = useAppTranslation(['common', 'home']);
  const { NETWORK_SETTINGS } = getConfig();
  const isMounting = useIsMounting();
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
  const [currentRole, setRole] = useState<string>('Borrower');

  const availableRoles = ['Borrower', 'Lender', 'Arbiter'];

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
            <SettingsSection>
              <SectionTitle>
                <SectionHeading>{t('settings:slippage-tolerance')}</SectionHeading>
              </SectionTitle>
              <SectionContent>
                {availableRoles.map((role) => (
                  <SlippageOption onClick={() => setRole(role)} active={role === currentRole} key={`s-${role}`}>
                    {role}
                  </SlippageOption>
                ))}
              </SectionContent>
            </SettingsSection>
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
