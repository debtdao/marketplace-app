import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { RequestCollateralTx } from '@components/app';

const StyledAddCreditPositionTxModal = styled(ModalTx)``;
export interface ReleastCollateralTxModalProps {
  onClose: () => void;
}

export const RequestCollateralTxModal: FC<ReleastCollateralTxModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');
  // if (!creditLine) return; // TODO error or creditLine selector input

  return (
    <StyledAddCreditPositionTxModal {...props}>
      <RequestCollateralTx header={t('components.transaction.request-collateral.header')} onClose={onClose} />
    </StyledAddCreditPositionTxModal>
  );
};
