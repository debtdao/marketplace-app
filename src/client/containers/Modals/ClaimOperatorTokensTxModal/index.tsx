import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { ClaimOperatorTokensTx } from '@components/app';

const StyledClaimOperatorTokensTxModal = styled(ModalTx)`
  height: 50%;
`;

export interface ClaimOperatorTokensTxModalProps {
  onClose: () => void;
}

export const ClaimOperatorTokensTxModal: FC<ClaimOperatorTokensTxModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <StyledClaimOperatorTokensTxModal>
      <ClaimOperatorTokensTx
        header={t('components.transaction.claim-revenue.header')} // TODO
        onClose={onClose}
      />
    </StyledClaimOperatorTokensTxModal>
  );
};
