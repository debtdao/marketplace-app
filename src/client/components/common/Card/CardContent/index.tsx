import { FC } from 'react';
import styled from 'styled-components';

import { device } from '@themes/default';

const Container = styled.article<{ wrap?: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  // @media ${device.mobile} {
  //   padding: 0rem;
  // }
`;

interface CardContentProps {
  wrap?: boolean;
  onClick?: () => void;
}

export const CardContent: FC<CardContentProps> = ({ children, wrap, ...props }) => {
  return (
    <Container wrap={wrap ? 'wrap' : 'nowrap'} {...props}>
      {children}
    </Container>
  );
};
