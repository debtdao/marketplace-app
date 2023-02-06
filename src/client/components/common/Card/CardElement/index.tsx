import { FC, ReactNode } from 'react';
import styled from 'styled-components';

import { Icon, ArrowDownIcon, IconProps, InfoIcon, Tooltip, TooltipProps } from '@components/common';

const Container = styled.div<{ width?: string; align?: string; grow?: string; fontWeight?: number }>`
  display: flex;
  flex-direction: column;
  width: ${({ width }) => width ?? '17rem'};
  align-items: ${({ align }) => align ?? 'flex-start'};
  flex-grow: ${({ grow }) => grow ?? '0'};
  margin: 0.825rem ${({ theme }) => theme.card.padding};
  font-weight: ${({ fontWeight }) => fontWeight ?? 400};
`;

interface SortIconProps extends Omit<IconProps, 'ref'> {
  activeSort?: boolean;
  sortType?: SortType;
}

interface StyledIconProps extends Omit<IconProps, 'ref'> {}

interface StyledTooltipProps extends Omit<TooltipProps, 'ref'> {}

const StyledIcon = styled(({ ...props }: StyledIconProps) => <Icon {...props} />)`
  height: 1.1rem;
  // position: relative;
  margin-left: 0.4rem;
  flex-shrink: 0;
  transition: transform 200ms ease-in-out;
`;

const SortIcon = styled(({ activeSort, sortType, ...props }: SortIconProps) => <Icon {...props} />)`
  height: 1.1rem;
  // position: relative;
  margin-left: 0.4rem;
  // fill: currentColor;
  transition: transform 200ms ease-in-out;
  flex-shrink: 0;
  transform: rotateZ(0);

  ${({ activeSort, sortType, theme }) =>
    activeSort &&
    `
    color: ${theme.colors.texts};
    transform: ${sortType === 'asc' ? 'rotateZ(180deg)' : 'rotateZ(0deg)'};
  `}
`;

const StyledTooltip = styled(({ ...props }: StyledTooltipProps) => <Tooltip {...props} />)`
  position: absolute;
`;

const Header = styled.h3<{ onClick?: () => void }>`
  display: flex;
  position: relative;
  align-items: center;
  // font-size: 1.6rem;
  font-size: 2rem;
  font-weight: 400;
  margin: 0;
  padding: 0;
  color: ${({ theme }) => theme.colors.texts};
  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'default')};
`;

const Content = styled.div`
  display: inline-flex;
  align-items: center;
  margin-top: 0.8rem;
  font-size: 2.4rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
  color: ${({ theme }) => theme.colors.texts};

  :first-child img {
    margin-right: ${({ theme }) => theme.layoutPadding};
  }
`;

type SortType = 'asc' | 'desc';
interface CardElementProps {
  header?: string;
  description?: string;
  sortable?: boolean;
  activeSort?: boolean;
  sortType?: SortType;
  content?: string | ReactNode;
  width?: string;
  align?: 'flex-start' | 'center' | 'flex-end';
  grow?: '1' | '0';
  fontWeight?: number;
  onClick?: () => void;
  className?: string;
}

export const CardElement: FC<CardElementProps> = ({
  children,
  header,
  description,
  sortable,
  activeSort,
  sortType,
  content,
  width,
  align,
  grow,
  fontWeight,
  onClick,
  className,
  ...props
}) => {
  // console.log('Card Element - props: ', props);
  // console.log('Card Element - content: ', content);
  // console.log('Card Element - description: ', description);
  // const stuff = 'text';
  return (
    <Container width={width} align={align} grow={grow} fontWeight={fontWeight} className={className} {...props}>
      {header && (
        <Header onClick={onClick}>
          {header}
          {/* <Tooltip placement="bottom-start" tooltipComponent={<>{description}</>}>
            <Icon Component={InfoIcon} size="1.5rem" />
          </Tooltip> */}
          <StyledTooltip placement="bottom-start" tooltipComponent={<>{description}</>}>
            <StyledIcon Component={InfoIcon} size="1.5rem" />
          </StyledTooltip>
          {sortable && <SortIcon activeSort={activeSort} sortType={sortType} Component={ArrowDownIcon} />}
        </Header>
      )}
      {content && <Content>{content}</Content>}
      {children && <Content>{children}</Content>}
    </Container>
  );
};
