import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useAppSelector, useAppTranslation, useIsMounting, useAppDispatch } from '@hooks';
import {
  TokensSelectors,
  WalletSelectors,
  AppSelectors,
  ModalSelectors,
  LinesActions,
  LinesSelectors,
  AlertsActions,
} from '@store';
import { SummaryCard, ViewContainer, NoWalletCard, SliderCard } from '@components/app';
import { SpinnerLoading, Text } from '@components/common';
import { halfWidthCss, isValidAddress } from '@utils';
import { AggregatedCreditLine } from '@src/core/types';

const StyledViewContainer = styled(ViewContainer)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: min-content;
`;

const HeaderCard = styled(SummaryCard)`
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

const RoleOption = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20rem;
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

const StyledSliderCard = styled(SliderCard)`
  padding: 3rem;
  margin: 0;
`;

export const Portfolio = () => {
  const { t } = useAppTranslation(['common', 'home']);
  const isMounting = useIsMounting();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const history = useHistory();
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);

  // const labsSummary = useAppSelector(LabsSelectors.selectSummaryData);
  const userTokens = useAppSelector(TokensSelectors.selectUserTokens);
  const activeModal = useAppSelector(ModalSelectors.selectActiveModal);
  const appStatus = useAppSelector(AppSelectors.selectAppStatus);
  const tokensListStatus = useAppSelector(TokensSelectors.selectWalletTokensStatus);
  const generalLoading = (appStatus.loading || tokensListStatus.loading || isMounting) && !activeModal;

  const borrowerPositions = useAppSelector(LinesSelectors.selectBorrowerPositions);

  const userTokensLoading = generalLoading && !userTokens.length;
  const [currentRole, setRole] = useState<string>('Borrower');
  const [data, setdata] = useState([]);
  const [aggregatedCreditLine, setAggregatedCreditLine] = useState<AggregatedCreditLine>();

  const availableRoles = ['Borrower', 'Lender', 'Arbiter'];

  const summaryCardItems = [
    {
      header: t(''),
      Component: (
        <RoleOption
          onClick={() => setRole(availableRoles[0])}
          active={availableRoles[0] === currentRole}
          key={`s-${availableRoles[0]}`}
        >
          {t(`settings:${availableRoles[0]}`)}
        </RoleOption>
      ),
    },
    {
      header: t(''),
      Component: (
        <RoleOption
          onClick={() => setRole(availableRoles[1])}
          active={availableRoles[1] === currentRole}
          key={`s-${availableRoles[1]}`}
        >
          {t(`settings:${availableRoles[1]}`)}
        </RoleOption>
      ),
    },
    {
      header: t(''),
      Component: (
        <RoleOption
          onClick={() => setRole(availableRoles[2])}
          active={availableRoles[2] === currentRole}
          key={`s-${availableRoles[2]}`}
        >
          {t(`settings:${availableRoles[2]}`)}
        </RoleOption>
      ),
    },
  ];

  useEffect(() => {
    const borrowerAddress: string | undefined = location.pathname.split('/')[2];

    if (!borrowerAddress || !isValidAddress(borrowerAddress)) {
      dispatch(AlertsActions.openAlert({ message: 'INVALID_ADDRESS', type: 'error' }));
      history.push('/market');
      return;
    } else if (borrowerAddress.length === 42) {
      dispatch(LinesActions.getBorrowerPositions({ borrower: borrowerAddress.toLocaleLowerCase() }));
    }
  }, [currentRole, walletIsConnected]);

  useEffect(() => {
    if (borrowerPositions) {
      let borrowerData: any = [];
      const keys = Object.keys(borrowerPositions);
      keys.map((key) => {
        let data = borrowerPositions[key];
        borrowerData.push(data);
      });
      setdata(borrowerData);
    }
  }, [borrowerPositions]);

  useEffect(() => {
    //export interface AggregatedCreditLine extends BaseCreditLine {
    // real-time aggregate usd value across all credits
    //  principal: string; // | Promise<string>;
    //  deposit: string; // | Promise<string>;
    //  // id, symbol, APY (4 decimals)
    //  highestApy: [string, string, string];
    //  positions?: CreditPosition[];
    //  escrow?: AggregatedEscrow;
    //  spigot?: AggregatedSpigot;
    //}

    const aggregatedCredit = '';
  }, [data]);

  return (
    <StyledViewContainer>
      <HeaderCard items={summaryCardItems} cardSize="small" />

      {!walletIsConnected && <StyledNoWalletCard />}

      {userTokensLoading && <StyledSpinnerLoading />}

      {borrowerPositions && (
        <StyledSliderCard
          header={t('components.no-borrower-positions.header')}
          Component={
            <Text>
              <p>{t('components.no-borrower-positions.content')}</p>
            </Text>
          }
        />
      )}

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
