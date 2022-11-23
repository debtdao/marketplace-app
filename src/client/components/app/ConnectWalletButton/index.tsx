import styled from 'styled-components';

import { useAppTranslation } from '@hooks';
import { Button, Text } from '@components/common';
import { device } from '@themes/default';
import { formatAddress } from '@utils';
import { BlocknativeWalletImpl } from '@frameworks/blocknative';

interface WalletAddressProps {
  address?: string;
  ensName?: string;
  disabled?: boolean;
  onClick: () => void;
}

const StyledButton = styled(Button)`
  overflow: hidden;
  min-width: 7.4rem;

  @media ${device.mobile} {
    width: auto;
  }
`;

export const ConnectWalletButton = ({ address, ensName, disabled, onClick }: WalletAddressProps) => {
  const { t } = useAppTranslation('common');
  let buttonMessage;

  const connectWallet = () => {
    let bs = new BlocknativeWalletImpl();
    bs.connect();
  };

  if (!address) {
    buttonMessage = t('components.connect-button.connect');
  } else {
    buttonMessage = ensName ?? formatAddress(address);
  }

  return (
    <StyledButton
      onClick={connectWallet}
      disabled={disabled}
      data-testid="connect-wallet-button"
      data-connected={!!address}
    >
      <Text ellipsis>{buttonMessage}</Text>
    </StyledButton>
  );
};
