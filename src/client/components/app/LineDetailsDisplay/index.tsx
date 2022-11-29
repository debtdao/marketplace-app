import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { AggregatedCreditLine, CreditLinePage, CreditPosition } from '@src/core/types';
import { useAppTranslation, useAppSelector, useAppDispatch } from '@hooks';
import { Text } from '@components/common';
import { LinesActions, LinesSelectors, WalletSelectors } from '@store';

import { LineMetadata } from './LineMetadata';
import { PositionsTable } from './PositionsTable';

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
  const borrowerPositions = useAppSelector(LinesSelectors.selectBorrowerPositions);
  const userWallet = useAppSelector(WalletSelectors.selectSelectedAddress);

  const dispatch = useAppDispatch();

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

  useEffect(() => {
    if (borrowerPositions) console.log({ borrowerPositions });
  }, [borrowerPositions]);

  useEffect(() => {
    if (userWallet) {
      console.log('fetching borrower positions for: ', userWallet);
      dispatch(LinesActions.getBorrowerPositions({ borrower: '0x1a6784925814a13334190fd249ae0333b90b6443' }));
    }
  }, [userWallet]);

  if (!line && !page) return <Container>{t('lineDetails:line.no-data')}</Container>;

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
