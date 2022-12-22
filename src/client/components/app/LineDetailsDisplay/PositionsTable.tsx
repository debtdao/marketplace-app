import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { getAddress, parseUnits } from 'ethers/lib/utils';

import { ModalsActions, LinesActions, LinesSelectors, WalletSelectors, WalletActions } from '@store';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { device } from '@themes/default';
import { DetailCard, ActionButtons, ViewContainer } from '@components/app';
import { Input, SearchIcon, Button, RedirectIcon, Link } from '@components/common';
import { ARBITER_POSITION_ROLE, BORROWER_POSITION_ROLE, LENDER_POSITION_ROLE, CreditPosition } from '@src/core/types';
import { humanize, formatAddress, normalizeAmount } from '@src/utils';
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
}

interface ActionButtonProps {
  name: string;
  handler: (position?: string) => void;
  disabled: boolean;
}

export const PositionsTable = (props: PositionsProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const dispatch = useAppDispatch();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));

  const userRoleMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const lineAddress = useAppSelector(LinesSelectors.selectSelectedLineAddress);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const { positions } = props;
  const { NETWORK } = getEnv();

  //Initial set up for positions table
  useEffect(() => {
    if (selectedLine && !lineAddress) {
      dispatch(LinesActions.setSelectedLineAddress({ lineAddress: selectedLine.id }));
    } else if (lineAddress && !selectedLine) {
      dispatch(LinesActions.getLinePage({ id: lineAddress }));
    }
  }, [lineAddress, selectedLine]);

  //Action Handlers for positions table

  const depositHandler = (position?: string) => {
    if (!userWallet) {
      connectWallet();
    } else {
      console.log('accept Proposal', position);
      dispatch(LinesActions.setSelectedLinePosition({ position }));
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

  const borrowHandler = (position?: string) => {
    if (!position) return;
    console.log('borrow', position);
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

  //Returns a list of transactions to display on positions table
  const getUserPositionActions = (position: CreditPosition) => {
    if(userRoleMetadata.role === ARBITER_POSITION_ROLE) {
      return [
        {
          name: t('components.transaction.liquidate'),
          handler: liquidateHandler,
          disabled: false,
        },
      ];
    }

    if (userRoleMetadata.role === BORROWER_POSITION_ROLE) {
      if (position.status === 'PROPOSED') {
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
      const repayAction = {
          name: t('components.transaction.deposit-and-repay.header'),
          handler: depositAndRepayHandler,
          disabled: false,
        };

      if(position.deposit === position.principal) return [repayAction];
      else return [borrowAction, repayAction];
    }

    //If user is lender, and line has amount to withdraw, return withdraw action
    if (
      getAddress(position.lender) == userWallet &&
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

  return (
    <>
      <TableHeader>{t('components.positions-card.positions')}</TableHeader>
      <ViewContainer>
        <PositionsCard
          header={t('components.positions-card.positions')}
          data-testid="vaults-opportunities-list"
          metadata={[
            {
              key: 'status',
              header: t('components.positions-card.status'),
              sortable: true,
              width: '14rem',
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
              width: '10rem',
              className: 'col-available',
            },
            {
              key: 'deposit',
              header: t('components.positions-card.total-deposits'),
              sortable: true,
              width: '10rem',
              className: 'col-assets',
            },
            {
              key: 'principal',
              header: t('components.positions-card.principal'),
              sortable: true,
              width: '10rem',
              className: 'col-assets',
            },
            {
              key: 'interest',
              header: t('components.positions-card.interest'),
              sortable: true,
              width: '10rem',
              className: 'col-assets',
            },
            {
              key: 'drate',
              header: t('components.positions-card.drate'),
              sortable: true,
              width: '7rem',
              className: 'col-assets',
            },
            {
              key: 'frate',
              header: t('components.positions-card.frate'),
              sortable: true,
              width: '7rem',
              className: 'col-assets',
            },
            {
              key: 'actions',
              align: 'flex-end',
              width: 'auto',
              grow: '1',
            },
          ]}
          data={positions?.map((position) => ({
            // this needs to be humanized to correct amount depending on the token.
            deposit: humanize('amount', position.deposit, position.token.decimals, 2),
            drate: `${normalizeAmount(position.dRate, 2)} %`,
            frate: `${normalizeAmount(position.fRate, 2)} %`,
            status: position.status,
            principal: humanize('amount', position.principal, position.token.decimals, 2),
            interest: humanize('amount', position.interestAccrued, position.token.decimals, 2),
            lender: (
              <RouterLink to={`/portfolio/${position.lender}`} key={position.id} selected={false}>
                {formatAddress(position.lender)}
                <RedirectLinkIcon />
              </RouterLink>
            ),
            token: (
              <a
                //change to etherscan on launch
                href={`https://etherscan.io/address/${position.token.address}`}
                target={'_blank'}
                key={`${position.token.symbol}-${position.id}`}
                rel={'noreferrer'}
              >
                {position.token.symbol}
                <RedirectLinkIcon />
              </a>
            ),
            actions: <ActionButtons value={position.id} actions={getUserPositionActions(position)} />,
          }))}
          SearchBar={
            <>
              <Input
                value={''}
                onChange={(e) => console.log(e)}
                placeholder={t('components.search-input.search')}
                Icon={SearchIcon}
              />

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
