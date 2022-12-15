import { useEffect, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { useAppSelector, useAppTranslation, useAppDispatch } from '@hooks';
import { Text } from '@components/common';
import { OnchainMetaDataActions, OnchainMetaDataSelector, LinesSelectors } from '@store';
import { getENS } from '@src/utils';
import { ENSAddressPair } from '@src/core/types';

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
  const dispatch = useAppDispatch();

  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);
  const ENSRegistry = useAppSelector(OnchainMetaDataSelector.selectENSPairs);
  const [borrowerID, setBorrowerId] = useState('');

  useEffect(() => {
    dispatch(OnchainMetaDataActions.getENS(selectedLine?.borrower!));
  }, [selectedLine]);

  useEffect(() => {
    const ENSData: ENSAddressPair[] = getENS(selectedLine?.borrower!, ENSRegistry);
    if (ENSData && !ENSData[0]) {
      setBorrowerId(selectedLine?.borrower!);
      return;
    }
    if (ENSData && ENSData[0].ENS) {
      setBorrowerId(ENSData[0].ENS);
      return;
    }
  }, [selectedLine, ENSRegistry]);

  if (!selectedLine) return <Container>{t('lineDetails:line.no-data')}</Container>;
  const { principal, deposit, escrow, spigot, start, end } = selectedLine;

  const StandardMetadata = (metadataProps: any) => (
    <>
      <Header>
        <BorrowerName ellipsis>{borrowerID}</BorrowerName>
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
