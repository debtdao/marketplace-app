import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { ClaimRevenueTx } from '@components/app';

const StyledClaimRevenueTxModal = styled(ModalTx)``;
export interface ClaimRevenueTxModalProps {
  // revenueContractAddress?: string;
  onClose: () => void;
}

export const ClaimRevenueTxModal: FC<ClaimRevenueTxModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');
  return (
    <StyledClaimRevenueTxModal {...props}>
      <ClaimRevenueTx
        header={t('components.transaction.claim-revenue.header')} // TODO
        onClose={onClose}
      />
    </StyledClaimRevenueTxModal>
  );
};
