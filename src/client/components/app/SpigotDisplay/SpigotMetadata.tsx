import { isEmpty } from 'lodash';
import { BigNumber } from 'ethers';
import styled from 'styled-components';
import { useEffect } from 'react';

import { device } from '@themes/default';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { ThreeColumnLayout } from '@src/client/containers/Columns';
import { formatAddress, prettyNumbers, getENS, humanize, getEtherscanUrlStub } from '@src/utils';
import {
  ARBITER_POSITION_ROLE,
  BORROWER_POSITION_ROLE,
  LENDER_POSITION_ROLE,
  RevenueSummary,
  SpigotRevenueContract,
  TokenView,
} from '@src/core/types';
import { DetailCard, ActionButtons, TokenIcon, ViewContainer, Container } from '@components/app';
import { Button, Text, RedirectIcon, Link } from '@components/common';
import {
  LinesSelectors,
  ModalsActions,
  WalletSelectors,
  WalletActions,
  CollateralActions,
  OnchainMetaDataSelector,
  CollateralSelectors,
  NetworkSelectors,
  TokensSelectors,
  OnchainMetaDataActions,
} from '@src/core/store';
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
  // const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const selectedSpigot = useAppSelector(CollateralSelectors.selectSelectedSpigot);
  const dispatch = useAppDispatch();
  const ensMap = useAppSelector(OnchainMetaDataSelector.selectENSPairs);
  const { NETWORK } = getEnv();
  const connectWallet = () => dispatch(WalletActions.walletSelect({ network: NETWORK }));
  const network = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const etherscanUrl = getEtherscanUrlStub(network);
  const tokensMap = useAppSelector(TokensSelectors.selectTokensMap);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);

  useEffect(() => {
    if (!selectedSpigot || !selectedSpigot.spigots) return;
    const spigots = selectedSpigot.spigots ?? {};
    const spigotIds = Object.keys(selectedSpigot.spigots!) ?? [];
    for (let i = 0; i < spigotIds.length; i++) {
      const id = spigotIds[i];
      const revenueContract = spigots[id].contract;
      dispatch(OnchainMetaDataActions.getABI(revenueContract));
    }
  }, [selectedSpigot, walletNetwork]);

  // if (!selectedLine) return <Container>{t('lineDetails:line.no-data')}</Container>;
  if (!selectedSpigot) return <Container>{t('lineDetails:line.no-data')}</Container>;
  // const { spigot } = selectedLine;

  const addSpigotHandler = (token: TokenView) => {
    if (!walletIsConnected) {
      connectWallet();
    } else {
      dispatch(CollateralActions.setSelectedRevenueContract({ contractAddress: token.address }));
      dispatch(ModalsActions.openModal({ modalName: 'enableSpigot' }));
    }
  };

  const enableSpigotText = walletIsConnected
    ? `${t('spigot:metadata.add-revenue-contract')}`
    : `${t('components.connect-button.connect')}`;

  const getCollateralTableActions = () => {
    return <Button onClick={addSpigotHandler}>{enableSpigotText}</Button>;
  };

  const claimRev = (contract: string) => {
    return {
      name: t('spigot:claim-revenue'),
      handler: () => {
        dispatch(
          ModalsActions.openModal({ modalName: 'claimRevenue', modalProps: { revenueContractAddress: contract } })
        );
        // open modal, dispatch action inside modal
        // dispatch(
        //   CollateralActions.claimRevenue({
        //     spigotAddress: selectedSpigot.id,
        //     revenueContract: selectedRevenueContract
        //   })
        // )
      },
    };
  };

  const allSpigots: SpigotRevenueContract[] = [...Object.values(selectedSpigot?.spigots ?? {})];
  const formattedSpigots = allSpigots.map((c) => ({
    ...c,
    key: c.contract,
    // header: c.type + c.token.toString(),
    align: 'flex-start',
    actions: 'claim-revenue',
  }));
  console.log('formatted spigots: ', formattedSpigots);
  return (
    <>
      <ViewContainer>
        <AssetsListCard
          header={' '} //{t('lineDetails:metadata.escrow.assets-list.title')}
          data-testid="line-assets-list"
          metadata={[
            {
              key: 'contract',
              header: 'Contract Address', //t('lineDetails:metadata.escrow.assets-list.contract'),
              transform: ({ contract }) => (
                <Link to={etherscanUrl + `${contract}`}>
                  <Text>{formatAddress(getENS(contract, ensMap)!)}</Text>
                  <RedirectLinkIcon />
                </Link>
              ),
              width: '16rem',
              sortable: true,
              className: 'col-type',
            },
            {
              key: 'token',
              header: 'Contract Symbol', //t('lineDetails:metadata.escrow.assets-list.symbol'),
              transform: ({ contract }) => (
                <Link to={etherscanUrl + `${contract}`}>
                  <Text>{tokensMap[formatAddress(contract)] ? tokensMap[formatAddress(contract)].symbol : 'N/A'}</Text>
                </Link>
              ),
              width: '15rem',
              sortable: true,
              className: 'col-symbol',
            },
            {
              key: 'actions',
              transform: ({ contract }) => <ActionButtons actions={[claimRev(contract)]} />,
              align: 'flex-end',
              width: 'auto',
              grow: '1',
            },
          ]}
          data={formattedSpigots ? formattedSpigots : []}
          SearchBar={getCollateralTableActions()}
          searching={false}
          onAction={undefined}
          initialSortBy="value"
          wrap
        />
      </ViewContainer>

      {/* TODO: dope data viz */}
    </>
  );
};
