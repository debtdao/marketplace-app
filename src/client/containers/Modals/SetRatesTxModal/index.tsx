import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { SetRatesTx } from '@components/app';

const StyledSetRatesTxModal = styled(ModalTx)``;
export interface SetRatesModalProps {
  onClose: () => void;
}

export const SetRatesTxModal: FC<SetRatesModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');

  const onSelectedCreditLineChange = () => {
    // new creditLine selected to invest in
    // setSelected()
  };

  const onPositionChange = () => {
    // update deposit params
  };
  return (
    <StyledSetRatesTxModal {...props}>
      <SetRatesTx
        header={t('components.transaction.set-rates')}
        onSelectedCreditLineChange={onSelectedCreditLineChange}
        onPositionChange={onPositionChange}
        onClose={onClose}
      />
    </StyledSetRatesTxModal>
  );
};
