import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

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

interface Transaction {
  name: string;
  handler: (e: Event) => void;
  disabled: boolean;
}

export const PositionsTable = (props: PositionsProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const dispatch = useAppDispatch();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));

  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const userRoleMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const lineAddress = useAppSelector(LinesSelectors.selectSelectedLineAddress);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const [actions, setActions] = useState<Transaction[]>([]);
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

  const ApproveMutualConsent = {
    name: t('Accept'),
    handler: (e: Event) => acceptProposalHandler(e),
    disabled: false,
  };

  useEffect(() => {
    switch (userRoleMetadata.role) {
      case BORROWER_POSITION_ROLE:
        setActions([
          {
            name: t('components.transaction.borrow'),
            handler: (e: Event) => borrowHandler(e),
            disabled: false,
          },
          {
            name: t('components.transaction.deposit-and-repay.header'),
            handler: (e: Event) => depositAndRepayHandler(e),
            disabled: false,
          },
        ]);
        break;
      case LENDER_POSITION_ROLE:
        setActions([
          {
            name: t('components.transaction.withdraw'),
            handler: (e: Event) => WithdrawHandler(e),
            disabled: false,
          },
        ]);
        break;
      case ARBITER_POSITION_ROLE:
        setActions([
          {
            name: t('components.transaction.liquidate'),
            handler: (e: Event) => liquidateHandler(e),
            disabled: false,
          },
        ]);
        break;
      default:
        setActions([]);
    }
  }, [userWallet]);

  //Action Handlers for positions table

  const depositHandler = (e: Event) => {
    if (!userWallet) {
      connectWallet();
    } else {
      dispatch(LinesActions.setSelectedLinePosition({ position: (e.target as HTMLInputElement).value }));
      dispatch(ModalsActions.openModal({ modalName: 'addPosition' }));
    }
  };

  const liquidateHandler = (e: Event) => {
    dispatch(LinesActions.setSelectedLinePosition({ position: (e.target as HTMLInputElement).value }));
    dispatch(ModalsActions.openModal({ modalName: 'liquidateBorrower' }));
  };

  const WithdrawHandler = (e: Event) => {
    dispatch(LinesActions.setSelectedLinePosition({ position: (e.target as HTMLInputElement).value }));
    dispatch(ModalsActions.openModal({ modalName: 'withdraw' }));
  };

  const borrowHandler = (e: Event) => {
    dispatch(LinesActions.setSelectedLinePosition({ position: (e.target as HTMLInputElement).value }));
    dispatch(ModalsActions.openModal({ modalName: 'borrow' }));
  };

  const depositAndRepayHandler = (e: Event) => {
    dispatch(LinesActions.setSelectedLinePosition({ position: (e.target as HTMLInputElement).value }));
    dispatch(ModalsActions.openModal({ modalName: 'depositAndRepay' }));
  };

  const acceptProposalHandler = (e: Event) => {
    dispatch(LinesActions.setSelectedLinePosition({ position: (e.target as HTMLInputElement).value }));
    dispatch(ModalsActions.openModal({ modalName: 'addPosition' }));
  };

  const isWithdrawable = (deposit: string, borrowed: string, lender: string, interestRepaid: string) => {
    // Withdraw/Accept are not working on Portfolio / Lender
    if (!userWallet) {
      return;
    }
    return (
      Number(borrowed) < Number(deposit) + Number(interestRepaid) &&
      ethers.utils.getAddress(lender) === ethers.utils.getAddress(userWallet!)
    );
  };

  let ctaButtonText = userWallet
    ? `${t('lineDetails:positions-table.new-position')}`
    : `${t('components.connect-button.connect')}`;

  //Returns a list of transactions to display on positions table
  const getUserPositionActions = (position: CreditPosition) => {
    if (position.status === 'PROPOSED' && userRoleMetadata.role === BORROWER_POSITION_ROLE) {
      return [ApproveMutualConsent];
    }
    //If user is lender, and line has amount to withdraw, return withdraw action
    if (isWithdrawable(position.deposit, position.principal, position.lender, position.interestRepaid)) {
      return actions;
    }
    //Returns actions for borrower on open line
    if (userRoleMetadata.role === BORROWER_POSITION_ROLE) {
      return actions;
    }
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
            /** @TODO add tags e.g. spigot here */
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
              {/*Do not render if user is lender*/}
              <Button onClick={depositHandler}>{ctaButtonText}</Button>
            </>
          }
          searching={false}
          filterLabel="Show 0% APY"
          //@ts-ignore
          filterBy={''}
          initialSortBy="deposit"
          onAction={() => console.log('action')}
          wrap
        />
      </ViewContainer>
      <br />
    </>
  );
};
