import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import styled from 'styled-components';

import {
  LinesActions,
  AlertsActions,
  AppSelectors,
  TokensSelectors,
  LinesSelectors,
  NetworkSelectors,
  CollateralSelectors,
  CollateralActions,
  TokensActions,
} from '@store';
import { useAppDispatch, useAppSelector, useAppTranslation, useIsMounting } from '@hooks';
import { ViewContainer, SliderCard, SpigotDisplay } from '@components/app';
import { Button, Link, SpinnerLoading, Text } from '@components/common';
import {
  // parseHistoricalEarningsUnderlying,
  // parseHistoricalEarningsUsd,
  isValidAddress,
  // parseLastEarningsUsd,
  // parseLastEarningsUnderlying,
} from '@utils';
import { getConfig } from '@config';
import { device } from '@themes/default';

const StyledSliderCard = styled(SliderCard)`
  padding: 3rem;
  margin: auto;
`;

const SpigotView = styled(ViewContainer)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media ${device.mobile} {
    ${StyledSliderCard} {
      padding: 1rem;
    }
  }
`;

export interface SpigotRouteParams {
  lineAddress: string;
  spigotAddress: string;
  network: string;
}

export const Spigot = () => {
  const { t } = useAppTranslation(['common', 'spigot']);
  const dispatch = useAppDispatch();
  const history = useHistory();
  const isMounting = useIsMounting();
  const { network, spigotAddress, lineAddress } = useParams<SpigotRouteParams>();
  const selectedSpigot = useAppSelector(CollateralSelectors.selectSelectedSpigot);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLine);
  const appStatus = useAppSelector(AppSelectors.selectAppStatus);
  const { NETWORK_SETTINGS } = getConfig();
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const currentNetworkSettings = NETWORK_SETTINGS[currentNetwork];

  useEffect(() => {
    if (!spigotAddress || !isValidAddress(spigotAddress)) {
      dispatch(AlertsActions.openAlert({ message: 'INVALID_ADDRESS', type: 'error' }));
      history.push(`${network}/market`);
      return;
    }
    dispatch(CollateralActions.setSelectedSpigot({ spigotAddress: spigotAddress }));
    // TODO: implement getSpigot gql query and replace dispatch to getLinePage
    // dispatch(CollateralActions.getSpigotPage({ id: spigotAddress }));
    if (spigotAddress && !selectedSpigot) {
      dispatch(TokensActions.getTokens())
        .then((res) => dispatch(LinesActions.getLinePage({ id: lineAddress })))
        .then((error) => dispatch(LinesActions.getLinePage({ id: lineAddress })));
      dispatch(LinesActions.setSelectedLineAddress({ lineAddress }));
    }

    return () => {
      // dispatch(CollateralActions.clearSelectedSpigot()); // TODO
    };
  }, [spigotAddress]);

  const generalLoading = appStatus.loading;

  // critical thing is to setup claimRevenue for push payments
  return (
    <SpigotView>
      <SpigotDisplay />
      {lineAddress ? (
        <Button>
          <Link to={`/${network}/lines/${lineAddress}`}>{t('Back to Line of Credit')}</Link>
        </Button>
      ) : null}
      {generalLoading && <SpinnerLoading flex="1" width="100%" height="20%" />}
      {!generalLoading && !selectedSpigot && (
        <StyledSliderCard
          header={t('spigot:no-spigot-supported-card.header', { network: currentNetworkSettings.name })}
          Component={
            <Text>
              <p>{t('spigot:no-spigot-supported-card.content')}</p>
            </Text>
          }
        />
      )}
    </SpigotView>
  );
};
