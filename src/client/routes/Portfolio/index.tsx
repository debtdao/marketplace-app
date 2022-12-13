import styled from 'styled-components';
import { useState, useEffect } from 'react';
import _ from 'lodash';
import { useParams } from 'react-router-dom';

import { useAppSelector, useAppTranslation, useAppDispatch } from '@hooks';
import { WalletSelectors, LinesActions, LinesSelectors, AlertsActions } from '@store';
import { SummaryCard, ViewContainer } from '@components/app';
import { isValidAddress } from '@utils';
import { LENDER_POSITION_ROLE, BORROWER_POSITION_ROLE, CreditPosition } from '@src/core/types';
import { PositionsTable } from '@src/client/components/app/LineDetailsDisplay/PositionsTable';

const StyledViewContainer = styled(ViewContainer)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: min-content;
`;

const HeaderCard = styled(SummaryCard)`
  grid-column: 1 / 3;
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
  // const isMounting = useIsMounting();
  const { userAddress } = useParams<userParams>();
  const dispatch = useAppDispatch();

  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const userPortfolio = useAppSelector(LinesSelectors.selectUserPortfolio);
  const portfolioAddress = userAddress ? userAddress : userWallet;
  const allPositions = useAppSelector(LinesSelectors.selectPositionsMap);
  const [currentRole, setRole] = useState<string>(BORROWER_POSITION_ROLE);

  const setSelectedLine = (address: string) => dispatch(LinesActions.setSelectedLineAddress({ lineAddress: address }));
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
    }
  }, [currentRole, walletIsConnected, userWallet, userAddress]);

  const { borrowerLineOfCredits, lenderPositions } = userPortfolio;
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
