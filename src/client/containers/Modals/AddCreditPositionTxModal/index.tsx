import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { AddCreditPositionTx } from '@components/app';

const StyledAddCreditPositionTxModal = styled(ModalTx)``;
export interface AddCreditPositionTxModalProps {
  onClose: () => void;
}

export const AddCreditPositionTxModal: FC<AddCreditPositionTxModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');
  // if (!creditLine) return; // TODO error or creditLine selector input

  return (
    <StyledAddCreditPositionTxModal {...props}>
      <AddCreditPositionTx header={t('components.transaction.add-credit.header')} onClose={onClose} />
    </StyledAddCreditPositionTxModal>
  );
};
