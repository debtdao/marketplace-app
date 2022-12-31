import { isEmpty } from 'lodash';
import { BigNumber } from 'ethers';
import styled from 'styled-components';

import { device } from '@themes/default';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { ThreeColumnLayout } from '@src/client/containers/Columns';
import { prettyNumbers } from '@src/utils';
import {
  ARBITER_POSITION_ROLE,
  BORROWER_POSITION_ROLE,
  LENDER_POSITION_ROLE,
  RevenueSummary,
  TokenView,
} from '@src/core/types';
import { DetailCard, ActionButtons, TokenIcon, ViewContainer } from '@components/app';
import { Button, Text, RedirectIcon } from '@components/common';
import { LinesSelectors, ModalsActions, WalletSelectors, WalletActions, CollateralActions } from '@src/core/store';
import { humanize } from '@src/utils';
import { getEnv } from '@config/env';

const SectionHeader = styled.h3`
  ${({ theme }) => `
    font-size: ${theme.fonts.sizes.xl};
    font-weight: 600;
    margin: ${theme.spacing.xl} 0;
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

interface SpigotMetadataProps {
  revenue?: { [token: string]: RevenueSummary };
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

export const SpigotMetadata = (props: SpigotMetadataProps) => {
  console.log('render line metadata', props);
  const { t } = useAppTranslation(['common', 'spigot']);
  const walletIsConnected = useAppSelector(WalletSelectors.selectWalletIsConnected);
  const userPositionMetadata = useAppSelector(LinesSelectors.selectUserPositionMetadata);
  const dispatch = useAppDispatch();
  const { NETWORK } = getEnv();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));

  const { revenue } = props;
  const totalRevenue = isEmpty(revenue)
    ? ''
    : Object.values(revenue!)
        .reduce((sum, rev) => sum.add(BigNumber.from(rev)), BigNumber.from('0'))
        .div(BigNumber.from(1)) // scale to usd decimals
        .toString();

  const renderSpigotMetadata = () => {
    if (!revenue) return null;
    if (!totalRevenue)
      return (
        <MetricDataDisplay title={t('spigot:metadata.revenue.no-revenue')} data={`$ ${prettyNumbers(totalRevenue)}`} />
      );
    return (
      <MetricDataDisplay title={t('spigot:metadata.revenue.per-month')} data={`$ ${prettyNumbers(totalRevenue)}`} />
    );
  };

  const addSpigotHandler = (token: TokenView) => {
    if (!walletIsConnected) {
      connectWallet();
    } else {
      dispatch(CollateralActions.setSelectedRevenueContract({ contractAddress: token.address }));
      dispatch(ModalsActions.openModal({ modalName: 'enableSpigot' }));
    }
  };

  const enableSpigotText = walletIsConnected
    ? `${t('spigot:metadata.collateral-table.enable-spigot')}`
    : `${t('components.connect-button.connect')}`;

  const getCollateralTableActions = () => {
    console.log('get collateral table actions', userPositionMetadata.role);
    switch (userPositionMetadata.role) {
      // case BORROWER_POSITION_ROLE:
      //   return <Button onClick={depositHandler}>{depositCollateralText} </Button>;
      // case ARBITER_POSITION_ROLE:
      // case LENDER_POSITION_ROLE: // for testing
      //   return (
      //     <>
      //       <Button onClick={addSpigotHandler}>{enableSpigotText}</Button>
      //       <Button onClick={enableAssetHandler}>{enableCollateralText}</Button>
      //     </>
      //   );
      default:
        return null;
    }
  };

  return (
    <>
      <ThreeColumnLayout>
        <MetricDataDisplay title={t('spigot:metadata.lifetime-revenue')} data={`$ ${prettyNumbers(totalRevenue)}`} />
        <MetricDataDisplay title={t('spigot:metadata.30d-revenue')} data={`$ ${prettyNumbers(totalRevenue)}`} />
        <MetricDataDisplay title={t('spigot:metadata.account-surplus')} data={`$ ${prettyNumbers(totalRevenue)}`} />
      </ThreeColumnLayout>
      <SectionHeader>{t('spigot:metadata.spigot-')}</SectionHeader>

      <ThreeColumnLayout>{renderSpigotMetadata()}</ThreeColumnLayout>

      {/* TODO: dope data viz */}
    </>
  );
};
