import styled from 'styled-components';
import _ from 'lodash';
import { useState, useEffect } from 'react';

import { useAppSelector, useAppTranslation, useAppDispatch } from '@hooks';
import { RedirectIcon, Text, Link } from '@components/common';
import {
  OnchainMetaDataActions,
  OnchainMetaDataSelector,
  LinesSelectors,
  CollateralSelectors,
  WalletSelectors,
} from '@store';
import { getENS } from '@src/utils';
import { useExplorerURL } from '@src/client/hooks/useExplorerURL';

interface SpigotDisplayProps {}

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

export const SpigotDisplay = (props: SpigotDisplayProps) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();

  const selectedSpigot = useAppSelector(CollateralSelectors.selectSelectedSpigot);
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const explorerUrl = useExplorerURL(walletNetwork);

  // allow passing in core data first if we have it already and let Page data render once returned
  // if we have all data render full UI

  if (!selectedSpigot) return null;
  return (
    <Container>
      <Header>
        <Link to={`${explorerUrl}/address/${selectedSpigot.id}`}>
          <SpigotAddy>
            {selectedSpigot.id}
            <Redirect />
          </SpigotAddy>
        </Link>
      </Header>
    </Container>
  );
};
