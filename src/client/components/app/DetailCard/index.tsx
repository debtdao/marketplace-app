import { useState, useEffect, ReactNode } from 'react';
import styled from 'styled-components';

import { Card, CardHeader, CardContent, CardElement, CardEmptyList, ToggleButton } from '@components/common';
import { sort } from '@utils';
import { device } from '@themes/default';
import { useWindowDimensions } from '@hooks';

const StyledCardElement = styled(CardElement)<{ stripes?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin: 0;
  // NOTE Card element uses card padding and layout padding, also other card child components too, doing this
  // all the card components will work fine when modifying either of the paddings, since the paddings are
  // related between them
  padding: calc(${({ theme }) => theme.card.padding} / 4) calc(${({ theme }) => theme.layoutPadding} / 2);
  font-size: 1.4rem;
  flex-shrink: 2;

  &:last-child {
    align-items: flex-end;
  }

  > * {
    margin-top: 0;
    font-size: inherit;
    color: inherit;
  }

  ${({ stripes, theme }) =>
    stripes &&
    `
    &:nth-child(even) {
      background-color: ${theme.colors.surfaceVariantA};
    }
  `}

  @media ${device.mobile} {
    padding-left: 0rem;
    padding-right: 0rem;
  }
`;

const TitleCardElement = styled(CardElement)`
  margin: 0;
  padding: 0.6rem calc(${({ theme }) => theme.layoutPadding} / 2);
  flex-shrink: 2;
  user-select: none;
  align-items: flex-start;
  &:last-child {
    align-items: flex-end;
  }
  @media ${device.mobile} {
    padding: 0rem;
  }
`;

const StyledCardContent = styled(CardContent)<{ wrap?: boolean; pointer?: boolean }>`
  align-items: stretch;
  justify-content: stretch;
  ${({ pointer }) => pointer && `cursor: pointer;`};
  // ${({ wrap }) => wrap && `flex-wrap: wrap;`};

  &:hover {
    background-color: ${({ theme }) => theme.colors.selectionBar};

    // NOTE If you want to change other elements on selection bar hover
    ${StyledCardElement} {
      color: ${({ theme }) => theme.colors.titles};
    }
  }
`;

const StyledCardHeader = styled(CardHeader)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  grid-gap: 0.5rem;
`;

const StyledCard = styled(Card)`
  padding: ${({ theme }) => theme.card.padding} 0;
  width: 100%;
`;

const SectionContent = styled.div`
  display: flex;
  grid-gap: 0.5rem;
  align-items: center;
`;

interface Metadata<T> {
  key: Extract<keyof T, string>;
  header?: string;
  description?: string;
  align?: 'flex-start' | 'center' | 'flex-end';
  fontWeight?: number;
  width?: string;
  grow?: '1' | '0';
  hide?: boolean;
  className?: string;
  sortable?: boolean;
  format?: (item: T) => string;
  transform?: (item: T) => ReactNode;
}

interface DetailCardProps<T> {
  header: string;
  description?: string;
  metadata: Metadata<T>[];
  data: T[];
  stripes?: boolean;
  wrap?: boolean;
  initialSortBy?: Extract<keyof T, string>;
  SearchBar?: ReactNode;
  searching?: boolean;
  onAction?: (item: T) => void;
  filterBy?: (item: T) => boolean;
  filterLabel?: string;
  hideActions?: boolean;
}

export const DetailCard = <T,>({
  header,
  metadata,
  data,
  stripes,
  wrap,
  initialSortBy,
  SearchBar,
  searching,
  onAction,
  filterBy,
  filterLabel,
  hideActions,
  ...props
}: DetailCardProps<T>) => {
  const { isMobile } = useWindowDimensions();
  const [sortedData, setSortedData] = useState(initialSortBy ? sort(data, initialSortBy) : data);
  const [sortedBy, setSortedBy] = useState(initialSortBy);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filterToggle, setFilterToggle] = useState(filterBy ? false : true);
  const filteredData = filterBy ? sortedData.filter(filterBy) : sortedData;
  const displayData = filterToggle ? sortedData : filteredData;

  const handleSort = (key: Extract<keyof T, string>) => {
    if (sortedBy === key) {
      setSortedData([...sortedData].reverse());
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setSortedData(sort(sortedData, key));
      setSortedBy(key);
      setOrder('desc');
    }
  };

  useEffect(() => {
    setSortedData(sortedBy ? sort(data, sortedBy, order) : data);
  }, [data]);

  if (data.length === 0 && !SearchBar) {
    return null;
  }
  return (
    <StyledCard {...props}>
      <StyledCardHeader header={header}>
        {!hideActions ? (
          <SectionContent>
            {!!filterBy && (
              <>
                {filterLabel}
                <ToggleButton
                  ariaLabel={filterLabel}
                  selected={filterToggle}
                  setSelected={setFilterToggle}
                  data-testid="filter-toggle"
                  data-active={filterToggle}
                />
              </>
            )}
            {SearchBar}
          </SectionContent>
        ) : (
          <></>
        )}
      </StyledCardHeader>

      {!!displayData.length && (
        <CardContent>
          {metadata.map(
            ({ key, sortable, hide, className, transform, format, ...rest }) =>
              !hide && (
                <TitleCardElement
                  className={className}
                  key={key}
                  onClick={() => (sortable ? handleSort(key) : undefined)}
                  sortable={sortable}
                  activeSort={sortedBy === key}
                  sortType={order}
                  {...rest}
                />
              )
          )}
        </CardContent>
      )}

      {displayData.map((item, i) => (
        <StyledCardContent
          key={`content-${i}`}
          wrap={wrap}
          pointer={!!onAction}
          data-testid="list-item"
          onClick={() => {
            if (onAction) onAction(item);
          }}
        >
          {metadata.map(
            ({ key, width, align, grow, hide, fontWeight, className, format, transform }) =>
              !hide && (
                <StyledCardElement
                  key={`element-${key}-${i}`}
                  content={transform ? undefined : format ? format(item) : item[key]}
                  fontWeight={fontWeight}
                  width={width}
                  align={align}
                  grow={grow}
                  stripes={stripes}
                  className={className}
                >
                  {transform && transform(item)}
                </StyledCardElement>
              )
          )}
        </StyledCardContent>
      ))}

      {!displayData.length && <CardEmptyList searching={searching} />}
    </StyledCard>
  );
};
