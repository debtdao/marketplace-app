import { useEffect, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { SecuredLine, SecuredLineWithEvents, CreditPosition } from '@types';
import { useAppDispatch, useAppSelector, useAppTranslation } from '@hooks';
import { Text } from '@components/common';
import { LinesActions, LinesSelectors } from '@store';

import { LineMetadata } from './LineMetadata';
import { PositionsTable } from './PositionsTable';

interface LineDetailsProps {
  line?: SecuredLine;
  page?: SecuredLineWithEvents;
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
  const dispatch = useAppDispatch();
  const { line, page } = props;

  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const selectedPosition = useAppSelector(LinesSelectors.selectSelectedPositionId);

  const [positions, setPositions] = useState<CreditPosition[]>();

  useEffect(() => {
    if (!selectedLine && line) {
      dispatch(LinesActions.setSelectedLineAddress({ lineAddress: line.id }));
    }
    // LineDetails page handles getLinePage query
  }, [page]);

  if (!selectedLine) return <Container>{t('lineDetails:line.no-data')}</Container>;
  const { principal, deposit, escrow, spigot, borrower, start, end } = selectedLine;

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
        <PositionsTable positions={positions} />
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
