import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { isEmpty } from 'lodash';

import {
  useAppTranslation,
  useAppDispatch,
  useSelectedCreditLine,

  // used to dummy token for dev
  useAppSelector,
  useSelectedSellToken,
} from '@hooks';
import { toBN } from '@src/utils';
import { CreditEvent, SetRateEvent } from '@src/core/types';

const Table = styled.table`
  ${({ theme }) => `
    margin: ${theme.fonts.sizes.xl} 0;
  `}
`;

const TableHeader = styled.h3`
  ${({ theme }) => `
    font-size: ${theme.fonts.sizes.xl};
    font-weight: 600;
    margin: ${theme.spacing.xl} 0;
    color: ${theme.colors.primary};
  `}
`;

const TableRow = styled.h3`
  ${({ theme }) => `
  `}
`;

const ColumnName = styled.h3`
  display: inline;
  font-weight: 600;
  ${({ theme }) => `
    font-size: ${theme.fonts.sizes.lg};
    padding: ${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 0;
    color: ${theme.colors.primary};
  `}
`;

interface CreditEventsTableProps {
  events: CreditEvent[];
}

export const CreditEventsTable = (props: CreditEventsTableProps) => {
  const { t } = useAppTranslation(['common', 'lineDetails']);
  const { events } = props;

  const columnNames = ['positionId', 'timestamp', 'token', 'amount', 'value'];

  const renderEvents = (events: CreditEvent[]) =>
    events.map((e) => {
      const eventName = e.__typename.split(/[A-Z]/).slice(0, 1).join(' '); // remove 'Event' suffix
      return (
        <tr key={e.id}>
          <td>{eventName}</td>
          {columnNames.map((n) => (
            <td key={`${e.id}-${n}`}>{e[n]}</td>
          ))}
        </tr>
      );
    });

  return (
    <>
      <TableHeader>{t('lineDetails:credit-events.title')}</TableHeader>
      <Table>
        <tr> {isEmpty(events) ? null : columnNames.map((n) => <ColumnName key={n}>{n}</ColumnName>)}</tr>
        <tbody>
          {isEmpty(events) ? <ColumnName> {t('lineDetails:credit-events.no-data')} </ColumnName> : renderEvents(events)}
        </tbody>
      </Table>
    </>
  );
};
