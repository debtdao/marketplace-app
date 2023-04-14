import { FC } from 'react';
import styled from 'styled-components';

export const DescText = styled.p`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.txModalColors.text};
`;

export const HeaderText = styled.h2`
  font-size: 1.6rem;
  text-transform: capitalize;
  color: ${({ theme }) => theme.colors.txModalColors.text};
`;
