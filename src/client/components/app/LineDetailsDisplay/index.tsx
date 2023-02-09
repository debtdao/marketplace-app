import styled from 'styled-components';
import _ from 'lodash';
import { useState, useEffect } from 'react';

import { useAppSelector, useAppTranslation, useAppDispatch } from '@hooks';
import { RedirectIcon, Text, Link } from '@components/common';
import { OnchainMetaDataActions, OnchainMetaDataSelector, LinesSelectors, NetworkSelectors } from '@store';
import { Collateral, Network } from '@src/core/types';
import { getENS } from '@src/utils';

import { LineMetadata } from './LineMetadata';
import { PositionsTable } from './PositionsTable';

interface LineDetailsProps {
  onAddCollateral?: Function;
  lineNetwork: Network;
}

export const Container = styled.div`
  margin: 0;
  width: 100%;
`;

export const BorrowerName = styled(Text)`
  max-width: 100%;
`;

export const LineDetailsDisplay = (props: LineDetailsProps) => {
  const { t } = useAppTranslation('common');
  const dispatch = useAppDispatch();
  const selectedLine = useAppSelector(LinesSelectors.selectSelectedLinePage);
  const positions = useAppSelector(LinesSelectors.selectPositionsForSelectedLine);
  const ensMap = useAppSelector(OnchainMetaDataSelector.selectENSPairs);
  const [borrowerID, setBorrowerId] = useState('');

  useEffect(() => {
    dispatch(OnchainMetaDataActions.getENS(selectedLine?.borrower!));
  }, [selectedLine]);

  useEffect(() => {
    const ensName = getENS(selectedLine?.borrower!, ensMap);
    setBorrowerId(ensName!);
  }, [selectedLine, ensMap]);

  if (!selectedLine) return <Container>{t('lineDetails:line.no-data')}</Container>;
  const { borrower } = selectedLine;

  // allow passing in core data first if we have it already and let Page data render once returned
  // if we have all data render full UI
  return (
    <Container>
      <LineMetadata borrowerID={borrowerID} />
      {positions && <PositionsTable borrower={borrower} positions={_.values(positions)} />}
    </Container>
  );
};
