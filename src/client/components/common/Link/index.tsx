import { FC } from 'react';
import { Link as InternalLink } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useHistory } from 'react-router-dom';

import {
  BaseAnalyticsEventData,
  EVENT_NAVIGATE_EXTERNAL_1ST_PARTY,
  EVENT_NAVIGATE_EXTERNAL_3RD_PARTY,
} from '@src/core/types';
import { trackAnalyticsEvent, trackPage } from '@src/core/frameworks/segment';
import { useAppSelector } from '@src/client/hooks';
import { WalletSelectors } from '@src/core/store';
// want to track segment.page for everytime link is pressed

export interface LinkProps {
  to: string;
  target?: string;
  external?: boolean;
  className?: string;
}

const StyledLink = css`
  color: inherit;
  font-size: 1.4rem;
`;

const ExternalLink = styled.a`
  ${StyledLink}
`;
const StyledInternalLink = styled(InternalLink)`
  ${StyledLink}
`;

export const Link: FC<LinkProps> = ({ to, className, target = '_blank', children, ...props }) => {
  const history = useHistory();
  const wallet = useAppSelector(WalletSelectors.selectWallet);

  // TODO do Regex for different  parts of url
  const isInternal = to.startsWith('/') || window.location.host === to;
  const isSubdomain = to.split('.').length > 2; // false positive on files (.pdf) but we want those in new tabs too"

  const onNavigate = () => {
    const eventData = { wallet, target };
    console.log('is sub', isSubdomain, to.split('.'));

    if (isInternal) {
      trackPage({ data: { wallet } });
      history.push(to);
      return;
    } else if (isSubdomain) {
      trackAnalyticsEvent(EVENT_NAVIGATE_EXTERNAL_1ST_PARTY)({ to, ...eventData });
      // external links are always opened in another tab
      const tab = window.open(to, target);
      // try focusing on our content if we opne it
      // tab?.focus();
      return;
    } else {
      trackAnalyticsEvent(EVENT_NAVIGATE_EXTERNAL_3RD_PARTY)({ to, ...eventData });
      // external links are always opened in another tab
      window.open(to, target);
      return;
    }
  };

  return (
    <div onClick={onNavigate}>
      {isInternal ? (
        <StyledInternalLink to={to} className={className} {...props}>
          {children}
        </StyledInternalLink>
      ) : (
        <ExternalLink target={target} href={to} className={className}>
          {children}
        </ExternalLink>
      )}
    </div>
  );
};
