import { useEffect, useState, useMemo } from 'react';

import { getLine } from '@src/core/frameworks/gql';
import { GET_LINE_QUERY, GET_LINE_PAGE_QUERY, GET_LINES_QUERY } from '@config/constants/queries';
import { Address, GetLineArgs, GetLinePageArgs, GetLinesArgs, BaseCreditLine } from '@types';

export function useLine(id: Address): [BaseCreditLine | undefined, Boolean] {
  const [line, setLine] = useState<BaseCreditLine | undefined>();
  const [loading, isLoading] = useState(false);

  useEffect(() => {
    if (!line) {
      isLoading(true);
      getLine({ id })
        .then(({ error, loading, data }) => {
          console.log('response from graphql', line);
          if (!line) throw Error('getLine failed');
          setLine(line);
          isLoading(false);
        })
        .catch((err) => {
          isLoading(false);
          console.log('err', err);
        });
    }
  }, [id]);

  return [line, loading];
}
