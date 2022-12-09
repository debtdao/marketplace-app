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

  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);
  console.log('User Portfolio select positions for line id: ', selectedLine);
  console.log('User Portfolio select positions for line: ', positions);

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
