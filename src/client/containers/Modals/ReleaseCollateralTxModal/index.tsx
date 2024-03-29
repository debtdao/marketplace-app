import { FC } from 'react';
import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { ModalTx } from '@components/common';
import { ReleaseCollateralTx } from '@components/app';

const StyledReleaseCollateralTxModal = styled(ModalTx)``;
export interface ReleaseCollateralTxModalProps {
  onClose: () => void;
}

export const ReleaseCollateralTxModal: FC<ReleaseCollateralTxModalProps> = ({ onClose, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <StyledReleaseCollateralTxModal {...props}>
      <ReleaseCollateralTx header={t('components.transaction.enable-spigot.header')} onClose={onClose} />
    </StyledReleaseCollateralTxModal>
  );
};
