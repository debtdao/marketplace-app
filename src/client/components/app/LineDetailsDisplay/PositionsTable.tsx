import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';

import { ModalsActions, LinesActions, LinesSelectors, WalletSelectors, WalletActions } from '@store';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { device } from '@themes/default';
import { DetailCard, ActionButtons, ViewContainer } from '@components/app';
import { Input, SearchIcon, Button, RedirectIcon } from '@components/common';
import { ARBITER_POSITION_ROLE, BORROWER_POSITION_ROLE, LENDER_POSITION_ROLE, CreditPosition } from '@src/core/types';
import { humanize, formatAddress } from '@src/utils';
import { getEnv } from '@config/env';

const linkHoverFilter = 'brightness(90%)';
const linkTransition = 'filter 200ms ease-in-out';

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
    filter: ${linkHoverFilter};
  }

  span {
    transition: ${linkTransition};
  }
  ${(props) =>
    props.selected &&
    `
    color: ${props.theme.colors.titlesVariant};
  `}
`;

const Redirect = styled(RedirectIcon)`
  display: inline-block;
  fill: currentColor;
  width: 1.2rem;
  margin-left: 1rem;
  padding-bottom: 0.2rem;
`;

interface PositionsProps {
  events: CreditPosition[];
}

interface Transaction {
  name: string;
  handler: (e: Event) => void;
  disabled: boolean;
}

export const PositionsTable = (props: PositionsProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const userRoleMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const lineAddress = useAppSelector(LinesSelectors.selectSelectedLineAddress);
  const selectedPage = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const [actions, setActions] = useState<Transaction[]>([]);
  const { events } = props;
  const dispatch = useAppDispatch();
  const { NETWORK } = getEnv();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));

  //Initial set up for positions table

  useEffect(() => {
    if (!selectedLine) {
      return;
    }
    let address = selectedLine.id;
    dispatch(LinesActions.setSelectedLineAddress({ lineAddress: address }));
  }, [selectedLine]);

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
  }, [selectedLine, userWallet]);

  useEffect(() => {
    if (!lineAddress) {
      return;
    }
    dispatch(LinesActions.getLinePage({ id: lineAddress }));
  }, [selectedPage]);

  //Action Handlers for positions table

  const depositHandler = (e: Event) => {
    if (!userWallet) {
      connectWallet();
    } else {
      const target = e.target! as HTMLInputElement;
      dispatch(LinesActions.setSelectedLinePosition({ position: target.value! }));
      dispatch(ModalsActions.openModal({ modalName: 'addPosition' }));
    }
  };

  const liquidateHandler = (e: Event) => {
    const target = e.target! as HTMLInputElement;
    dispatch(LinesActions.setSelectedLinePosition({ position: target.value! }));
    dispatch(ModalsActions.openModal({ modalName: 'liquidateBorrower' }));
  };

  const WithdrawHandler = (e: Event) => {
    const target = e.target! as HTMLInputElement;
    dispatch(LinesActions.setSelectedLinePosition({ position: target.value! }));
    dispatch(ModalsActions.openModal({ modalName: 'withdraw' }));
  };

  const borrowHandler = (e: Event) => {
    const target = e.target! as HTMLInputElement;
    dispatch(LinesActions.setSelectedLinePosition({ position: target.value! }));
    dispatch(ModalsActions.openModal({ modalName: 'borrow' }));
  };

  const depositAndRepayHandler = (e: Event) => {
    const target = e.target! as HTMLInputElement;
    dispatch(LinesActions.setSelectedLinePosition({ position: target.value! }));
    dispatch(ModalsActions.openModal({ modalName: 'depositAndRepay' }));
  };

  const acceptProposalHandler = (e: Event) => {
    const target = e.target! as HTMLInputElement;
    dispatch(LinesActions.setSelectedLinePosition({ position: target.value! }));
    dispatch(ModalsActions.openModal({ modalName: 'addPosition' }));
  };

  const isWithdrawable = (deposit: string, borrowed: string, lender: string, interestRepaid: string) => {
    if (!userWallet) {
      return;
    }
    return (
      Number(borrowed) < Number(deposit) + Number(interestRepaid) &&
      ethers.utils.getAddress(lender) === ethers.utils.getAddress(userWallet!)
    );
  };

  let ctaButtonText = userWallet
    ? `${t('lineDetails:positions-events.propose-position')}`
    : `${t('components.connect-button.connect')}`;

  const getUserTransactions = (event: CreditPosition) => {
    if (event.status === 'PROPOSED' && userRoleMetadata.role === BORROWER_POSITION_ROLE) {
      return [ApproveMutualConsent];
    }
    if (isWithdrawable(event.deposit, event.principal, event.lender, event.interestRepaid)) {
      return actions;
    }
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
          data={events?.map((event) => ({
            // this needs to be humanized to correct amount depending on the token.
            deposit: humanize('amount', event.deposit, event.token.decimals, 2),
            drate: `${event.drate} %`,
            frate: `${event.frate} %`,
            status: event.status,
            principal: humanize('amount', event.principal, event.token.decimals, 2),
            interest: humanize('amount', event.interestAccrued, event.token.decimals, 2),
            lender: (
              <RouterLink to={`/portfolio/${event.lender}`} key={event.id} selected={false}>
                {formatAddress(event.lender)}
                <Redirect />
              </RouterLink>
            ),
            token: (
              <a
                //change to etherscan on launch
                href={`https://etherscan.io/address/${event.token.id}`}
                target={'_blank'}
                key={`${event.token.symbol}-${event.id}`}
                rel={'noreferrer'}
              >
                {event.token.symbol}
                <Redirect />
              </a>
            ),
            actions: <ActionButtons value={event.id} actions={getUserTransactions(event)} />,
          }))}
          SearchBar={
            <>
              <Input
                value={''}
                onChange={(e) => console.log(e)}
                placeholder={t('components.search-input.search')}
                Icon={SearchIcon}
              />
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
