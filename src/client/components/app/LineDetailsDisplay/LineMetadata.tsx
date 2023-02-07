import { isEmpty } from 'lodash';
import { BigNumber, ethers } from 'ethers';
import styled from 'styled-components';
import { format } from 'date-fns';
import { getAddress } from 'ethers/lib/utils';

import { device } from '@themes/default';
import { useAppDispatch, useAppSelector, useAppTranslation, useExplorerURL } from '@hooks';
import { ThreeColumnLayout } from '@src/client/containers/Columns';
import { prettyNumbers, unnullify } from '@src/utils';
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
  UNINITIALIZED_STATUS,
  ACTIVE_STATUS,
  LIQUIDATABLE_STATUS,
  REPAID_STATUS,
  INSOLVENT_STATUS,
} from '@src/core/types';
import { DetailCard, ActionButtons, TokenIcon, ViewContainer } from '@components/app';
import { Button, Text, RedirectIcon, Link, CardEmptyList, Tooltip, InfoIcon, Icon } from '@components/common';
import {
  LinesSelectors,
  ModalsActions,
  WalletSelectors,
  WalletActions,
  CollateralActions,
  NetworkSelectors,
  TokensSelectors,
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
  display: flex;
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

const MetadataBox = styled.div`
  ${({ theme }) => `
    font-size: ${theme.fonts.sizes.md};
  `}
`;

const MetadataTitle = styled.span`
  ${({ theme }) => `color: ${theme.colors.primary}; `}
  font-weight: 800;
`;

const MetadataRow = styled.p`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: 0rem;
`;

const StatusWithColor = styled.span<{ status: string }>`
  color: ${({ status }) => {
    switch (status) {
      case UNINITIALIZED_STATUS:
        return '#E6E600'; // darkish yellow
      case ACTIVE_STATUS:
      case REPAID_STATUS:
        return '#6AFF4D'; // light green
      case INSOLVENT_STATUS:
      case LIQUIDATABLE_STATUS:
        return '#FF1919'; // bright red
    }
  }};
`;

const CratioWithColor = styled.span<{ diff: number }>`
  color: ${({ diff }) => {
    if (diff >= 15) return '#6AFF4D'; // decent margin - light green
    else if (diff < 0) return '#FF1919'; // liquidatable - bright red
    else return '#E6E600'; // close to liquidatable - darkish yellow
  }};
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

const TokenIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const StyledIcon = styled(Icon)`
  margin-left: 1rem;
  flex-shrink: 0;
  fill: ${({ theme, color, fill }) => fill ?? color ?? theme.colors.titles};
`;

const AssetsListCard = styled(DetailCard)`
  // max-width: ${({ theme }) => theme.globalMaxWidth};
  max-width: 100%;
  width: 100%;
  margin: 4rem 0;
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
  description: string;
  data: string;
  displaySubmetrics?: boolean;
  children?: any;
}

