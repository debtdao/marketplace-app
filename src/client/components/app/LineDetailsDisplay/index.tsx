import styled from 'styled-components';
import { Link } from 'react-router-dom';
import _ from 'lodash';

import { SecuredLine, SecuredLineWithEvents, CreditPosition } from '@types';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { RedirectIcon, Text } from '@components/common';
import { LinesActions, LinesSelectors } from '@store';

import { LineMetadata } from './LineMetadata';
import { PositionsTable } from './PositionsTable';

const linkHoverFilter = 'brightness(90%)';
const linkTransition = 'filter 200ms ease-in-out';

interface LineDetailsProps {
  onAddCollateral?: Function;
}

const Container = styled.div`
  margin: 0;
  padding: 1em;
  width: 100%;
`;

const Redirect = styled(RedirectIcon)`
  display: inline-block;
  fill: currentColor;
  width: 1.2rem;
  margin-left: 2rem;
  padding-bottom: 0.2rem;
`;

const Header = styled.h1`
  ${({ theme }) => `
    margin-bottom: ${theme.spacing.xl};
    font-size: ${theme.fonts.sizes.xl};
    color: ${theme.colors.titles};
  `};
`;

const RouterLink = styled(Link)<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: inherit;
  font-size: 3rem;
  flex: 1;
  width: 100%;

  &:hover span {
    filter: ${linkHoverFilter};
  }

  span {
    transition: ${linkTransition};
  }
  ${(props) =>
    props.selected &&
    `
    color: ${props.theme.colors.titlesVariant};
  `}
`;

const BorrowerName = styled(Text)`
  max-width: 100%;
`;

export const LineDetailsDisplay = (props: LineDetailsProps) => {
  const { t } = useAppTranslation('common');

  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);

  if (!selectedLine) return <Container>{t('lineDetails:line.no-data')}</Container>;
  const { principal, deposit, escrow, spigot, borrower, start, end } = selectedLine;

  const StandardMetadata = (metadataProps: any) => (
    <>
      <Header>
        <RouterLink to={`/portfolio/${borrower}`} key={borrower} selected={false}>
          <BorrowerName>
            {borrower}'s Line Of Credit
            <Redirect />
          </BorrowerName>
        </RouterLink>
      </Header>
      <LineMetadata {...metadataProps} />
    </>
  );

  // allow passing in core data first if we have it already and let Page data render once returned
  // if we have all data render full UI
  return (
    <Container>
      <StandardMetadata
        revenue={spigot?.tokenRevenue}
        deposits={escrow?.deposits}
        deposit={deposit}
        principal={principal}
        totalInterestPaid={'0'}
        startTime={start}
        endTime={end}
      />

      {positions && <PositionsTable positions={_.values(positions)} />}
    </Container>
  );
};
