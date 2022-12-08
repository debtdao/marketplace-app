import { useEffect, useState } from 'react';

import { SecuredLine } from '@src/core/types';

export const useSelectedCreditLine = (): [SecuredLine | undefined, Function] => {
  const [creditLine, setCreditLine] = useState<SecuredLine | undefined>();

  useEffect(() => {
    // if(!creditLine && )
  }, [creditLine, setCreditLine]);

  return [creditLine, setCreditLine];
};
