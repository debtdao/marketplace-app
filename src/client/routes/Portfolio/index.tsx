import styled from 'styled-components';
import { useState, useEffect } from 'react';
import _ from 'lodash';
import { useParams } from 'react-router-dom';

import { useAppSelector, useAppTranslation, useAppDispatch } from '@hooks';
import { WalletSelectors, LinesActions, LinesSelectors, AlertsActions, TokensActions } from '@store';
import { SummaryCard, ViewContainer } from '@components/app';
import { isValidAddress } from '@utils';
import {
  LENDER_POSITION_ROLE,
  BORROWER_POSITION_ROLE,
  CreditPosition,
  SecuredLine,
  UseCreditLinesParams,
} from '@src/core/types';
import { PositionsTable } from '@src/client/components/app/LineDetailsDisplay/PositionsTable';
import { device } from '@themes/default';

const StyledViewContainer = styled(ViewContainer)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: min-content;
`;

const PortfolioHeader = styled.div`
  grid-column: 1 / 3;
  grid-column-gap: ${({ theme }) => theme.spacing.xl};
  display: flex;
  justify-content: space-between;

  @media ${device.desktop} {
    justify-content: flex-start;
  }
`;

const PortfolioOption = styled.div<{ active: boolean }>`
  ${({ theme, active }) => `
    margin: ${theme.spacing.lg} 0;
    color: ${theme.colors.titles};
    font-size: ${theme.fonts.sizes.xl};
    font-weight: 700;
    cursor: pointer;
    ${
      active
        ? `padding-bottom: ${theme.spacing.sm};
                border-bottom: solid 2px ${theme.colors.primaryVariant};`
        : ''
    }
    :hover {
      padding-bottom: ${theme.spacing.sm};
      border-bottom: solid 2px ${theme.colors.secondaryVariantB};
    }
  `}
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
  const { t } = useAppTranslation(['common', 'home', 'portfolio']);
  const { userAddress } = useParams<userParams>();
  const dispatch = useAppDispatch();

  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const userPortfolio = useAppSelector(LinesSelectors.selectUserPortfolio);
  const portfolioAddress = userAddress ? userAddress : userWallet;
  const allPositions = useAppSelector(LinesSelectors.selectPositionsMap);
  const [selectedRole, setRole] = useState<string>(BORROWER_POSITION_ROLE);
  const lineAddress = useAppSelector(LinesSelectors.selectSelectedLineAddress);

  const availableRoles = [BORROWER_POSITION_ROLE, LENDER_POSITION_ROLE];

  // TODO: Move this from market and portfolio pages into a shared location
  const defaultLineCategories: UseCreditLinesParams = {
    // using i18m translation as keys for easy display
    'market:featured.highest-credit': {
      first: 3,
      // NOTE: terrible proxy for total credit (oldest = most). Currently getLines only allows filtering by line metadata not modules'
      orderBy: 'start',
      orderDirection: 'asc',
    },
    'market:featured.highest-revenue': {
      first: 16,
      // NOTE: terrible proxy for total revenue earned (highest % = highest notional). Currently getLines only allows filtering by line metadata not modules'
      orderBy: 'defaultSplit',
      orderDirection: 'desc',
    },
    'market:featured.newest': {
      first: 15,
      orderBy: 'start', // NOTE: theoretically gets lines that start in the future, will have to refine query
      orderDirection: 'desc',
    },
  };

  useEffect(() => {
    if (!isValidAddress(portfolioAddress!)) {
      dispatch(AlertsActions.openAlert({ message: 'Please connect wallet.', type: 'error' }));
    } else if (portfolioAddress && isValidAddress(portfolioAddress)) {
      dispatch(LinesActions.getUserPortfolio({ user: portfolioAddress.toLocaleLowerCase() }));
      // TODO: only dispatch if userPortfolio doesn't provide what we need to populate linesMap
      dispatch(TokensActions.getTokens())
        .then((res) => dispatch(LinesActions.getLines(defaultLineCategories)))
        .then((error) => dispatch(LinesActions.getLines(defaultLineCategories)));
    }
  }, [portfolioAddress]);

  const { borrowerLineOfCredits, lenderPositions } = userPortfolio;
  // Get an array of borrowerPositions by flattening
  // an array of Position arrays from borrowerLineOfCredits map
  const borrowerPositions: CreditPosition[] = _.flatten(
    _.merge(borrowerLineOfCredits.map((loc: SecuredLine) => _.values(loc.positions)))
  );

  useEffect(() => {
    if (userPortfolio) {
      if (selectedRole === BORROWER_POSITION_ROLE) {
        if (borrowerLineOfCredits && borrowerLineOfCredits[0]) {
          const lineAddress = borrowerLineOfCredits[0].id;
          dispatch(LinesActions.clearSelectedLine());
          dispatch(LinesActions.setSelectedLineAddress({ lineAddress }));
        }
      } else {
        if (lenderPositions && lenderPositions[0]) {
          const position = lenderPositions[0];
          dispatch(LinesActions.clearSelectedLine());
          dispatch(LinesActions.setSelectedLinePosition({ position }));
          dispatch(LinesActions.setSelectedLineAddress({ lineAddress: allPositions[position].line }));
        }
      }
    }
  }, [userPortfolio, selectedRole]);

  return (
    <StyledViewContainer>
      <PortfolioHeader>
        {availableRoles.map((role: string) => (
          <PortfolioOption onClick={() => setRole(role)} active={role === selectedRole} key={`s-${role}`}>
            {t('portfolio:options.' + role)}
          </PortfolioOption>
        ))}
      </PortfolioHeader>

      {selectedRole === BORROWER_POSITION_ROLE && (
        <StyledBorrowerContainer>
          <PositionsTable
            borrower={portfolioAddress!}
            lender={undefined}
            positions={borrowerPositions}
            displayLine={true}
          />
        </StyledBorrowerContainer>
      )}

      {selectedRole === LENDER_POSITION_ROLE && (
        <StyledBorrowerContainer>
          <PositionsTable
            borrower={undefined}
            lender={portfolioAddress}
            positions={lenderPositions.map((id) => allPositions[id])}
            displayLine={true}
          />
        </StyledBorrowerContainer>
      )}
    </StyledViewContainer>
  );
};
