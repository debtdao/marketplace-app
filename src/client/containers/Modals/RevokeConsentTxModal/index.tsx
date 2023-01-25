// TODO: clean-up this code in Revoke Consent PR.
import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { RevokeConsentTx } from '@components/app';

const StyledRevokeConsentTxModal = styled(ModalTx)``;
export interface WithdrawTxModalProps {
  onClose: () => void;
}

export const RevokeConsentTxModal: FC<WithdrawTxModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');

  const onSelectedCreditLineChange = () => {
    // new creditLine selected to invest in
    // setSelected()
  };

  const onPositionChange = () => {
    // update deposit params
  };
  return (
    <StyledRevokeConsentTxModal {...props}>
      {/* TODO: add when implementing RevokeConsent */}
      {/* <RevokeConsentTx
        header={t('components.transaction.withdraw')}
        onSelectedCreditLineChange={onSelectedCreditLineChange}
        onPositionChange={onPositionChange}
        onClose={onClose}
      /> */}
    </StyledRevokeConsentTxModal>
  );
};
