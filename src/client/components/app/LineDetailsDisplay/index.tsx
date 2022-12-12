import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { AggregatedCreditLine, CreditLinePage, CreditPosition } from '@src/core/types';
import { useAppTranslation } from '@hooks';
import { RedirectIcon, Text } from '@components/common';

import { LineMetadata } from './LineMetadata';
import { PositionsTable } from './PositionsTable';

const linkHoverFilter = 'brightness(90%)';
const linkTransition = 'filter 200ms ease-in-out';

interface LineDetailsProps {
  line?: AggregatedCreditLine;
  page?: CreditLinePage;
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
  const { line, page } = props;

  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [lineData, setLineData] = useState<AggregatedCreditLine | CreditLinePage>(line!);
  const [positions, setPositions] = useState<CreditPosition[]>();

  const { principal, deposit, escrow, spigot, borrower, start, end } = lineData;

  useEffect(() => {
    if (page && page.positions) {
      setAllDataLoaded(true);
      setLineData(page);
      setPositions(page.positions);
    }
    console.log('updating in line details', page);
    // LineDetails page handles getLinePage query
  }, [page]);

  if (!line && !page) return <Container>{t('lineDetails:line.no-data')}</Container>;

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
  if (allDataLoaded && positions) {
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
        <PositionsTable events={positions} />
      </Container>
    );
  } else {
    // render partial UI with core data
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
      </Container>
    );
  }
};
