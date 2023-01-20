import { isEmpty } from 'lodash';
import { BigNumber, ethers } from 'ethers';
import styled from 'styled-components';
import { format } from 'date-fns';

import { device } from '@themes/default';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { ThreeColumnLayout } from '@src/client/containers/Columns';
import { prettyNumbers, getEtherscanUrlStub, unnullify, prettyNumbers2 } from '@src/utils';
import {
  AggregatedEscrow,
  ARBITER_POSITION_ROLE,
  BORROWER_POSITION_ROLE,
  Collateral,
  EscrowDeposit,
  EscrowDepositMap,
  LENDER_POSITION_ROLE,
  Network,
  RevenueSummary,
  SpigotRevenueContractMap,
  TokenView,
} from '@src/core/types';
import { DetailCard, ActionButtons, TokenIcon, ViewContainer } from '@components/app';
import { Button, Text, RedirectIcon, Link, CardEmptyList } from '@components/common';
import {
  LinesSelectors,
  ModalsActions,
  WalletSelectors,
  WalletActions,
  CollateralActions,
  NetworkSelectors,
} from '@src/core/store';
import { humanize } from '@src/utils';
import { getEnv } from '@config/env';

const SectionHeader = styled.h3`
  ${({ theme }) => `
    display: flex;
    font-size: ${theme.fonts.sizes.xl};
    font-weight: 600;
    margin: ${theme.spacing.xl} 0;
    color: ${theme.colors.primary};
  `}
`;

const CollateralTypeName = styled(Link)`
  ${({ theme }) => `
    font-size: ${theme.fonts.sizes.xl};
    font-weight: 600;
    margin: 0 ${theme.fonts.sizes.sm};
    color: ${theme.colors.primary};
  `}
`;

const MetricContainer = styled.div`
  ${({ theme }) => `
    margin-bottom: ${theme.spacing.xl};
  `}
`;

const MetricName = styled.h3`
  ${({ theme }) => `
    font-size: ${theme.fonts.sizes.lg};
    font-weight: 600;
    margin-bottom: ${theme.spacing.md};
    color: ${theme.colors.titles};
  `}
`;

const DataMetric = styled.h5`
  ${({ theme }) => `
    font-size: ${theme.fonts.sizes.md};
  `}
`;

const DataSubMetricsContainer = styled.div``;

const DataSubMetric = styled.p``;

const RedirectLinkIcon = styled(RedirectIcon)`
  display: inline-block;
  fill: currentColor;
  width: 1.2rem;
  margin-left: 1rem;
  padding-bottom: 0.2rem;
`;

