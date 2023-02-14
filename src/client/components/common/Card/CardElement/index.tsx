import { FC, ReactNode } from 'react';
import styled from 'styled-components';

import { Icon, ArrowDownIcon, IconProps, InfoIcon, Tooltip, TooltipProps } from '@components/common';
import { useWindowDimensions } from '@hooks';

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

// TODO: StyledIcon, StyledTooltipProps, and StyledTooltip do not work for some reason
interface StyledIconProps extends Omit<IconProps, 'ref'> {}

interface StyledTooltipProps extends Omit<TooltipProps, 'ref'> {}

const StyledIcon = styled(({ ...props }: StyledIconProps) => <Icon {...props} />)`
  height: 1.1rem;
  margin-left: 0.4rem;
  flex-shrink: 0;
  fill: ${({ theme, color, fill }) => fill ?? color ?? theme.colors.titles};
  transition: transform 200ms ease-in-out;
`;

const StyledTooltip = styled(({ ...props }: StyledTooltipProps) => <Tooltip {...props} />)`
  position: absolute;
`;

const SortIcon = styled(({ activeSort, sortType, ...props }: SortIconProps) => <Icon {...props} />)`
  height: 1.1rem;
  margin-left: 0.4rem;
  fill: ${({ theme }) => theme.colors.secondary};
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

const Header = styled.h3<{ onClick?: () => void }>`
  display: flex;
  flex-direction: row;
  position: relative;
  align-items: center;
  // text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
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

const IconContainer = styled.div`
  display: flex;
  flex-direction: column;
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
  const { isMobile } = useWindowDimensions();
  return (
    <Container width={width} align={align} grow={grow} fontWeight={fontWeight} className={className} {...props}>
      {header && (
        <Header onClick={onClick}>
          {header}
          {!isMobile && (
            <Tooltip placement="bottom-start" tooltipComponent={<>{description}</>}>
              <Icon Component={InfoIcon} size="1.5rem" />
            </Tooltip>
          )}

          {/* TODO: Add styled tooltip back once css issues are fixed */}
          {/* <Tooltip placement="bottom-start" tooltipComponent={<>{description}</>}>
            <StyledIcon Component={InfoIcon} size="1.5rem" />
          </Tooltip> */}
          {sortable && <SortIcon activeSort={activeSort} sortType={sortType} Component={ArrowDownIcon} />}
        </Header>
      )}
      {content && <Content>{content}</Content>}
      {children && <Content>{children}</Content>}
    </Container>
  );
};
