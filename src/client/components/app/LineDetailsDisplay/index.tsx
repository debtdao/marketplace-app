import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { AggregatedCreditLine, CreditLinePage } from '@src/core/types';
import { useAppTranslation } from '@hooks';
import { Text } from '@components/common';

import { LineMetadata } from './LineMetadata';
import { CreditEventsTable } from './CreditEventsTable';

interface LineDetailsProps {
  line?: AggregatedCreditLine;
  page?: CreditLinePage;
  onAddCollateral?: Function;
}

const Container = styled.div`
  margin: ${({ theme }) => theme.card.padding};
`;

const Header = styled.h1`
  ${({ theme }) => `
    margin-bottom: ${theme.spacing.xl};
    font-size: ${theme.fonts.sizes.xl};
  `};
`;

const BorrowerName = styled(Text)`
  max-width: 150px;
`;

export const LineDetailsDisplay = (props: LineDetailsProps) => {
  const { t } = useAppTranslation('common');
  const { line, page } = props;

  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [lineData, setLineData] = useState<AggregatedCreditLine | CreditLinePage>(line!);

  useEffect(() => {
    if (page) {
      setAllDataLoaded(true);
      setLineData(page);
    }
    // LineDetails page handles getLinePage query
  });

  if (!line && !page) return <Container>{t('lineDetails:line.no-data')}</Container>;

  const { principal, deposit, escrow, spigot, borrower, start, end } = lineData;
  const StandardMetadata = (metadataProps: any) => (
    <>
      <Header>
        <BorrowerName ellipsis>{borrower}</BorrowerName>
        's Line Of Credit
      </Header>
      <LineMetadata {...metadataProps} />
    </>
  );

  // allow passing in core data first if we have it already and let Page data render once returned
  if (allDataLoaded) {
    // if we have all data render full UI
    const { creditEvents } = page!;

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
        <CreditEventsTable events={creditEvents} />
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
