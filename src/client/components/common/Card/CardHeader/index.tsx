import { FC } from 'react';
import styled from 'styled-components';

import { device } from '@themes/default';

const Container = styled.div`
  width: 100%;
`;

const BigHeader = styled.h2`
  font-size: 2.4rem;
  font-weight: 700;
  margin: 0;
  padding: 0 ${({ theme }) => theme.card.padding};
`;

const Header = styled.h2`
  font-size: ${({ theme }) => theme.fonts.sizes.xl};
  font-weight: 700;
  margin: 0;
  padding: 0;
  @media ${device.mobile} {
    text-align: center;
  }
`;

const SubHeader = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  padding: 0;
`;

interface CardElementProps {
  bigHeader?: string;
  header?: string;
  subHeader?: string;
}

export const CardHeader: FC<CardElementProps> = ({ children, bigHeader, header, subHeader, ...props }) => {
  return (
    <Container {...props}>
      {bigHeader && <BigHeader>{bigHeader}</BigHeader>}
      {header && <Header>{header}</Header>}
      {subHeader && <SubHeader>{subHeader}</SubHeader>}
      {children}
    </Container>
  );
};
