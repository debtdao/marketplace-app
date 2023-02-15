import styled from 'styled-components';
import _ from 'lodash';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { device, sharedTheme } from '@themes/default';
import { useAppSelector, useAppTranslation, useAppDispatch, useWindowDimensions } from '@hooks';
import { RedirectIcon, Text, Link, Button } from '@components/common';
import {
  OnchainMetaDataActions,
  OnchainMetaDataSelector,
  LinesSelectors,
  CollateralSelectors,
  WalletSelectors,
  CollateralActions,
  ModalsActions,
  LinesActions,
} from '@store';
import { formatAddress, getENS } from '@src/utils';
import { useExplorerURL } from '@src/client/hooks/useExplorerURL';

import { ActionButtons } from '../ActionButtons';
import { BorrowerName } from '../LineDetailsDisplay/LineMetadata';

import { SpigotMetadata } from './SpigotMetadata';

interface SpigotDisplayProps {}

const StyledButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

const Container = styled.div`
  margin: 0;
  padding: 1em;
  width: 100%;
`;

const Redirect = styled(RedirectIcon)`
  display: inline-block;
  fill: currentColor;
  width: 1.2rem;
  margin-left: 2rem;
  padding-bottom: 0.2rem;
`;

const Header = styled.h1`
  ${({ theme }) => `
    margin-bottom: ${theme.spacing.xl};
    font-size: ${theme.fonts.sizes.xl};
    color: ${theme.colors.titles};
  `};
`;

// const BorrowerName = styled(Text)`
//   max-width: 100%;
// `;

const RouterLink = styled(Link)<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: inherit;
  font-size: 3rem;
  flex: 1;
  width: 100%;

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

const SpigotAddy = styled(Text)`
  max-width: 100%;
`;

export interface SpigotRouteParams {
  lineAddress: string;
  spigotAddress: string;
  network: string;
}

export const SpigotDisplay = () => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const { isMobile, width } = useWindowDimensions();
  const { devices } = sharedTheme;
  const { network, spigotAddress, lineAddress } = useParams<SpigotRouteParams>();
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const selectedSpigot = useAppSelector(CollateralSelectors.selectSelectedSpigot);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const explorerUrl = useExplorerURL(walletNetwork);
  const ensMap = useAppSelector(OnchainMetaDataSelector.selectENSPairs);
  const [borrowerID, setBorrowerId] = useState('');
  // const borrowerID = getENS(selectedLine?.borrower!, ensMap);

  useEffect(() => {
    dispatch(OnchainMetaDataActions.getENS(selectedLine?.borrower!));
    const ensName = getENS(selectedLine?.borrower!, ensMap);
    setBorrowerId(ensName!);
  }, [selectedLine]);

  // allow passing in core data first if we have it already and let Page data render once returned
  // if we have all data render full UI

  if (!selectedSpigot) return null;

  return (
    <Container>
      <Header>
        <RouterLink to={`${explorerUrl}/address/${borrowerID}`} key={borrowerID} selected={false}>
          {t('spigot:metadata.borrower')} {'  :  '}
          <BorrowerName>
            {width < devices.desktopS ? formatAddress(borrowerID) : borrowerID}
            <Redirect />
          </BorrowerName>
        </RouterLink>
      </Header>
      <SpigotMetadata />
      {lineAddress ? (
        <StyledButton>
          <Link to={`/${network}/lines/${lineAddress}`}>{t('Back to Line of Credit')}</Link>
        </StyledButton>
      ) : null}
    </Container>
  );
};
