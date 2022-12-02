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
import { SummaryCard, ViewContainer, NoWalletCard, SliderCard, LineDetailsDisplay } from '@components/app';
import { SpinnerLoading, Text } from '@components/common';
import { halfWidthCss, isValidAddress, formatGetBorrowerQuery } from '@utils';
import { CreditLinePage, LENDER_POSITION_ROLE, BORROWER_POSITION_ROLE, ARBITER_POSITION_ROLE } from '@src/core/types';

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

const StyledBorrowerContainer = styled.div`
  grid-column: 1 / 3;
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
  const borrowerAddress: string | undefined = location.pathname.split('/')[2];
  const borrowerPositions = useAppSelector(LinesSelectors.selectBorrowerPositions);
  const userPortfolio = useAppSelector(LinesSelectors.selectUserPortfolio);

  const userTokensLoading = generalLoading && !userTokens.length;
  const [currentRole, setRole] = useState<string>(BORROWER_POSITION_ROLE);
  const [data, setdata] = useState([]);
  const [aggregatedCreditLinePage, setAggregatedCreditLine] = useState<CreditLinePage>();

  const availableRoles = [BORROWER_POSITION_ROLE, LENDER_POSITION_ROLE, ARBITER_POSITION_ROLE];

  const SummaryCardItems = availableRoles.map((role: string) => {
    return {
      header: t(''),
      Component: (
        <RoleOption onClick={() => setRole(role)} active={role === currentRole} key={`s-${role}`}>
          {t(`settings:${role}`)}
        </RoleOption>
      ),
    };
  });

  useEffect(() => {
    if (!borrowerAddress || !isValidAddress(borrowerAddress)) {
      dispatch(AlertsActions.openAlert({ message: 'INVALID_ADDRESS', type: 'error' }));
      history.push('/market');
      return;
    } else if (borrowerAddress.length === 42) {
      dispatch(LinesActions.getBorrowerPositions({ borrower: borrowerAddress.toLocaleLowerCase() }));
      dispatch(LinesActions.getUserPortfolio({ user: borrowerAddress.toLocaleLowerCase() }));
    }
  }, [currentRole, walletIsConnected]);

  // TODO: Remove this as it is unnecessary. See the useEffect() codeblock below as a demonstration of how to use the userPortfolio object from state.
  // useEffect(() => {
  //   if (borrowerPositions) {
  //     let borrowerData: any = [];
  //     const keys = Object.keys(borrowerPositions);
  //     keys.map((key) => {
  //       let data = borrowerPositions[key];
  //       borrowerData.push(data);
  //     });
  //     setdata(borrowerData);
  //     console.log('Borrower Data State: ', borrowerData);
  //   }
  // }, [borrowerPositions]);

  useEffect(() => {
    if (userPortfolio) {
      let borrowerData: any = [];
      borrowerData = userPortfolio.borrowerPositions;
      setdata(borrowerData);
    }
  }, [userPortfolio]);

  useEffect(() => {
    let aggregate;
    if (data) {
      aggregate = formatGetBorrowerQuery(data, borrowerAddress);
    }
    setAggregatedCreditLine(aggregate);
  }, [data]);

  return (
    <StyledViewContainer>
      <HeaderCard items={SummaryCardItems} cardSize="small" />

      {!walletIsConnected && <StyledNoWalletCard />}

      {userTokensLoading && <StyledSpinnerLoading />}

      {!aggregatedCreditLinePage && (
        <StyledSliderCard
          header={t('components.no-borrower-positions.header')}
          Component={
            <Text>
              <p>{t('components.no-borrower-positions.content')}</p>
            </Text>
          }
        />
      )}

      {aggregatedCreditLinePage && currentRole === BORROWER_POSITION_ROLE ? (
        <StyledBorrowerContainer>
          <LineDetailsDisplay page={aggregatedCreditLinePage} line={aggregatedCreditLinePage} />
        </StyledBorrowerContainer>
      ) : (
        ''
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
