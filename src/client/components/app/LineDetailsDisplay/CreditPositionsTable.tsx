import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';

import { ModalsActions, LinesActions, LinesSelectors, WalletSelectors } from '@store';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { device } from '@themes/default';
import { DetailCard, ActionButtons, ViewContainer, SliderCard } from '@components/app';
import { Input, SearchIcon, Text, Button } from '@components/common';
import {
  ARBITER_POSITION_ROLE,
  BORROWER_POSITION_ROLE,
  CreditEvent,
  CreditPosition,
  LENDER_POSITION_ROLE,
} from '@src/core/types';
import { humanize } from '@src/utils';

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
    color: ${theme.colors.titles};
  `}
`;

interface CreditPositionsTableProps {
  positions: CreditPosition[];
}

const BannerCtaButton = styled(Button)`
  width: 80%;
  max-width: 20rem;
  margin-top: 1em;
`;

export const CreditPositionsTable = (props: CreditPositionsTableProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const userRoleMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const [actions, setActions] = useState([]);
  const { positions } = props;
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

  console.log('credit events table', positions);
  return (
    <>
      <TableHeader>{t('components.positions-card.positions')}</TableHeader>
      {isEmpty(positions) ? (
        <SliderCard
          header={t('lineDetails:positions-table.header')}
          Component={
            <Text>
              <p>{t('lineDetails:positions-table.no-data')}</p>

              <BannerCtaButton styling="primary" onClick={depositHandler}>
                {t('lineDetails:positions-table.propose-position')}
              </BannerCtaButton>
            </Text>
          }
        />
      ) : (
        <ViewContainer>
          <PositionsCard
            header={t('components.positions-card.positions')}
            data-testid="line-positions-table"
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
                key: 'dRate',
                header: t('components.positions-card.dRate'),
                sortable: true,
                width: '7rem',
                className: 'col-assets',
              },
              {
                key: 'fRate',
                header: t('components.positions-card.fRate'),
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
            data={positions.map(({ id, status, deposit, dRate, fRate, lender, token }) => ({
              // this needs to be humanized to correct amount depending on the token.
              deposit: humanize('amount', deposit, 18, 2),
              dRate: `${dRate} %`,
              fRate: `${fRate} %`,
              status: status,
              lender: lender,
              token: token.symbol,
              actions: (
                <ActionButtons
                  value={id}
                  actions={
                    status === 'PROPOSED' && userRoleMetadata.role === BORROWER_POSITION_ROLE
                      ? [ApproveMutualConsent]
                      : lender === userWallet
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
            //@ts-ignore
            onAction={console.log('o')}
            wrap
          />
        </ViewContainer>
      )}
      <br />
    </>
  );
};
