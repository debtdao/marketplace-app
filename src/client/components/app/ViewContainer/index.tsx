import { FC } from 'react';
import styled from 'styled-components';

import { device } from '@themes/default';

const StyledViewContainer = styled.main`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.layoutPadding};
  max-width: ${({ theme }) => theme.globalMaxWidth};
  flex: 1;
  overflow: hidden;
  overflow-y: auto;
  @media ${device.mobile} {
    max-width: 100%;
  }
`;

export const ViewContainer: FC = ({ children, ...props }) => {
  return <StyledViewContainer {...props}>{children}</StyledViewContainer>;
};
