import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { ModalsActions, LinesActions, LinesSelectors, WalletSelectors, WalletActions } from '@store';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { device } from '@themes/default';
import { DetailCard, ActionButtons, ViewContainer } from '@components/app';
import { Input, SearchIcon, Button } from '@components/common';
import { ARBITER_POSITION_ROLE, BORROWER_POSITION_ROLE, LENDER_POSITION_ROLE, CreditPosition } from '@src/core/types';
import { humanize, normalizeAmount, formatAddress } from '@src/utils';
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

interface PositionsProps {
  positions: CreditPosition[];
}

interface Transaction {
  name: string;
  handler: (e: Event) => void;
  disabled: boolean;
}

export const PositionsTable = (props: PositionsProps) => {
  console.log('render positions', props);
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
    console.log('p t', selectedLine, lineAddress);
    if (selectedLine && !lineAddress) {
      console.log('p t 2', selectedLine, lineAddress);
      dispatch(LinesActions.setSelectedLineAddress({ lineAddress: selectedLine.id }));
    } else if (lineAddress && !selectedLine) {
      console.log('p t 3', selectedLine, lineAddress);
      dispatch(LinesActions.getLinePage({ id: lineAddress }));
    }
  }, [lineAddress, selectedLine]);

  const ApproveMutualConsent = {
    name: t('Accept'),
    handler: (e: Event) => acceptProposalHandler(e),
    disabled: false,
  };

  useEffect(() => {
    let Transactions: Transaction[] = [];
    if (!userWallet) {
      Transactions = [];
    }
    if (userRoleMetadata.role === BORROWER_POSITION_ROLE) {
      Transactions.push({
        name: t('components.transaction.borrow'),
        handler: (e: Event) => borrowHandler(e),
        disabled: false,
      });
      Transactions.push({
        name: t('components.transaction.deposit-and-repay.header'),
        handler: (e: Event) => depositAndRepayHandler(e),
        disabled: false,
      });
    }
    if (userRoleMetadata.role === LENDER_POSITION_ROLE) {
      Transactions.push({
        name: t('components.transaction.withdraw'),
        handler: (e: Event) => WithdrawHandler(e),
        disabled: false,
      });
      console.log('withdraw');
    }
    if (userRoleMetadata.role === ARBITER_POSITION_ROLE) {
      Transactions.push({
        name: t('components.transaction.liquidate'),
        handler: (e: Event) => liquidateHandler(e),
        disabled: false,
      });
    }
    setActions(Transactions);
  }, [userWallet]);

  //Action Handlers for positions table

  const depositHandler = (e: Event) => {
    if (!userWallet) {
      connectWallet();
    } else {
      //@ts-ignore
      dispatch(LinesActions.setSelectedLinePosition({ position: e.target.value }));
      dispatch(ModalsActions.openModal({ modalName: 'addPosition' }));
    }
  };

  // THIS NEEDS REVISITNG
  const liquidateHandler = (e: Event) => {
    //@ts-ignore
    dispatch(LinesActions.setSelectedLinePosition({ position: e.target.value }));
    dispatch(ModalsActions.openModal({ modalName: 'liquidateBorrower' }));
  };

  const WithdrawHandler = (e: Event) => {
    //@ts-ignore
    dispatch(LinesActions.setSelectedLinePosition({ position: e.target.value }));
    dispatch(ModalsActions.openModal({ modalName: 'withdraw' }));
  };

  const borrowHandler = (e: Event) => {
    //@ts-ignore
    dispatch(LinesActions.setSelectedLinePosition({ position: e.target.value }));
    dispatch(ModalsActions.openModal({ modalName: 'borrow' }));
  };

  const depositAndRepayHandler = (e: Event) => {
    //@ts-ignore
    dispatch(LinesActions.setSelectedLinePosition({ position: e.target.value }));
    dispatch(ModalsActions.openModal({ modalName: 'depositAndRepay' }));
  };

  const acceptProposalHandler = (e: Event) => {
    //@ts-ignore
    dispatch(LinesActions.setSelectedLinePosition({ position: e.target.value }));
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
  const getUserPositionActions = (event: CreditPosition) => {
    //If proposed and user is borrower, display return action (accept/mutualconsent)
    if (event.status === 'PROPOSED' && userRoleMetadata.role === BORROWER_POSITION_ROLE) {
      return [ApproveMutualConsent];
    }
    //If user is lender, and line has amount to withdraw, return withdraw action
    if (isWithdrawable(event.deposit, event.principal, event.lender, event.interestRepaid)) {
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
          data={positions?.map((p) => {
            return {
              // this needs to be humanized to correct amount depending on the token.
              deposit: humanize('amount', p.deposit, p.token.decimals, 2),
              drate: `${normalizeAmount(p.dRate, 2)} %`,
              frate: `${normalizeAmount(p.fRate, 2)} %`,
              status: p.status,
              principal: humanize('amount', p.principal, p.token.decimals, 2),
              interest: humanize('amount', p.interestAccrued, p.token.decimals, 2),
              lender: formatAddress(p.lender),
              token: p.token.symbol,
              actions: <ActionButtons value={p.id} actions={getUserPositionActions(p)} />,
            };
          })}
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
