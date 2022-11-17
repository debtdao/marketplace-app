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
  margin: 0;
  padding: 1em;
  width: 100%;
`;

const Header = styled.h1`
  ${({ theme }) => `
    margin-bottom: ${theme.spacing.xl};
    font-size: ${theme.fonts.sizes.xl};
    color: ${theme.colors.titles};
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
  const [positions, setPositions] = useState<[]>();
  const [totalInterestPaid, setTotalInterestPaid] = useState('0');
  const [totalOutstandingDebt, setTotalDebt] = useState('0');
  const [totalCreditProvided, setTotalCredit] = useState('0');

  useEffect(() => {
    if (page && page.positions) {
      setAllDataLoaded(true);
      setLineData(page);
      setPositions(page.positions);
      let interestPaid: number = 0;
      let totalCredit: number = 0;
      let totalDebt: number = 0;
      page.positions.map((position, i) => {
        interestPaid = +interestPaid + +position['interestAccrued'];
        totalCredit = +totalCredit + +position['deposit'];
        totalDebt = +totalDebt + +position['principle'] + +position['interestAccrued'];
      });
      setTotalInterestPaid(`${interestPaid}`);
      setTotalCredit(`${totalCredit}`);
      setTotalDebt(`${totalDebt}`);
    }
    // LineDetails page handles getLinePage query
  }, [page?.positions]);

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
  if (allDataLoaded && positions) {
    // if we have all data render full UI
    return (
      <Container>
        <StandardMetadata
          revenue={spigot?.tokenRevenue}
          deposits={escrow?.deposits}
          deposit={deposit}
          principal={principal}
          totalInterestPaid={totalInterestPaid}
          totalOutstandingDebt={totalOutstandingDebt}
          totalCreditProvided={totalCreditProvided}
          startTime={start}
          endTime={end}
        />
        <CreditEventsTable events={positions} />
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
