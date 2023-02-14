import styled from 'styled-components';
import { format, differenceInDays } from 'date-fns';

import { prettyNumbers, formatAddress, unnullify, humanize } from '@utils';
import { Card, CardHeader, CardContent, Text, Icon, ChevronRightIcon } from '@components/common';
import { TokenIcon } from '@components/app';
import { useAppTranslation, useAppSelector } from '@hooks';
import { OnchainMetaDataSelector } from '@src/core/store';
import { SecuredLine, Item } from '@src/core/types';
import { getENS } from '@utils';
import { device } from '@themes/default';

const TokenListIconSize = '1rem';

const ContainerCard = styled(Card)`
  padding: ${({ theme }) => theme.card.padding} 0;
  width: 100%;
  min-width: 56%;
  border-radius: 0.2rem;
  background: none;
`;

const StyledCardContent = styled(CardContent)`
  align-items: stretch;
  justify-content: start;
  flex-wrap: wrap;
  grid-gap: ${({ theme }) => theme.card.padding};
  margin-top: ${({ theme }) => theme.card.padding};
`;

const ItemCard = styled(Card)<{ onClick: any }>`
  display: flex;
  align-items: start;
  min-height: 30rem;
  // display three columns on larger screens
  min-width: 31%;
  max-width: 32%;
  flex: 1;
  padding: ${({ theme }) => theme.layoutPadding};
  padding-right: calc(${({ theme }) => theme.card.padding} + ${TokenListIconSize} * 2.5);
  background-color: ${({ theme }) => (theme.name === 'light' ? theme.colors.surface : theme.colors.surfaceVariantA)};
  color: ${({ theme }) => theme.colors.primary};
  box-shadow: ${({ theme }) => `inset ${theme.colors.accents.purp} 0 0 ${theme.spacing.sm};`}
  position: relative;
  transition: filter 200ms ease-in-out;

  // display two columns on small screens
  @media ${device.desktopS} {
    min-width: 48%;
  }

  // display a single column on mobile
  @media ${device.mobile} {
    min-width: 100%;
  }

  ${({ onClick, theme }) =>
    onClick &&
    `
    cursor: pointer;
    &:hover {
      filter: brightness(85%);
      ${TokenListIcon} {
        color: ${theme.colors.secondary};
      }
    }
  `};
`;

const ItemHeader = styled(Text)`
  position: absolute;
  font-size: ${({ theme }) => theme.fonts.sizes.md};
`;

const ItemInfo = styled(Text)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ItemInfoLabel = styled(Text)`
  margin-top: 0.8rem;
  font-size: ${({ theme }) => theme.fonts.sizes.md};
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemName = styled(Text)`
  font-size: ${({ theme }) => theme.fonts.sizes.lg};
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

const TopIcon = styled.div`
  margin-bottom: 10rem;
  margin-right: 3rem;
  user-select: none;
`;

const Divider = styled.div`
  height: ${({ theme }) => theme.spacing.md};
`;

const MetricsTextContainer = styled.div`
  display: flex;
  flex-direction: space-between;
`;

const Metric = styled.span`
  font-weight: bold;
  font-size: 3rem;
`;

const MetricsText = styled.span`
  font-size: ${({ theme }) => theme.fonts.sizes.md};
`;

interface RecommendationsProps {
  header?: string;
  subHeader?: string;
  items: Item[];
}

export const RecommendationsCard = ({ header, subHeader, items, ...props }: RecommendationsProps) => {
  const { t } = useAppTranslation(['common']);
  const ensMap = useAppSelector(OnchainMetaDataSelector.selectENSPairs);
  if (items.length === 0) {
    return null;
  }
  // todo handle loading of principal/deposit vals with spinner or something
  return (
    <ContainerCard {...props}>
      <CardHeader header={header} subHeader={subHeader} />

      <StyledCardContent>
        {items.map((item, i) => {
          const endDateHumanized = format(new Date(item.end * 1000), 'MMMM dd, yyyy');
          return (
            <ItemCard
              key={`${i}-${item.borrower}`}
              variant="primary"
              onClick={item.onAction ? item.onAction : undefined}
            >
              {item.header && <ItemHeader>{item.header}</ItemHeader>}

              <TopIcon>
                <TokenIcon symbol={''} icon={item.icon} size="xxBig" />
              </TopIcon>

              <ItemInfo>
                <ItemName>
                  {' '}
                  {t('components.line-card.borrower')}: {formatAddress(getENS(item.borrower, ensMap)!)}
                </ItemName>
                <Divider />

                <Metric>
                  ${humanize('amount', item.principal, 18, 2)} / ${humanize('amount', item.deposit, 18, 2)}
                </Metric>
                <MetricsTextContainer>
                  <MetricsText>
                    {' '}
                    {t('components.line-card.total-debt')} / {t('components.line-card.total-credit')}{' '}
                  </MetricsText>
                </MetricsTextContainer>
                <Divider />

                <ItemInfoLabel>{t('components.line-card.secured-by')}:</ItemInfoLabel>
                <Metric>
                  ${humanize('amount', item.escrow?.collateralValue, 18, 2)} / ${' '}
                  {humanize('amount', item.spigot?.revenueValue, 18, 2)}
                </Metric>
                <MetricsTextContainer>
                  <MetricsText>
                    {' '}
                    {t('components.line-card.collateral')} / {t('components.line-card.revenue')}{' '}
                  </MetricsText>
                </MetricsTextContainer>
                <Divider />

                <ItemInfoLabel>
                  {t('components.line-card.end')}: <MetricsText>{endDateHumanized}</MetricsText>
                </ItemInfoLabel>
                <Divider />
              </ItemInfo>
              {item.onAction && <TokenListIcon Component={ChevronRightIcon} />}
            </ItemCard>
          );
        })}
      </StyledCardContent>
    </ContainerCard>
  );
};
