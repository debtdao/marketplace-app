import styled from 'styled-components';

import { LineCard, LineCardHeader, LineCardContent, Text, Icon, ChevronRightIcon } from '@components/common';
import { TokenIcon } from '@components/app';
import { device } from '@src/client/themes/default';

const TokenListIconSize = '1rem';

const ContainerCard = styled(LineCard)`
  padding: ${({ theme }) => theme.card.padding} 0;
  width: 100%;
  min-width: 20vw;
  min-height: 250px;
  height: 100%;
`;

const StyledCardContent = styled(LineCardContent)`
  align-items: stretch;
  justify-content: center;
  flex-wrap: wrap;
  grid-gap: ${({ theme }) => theme.card.padding};
  margin-top: ${({ theme }) => theme.card.padding};
  padding: 0 ${({ theme }) => theme.card.padding};
`;

const ItemCard = styled(LineCard)<{ onClick: any }>`
  max-width: 33vw;
  @media (${device.mobile}) {
    max-width: 100%;
  }
  ${({ theme }) => `
    box-shadow: 0px 4px 10px 2px ${theme.colors.primary};
    background: ${theme.colors.background};
    color: ${theme.colors.primary};
  `}
`;

const ItemHeader = styled(Text)`
  position: absolute;
  font-size: ${({ theme }) => theme.fonts.md};
`;

const ItemInfo = styled(Text)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ItemInfoLabel = styled(Text)`
  color: ${({ theme }) => theme.colors.titles};
  margin-top: 0.8rem;
  font-weight: 700;
  font-size: 2.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemName = styled(Text)`
  color: ${({ theme }) => theme.colors.icons.variant};
  font-size: 1.6rem;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const TokenListIcon = styled(Icon)`
  position: absolute;
  right: 3rem;
  fill: currentColor;
  width: ${TokenListIconSize};
  transition: color 200ms ease-in-out;
`;

const CenterIcon = styled.div`
  display: flex;
  margin-right: ${({ theme }) => theme.layoutPadding};
  user-select: none;
`;

interface Item {
  header?: string;
  icon: string;
  name: string;
  info: string;
  infoDetail?: string;
  action?: string;
  onAction?: () => void;
}

interface RecommendationsProps {
  header?: string;
  subHeader?: string;
  items: Item[];
}

export const LineCards = ({ header, subHeader, items, ...props }: RecommendationsProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <ContainerCard {...props}>
      <LineCardHeader header={header} subHeader={subHeader} />

      <LineCardContent>
        {items.map((item, i) => (
          <ItemCard key={`${i}-${item.name}`} variant="primary" onClick={item.onAction ? item.onAction : undefined}>
            {item.header && <ItemHeader>{item.header}</ItemHeader>}

            <CenterIcon>
              <TokenIcon symbol={item.name} icon={item.icon} size="xBig" />
            </CenterIcon>

            <ItemInfo>
              <ItemName>{item.name}</ItemName>
              <ItemInfoLabel>{item.info}</ItemInfoLabel>
            </ItemInfo>

            {item.onAction && <TokenListIcon Component={ChevronRightIcon} />}
          </ItemCard>
        ))}
      </LineCardContent>
    </ContainerCard>
  );
};
