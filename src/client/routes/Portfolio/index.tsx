import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';

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
import { SummaryCard, ViewContainer, SliderCard, LineDetailsDisplay } from '@components/app';
import { SpinnerLoading, Text } from '@components/common';
import { isValidAddress, formatGetBorrowerQuery } from '@utils';
import { CreditLinePage, LENDER_POSITION_ROLE, BORROWER_POSITION_ROLE } from '@src/core/types';
import { PositionsTable } from '@src/client/components/app/LineDetailsDisplay/PositionsTable';

const StyledViewContainer = styled(ViewContainer)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: min-content;
`;

const HeaderCard = styled(SummaryCard)`
  grid-column: 1 / 3;
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

const StyledBorrowerContainer = styled.div`
  grid-column: 1 / 3;
`;

type userParams = {
  userAddress: string;
};

export const Portfolio = () => {
  const { t } = useAppTranslation(['common', 'home']);
  const isMounting = useIsMounting();
  const { userAddress } = useParams<userParams>();
  const dispatch = useAppDispatch();
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);

  const userTokens = useAppSelector(TokensSelectors.selectUserTokens);
  const activeModal = useAppSelector(ModalSelectors.selectActiveModal);
  const appStatus = useAppSelector(AppSelectors.selectAppStatus);
  const tokensListStatus = useAppSelector(TokensSelectors.selectWalletTokensStatus);
  const generalLoading = (appStatus.loading || tokensListStatus.loading || isMounting) && !activeModal;
  const userPortfolio = useAppSelector(LinesSelectors.selectUserPortfolio);

  const userTokensLoading = generalLoading && !userTokens.length;
  const [currentRole, setRole] = useState<string>(BORROWER_POSITION_ROLE);
  const [data, setdata] = useState<any[]>([]);
  const [aggregatedCreditLinePage, setAggregatedCreditLine] = useState<CreditLinePage>();

  const availableRoles = [BORROWER_POSITION_ROLE, LENDER_POSITION_ROLE];

  const SummaryCardItems = availableRoles.map((role: string) => {
    return {
      header: t(''),
      Component: (
        <RoleOption onClick={() => handleSetRole(role)} active={role === currentRole} key={`s-${role}`}>
          {t(`settings:${role}`)}
        </RoleOption>
      ),
    };
  });

  const handleSetRole = (role: string) => {
    setdata([]);
    setRole(role);
  };

  useEffect(() => {
    if (!userAddress || !isValidAddress(userAddress)) {
      dispatch(AlertsActions.openAlert({ message: 'INVALID_ADDRESS', type: 'error' }));
      return;
    } else if (userAddress.length === 42) {
      dispatch(LinesActions.getUserPortfolio({ user: userAddress.toLocaleLowerCase() }));
    }
  }, [currentRole, walletIsConnected]);

  useEffect(() => {
    if (userPortfolio && currentRole === BORROWER_POSITION_ROLE) {
      //Types for returned obj need to be set up correctly
      //@ts-ignore
      const borrowerData: any[] = userPortfolio.borrowerLineOfCredits;
      setdata(borrowerData);
      if (borrowerData && borrowerData[0]) {
        const lineId = borrowerData[0].id;
        dispatch(LinesActions.setSelectedLineAddress({ lineAddress: lineId }));
      }
    }
    if (userPortfolio && currentRole === LENDER_POSITION_ROLE) {
      const lenderData = userPortfolio?.lenderPositions?.positions;
      setdata(lenderData ? lenderData : []);
      if (lenderData && lenderData[0].id) {
        const lineId = lenderData[0].id;
        dispatch(LinesActions.setSelectedLineAddress({ lineAddress: lineId }));
      }
    }
  }, [userPortfolio, currentRole]);

  useEffect(() => {
    let aggregate;
    if (data && currentRole === BORROWER_POSITION_ROLE) {
      aggregate = formatGetBorrowerQuery(data, userAddress);
    }
    setAggregatedCreditLine(aggregate);
  }, [data]);

  return (
    <StyledViewContainer>
      <HeaderCard items={SummaryCardItems} cardSize="small" />

      {!aggregatedCreditLinePage && !data && <StyledSpinnerLoading />}

      {aggregatedCreditLinePage && currentRole === BORROWER_POSITION_ROLE ? (
        <StyledBorrowerContainer>
          <LineDetailsDisplay page={aggregatedCreditLinePage} line={aggregatedCreditLinePage} />
        </StyledBorrowerContainer>
      ) : (
        ''
      )}

      {currentRole === LENDER_POSITION_ROLE ? (
        <StyledBorrowerContainer>
          <PositionsTable events={data} />
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
