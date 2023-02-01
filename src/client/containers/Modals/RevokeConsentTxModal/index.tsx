// TODO: clean-up this code in Revoke Consent PR.
import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { RevokeConsentTx } from '@components/app';

const StyledRevokeConsentTxModal = styled(ModalTx)``;
export interface RevokeConsentTxModalProps {
  onClose: () => void;
}

export const RevokeConsentTxModal: FC<RevokeConsentTxModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <StyledRevokeConsentTxModal {...props}>
      <RevokeConsentTx header={t('components.transaction.revoke-consent.header')} onClose={onClose} />
    </StyledRevokeConsentTxModal>
  );
};
