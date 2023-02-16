import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { getAddress, parseUnits } from 'ethers/lib/utils';
import _ from 'lodash';

import {
  ModalsActions,
  LinesActions,
  LinesSelectors,
  WalletSelectors,
  WalletActions,
  OnchainMetaDataSelector,
  NetworkSelectors,
  TokensSelectors,
  TokensActions,
} from '@store';
import { useAppDispatch, useAppSelector, useAppTranslation, useExplorerURL, useWindowDimensions } from '@hooks';
import { device, sharedTheme } from '@themes/default';
import { DetailCard, ActionButtons, ViewContainer, TokenIcon } from '@components/app';
import { Input, SearchIcon, Button, RedirectIcon, Link } from '@components/common';
import {
  ARBITER_POSITION_ROLE,
  BORROWER_POSITION_ROLE,
  LENDER_POSITION_ROLE,
  CreditPosition,
  CreditProposal,
  PROPOSED_STATUS,
  CLOSED_STATUS,
} from '@src/core/types';
import { humanize, formatAddress, normalizeAmount, getENS } from '@src/utils';
import { getEnv } from '@config/env';

const PositionsCard = styled(DetailCard)`
  max-width: 100%;
  width: 100%;
  padding: ${({ theme }) => theme.card.padding};
  @media ${device.tablet} {
    .col-name {
      width: 100%;
    }
  }
  @media ${device.tabletL} {
    .col-assets {
      display: none;
    }
  }
  @media ${device.mobile} {
    .col-assets {
      display: none;
    }
    .col-available {
      display: none;
    }
  }
` as typeof DetailCard;

const TableHeader = styled.h3`
  ${({ theme }) => `
    font-size: ${theme.fonts.sizes.xl};
    font-weight: 600;
    margin: ${theme.spacing.xl} 0;
    color: ${theme.colors.primary};
  `}
`;

const RouterLink = styled(Link)<{ selected: boolean }>`
  display: flex;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  color: inherit;
  font-size: 1.2rem;
  flex: 1;

  &:hover span {
    filter: brightness(90%);
  }

  span {
    transition: filter 200ms ease-in-out;
  }
  ${(props) =>
    props.selected &&
    `
    color: ${props.theme.colors.titlesVariant};
  `}
`;

const RedirectLinkIcon = styled(RedirectIcon)`
  display: inline-block;
  fill: currentColor;
  width: 1.2rem;
  margin-left: 1rem;
  padding-bottom: 0.2rem;
`;

const TokenIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

interface PositionsTableProps {
  borrower?: string;
  lender?: string;
  positions: CreditPosition[];
  displayLine?: boolean; // whether to add the positions line to the table
}

