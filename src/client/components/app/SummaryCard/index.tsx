import { FC, ReactNode } from 'react';
import styled from 'styled-components';

import { Card, CardHeader, CardContent, CardElement, Text, CardRedirection } from '@components/common';

const StyledCard = styled(Card)`
  padding: ${({ theme }) => theme.card.padding} 0;
  width: 100%;
  flex-shrink: 0;
  position: relative;
`;

const StyledCardContent = styled(CardContent)``;

const StyledCardElement = styled(CardElement)`
  max-width: 100%;
  overflow: hidden;
  width: auto;
  min-width: 17rem;
  flex: 1;
`;

const StyledText = styled(Text)<{ variant?: string }>`
  font-weight: 600;
  color: ${({ theme, variant }) => (variant === 'secondary' ? theme.colors.secondary : theme.colors.titles)};
`;

interface Item {
  header: string;
  content?: string;
  Component?: ReactNode;
}

interface SummaryCardProps {
  header?: string;
  items: Item[];
  variant?: 'primary' | 'secondary';
  cardSize?: 'small' | 'big';
  redirectTo?: string;
}

//Use this to display info about positions such as total amount, debt amount etc..

export const SummaryCard: FC<SummaryCardProps> = ({ header, items, variant, cardSize, redirectTo, ...props }) => {
  return (
    <StyledCard variant={variant} cardSize={cardSize} {...props}>
      {header && <CardHeader header={header} />}
      {redirectTo && <CardRedirection redirectTo={redirectTo} />}

      <StyledCardContent wrap>
        {items.map((item) => (
          <StyledCardElement
            key={item.header}
            header={item.header}
            content={<StyledText variant={variant}>{item.content}</StyledText>}
          >
            {item.Component && <StyledText variant={variant}>{item.Component}</StyledText>}
          </StyledCardElement>
        ))}
      </StyledCardContent>
    </StyledCard>
  );
};
