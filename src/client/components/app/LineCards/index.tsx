import styled from 'styled-components';

import { LineCard, LineCardHeader, LineCardContent, Text, Icon, ChevronRightIcon } from '@components/common';
import { TokenIcon } from '@components/app';
import { device } from '@src/client/themes/default';

const TokenListIconSize = '1rem';

const ContainerCard = styled(LineCard)`
  padding: ${({ theme }) => theme.card.padding} 0;
  width: 100%;
  min-width: 20vw;
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
  @media (${device.tablet}) {
    max-width: 100%;
    min-height: 250px;
  }
  ${({ theme }) => `
    box-shadow: 0px 4px 10px 2px ${theme.colors.primary};
    background: ${theme.colors.background};
    color: ${theme.colors.primary};
  `}
`;

const ItemHeader = styled(Text)`
  position: absolute;
  font-size: ${({ theme }) => theme.fonts.sizes.md};
  font-weight: 800; // 400 when on LS-VG5000 font
`;

const BorrowerInfo = styled(Text)`
  ${({ theme }) => theme.fonts.styles.body};
  display: flex;
  flex-direction: row;
  overflow: hidden;
`;

const BorrowerDescription = styled(Text)`
  ${({ theme }) => theme.fonts.styles.body};
  color: ${({ theme }) => theme.colors.titles};
  margin-top: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LineBorrowerName = styled(Text)`
  ${({ theme }) => theme.fonts.styles.cardHeader};
  color: ${({ theme }) => theme.colors.icons.variant};
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

const BorrowerIcon = styled.div`
  margin-right: ${({ theme }) => theme.spacing.md};
`;

const CollateralTitle = styled.h3`
  ${({ theme }) => theme.fonts.styles.cardHeader};
  margin: ${({ theme }) => theme.spacing.md} 0;
  color: ${({ theme }) => theme.colors.icons.variant};
`;

const CollateralInfo = styled.div`
  display: grid;
  flex-direction: row;
  justify-content: space-around;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: ${({ theme }) => theme.spacing.md};
`;

interface Item {
  header?: string;
  icon: string;
  name: string;
  info: string;
  spigot?: string;
  escrow?: string;
  tags?: string[];
  infoDetail?: string;
  action?: string;
  onAction?: () => void;
}

interface RecommendationsProps {
  header?: string;
  subHeader?: string;
  items: Item[];
  // line: BasicLineData
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

            <BorrowerInfo>
              <BorrowerIcon>
                {' '}
                <TokenIcon symbol={item.name} icon={item.icon} size="xBig" />
              </BorrowerIcon>
              <LineBorrowerName>{item.name}</LineBorrowerName>
              <BorrowerDescription>{item.info}</BorrowerDescription>
            </BorrowerInfo>

            <CollateralTitle>Secured By:</CollateralTitle>
            <CollateralInfo>
              {/* TODO: useLineCollateralStats(spigot, escrow) */}
              <BorrowerDescription>{item.name}</BorrowerDescription>
              <BorrowerDescription>{item.name}</BorrowerDescription>
              <BorrowerDescription>{item.name}</BorrowerDescription>
              <BorrowerDescription>{item.name}</BorrowerDescription>
            </CollateralInfo>

            {item.onAction && <TokenListIcon Component={ChevronRightIcon} />}
          </ItemCard>
        ))}
      </LineCardContent>
    </ContainerCard>
  );
};
