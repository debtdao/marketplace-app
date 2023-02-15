import { isEmpty } from 'lodash';
import { BigNumber } from 'ethers';
import styled from 'styled-components';
import { useEffect } from 'react';

import { device } from '@themes/default';
import { useAppDispatch, useAppSelector, useAppTranslation, useExplorerURL } from '@hooks';
import { ThreeColumnLayout } from '@src/client/containers/Columns';
import { formatAddress, prettyNumbers, getENS, humanize } from '@src/utils';
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

const StyledButton = styled(Button)`
  @media ${device.mobile} {
    padding: ${({ theme }) => theme.spacing.xl} 0;
  }
`;

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
  const explorerUrl = useExplorerURL(network);
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

  const claimOperatorTokensHandler = () => {
    if (!walletIsConnected) {
      connectWallet();
    } else {
      dispatch(ModalsActions.openModal({ modalName: 'claimOperatorTokens' }));
    }
  };

  const enableSpigotText = walletIsConnected
    ? `${t('spigot:metadata.add-revenue-contract')}`
    : `${t('components.connect-button.connect')}`;

  const ClaimOperatorTokensText = walletIsConnected
    ? `${t('spigot:metadata.claim-operator-tokens')}`
    : `${t('components.connect-button.connect')}`;

  const getCollateralTableActions = () => {
    switch (userPositionMetadata.role) {
      case BORROWER_POSITION_ROLE:
        return <StyledButton onClick={claimOperatorTokensHandler}>{ClaimOperatorTokensText}</StyledButton>;
      case ARBITER_POSITION_ROLE:
        return (
          <>
            <StyledButton onClick={addSpigotHandler}>{enableSpigotText}</StyledButton>
          </>
        );
      case LENDER_POSITION_ROLE:
      default:
        return (
          <>
            <StyledButton onClick={claimOperatorTokensHandler}>{ClaimOperatorTokensText}</StyledButton>
          </>
        );
    }
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
  return (
    <>
      <ViewContainer>
        <AssetsListCard
          header={t('spigot:metadata.title')}
          data-testid="line-assets-list"
          metadata={[
            {
              key: 'contract',
              header: t('spigot:metadata.contract-address'),
              description: t('spigot:metadata.tooltips.contract-address'),
              transform: ({ contract }) => (
                <Link to={`${explorerUrl}/address/${contract}`}>
                  <Text>{formatAddress(getENS(contract, ensMap)!)}</Text>
                  <RedirectLinkIcon />
                </Link>
              ),
              // width: '16rem',
              sortable: true,
              className: 'col-address',
            },
            {
              key: 'token',
              header: t('spigot:metadata.symbol'),
              description: t('spigot:metadata.tooltips.symbol'),
              transform: ({ contract }) => (
                <Link to={`${explorerUrl}/address/${contract}`}>
                  <Text>{tokensMap[formatAddress(contract)] ? tokensMap[formatAddress(contract)].symbol : 'N/A'}</Text>
                </Link>
              ),
              // width: '15rem',
              sortable: true,
              className: 'col-available',
            },
            {
              key: 'ownerSplit',
              header: t('spigot:metadata.revenue-split'),
              description: t('spigot:metadata.tooltips.revenue-split'),
              transform: ({ ownerSplit }) => {
                const borrowerSplit = 100 - Number(ownerSplit) + '%';
                const lenderSplit = ownerSplit + '%';
                const ownerSplitFormatted = `Borrower: ${borrowerSplit}  |  Lender: ${lenderSplit}`;
                return <Text>{ownerSplitFormatted}</Text>;
              },
              width: 'auto',
              sortable: true,
              className: 'col-available',
            },
            {
              key: 'actions',
              header: t('spigot:metadata.actions'),
              description: t('spigot:metadata.tooltips.actions'),
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
