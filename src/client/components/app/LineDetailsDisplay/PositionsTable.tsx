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
} from '@store';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { device } from '@themes/default';
import { DetailCard, ActionButtons, ViewContainer } from '@components/app';
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
  max-width: ${({ theme }) => theme.globalMaxWidth};
  padding: ${({ theme }) => theme.card.padding};
  @media ${device.tablet} {
    .col-name {
      width: 100%;
    }
  }
  @media (max-width: 750px) {
    .col-assets {
      display: none;
    }
  }
  @media ${device.mobile} {
    .col-available {
      width: 10rem;
    }
  }
  @media (max-width: 450px) {
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
  padding: 0.5rem;

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

interface PositionsProps {
  positions: CreditPosition[];
  displayLine?: boolean; // whether to add the positions line to the table
}

interface ActionButtonProps {
  name: string;
  handler: (position?: string) => void;
  disabled: boolean;
}

export const PositionsTable = ({ positions, displayLine = false }: PositionsProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const dispatch = useAppDispatch();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const userRoleMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const lineAddress = useAppSelector(LinesSelectors.selectSelectedLineAddress);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const { NETWORK } = getEnv();
  const ensMap = useAppSelector(OnchainMetaDataSelector.selectENSPairs);

  // Initial set up for positions table
  useEffect(() => {
    if (selectedLine && !lineAddress) {
      dispatch(LinesActions.setSelectedLineAddress({ lineAddress: selectedLine.id }));
    } else if (lineAddress && !selectedLine) {
      dispatch(LinesActions.getLinePage({ id: lineAddress }));
    }
  }, [lineAddress, selectedLine]);

  // Action Handlers for positions table

  const depositHandler = (position?: string, proposal?: string) => {
    console.log('Deposit Handler: ', position, proposal);
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

      if (position.status === PROPOSED_STATUS) {
        const approveMutualConsent = {
          name: t('components.transaction.add-credit.accept-terms'),
          handler: depositHandler,
          disabled: false,
        };
        return [approveMutualConsent];
      }

      const borrowAction = {
        name: t('components.transaction.borrow'),
        handler: borrowHandler,
        disabled: false,
      };

      if (position.deposit === position.principal) return [repayAction];
      else return [borrowAction, repayAction];
    }

    // If user is lender and position status is PROPOSED, return revoke consent action
    if (getAddress(position.lender) === userWallet && position.status === PROPOSED_STATUS) {
      return [
        {
          name: t('components.transaction.revoke-consent.cta'),
          handler: revokeConsentHandler,
          disabled: false,
        },
      ];
      // If user is lender, and line has amount to withdraw, return withdraw action
    } else if (
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
    console.log('Proposal: ', proposal);

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

    // Display button to approve proposal for the borrower of the proposal
    if (userRoleMetadata.role === BORROWER_POSITION_ROLE) {
      return [approveMutualConsent];
    }

    // Display button to cancel proposal for the maker of the proposal
    if (getAddress(proposal.maker) === userWallet) {
      return [revokeMutualConsent];
    }

    return [];
  };

  const formattedPositions = _.flatten(
    positions?.map((position) => {
      const positionToDisplay = {
        // this needs to be humanized to correct amount depending on the token.
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
          <RouterLink
            key={position.token.address}
            to={`https://etherscan.io/address/${position.token.address}`}
            selected={false}
          >
            {position.token.symbol}
          </RouterLink>
        ),
        actions: (
          <ActionButtons
            value1={position.id}
            actions={position.status !== PROPOSED_STATUS ? getUserPositionActions(position) : []}
          />
        ),
      };
      const proposals = position.status === PROPOSED_STATUS ? position.proposalsMap : {};
      const proposalsToDisplay =
        position.status === PROPOSED_STATUS
          ? Object.values(position.proposalsMap)
              .filter((proposal) => proposal.revokedAt === null)
              .map((proposal) => {
                console.log('Proposal: ', proposal);
                return {
                  deposit: humanize('amount', proposal.args[2], position.token.decimals, 2),
                  drate: `${normalizeAmount(proposal.args[0], 2)} %`,
                  frate: `${normalizeAmount(proposal.args[1], 2)} %`,
                  line: (
                    <RouterLink to={`/${currentNetwork}/lines/${position.line}`} key={position.line} selected={false}>
                      {formatAddress(position.line)}
                      <RedirectLinkIcon />
                    </RouterLink>
                  ),
                  status: position.status, // TODO: remove this if keep original way to display proposals
                  principal: humanize('amount', '0', position.token.decimals, 2),
                  interest: humanize('amount', '0', position.token.decimals, 2),
                  lender: (
                    <RouterLink
                      to={`/${currentNetwork}/portfolio/${proposal.args[4]}`}
                      key={position.id}
                      selected={false}
                    >
                      {formatAddress(getENS(proposal.args[4], ensMap)!)}
                      <RedirectLinkIcon />
                    </RouterLink>
                  ),
                  token: (
                    <RouterLink
                      key={proposal.args[3]}
                      to={`https://etherscan.io/address/${proposal.args[3]}`}
                      selected={false}
                    >
                      {position.token.symbol}
                    </RouterLink>
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
      // TODO: remove this if keep original way to display proposals
      const positionsAndProposalsToDisplay =
        position.status === PROPOSED_STATUS ? [...proposalsToDisplay] : [positionToDisplay];

      // TODO: add this if keep original way to display proposals
      // const positionsAndProposalsToDisplay = [positionToDisplay, ...proposalsToDisplay];

      return positionsAndProposalsToDisplay;
      // return positionToDisplay;
    })
  );

  console.log('positions table display line', displayLine, !displayLine);
  return (
    <>
      <TableHeader>{t('components.positions-card.positions')}</TableHeader>
      <ViewContainer>
        <PositionsCard
          header={' '}
          data-testid="vaults-opportunities-list"
          metadata={[
            {
              key: 'status',
              header: t('components.positions-card.status'),
              sortable: true,
              width: '12rem',
              className: 'col-apy',
            },
            {
              key: 'line',
              hide: !displayLine,
              header: t('components.positions-card.line'),
              sortable: true,
              width: '13rem',
              className: 'col-apy',
            },
            {
              key: 'lender',
              header: t('components.positions-card.lender'),
              sortable: true,
              width: '13rem',
              className: 'col-available',
            },
            {
              key: 'token',
              header: t('components.positions-card.token'),
              sortable: true,
              width: '8rem',
              className: 'col-available',
            },
            {
              key: 'deposit',
              header: t('components.positions-card.total-deposits'),
              sortable: true,
              width: '13rem',
              className: 'col-assets',
            },
            {
              key: 'principal',
              header: t('components.positions-card.principal'),
              sortable: true,
              width: '13rem',
              className: 'col-assets',
            },
            {
              key: 'interest',
              header: t('components.positions-card.interest'),
              sortable: true,
              width: '8rem',
              className: 'col-assets',
            },
            {
              key: 'drate',
              header: t('components.positions-card.drate'),
              sortable: true,
              width: '10rem',
              className: 'col-assets',
            },
            {
              key: 'frate',
              header: t('components.positions-card.frate'),
              sortable: true,
              width: '10rem',
              className: 'col-assets',
            },
            {
              key: 'actions',
              align: 'flex-end',
              width: 'auto',
              grow: '1',
            },
          ]}
          data={formattedPositions}
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
      </ViewContainer>
      <br />
    </>
  );
};
