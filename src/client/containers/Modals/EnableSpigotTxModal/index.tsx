import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { EnableSpigotTx } from '@components/app';

const StyledEnableSpigotTxModal = styled(ModalTx)``;
export interface EnableSpigotTxModalProps {
  onClose: () => void;
}

export const EnableSpigotTxModal: FC<EnableSpigotTxModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <StyledEnableSpigotTxModal {...props}>
      <EnableSpigotTx header={t('components.transaction.enable-spigot.header')} onClose={onClose} />
    </StyledEnableSpigotTxModal>
  );
};
