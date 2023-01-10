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

  useEffect(() => {
    if (!spigotAddress || !isValidAddress(spigotAddress)) {
      dispatch(AlertsActions.openAlert({ message: 'INVALID_ADDRESS', type: 'error' }));
      history.push('/market');
      return;
    }
    dispatch(CollateralActions.setSelectedSpigot({ spigotAddress: spigotAddress }));
    // TODO: implement getSpigot gql query and replace dispatch to getLinePage
    // dispatch(CollateralActions.getSpigotPage({ id: spigotAddress }));
    if (spigotAddress && !selectedSpigot) {
      dispatch(LinesActions.getLinePage({ id: lineAddress }));
      dispatch(LinesActions.setSelectedLineAddress({ lineAddress }));
    }

    return () => {
      // dispatch(CollateralActions.clearSelectedSpigot()); // TODO
    };
  }, [spigotAddress]);

  if (!selectedSpigot) return null;

  const generalLoading = appStatus.loading;
  const { id, line, revenueSummary } = selectedSpigot;
  // getSpigotPageStatus.loading ||
  // tokensStatus.loading;

  // critical thing is to setup claimRevenue for push payments
  return (
    <SpigotView>
      <SpigotDisplay />
      {line ? (
        <Button>
          <Link to={`/lines/${network}/${line}`}>{t('Back to Line of Credit')}</Link>
        </Button>
      ) : null}
      {generalLoading && <SpinnerLoading flex="1" width="100%" height="20%" />}
    </SpigotView>
  );
};
