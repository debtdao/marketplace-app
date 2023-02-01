import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { RepayPositionTx } from '@components/app';

const StyledRepayPositionTxModal = styled(ModalTx)``;
export interface RepayPositionTxModalProps {
  onClose: () => void;
}

export const RepayPositionTxModal: FC<RepayPositionTxModalProps> = ({ onClose, ...props }) => {
  console.log('deposit and repay modal', props);
  const { t } = useAppTranslation('common');
  // if (!creditLine) return; // TODO error or creditLine selector input

  const onSelectedCreditLineChange = () => {
    // new creditLine selected to invest in
    // setSelected()
  };

  const onPositionChange = () => {
    // update deposit params
  };

  return (
    <StyledRepayPositionTxModal {...props}>
      <RepayPositionTx
        header={t('components.transaction.repay.header')} // TODO
        acceptingOffer={false}
        onClose={onClose}
        onSelectedCreditLineChange={onSelectedCreditLineChange}
        onPositionChange={onPositionChange}
      />
    </StyledRepayPositionTxModal>
  );
};
