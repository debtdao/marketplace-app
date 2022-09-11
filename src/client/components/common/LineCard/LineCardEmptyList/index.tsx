import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { Text } from '@components/common';

const StyledLineCardEmptyList = styled.div<{ wrap?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  line-height: 1.7rem;
  font-weight: 400;
  margin: 6.6rem 2rem;
  text-align: center;
`;

interface LineCardEmptyListProps {
  text?: string;
  searching?: boolean;
  onClick?: () => void;
}

export const LineCardEmptyList: FC<LineCardEmptyListProps> = ({ children, text, searching, onClick, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <StyledLineCardEmptyList onClick={onClick} {...props}>
      {text ?? (
        <Text>
          <Text center fontWeight="bold">
            {t('components.empty-list.text')}
          </Text>
          {searching && <Text center>{t('components.empty-list.searching-text')}</Text>}
        </Text>
      )}
    </StyledLineCardEmptyList>
  );
};