const MetricDataDisplay = ({ title, description, data, displaySubmetrics = false, children }: MetricDisplay) => {
  return (
    <MetricContainer>
      <MetricName>
        {title}
        <Tooltip placement="bottom-start" tooltipComponent={<>{description}</>}>
          <StyledIcon Component={InfoIcon} size="1.5rem" />
        </Tooltip>
      </MetricName>
      <DataMetric>{data}</DataMetric>
      {displaySubmetrics && <DataSubMetricsContainer>{children}</DataSubMetricsContainer>}
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
  const explorerUrl = useExplorerURL(network);
  const tokensMap = useAppSelector(TokensSelectors.selectTokensMap);

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

  console.log('selectedLine: ', selectedLine);
  console.log('escrow: ', escrow);
  console.log('spigot: ', spigot);
  const { deposits, minCRatio, cratio, collateralValue } = escrow!;
  const { revenueValue, revenueSummary: revenue } = spigot!;

  const renderEscrowMetadata = () => {
    if (!deposits) return null;
    if (!collateralValue)
      return (
        <MetricDataDisplay
          title={t('lineDetails:metadata.escrow.no-collateral')}
          description={t('lineDetails:metadata.escrow.no-collateral')}
          data={`$ ${prettyNumbers(collateralValue)}`}
        />
      );
    return (
      <MetricDataDisplay
        title={t('lineDetails:metadata.escrow.total')}
        description={t('lineDetails:metadata.escrow.tooltip.total')}
        data={`$ ${humanize('amount', collateralValue, 18, 2)}`}
      />
    );
  };
  const renderSpigotMetadata = () => {
    if (!revenue) return null;
    return (
      <>
        <MetadataBox>
          <MetadataRow>
            <Tooltip
              placement="bottom-start"
              tooltipComponent={<>{t('lineDetails:metadata.tooltip.lender-revenue-split')}</>}
            >
              <StyledIcon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
            <MetadataTitle>
              {`${t('lineDetails:metadata.lender')}  ${t('lineDetails:metadata.revenue-split')}`}:
            </MetadataTitle>{' '}
            {defaultSplit}%
          </MetadataRow>
          <MetadataRow>
            <Tooltip
              placement="bottom-start"
              tooltipComponent={<>{t('lineDetails:metadata.tooltip.borrower-revenue-split')}</>}
            >
              <StyledIcon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
            <MetadataTitle>
              {`${t('lineDetails:metadata.borrower')}  ${t('lineDetails:metadata.revenue-split')}`}:
            </MetadataTitle>{' '}
            {100 - Number(defaultSplit)}%
          </MetadataRow>
          <MetadataRow>
            <Tooltip placement="bottom-start" tooltipComponent={<>{t('lineDetails:metadata.tooltip.cratio')}</>}>
              <StyledIcon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
            <MetadataTitle>{t('lineDetails:metadata.cratio')}: </MetadataTitle>{' '}
            <CratioWithColor diff={Number(cratio) - Number(minCRatio)}>{cratio}%</CratioWithColor>
          </MetadataRow>
          <MetadataRow>
            <Tooltip placement="bottom-start" tooltipComponent={<>{t('lineDetails:metadata.tooltip.min-cratio')}</>}>
              <StyledIcon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
            <MetadataTitle>{t('lineDetails:metadata.min-cratio')}: </MetadataTitle> {minCRatio}%
          </MetadataRow>
        </MetadataBox>
        <MetricDataDisplay
          title={t('lineDetails:metadata.revenue.total')}
          description={t('lineDetails:metadata.revenue.tooltip')}
          data={`$ ${humanize('amount', revenueValue, 18, 2)}`}
        />
      </>
    );
  };

  const addCollateralHandler = (token: TokenView) => {
    if (!walletIsConnected) {
      connectWallet();
    } else {
      dispatch(CollateralActions.setSelectedCollateralAsset({ assetAddress: token.address }));
      dispatch(ModalsActions.openModal({ modalName: 'addCollateral', modalProps: { assetAddress: token.address } }));
    }
  };

  const releaseCollateralhandler = (token: TokenView) => {
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

  const formattedCollateralData = allCollateral.map((c) => {
    const tokenIcon = Object.keys(tokensMap).length > 0 ? tokensMap[getAddress(c.token.address)]?.icon ?? '' : '';
    const tokenInfo = { icon: tokenIcon, ...c.token };
    const collateral = { ...c, token: tokenInfo };
    return {
      ...collateral,
      key: c.type + c.token.toString(),
      align: 'flex-start',
      actions: getCollateralRowActionForRole(userPositionMetadata.role),
    };
  });

  const connectWalletText = t('components.connect-button.connect');
  const enableCollateralText = walletIsConnected
    ? t('lineDetails:metadata.collateral-table.enable-asset')
    : connectWalletText;

  const enableSpigotText = walletIsConnected
    ? t('lineDetails:metadata.collateral-table.enable-spigot')
    : connectWalletText;

  const depositCollateralText = walletIsConnected
    ? t('lineDetails:metadata.collateral-table.add-collateral')
    : connectWalletText;

  const getCollateralTableActions = () => {
    switch (userPositionMetadata.role) {
      case BORROWER_POSITION_ROLE:
        return <></>;
      case ARBITER_POSITION_ROLE:
        return (
          <>
            <Button onClick={addSpigotHandler}>{enableSpigotText}</Button>
            <Button onClick={enableAssetHandler}>{enableCollateralText}</Button>
          </>
        );
      case LENDER_POSITION_ROLE: // for testing
        return <></>;

      default:
        return <></>;
    }
  };

  const startDateHumanized = format(new Date(startTime * 1000), 'MMMM dd, yyyy');
  const endDateHumanized = format(new Date(endTime * 1000), 'MMMM dd, yyyy');
  const revenueSplitFormatted: Metric[] = [
    { title: `${t('lineDetails:metadata.lender')}`, data: defaultSplit + '%' },
    {
      title: `${t('lineDetails:metadata.borrower')}`,
      data: 100 - Number(defaultSplit) + '%',
    },
  ];

  // TODO: fix types on args
  // TODO: What is the action button for revenue?
  const renderButtons = (token: any, type: any) => {
    if (type === 'revenue') {
      return;
    }
    // TODO: Needs padding
    if (userPositionMetadata.role === BORROWER_POSITION_ROLE) {
      return (
        <ActionButtons
          actions={[
            {
              name: t('components.transaction.deposit'),
              handler: () => addCollateralHandler(token),
              disabled: !walletIsConnected,
            },
            {
              name: t('components.transaction.release'),
              handler: () => releaseCollateralhandler(token),
              disabled: !walletIsConnected,
            },
          ]}
        />
      );
    }
    // TODO: should any action buttons be returned if the user is not the borrower
    // return (
    //   <ActionButtons
    //     actions={[
    //       {
    //         name: t('components.transaction.deposit'),
    //         handler: () => depositHandler(token),
    //         disabled: !walletIsConnected,
    //       },
    //     ]}
    //   />
    // );
    return;
  };

  return (
    <>
      <ThreeColumnLayout>
        <MetadataBox>
          <MetadataRow>
            <Tooltip placement="bottom-start" tooltipComponent={<>{t('lineDetails:metadata.tooltip.status')}</>}>
              <StyledIcon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
            <MetadataTitle>{t('lineDetails:metadata.status')}: </MetadataTitle>{' '}
            <StatusWithColor status={status}>{status[0].toUpperCase() + status.substring(1)}</StatusWithColor>{' '}
          </MetadataRow>
          <MetadataRow>
            <Tooltip placement="bottom-start" tooltipComponent={<>{t('lineDetails:metadata.tooltip.start')}</>}>
              <StyledIcon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
            <MetadataTitle>{t('lineDetails:metadata.start')}: </MetadataTitle> {startDateHumanized}
          </MetadataRow>
          <MetadataRow>
            <Tooltip placement="bottom-start" tooltipComponent={<>{t('lineDetails:metadata.tooltip.end')}</>}>
              <StyledIcon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
            <MetadataTitle>{t('lineDetails:metadata.end')}: </MetadataTitle> {endDateHumanized}
          </MetadataRow>
          <MetadataRow>
            <Tooltip
              placement="bottom-start"
              tooltipComponent={<>{t('lineDetails:metadata.tooltip.total-interest-paid')}</>}
            >
              <StyledIcon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
            <MetadataTitle>{t('lineDetails:metadata.total-interest-paid')}: </MetadataTitle> $
            {humanize('amount', totalInterestRepaid, 18, 2)}
          </MetadataRow>
        </MetadataBox>
        <MetricDataDisplay
          title={t('lineDetails:metadata.principal')}
          description={t('lineDetails:metadata.tooltip.principal')}
          data={`$ ${humanize('amount', principal, 18, 2)}`}
        />
        <MetricDataDisplay
          title={t('lineDetails:metadata.deposit')}
          description={t('lineDetails:metadata.tooltip.deposit')}
          data={`$ ${humanize('amount', deposit, 18, 2)}`}
        />
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
      {/* <SectionHeader>{t('lineDetails:metadata.escrow.assets-list.title')}</SectionHeader> */}
      <div>
        <AssetsListCard
          header={'Collateral'}
          data-testid="line-assets-list"
          metadata={[
            {
              key: 'type',
              header: t('lineDetails:metadata.escrow.assets-list.type'),
              description: t('lineDetails:metadata.escrow.tooltip.type'),
              transform: ({ type }) => (
                <>
                  <Text>{type?.toUpperCase()}</Text>
                </>
              ),
              // width: '10rem',
              sortable: true,
              className: 'col-type',
            },
            {
              key: 'token',
              header: t('lineDetails:metadata.escrow.assets-list.symbol'),
              description: t('lineDetails:metadata.escrow.tooltip.symbol'),
              transform: ({ token: { symbol, icon, address } }) => (
                <TokenIconContainer>
                  <TokenIcon icon={icon} symbol={symbol} size="small" margin="0.5rem" />
                  <RouterLink key={address} to={`${explorerUrl}/address/${address}`} selected={false}>
                    {symbol}
                    <RedirectLinkIcon />
                  </RouterLink>
                </TokenIconContainer>
              ),
              // width: '15rem',
              sortable: true,
              className: 'col-symbol',
            },
            {
              key: 'amount',
              header: t('lineDetails:metadata.escrow.assets-list.amount'),
              description: t('lineDetails:metadata.escrow.tooltip.amount'),
              // transform: ({ token: { balance } }) => <Text ellipsis> {balance} </Text>,
              format: ({ amount }) => `${humanize('amount', amount, 18, 2)}`,
              sortable: true,
              // width: '20rem',
              className: 'col-amount',
            },
            {
              key: 'value',
              header: t('lineDetails:metadata.escrow.assets-list.value'),
              description: t('lineDetails:metadata.escrow.tooltip.value'),
              format: ({ value }) => `$ ${humanize('amount', value, 18, 2)}`,
              // format: ({ value }) => `$ ${humanize('value', value, 18, 2)}`,
              sortable: true,
              // width: '20rem',
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
      </div>
    </>
  );
};
