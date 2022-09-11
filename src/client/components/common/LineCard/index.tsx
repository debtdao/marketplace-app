import { FC } from 'react';
import styled, { css } from 'styled-components';

import { styledSystem, StyledSystemProps } from '../styledSystem';

import { LineCardHeader } from './LineCardHeader';
import { LineCardContent } from './LineCardContent';
import { LineCardElement } from './LineCardElement';
import { LineCardEmptyList } from './LineCardEmptyList';
import { LineCardRedirection } from './LineCardRedirection';

const bigSize = css`
  min-height: 17.6rem;
`;

const smallSize = css`
  min-height: 11.2rem;
`;

const microSize = css`
  min-height: 8rem;
`;

const defaultVariant = css`
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.titles};
`;

const primaryVariant = css`
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.titles};
`;

const secondaryVariant = css`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.titles};
`;

const backgroundVariant = css`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.onBackground};
`;

const surfaceVariant = css`
  background-color: ${({ theme }) => theme.colors.surfaceVariantA};
  color: ${({ theme }) => theme.colors.titles};
`;

const sizeStyle = ({ cardSize }: LineCardProps) => {
  switch (cardSize) {
    case 'micro':
      return microSize;
    case 'small':
      return smallSize;
    case 'big':
      return bigSize;
    default:
      return;
  }
};

const variantStyle = ({ variant }: LineCardProps) => {
  switch (variant) {
    case 'primary':
      return primaryVariant;
    case 'secondary':
      return secondaryVariant;
    case 'background':
      return backgroundVariant;
    case 'surface':
      return surfaceVariant;
    default:
      return defaultVariant;
  }
};

type LineCardVariant = 'primary' | 'secondary' | 'background' | 'surface';
export type LineCardSizeType = 'micro' | 'small' | 'big';

export interface LineCardProps extends StyledSystemProps {
  onClick?: () => void;
  variant?: LineCardVariant;
  cardSize?: LineCardSizeType;
}

const StyledDiv = styled.article<LineCardProps>`
  border-radius: ${({ theme }) => theme.globalRadius};
  padding: 1.7rem ${({ theme }) => theme.card.padding};

  ${variantStyle};
  ${sizeStyle};
  ${styledSystem};
`;

export const LineCard: FC<LineCardProps> = (props) => <StyledDiv {...props} />;

export { LineCardHeader, LineCardContent, LineCardElement, LineCardEmptyList, LineCardRedirection };
