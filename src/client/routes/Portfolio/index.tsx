import styled from 'styled-components';
import { useState, useEffect } from 'react';
import _ from 'lodash';
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
  WalletActions,
} from '@store';
import { SummaryCard, ViewContainer, LineDetailsDisplay, NoWalletCard } from '@components/app';
import { SpinnerLoading } from '@components/common';
import { isValidAddress, halfWidthCss } from '@utils';
import { SecuredLineWithEvents, LENDER_POSITION_ROLE, BORROWER_POSITION_ROLE, CreditPosition } from '@src/core/types';
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
  // const isMounting = useIsMounting();
  const { userAddress } = useParams<userParams>();
  const dispatch = useAppDispatch();

  // TODO: pull all selectors in with single import statement
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  // const userTokens = useAppSelector(TokensSelectors.selectUserTokens);
  // const activeModal = useAppSelector(ModalSelectors.selectActiveModal);
  // const appStatus = useAppSelector(AppSelectors.selectAppStatus);
  // const tokensListStatus = useAppSelector(TokensSelectors.selectWalletTokensStatus);
  // const generalLoading = (appStatus.loading || tokensListStatus.loading || isMounting) && !activeModal;
  const userPortfolio = useAppSelector(LinesSelectors.selectUserPortfolio);
  const portfolioAddress = userAddress ? userAddress : userWallet;
  const allPositions = useAppSelector(LinesSelectors.selectPositionsMap);
  // const userTokensLoading = generalLoading && !userTokens.length;
  // const [portfolioLoaded, setPortfolioLoaded] = useState<boolean>(false);
  const [currentRole, setRole] = useState<string>(BORROWER_POSITION_ROLE);

  const setSelectedLine = (address: string) => dispatch(LinesActions.setSelectedLineAddress({ lineAddress: address }));
  // const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const availableRoles = [BORROWER_POSITION_ROLE, LENDER_POSITION_ROLE];

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
    if (!isValidAddress(portfolioAddress!)) {
      dispatch(AlertsActions.openAlert({ message: 'Please connect wallet.', type: 'error' }));
    } else if (portfolioAddress && isValidAddress(portfolioAddress)) {
      dispatch(LinesActions.getUserPortfolio({ user: portfolioAddress.toLocaleLowerCase() }));
      // @TODO dispatch action to set wallet address == portfolioAddress.
      // dispatch(WalletActions.addressChange({ address: portfolioAddress }));
      // Need to say portfolioAddress is lender instead of user wallet
      // setPortfolioLoaded(true);
    }
  }, [currentRole, walletIsConnected, userWallet]);

  const { borrowerLineOfCredits, lenderPositions } = userPortfolio;
  // setSelectedLine('');
  // setSelectedLine(borrowerLineOfCredits[0].id);

  // Get an array of borrowerPositions by flattening
  // an array of Position arrays from borrowerLineOfCredits map
  const borrowerPositions: CreditPosition[] = _.flatten(
    _.merge(borrowerLineOfCredits.map((loc) => _.values(loc.positions)))
  );

  useEffect(() => {
    if (userPortfolio && currentRole === BORROWER_POSITION_ROLE) {
      const { borrowerLineOfCredits } = userPortfolio;

      if (borrowerLineOfCredits && borrowerLineOfCredits[0]) {
        const lineId = borrowerLineOfCredits[0].id;
        console.log('User Portfolio Borrower LOC', borrowerLineOfCredits);
        console.log('User Portfolio Borrower lineId: ', lineId);
        setSelectedLine(lineId);
      }
    }
    if (userPortfolio && currentRole === LENDER_POSITION_ROLE) {
      if (lenderPositions && lenderPositions[0]) {
        // const lineId = lenderPositions[0];
        // setSelectedLine(lineId);
      }
    }
  }, [userPortfolio, currentRole]);

  return (
    <StyledViewContainer>
      <HeaderCard items={SummaryCardItems} cardSize="small" />

      {/* {!selectedLine && !lenderPositions && <StyledSpinnerLoading />} */}

      {currentRole === BORROWER_POSITION_ROLE && (
        <StyledBorrowerContainer>
          <PositionsTable positions={borrowerPositions} />
        </StyledBorrowerContainer>
      )}

      {currentRole === LENDER_POSITION_ROLE && (
        <StyledBorrowerContainer>
          <PositionsTable positions={lenderPositions.map((id) => allPositions[id])} />
        </StyledBorrowerContainer>
      )}

      {/* {!portfolioLoaded && <StyledNoWalletCard />} */}
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
      // )} */}
    </StyledViewContainer>
  );
};
