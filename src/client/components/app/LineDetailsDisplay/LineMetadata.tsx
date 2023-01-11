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
import { Button, Text, RedirectIcon, Link } from '@components/common';
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

// const CollateralContainer = styled.div`
//   ${({ theme }) => `
//     display: flex;
//     padding-bottom: ${theme.spacing.xl};
//     gap: ${theme.spacing.xl};
//   `}
// `;

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
interface LineMetadataProps {
  principal: string;
  deposit: string;
  totalInterestRepaid: string;
  startTime: number;
  endTime: number;
  revenue?: { [token: string]: RevenueSummary };
  minCRatio: number;
  cratio: string;
  defaultSplit: string;
  collateralValue: string;
  revenueValue: string;
  deposits?: EscrowDepositMap;
  spigots?: SpigotRevenueContractMap;
  lineNetwork: Network;
}

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

export const LineMetadata = (props: LineMetadataProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);
  const userPositionMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const dispatch = useAppDispatch();
  const { NETWORK } = getEnv();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));
  const network = useAppSelector(NetworkSelectors.selectCurrentNetwork);

  const {
    lineNetwork,
    principal,
    deposit,
    totalInterestRepaid,
    revenue,
    deposits,
    startTime,
    endTime,
    spigots,
    cratio,
    minCRatio,
    defaultSplit,
    collateralValue,
    revenueValue,
  } = props;

  // const totalRevenue = isEmpty(revenue)
  //   ? ''
  //   : Object.values(revenue!)
  //       // use historical price data for revenue
  //       .reduce((sum, rev) => sum.add(BigNumber.from(rev.value)), BigNumber.from('0'))
  //       // .div(BigNumber.from(1)) // scale to usd decimals
  //       .toString();

  // const totalCollateral = isEmpty(deposits)
  //   ? ''
  //   : Object.values(deposits!)
  //       .reduce<BigNumber>(
  //         (sum: BigNumber, d) =>
  //           // use current market value for tokens. if no price dont display.
  //           !d || !d.token.priceUsdc ? sum : sum.add(BigNumber.from(Number(d!.token.priceUsdc) ?? '0').mul(d!.amount)),
  //         BigNumber.from('0')
  //       )
  //       // .div(BigNumber.from(1)) // scale to usd decimals
  //       .toString();

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
  // const allCollateral: Collateral[] = [...Object.values(deposits ?? {}), ...Object.values(spigots ?? {})];

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
    switch (userPositionMetadata.role) {
      case BORROWER_POSITION_ROLE:
      case ARBITER_POSITION_ROLE:
      case LENDER_POSITION_ROLE: // for testing
        return (
          <>
            <Button>
              <Link to={`/lines/${lineNetwork}/${selectedLine?.id}/spigots/${selectedLine?.spigotId}`}>
                {enableSpigotText}
              </Link>
            </Button>
            <Button onClick={enableAssetHandler}>{enableCollateralText}</Button>
          </>
        );
      default:
        return null;
    }
  };

  const startDateHumanized = format(new Date(startTime * 1000), 'MMMM dd, yyyy');
  const endDateHumanized = format(new Date(endTime * 1000), 'MMMM dd, yyyy');
  return (
    <>
      <ThreeColumnLayout>
        {/* <MetricDataDisplay title={t('lineDetails:metadata.principal')} data={`$ ${prettyNumbers2(principal)}`} /> */}
        {/* <MetricDataDisplay title={t('lineDetails:metadata.deposit')} data={`$ ${humanize('amount', deposit, 42, 2)}`} /> */}
        <MetricDataDisplay
          title={t('lineDetails:metadata.principal')}
          data={`$ ${humanize('amount', principal, 18, 2)}`}
        />
        <MetricDataDisplay
          title={t('lineDetails:metadata.deposit')} // rename to Credit Limit
          data={`$ ${humanize('amount', deposit, 18, 2)}`}
        />
        <MetricDataDisplay
          title={t('lineDetails:metadata.totalInterestPaid')}
          data={`$ ${humanize('amount', totalInterestRepaid, 18, 2)}`}
        />
        {/* <MetricDataDisplay title={t('lineDetails:metadata.deposit')} data={`$ ${prettyNumbers2(deposit)}`} /> */}
        {/* <MetricDataDisplay
          title={t('lineDetails:metadata.totalInterestPaid')}
          data={`$ ${prettyNumbers(totalInterestPaid)}`}
        /> */}
        <MetricDataDisplay
          title={'Revenue Split'} //{t('lineDetails:metadata.principal')}
          data={defaultSplit + '%'}
        />
        <MetricDataDisplay
          title={'Minimum Collateralization Ratio'} //{t('lineDetails:metadata.principal')}
          data={minCRatio + '%'}
        />
        <MetricDataDisplay
          title={'Collateralization Ratio'} //{t('lineDetails:metadata.principal')}
          data={cratio + '%'}
        />
        {/* <MetricDataDisplay
          title={''} //{t('lineDetails:metadata.principal')}
          data={''}
        /> */}
        <MetricDataDisplay title={t('lineDetails:metadata.start')} data={startDateHumanized} />
        <MetricDataDisplay title={t('lineDetails:metadata.end')} data={endDateHumanized} />
      </ThreeColumnLayout>
      <SectionHeader>
        {t('lineDetails:metadata.secured-by')}
        {/* <CollateralTypeName to={`/spigots/${lineNetwork}/${selectedLine?.spigotId}`}> */}
        {/* <CollateralTypeName to={`/lines/${lineNetwork}/${selectedLine?.id}/spigots/${selectedLine?.spigotId}`}>
          {' '}
          {t(`lineDetails:metadata.revenue.title`)}{' '}
        </CollateralTypeName> */}
        {t(`lineDetails:metadata.revenue.title`)} {' + '}
        {/* uncomment when escrow page made:
          <CollateralTypeName to={'/spigot/' + selectedLine?.escrowId}> */}{' '}
        {t(`lineDetails:metadata.escrow.title`)} {/* </CollateralTypeName> */}
      </SectionHeader>

      {!revenue && !deposits && <MetricName>{t('lineDetails:metadata.unsecured')}</MetricName>}

      <ThreeColumnLayout>
        {renderSpigotMetadata()}
        {renderEscrowMetadata()}
      </ThreeColumnLayout>

      <ViewContainer>
        <SectionHeader>{t('lineDetails:metadata.escrow.assets-list.title')}</SectionHeader>
        <AssetsListCard
          header={' '} //{t('lineDetails:metadata.escrow.assets-list.title')}
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
                //TODO: change to etherscan on launch
                <a href={getEtherscanUrlStub(network) + `${address}`} target={'_blank'} rel={'noreferrer'}>
                  {icon && <TokenIcon icon={icon} symbol={symbol} />}
                  <Text>{symbol}</Text>
                  <RedirectLinkIcon />
                </a>
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
              format: ({ value }) => humanize('usd', value, 2 /* 4 decimals but as percentage */, 0),
              sortable: true,
              width: '20rem',
              className: 'col-value',
            },
            {
              key: 'actions',
              transform: ({ token }) => (
                <ActionButtons
                  actions={[
                    {
                      name: t('components.transaction.deposit'),
                      handler: () => depositHandler(token),
                      disabled: !walletIsConnected,
                    },
                  ]}
                />
              ),
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