const AssetsListCard = styled(DetailCard)`
  max-width: ${({ theme }) => theme.globalMaxWidth};
  padding: ${({ theme }) => theme.card.padding};
  @media ${device.tablet} {
    .col-name {
      width: 18rem;
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

interface Metric {
  title: string;
  data: string;
}

interface MetricDisplay extends Metric {
  title: string;
  data: string;
  displaySubmetrics?: boolean;
  submetrics?: Metric[];
}

const MetricDataDisplay = ({ title, data, displaySubmetrics = false, submetrics }: MetricDisplay) => {
  return (
    <MetricContainer>
      <MetricName>{title}</MetricName>
      <DataMetric>{data}</DataMetric>
      {displaySubmetrics && (
        <DataSubMetricsContainer>
          {submetrics?.map(({ title, data }) => (
            <DataSubMetric>
              {title} : {data}
            </DataSubMetric>
          ))}
        </DataSubMetricsContainer>
      )}
    </MetricContainer>
  );
};

export const LineMetadata = () => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);
  const userPositionMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const dispatch = useAppDispatch();
  const { NETWORK } = getEnv();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));
  const network = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  console.log('Selected Line', selectedLine);

  const {
    start: startTime,
    end: endTime,
    status,
    principal,
    deposit,
    totalInterestRepaid,
    escrow,
    spigot,
    defaultSplit,
  } = selectedLine!;

  const { deposits, minCRatio, cratio, collateralValue } = escrow!;
  const { revenueValue, revenueSummary: revenue } = spigot!;

  const renderEscrowMetadata = () => {
    if (!deposits) return null;
    if (!collateralValue)
      return (
        <MetricDataDisplay
          title={t('lineDetails:metadata.escrow.no-collateral')}
          data={`$ ${prettyNumbers(collateralValue)}`}
        />
      );
    return (
      <MetricDataDisplay
        title={t('lineDetails:metadata.escrow.total')}
        data={`$ ${humanize('amount', collateralValue, 18, 2)}`}
      />
    );
  };
  const renderSpigotMetadata = () => {
    if (!revenue) return null;
    return (
      <MetricDataDisplay
        title={t('lineDetails:metadata.revenue.total')}
        data={`$ ${humanize('amount', revenueValue, 18, 2)}`}
      />
    );
  };

  const depositHandler = (token: TokenView) => {
    if (!walletIsConnected) {
      connectWallet();
    } else {
      dispatch(CollateralActions.setSelectedCollateralAsset({ assetAddress: token.address }));
      dispatch(ModalsActions.openModal({ modalName: 'addCollateral', modalProps: { assetAddress: token.address } }));
    }
  };

  const withdrawHandler = (token: TokenView) => {
    if (!walletIsConnected) {
      connectWallet();
    } else {
      dispatch(CollateralActions.setSelectedCollateralAsset({ assetAddress: token.address }));
      dispatch(
        ModalsActions.openModal({ modalName: 'releaseCollateral', modalProps: { assetAddress: token.address } })
      );
    }
  };

  const addSpigotHandler = (token: TokenView) => {
    if (!walletIsConnected) {
      connectWallet();
    } else {
      dispatch(CollateralActions.setSelectedRevenueContract({ contractAddress: token.address }));
      dispatch(ModalsActions.openModal({ modalName: 'enableSpigot' }));
    }
  };

  const enableAssetHandler = (token: TokenView) => {
    if (!walletIsConnected) {
      connectWallet();
    } else {
      dispatch(ModalsActions.openModal({ modalName: 'enableCollateral' }));
    }
  };

  const allCollateral: Collateral[] = [...Object.values(deposits ?? {}), ...Object.values(revenue ?? {})];

  const getCollateralRowActionForRole = (role: string) => {
    switch (role) {
      case ARBITER_POSITION_ROLE:
        return 'liquidate';
      case BORROWER_POSITION_ROLE:
      default:
        return 'add-collateral';
    }
  };

  const formattedCollateralData = allCollateral.map((c) => ({
    ...c,
    key: c.type + c.token.toString(),
    // header: c.type + c.token.toString(),
    align: 'flex-start',
    actions: getCollateralRowActionForRole(userPositionMetadata.role),
  }));

  const enableCollateralText = walletIsConnected
    ? `${t('lineDetails:metadata.collateral-table.enable-asset')}`
    : `${t('components.connect-button.connect')}`;

  const enableSpigotText = walletIsConnected
    ? `${t('lineDetails:metadata.collateral-table.enable-spigot')}`
    : `${t('components.connect-button.connect')}`;

  const depositCollateralText = walletIsConnected
    ? `${t('lineDetails:metadata.collateral-table.add-collateral')}`
    : `${t('components.connect-button.connect')}`;

  const getCollateralTableActions = () => {
    console.log('COLLATERAL TABLE', userPositionMetadata.role);
    switch (userPositionMetadata.role) {
      case BORROWER_POSITION_ROLE:
        return; // comment this out to test buttons
      case ARBITER_POSITION_ROLE:
        return (
          <>
            <Button onClick={addSpigotHandler}>{enableSpigotText}</Button>
            <Button onClick={enableAssetHandler}>{enableCollateralText}</Button>
          </>
        );
      case LENDER_POSITION_ROLE: // for testing

      default:
        return null;
    }
  };

  const startDateHumanized = format(new Date(startTime * 1000), 'MMMM dd, yyyy');
  const endDateHumanized = format(new Date(endTime * 1000), 'MMMM dd, yyyy');

  // TODO: fix types on args
  // TODO: What is the action button for revenue?
  const renderButtons = (token: any, type: any) => {
    console.log('TYPE BUTTONS', type);
    if (type === 'revenue') {
      return;
    }
    // TODO: Needs padding
    return (
      <>
        <ActionButtons
          actions={[
            {
              name: t('components.transaction.release'),
              handler: () => withdrawHandler(token),
              disabled: !walletIsConnected,
            },
          ]}
        />
        <ActionButtons
          actions={[
            {
              name: t('components.transaction.deposit'),
              handler: () => depositHandler(token),
              disabled: !walletIsConnected,
            },
          ]}
        />
      </>
    );
  };
  return (
    <>
      <ThreeColumnLayout>
        <MetricDataDisplay
          title={t('lineDetails:metadata.principal')}
          data={`$ ${humanize('amount', principal, 18, 2)}`}
        />
        <MetricDataDisplay
          title={t('lineDetails:metadata.deposit')} // rename to Credit Limit
          data={`$ ${humanize('amount', deposit, 18, 2)}`}
        />
        <MetricDataDisplay
          title={t('lineDetails:metadata.total-interest-paid')}
          data={`$ ${humanize('amount', totalInterestRepaid, 18, 2)}`}
        />
        <MetricDataDisplay title={t('lineDetails:metadata.revenue-split')} data={defaultSplit + '%'} />
        <MetricDataDisplay title={t('lineDetails:metadata.min-cratio')} data={minCRatio + '%'} />
        <MetricDataDisplay title={t('lineDetails:metadata.cratio')} data={cratio + '%'} />
        <MetricDataDisplay
          title={t('lineDetails:metadata.status')}
          data={status[0].toUpperCase() + status.substring(1)}
        />
        <MetricDataDisplay title={t('lineDetails:metadata.start')} data={startDateHumanized} />
        <MetricDataDisplay title={t('lineDetails:metadata.end')} data={endDateHumanized} />
      </ThreeColumnLayout>
      <SectionHeader>
        {t('lineDetails:metadata.secured-by')}
        <CollateralTypeName to={`/${network}/lines/${selectedLine?.id}/spigots/${selectedLine?.spigotId}`}>
          {' '}
          {t(`lineDetails:metadata.revenue.title`)}{' '}
        </CollateralTypeName>
        {' + '}
        {t(`lineDetails:metadata.escrow.title`)}
      </SectionHeader>

      {!revenue && !deposits && <MetricName>{t('lineDetails:metadata.unsecured')}</MetricName>}

      <ThreeColumnLayout>
        {renderSpigotMetadata()}
        {renderEscrowMetadata()}
      </ThreeColumnLayout>
      <SectionHeader>{t('lineDetails:metadata.escrow.assets-list.title')}</SectionHeader>
      <ViewContainer>
        <AssetsListCard
          header={' '}
          data-testid="line-assets-list"
          metadata={[
            {
              key: 'type',
              header: t('lineDetails:metadata.escrow.assets-list.type'),
              transform: ({ type }) => (
                <>
                  <Text>{type?.toUpperCase()}</Text>
                </>
              ),
              width: '10rem',
              sortable: true,
              className: 'col-type',
            },
            {
              key: 'token',
              header: t('lineDetails:metadata.escrow.assets-list.symbol'),
              transform: ({ token: { symbol, icon, address } }) => (
                <Link to={getEtherscanUrlStub(network) + `${address}`}>
                  {icon && <TokenIcon icon={icon} symbol={symbol} />}
                  <Text>{symbol}</Text>
                  <RedirectLinkIcon />
                </Link>
              ),
              width: '15rem',
              sortable: true,
              className: 'col-symbol',
            },
            {
              key: 'amount',
              header: t('lineDetails:metadata.escrow.assets-list.amount'),
              transform: ({ token: { balance } }) => <Text ellipsis> {balance} </Text>,
              sortable: true,
              width: '20rem',
              className: 'col-amount',
            },
            {
              key: 'value',
              header: t('lineDetails:metadata.escrow.assets-list.value'),
              format: ({ value }) => `$ ${humanize('amount', value, 18, 2)}`,
              sortable: true,
              width: '20rem',
              className: 'col-value',
            },
            {
              key: 'actions',
              transform: ({ token, type }) => renderButtons(token, type),
              align: 'flex-end',
              width: 'auto',
              grow: '1',
            },
          ]}
          data={formattedCollateralData ? formattedCollateralData : []}
          SearchBar={getCollateralTableActions()}
          searching={false}
          onAction={undefined}
          initialSortBy="value"
          wrap
        />
      </ViewContainer>
    </>
  );
};