export const PositionsTable = ({ borrower, lender, positions, displayLine = false }: PositionsTableProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const dispatch = useAppDispatch();
  const { isMobile, width } = useWindowDimensions();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));

  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const userRoleMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const lineAddress = useAppSelector(LinesSelectors.selectSelectedLineAddress);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const explorerUrl = useExplorerURL(currentNetwork);
  const { NETWORK } = getEnv();
  const ensMap = useAppSelector(OnchainMetaDataSelector.selectENSPairs);
  const tokensMap = useAppSelector(TokensSelectors.selectTokensMap);

  // Initial set up for positions table
  useEffect(() => {
    if (selectedLine && !lineAddress) {
      dispatch(LinesActions.setSelectedLineAddress({ lineAddress: selectedLine.id }));
    } else if (lineAddress && !selectedLine) {
      if (tokensMap === undefined) {
        dispatch(TokensActions.getTokens()).then((res) => dispatch(LinesActions.getLinePage({ id: lineAddress })));
      } else {
        dispatch(LinesActions.getLinePage({ id: lineAddress }));
      }
    }
  }, [lineAddress, selectedLine]);

  // Action Handlers for positions table

  const depositHandler = (position?: string, proposal?: string) => {
    if (!userWallet) {
      connectWallet();
    } else {
      dispatch(LinesActions.setSelectedLinePosition({ position }));
      dispatch(LinesActions.setSelectedLinePositionProposal({ proposal }));
      dispatch(ModalsActions.openModal({ modalName: 'addPosition' }));
    }
  };

  const liquidateHandler = (position?: string) => {
    if (!position) return;
    dispatch(LinesActions.setSelectedLinePosition({ position }));
    dispatch(ModalsActions.openModal({ modalName: 'liquidateBorrower' }));
  };

  const withdrawHandler = (position?: string) => {
    if (!position) return;
    dispatch(LinesActions.setSelectedLinePosition({ position }));
    dispatch(ModalsActions.openModal({ modalName: 'withdraw' }));
  };

  const revokeConsentHandler = (position?: string, proposal?: string) => {
    if (!position) return;
    dispatch(LinesActions.setSelectedLinePosition({ position }));
    dispatch(LinesActions.setSelectedLinePositionProposal({ proposal }));
    dispatch(ModalsActions.openModal({ modalName: 'revokeConsent' }));
  };

  const borrowHandler = (position?: string) => {
    if (!position) return;
    dispatch(LinesActions.setSelectedLinePosition({ position }));
    dispatch(ModalsActions.openModal({ modalName: 'borrow' }));
  };

  const depositAndRepayHandler = (position?: string) => {
    if (!position) return;
    dispatch(LinesActions.setSelectedLinePosition({ position }));
    dispatch(ModalsActions.openModal({ modalName: 'depositAndRepay' }));
  };

  let ctaButtonText = userWallet
    ? `${t('lineDetails:positions-table.new-position')}`
    : `${t('components.connect-button.connect')}`;

  // Returns a list of transactions to display on positions table
  const getUserPositionActions = (position: CreditPosition) => {
    const repayAction = {
      name: t('components.transaction.repay.header'),
      handler: depositAndRepayHandler,
      disabled: false,
    };

    if (userRoleMetadata.role === ARBITER_POSITION_ROLE) {
      return [
        repayAction,
        {
          name: t('components.transaction.liquidate'),
          handler: liquidateHandler,
          disabled: false,
        },
      ];
    }

    if (userRoleMetadata.role === BORROWER_POSITION_ROLE) {
      if (position.status === CLOSED_STATUS) return [];

      const borrowAction = {
        name: t('components.transaction.borrow'),
        handler: borrowHandler,
        disabled: false,
      };

      if (position.deposit === position.principal) return [repayAction];
      else return [borrowAction, repayAction];
    }

    // If user is lender, and line has amount to withdraw, return withdraw action
    if (
      getAddress(position.lender) === userWallet &&
      BigNumber.from(position.deposit).gt(BigNumber.from(position.principal))
    ) {
      return [
        {
          name: t('components.transaction.withdraw'),
          handler: withdrawHandler,
          disabled: false,
        },
      ];
    }

    // not party to line. no actions;
    return [];
  };

  // Returns a list of transactions to display on positions table for proposals
  const getUserProposalActions = (proposal: CreditProposal) => {
    const approveMutualConsent = {
      name: t('components.transaction.add-credit.accept-terms'),
      handler: depositHandler,
      disabled: false,
    };

    const revokeMutualConsent = {
      name: t('components.transaction.revoke-consent.cta'),
      handler: revokeConsentHandler,
      disabled: false,
    };

    // Display button to approve proposal for the taker/borrower of the proposal
    if (borrower && getAddress(borrower) === userWallet && getAddress(proposal.maker) === userWallet) {
      return [approveMutualConsent, revokeMutualConsent];
    }

    // Display button to approve proposal for the taker/borrower of the proposal
    if (borrower && getAddress(borrower) === userWallet) {
      return [approveMutualConsent];
    }

    // Display button to cancel proposal for the maker of the proposal
    if (getAddress(proposal.maker) === userWallet) {
      return [revokeMutualConsent];
    }

    return [];
  };

  const formattedPositionsAndProposals = _.flatten(
    positions?.map((position) => {
      const tokenIcon = tokensMap?.[getAddress(position.token.address)]?.icon ?? '';
      const positionToDisplay = {
        deposit: humanize('amount', position.deposit, position.token.decimals, 2),
        drate: `${normalizeAmount(position.dRate, 2)} %`,
        frate: `${normalizeAmount(position.fRate, 2)} %`,
        line: (
          <RouterLink to={`/${currentNetwork}/lines/${position.line}`} key={position.line} selected={false}>
            {formatAddress(position.line)}
            <RedirectLinkIcon />
          </RouterLink>
        ),
        status: position.status,
        principal: humanize('amount', position.principal, position.token.decimals, 2),
        interest: humanize('amount', position.interestAccrued, position.token.decimals, 2),
        lender: (
          <RouterLink to={`/${currentNetwork}/portfolio/${position.lender}`} key={position.id} selected={false}>
            {formatAddress(getENS(position.lender, ensMap)!)}
            <RedirectLinkIcon />
          </RouterLink>
        ),
        token: (
          <TokenIconContainer>
            <TokenIcon icon={tokenIcon} symbol={position.token.symbol} size="small" margin="0.5rem" />
            {/* <TokenIcon symbol={position.token.symbol} size="small" margin="0.5rem" /> */}
            <RouterLink
              key={position.token.address}
              to={`${explorerUrl}/address/${position.token.address}`}
              selected={false}
            >
              {position.token.symbol}
              <RedirectLinkIcon />
            </RouterLink>
          </TokenIconContainer>
        ),
        actions: (
          <ActionButtons
            value1={position.id}
            // Note: if position is in PROPOSED_STATUS, then we want to display the proposal actions instead
            actions={position.status !== PROPOSED_STATUS ? getUserPositionActions(position) : []}
          />
        ),
      };
      // generate list of proposals from each position in PROPOSED_STATUS
      const proposalsToDisplay =
        position.status === PROPOSED_STATUS
          ? Object.values(position.proposalsMap)
              .filter((proposal) => proposal.revokedAt === null || proposal.revokedAt === 0)
              .map((proposal) => {
                const tokenIcon = tokensMap?.[getAddress(position.token.address)]?.icon ?? '';
                const [dRate, fRate, deposit, tokenAddress, lenderAddress] = proposal.args;
                return {
                  deposit: humanize('amount', deposit, position.token.decimals, 2),
                  drate: `${normalizeAmount(dRate, 2)} %`,
                  frate: `${normalizeAmount(fRate, 2)} %`,
                  line: (
                    <RouterLink to={`/${currentNetwork}/lines/${position.line}`} key={position.line} selected={false}>
                      {formatAddress(position.line)}
                      <RedirectLinkIcon />
                    </RouterLink>
                  ),
                  status: position.status,
                  principal: humanize('amount', '0', position.token.decimals, 2),
                  interest: humanize('amount', '0', position.token.decimals, 2),
                  lender: (
                    <RouterLink to={`/${currentNetwork}/portfolio/${lenderAddress}`} key={position.id} selected={false}>
                      {formatAddress(getENS(lenderAddress, ensMap)!)}
                      <RedirectLinkIcon />
                    </RouterLink>
                  ),
                  token: (
                    <TokenIconContainer>
                      <TokenIcon icon={tokenIcon} symbol={position.token.symbol} size="small" margin="0.5rem" />
                      <RouterLink
                        key={position.token.address}
                        to={`${explorerUrl}/address/${position.token.address}`}
                        selected={false}
                      >
                        {position.token.symbol}
                        <RedirectLinkIcon />
                      </RouterLink>
                    </TokenIconContainer>
                  ),
                  actions: (
                    <ActionButtons
                      value1={position.id}
                      value2={proposal.id}
                      actions={getUserProposalActions(proposal)}
                    />
                  ),
                };
              })
          : [];

      const positionsAndProposalsToDisplay =
        position.status === PROPOSED_STATUS ? [...proposalsToDisplay] : [positionToDisplay];

      return positionsAndProposalsToDisplay;
    })
  );

  return (
    <>
      <div>
        <PositionsCard
          header={'Positions'}
          data-testid="vaults-opportunities-list"
          metadata={[
            {
              key: 'status',
              header: t('components.positions-card.status'),
              description: t('components.positions-card.tooltip.status'),
              sortable: true,
              className: 'col-status',
            },
            {
              key: 'line',
              hide: !displayLine,
              header: t('components.positions-card.line'),
              description: t('components.positions-card.tooltip.line'),
              sortable: true,
              className: 'col-assets',
            },
            {
              key: 'lender',
              header: t('components.positions-card.lender'),
              description: t('components.positions-card.tooltip.lender'),
              sortable: true,
              className: 'col-available',
            },
            {
              key: 'token',
              header: t('components.positions-card.token'),
              description: t('components.positions-card.tooltip.token'),
              sortable: true,
              className: 'col-token',
            },
            {
              key: 'deposit',
              header: t('components.positions-card.total-deposits'),
              description: t('components.positions-card.tooltip.total-deposits'),
              sortable: true,
              className: 'col-available',
            },
            {
              key: 'principal',
              header: t('components.positions-card.principal'),
              description: t('components.positions-card.tooltip.principal'),
              sortable: true,
              className: 'col-assets',
            },
            {
              key: 'interest',
              header: t('components.positions-card.interest'),
              description: t('components.positions-card.tooltip.interest'),
              sortable: true,
              className: 'col-assets',
            },
            {
              key: 'drate',
              header: t('components.positions-card.drate'),
              description: t('components.positions-card.tooltip.drate'),
              sortable: true,
              className: 'col-assets',
            },
            {
              key: 'frate',
              header: t('components.positions-card.frate'),
              description: t('components.positions-card.tooltip.frate'),
              sortable: true,
              className: 'col-assets',
            },
            {
              key: 'actions',
              description: t('components.positions-card.tooltip.actions'),
              header: 'Actions',
              align: 'flex-end',
              grow: '1',
            },
          ]}
          data={formattedPositionsAndProposals}
          SearchBar={
            <>
              {/* // TODO: Add search bar back when there is a need for it. */}
              {/* <Input
                value={''}
                onChange={(e) => console.log(e)}
                placeholder={t('components.search-input.search')}
                Icon={SearchIcon}
              /> */}

              {userRoleMetadata.role === LENDER_POSITION_ROLE && (
                <Button onClick={depositHandler}>{ctaButtonText}</Button>
              )}
            </>
          }
          searching={false}
          filterLabel="Show 0% APY"
          initialSortBy="deposit"
          onAction={() => console.log('action')}
          wrap
        />
      </div>
      <br />
    </>
  );
};
