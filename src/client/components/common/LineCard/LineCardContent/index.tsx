import { FC } from 'react';
import styled from 'styled-components';

import { ThreeColumnLayout } from '@containers/Columns';

const Container = styled(ThreeColumnLayout)<{ wrap?: string }>`
  flex-wrap: ${({ wrap }) => wrap};
`;

interface LineCardContentProps {
  wrap?: boolean;
  onClick?: () => void;
}

export const LineCardContent: FC<LineCardContentProps> = ({ children, wrap, ...props }) => {
  return (
    <Container wrap={wrap ? 'wrap' : 'nowrap'} {...props}>
      {children}
    </Container>
  );
};
