import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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
import { SummaryCard, ViewContainer, LineDetailsDisplay, NoWalletCard } from '@components/app';
import { SpinnerLoading } from '@components/common';
import { isValidAddress, halfWidthCss } from '@utils';
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

const StyledNoWalletCard = styled(NoWalletCard)`
  grid-column: 1 / 3;
  ${halfWidthCss}
`;

export const Portfolio = () => {
  const { t } = useAppTranslation(['common', 'home']);
  const isMounting = useIsMounting();
  const { userAddress } = useParams<userParams>();
  const dispatch = useAppDispatch();

  // TODO: pull all selectors in with single import statement
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const userTokens = useAppSelector(TokensSelectors.selectUserTokens);
  const activeModal = useAppSelector(ModalSelectors.selectActiveModal);
  const appStatus = useAppSelector(AppSelectors.selectAppStatus);
  const tokensListStatus = useAppSelector(TokensSelectors.selectWalletTokensStatus);
  const generalLoading = (appStatus.loading || tokensListStatus.loading || isMounting) && !activeModal;
  const userPortfolio = useAppSelector(LinesSelectors.selectUserPortfolio);
  const linesMap = useAppSelector(LinesSelectors.selectLinesMap);
  const portfolioAddress = userAddress ? userAddress : userWallet;
  const userTokensLoading = generalLoading && !userTokens.length;
  const [portfolioLoaded, setPortfolioLoaded] = useState<boolean>(false);
  const [currentRole, setRole] = useState<string>(BORROWER_POSITION_ROLE);

  // TODO: Add types
  const [lenderData, setLenderData] = useState<any[]>([]);

  const setSelectedLine = (address: string) => dispatch(LinesActions.setSelectedLineAddress({ lineAddress: address }));
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);

  console.log('user portfolio', userPortfolio, selectedLine);

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
    setLenderData([]);
    setRole(role);
  };

  useEffect(() => {
    if (!isValidAddress(portfolioAddress!)) {
      dispatch(AlertsActions.openAlert({ message: 'Please connect wallet.', type: 'error' }));
    } else if (portfolioAddress && isValidAddress(portfolioAddress)) {
      dispatch(LinesActions.getUserPortfolio({ user: portfolioAddress.toLocaleLowerCase() }));
      setPortfolioLoaded(true);
    }
  }, [currentRole, walletIsConnected, userWallet]);

  useEffect(() => {
    if (userPortfolio && currentRole === BORROWER_POSITION_ROLE) {
      // const borrowerData: any[] = userPortfolio.borrowerLineOfCredits;
      // if (borrowerData && borrowerData[0]) {
      //   const lineId = borrowerData[0].id;
      //   setSelectedLine(lineId);
      // const positionId = borrowerData[0].positions[0]?.id;
      // dispatch(LinesActions.setSelectedLinePosition({ position: positionId }));
      // }
    }
    if (userPortfolio && currentRole === LENDER_POSITION_ROLE) {
      const lenderData = userPortfolio?.lenderPositions;
      setLenderData(lenderData ? lenderData : []);
      if (lenderData && lenderData[0]) {
        const lineId = lenderData[0].id;
        setSelectedLine(lineId);
      }
    }
  }, [userPortfolio, currentRole]);

  return (
    <StyledViewContainer>
      <HeaderCard items={SummaryCardItems} cardSize="small" />

      {!selectedLine && !lenderData && <StyledSpinnerLoading />}

      {portfolioLoaded && selectedLine && currentRole === BORROWER_POSITION_ROLE ? (
        <StyledBorrowerContainer>
          <LineDetailsDisplay page={selectedLine as CreditLinePage} line={selectedLine} />
        </StyledBorrowerContainer>
      ) : (
        ''
      )}

      {portfolioLoaded && currentRole === LENDER_POSITION_ROLE && lenderData.length > 0 ? (
        <StyledBorrowerContainer>
          <PositionsTable positions={lenderData} />
        </StyledBorrowerContainer>
      ) : (
        ''
      )}

      {!portfolioLoaded && <StyledNoWalletCard />}
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
