import { ElementType, useEffect } from 'react';
import styled from 'styled-components';

import { useAppDispatch, useAppSelector, useWindowDimensions } from '@hooks';
import { NetworkSelectors, SettingsActions, SettingsSelectors, WalletSelectors } from '@store';
import { VaultIcon, SettingsIcon, SearchIcon, DiscordIcon, WalletIcon } from '@components/common';

import { NavSidebar } from './NavSidebar';
import { NavTabbar } from './NavTabbar';

export interface NavigationLink {
  to: string;
  text: string;
  icon: ElementType;
  hideMobile?: boolean;
  external?: boolean;
  optional?: boolean;
}

const StyledNavigation = styled.div``;

interface NavigationProps {
  hideOptionalLinks?: boolean;
}

const navLinks: NavigationLink[] = [
  {
    to: '/portfolio',
    text: 'navigation.portfolio',
    icon: WalletIcon,
  },
  {
    to: '/market',
    text: 'navigation.market',
    icon: VaultIcon,
  },
  {
    to: 'https://docs.debtdao.finance',
    text: 'navigation.docs',
    icon: SearchIcon,
    external: true,
    optional: true,
  },
  // {
  //   to: 'https://discord.gg/F83xx67fyQ',
  //   text: 'navigation.discord',
  //   icon: DiscordIcon,
  //   external: true,
  //   optional: true,
  // },
  {
    to: '/settings',
    text: 'navigation.settings',
    icon: SettingsIcon,
    // hideMobile: true,
  },
];

export const Navigation = ({ hideOptionalLinks }: NavigationProps) => {
  const { isMobile, isTablet, isDesktop } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const userAddress = useAppSelector(WalletSelectors.selectSelectedAddress);

  const displayLinks = navLinks.filter((link) => {
    if (link.text === 'navigation.portfolio') {
      link.to = `/${currentNetwork}/portfolio/${userAddress}`;
    }
    return !(link.optional && hideOptionalLinks);
  });

  // NOTE Auto collapse sidenav on mobile

  const collapsedSidebar = useAppSelector(SettingsSelectors.selectSidebarCollapsed);

  useEffect(() => {
    if ((isTablet || isMobile) && !collapsedSidebar) {
      dispatch(SettingsActions.closeSidebar());
    }
    if (isDesktop && !isTablet && collapsedSidebar) {
      dispatch(SettingsActions.openSidebar());
    }
  }, [isMobile, isTablet, isDesktop]);

  return (
    <StyledNavigation>
      {isMobile ? <NavTabbar navLinks={displayLinks} /> : <NavSidebar navLinks={displayLinks} />}
    </StyledNavigation>
  );
};
