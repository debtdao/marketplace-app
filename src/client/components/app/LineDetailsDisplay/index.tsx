import styled from 'styled-components';
import _ from 'lodash';
import { useState, useEffect } from 'react';

import { useAppSelector, useAppTranslation, useAppDispatch } from '@hooks';
import { RedirectIcon, Text, Link } from '@components/common';
import { OnchainMetaDataActions, OnchainMetaDataSelector, LinesSelectors, NetworkSelectors } from '@store';
import { Network } from '@src/core/types';
import { getENS } from '@src/utils';

import { LineMetadata } from './LineMetadata';
import { PositionsTable } from './PositionsTable';

interface LineDetailsProps {
  onAddCollateral?: Function;
  lineNetwork: Network;
}

export const Container = styled.div`
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
    filter: brightness(90%);
  }

  span {
    transition: filter 200ms ease-in-out;
  }
  ${(props) =>
    props.selected &&
    `
    color: ${props.theme.colors.titlesVariant};
  `}
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
  console.log('Line Details Display: ', selectedLine);
  useEffect(() => {
    dispatch(OnchainMetaDataActions.getENS(selectedLine?.borrower!));
  }, [selectedLine]);

  useEffect(() => {
    const ensName = getENS(selectedLine?.borrower!, ensMap);

    if (!ensName) {
      setBorrowerId(selectedLine?.borrower!);
    } else {
      setBorrowerId(ensName);
    }
  }, [selectedLine, ensMap]);

  if (!selectedLine) return <Container>{t('lineDetails:line.no-data')}</Container>;
  const { principal, deposit, totalInterestRepaid, escrow, borrower, spigot, start, end, defaultSplit } = selectedLine;
  console.log('Escrow State 0: ', escrow);
  console.log('Spigot State 0: ', spigot);

  console.log('line detail index lineNetwork', props.lineNetwork);
  const StandardMetadata = (metadataProps: any) => <></>;

  // allow passing in core data first if we have it already and let Page data render once returned
  // if we have all data render full UI
  return (
    <Container>
      <Header>
        <RouterLink to={`/portfolio/${props.lineNetwork}/${borrower}`} key={borrower} selected={false}>
          <BorrowerName>
            {t('lineDetails:metadata.borrower')} {'  :  '} {borrowerID}
            <Redirect />
          </BorrowerName>
        </RouterLink>
      </Header>
      <LineMetadata
        revenue={spigot?.revenueSummary}
        deposits={escrow?.deposits}
        deposit={deposit}
        principal={principal}
        totalInterestRepaid={totalInterestRepaid}
        startTime={start}
        endTime={end}
        minCRatio={escrow?.minCRatio ?? '0'}
        defaultSplit={defaultSplit}
        collateralValue={escrow?.collateralValue ?? '0'}
        revenueValue={spigot?.revenueValue ?? '0'}
        spigots={spigot?.spigots}
        lineNetwork={props.lineNetwork}
      />

      {positions && <PositionsTable positions={_.values(positions)} />}
    </Container>
  );
};
