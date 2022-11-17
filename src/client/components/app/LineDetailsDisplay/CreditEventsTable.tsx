import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';

import { ModalsActions, LinesActions, LinesSelectors, WalletSelectors } from '@store';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { device } from '@themes/default';
import { DetailCard, ActionButtons, ViewContainer, SliderCard } from '@components/app';
import { Input, SearchIcon, Text, Button } from '@components/common';
import { ARBITER_POSITION_ROLE, BORROWER_POSITION_ROLE, LENDER_POSITION_ROLE } from '@src/core/types';
import { humanize, formatAddress } from '@src/utils';

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

interface CreditEventsTableProps {
  events: [];
}

const BannerCtaButton = styled(Button)`
  width: 80%;
  max-width: 20rem;
  margin-top: 1em;
`;

export const CreditEventsTable = (props: CreditEventsTableProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const userRoleMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const [actions, setActions] = useState([]);
  const { events } = props;
  const dispatch = useAppDispatch();

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
    let Transactions = [];

    // TODO integrate UserPositoinMetadata in here
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
    //@ts-ignore
    if (userRoleMetadata.role === ARBITER_POSITION_ROLE) {
      Transactions.push({
        name: t('components.transaction.liquidate'),
        handler: (e: Event) => liquidateHandler(e),
        disabled: false,
      });
    }
    //@ts-ignore
    setActions(Transactions);
  }, [selectedLine]);

  const depositHandler = (e: Event) => {
    //@ts-ignore
    dispatch(LinesActions.setSelectedLinePosition({ position: e.target.value }));
    dispatch(ModalsActions.openModal({ modalName: 'addPosition' }));
  };

  console.log('user wallet and lender', userWallet);

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

  console.log('credit events table', events);
  return (
    <>
      <TableHeader>{t('components.positions-card.positions')}</TableHeader>
      {isEmpty(events) ? (
        <SliderCard
          header={t('lineDetails:positions-events.header')}
          Component={
            <Text>
              <p>{t('lineDetails:positions-events.no-data')}</p>

              <BannerCtaButton styling="primary" onClick={depositHandler}>
                {t('lineDetails:positions-events.propose-position')}
              </BannerCtaButton>
            </Text>
          }
        />
      ) : (
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
                key: 'principle',
                header: t('components.positions-card.principle'),
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
            data={events.map((event) => ({
              // this needs to be humanized to correct amount depending on the token.
              deposit: humanize('amount', event['deposit'], 18, 2),
              drate: `${event['drate']} %`,
              frate: `${event['frate']} %`,
              status: event['status'],
              lender: formatAddress(event['lender']),
              principle: humanize('amount', event['principle'], 18, 2),
              interest: humanize('amount', event['interestAccrued'], 18, 2),
              token: event['tokenSymbol'],
              actions: (
                <ActionButtons
                  value={event['id']}
                  actions={
                    event['status'] === 'PROPOSED' && userRoleMetadata.role === BORROWER_POSITION_ROLE
                      ? [ApproveMutualConsent]
                      : userRoleMetadata.role === LENDER_POSITION_ROLE
                      ? actions
                      : userRoleMetadata.role === BORROWER_POSITION_ROLE
                      ? actions
                      : []
                  }
                />
              ),
            }))}
            SearchBar={
              <>
                <Input
                  value={''}
                  onChange={(e) => console.log(e)}
                  placeholder={t('components.search-input.search')}
                  Icon={SearchIcon}
                />
                <Button onClick={depositHandler}>New Position</Button>
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
      )}
      <br />
    </>
  );
};
