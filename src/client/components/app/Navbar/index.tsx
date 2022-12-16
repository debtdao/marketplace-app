import styled from 'styled-components';

import { ConnectWalletButton } from '@components/app';
import { OptionList, EthereumIcon, ArbitrumIcon, Link } from '@components/common';
import { WalletSelectors } from '@src/core/store';
import { NetworkSelectors } from '@src/core/store';
import { useAppSelector } from '@hooks';
import { useWindowDimensions } from '@hooks';
import { Network } from '@types';
import { device } from '@themes/default';
import { getConfig } from '@config';
import { getConstants } from '@src/config/constants';

const { SUPPORTED_NETWORKS } = getConstants();

const StyledOptionList = styled(OptionList)`
  width: 15rem;
`;

const StyledNavbarActions = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 1.2rem;
  padding-left: 0.8rem;
  align-items: center;
  justify-content: flex-end;
  flex: 1;

  > * {
    height: 3.2rem;
  }
`;

const StyledText = styled.h1<{ toneDown?: boolean }>`
  display: inline-flex;
  font-size: 2.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.titles};
  margin: 0;
  padding: 0;

  ${({ toneDown, theme }) =>
    toneDown &&
    `
    color: ${theme.colors.textsSecondary};
  `}
`;

const BannerWarningText = styled.h2<{ toneDown?: boolean }>`
  display: inline-flex;
  font-size: 2.4rem;
  font-weight: 700;
  text-align: center;
  color: ${({ theme }) => theme.colors.titles};
  margin: 0;
  padding: 0;

  ${({ toneDown, theme }) =>
    toneDown &&
    `
    color: ${theme.colors.textsSecondary};
  `}
`;

const StyledLink = styled(Link)`
  font-size: 2.4rem;
  font-weight: 700;
`;

const StyledNavbar = styled.header`
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  margin-top: 1%;
  margin-bottom: 1%;
  background-color: ${({ theme }) => theme.colors.surface};
  z-index: ${({ theme }) => theme.zindex.navbar};
  max-width: ${({ theme }) => theme.globalMaxWidth};
  padding: ${({ theme }) => theme.card.padding};
  border-radius: ${({ theme }) => theme.globalRadius};

  @media ${device.mobile} {
    ${StyledText} {
      font-size: 1.9rem;
    }
    ${StyledOptionList} {
      width: auto;
    }
  }
`;

const getNetworkIcon = (network: Network) => {
  switch (network) {
    case 'mainnet':
      return EthereumIcon;
    case 'arbitrum':
      return ArbitrumIcon;
    case 'goerli':
      return EthereumIcon;
    default:
      return;
  }
};

interface NavbarProps {
  className?: string;
  title?: string;
  titleLink?: string;
  subTitle?: string;
  walletAddress?: string;
  addressEnsName?: string;
  onWalletClick?: () => void;
  disableWalletSelect?: boolean;
  selectedNetwork: Network;
  networkOptions: Network[];
  onNetworkChange: (network: string) => void;
  disableNetworkChange?: boolean;
  hideDisabledControls?: boolean;
}

export const Navbar = ({
  className,
  title,
  titleLink,
  subTitle,
  walletAddress,
  addressEnsName,
  onWalletClick,
  disableWalletSelect,
  selectedNetwork,
  onNetworkChange,
  disableNetworkChange,
  hideDisabledControls,
}: NavbarProps) => {
  const { isMobile } = useWindowDimensions();
  const { NETWORK_SETTINGS } = getConfig();
  const walletNetwork = useAppSelector(WalletSelectors.selectWalletNetwork);
  const walletNetworkName = useAppSelector(WalletSelectors.selectWalletNetworkName);

  const dropdownSelectedNetwork = {
    value: selectedNetwork,
    label: NETWORK_SETTINGS[selectedNetwork].name,
    Icon: getNetworkIcon(selectedNetwork),
  };

  const dropdownSelectedWalletNetwork = {
    value: walletNetwork,
    label: walletNetworkName,
    Icon: getNetworkIcon(walletNetwork!),
  };

  const secondTitleEnabled = !!subTitle?.length;

  const titleText = secondTitleEnabled ? <>{title}&nbsp;/&nbsp;</> : title;

  return (
    <div>
      <StyledNavbar className={className}>
        {title && (
          <>
            <StyledText toneDown={secondTitleEnabled}>
              {titleLink ? <StyledLink to={titleLink}>{titleText}</StyledLink> : titleText}
            </StyledText>
            {secondTitleEnabled && <StyledText>{subTitle}</StyledText>}
          </>
        )}

        <StyledNavbarActions>
          {!hideDisabledControls && (
            /* turn this into not a list because we only support mainnet right now */
            <StyledOptionList
              //@ts-ignore
              selected={walletNetwork !== undefined ? dropdownSelectedWalletNetwork : dropdownSelectedNetwork}
              setSelected={(option) => onNetworkChange(option.value)}
              options={[]}
              hideIcons={isMobile}
              disabled={disableNetworkChange}
            />
          )}

          <ConnectWalletButton
            address={walletAddress}
            ensName={addressEnsName}
            onClick={() => onWalletClick && onWalletClick()}
            disabled={disableWalletSelect}
          />
        </StyledNavbarActions>
      </StyledNavbar>

      {/* Display warning if not connected to supported network! */}
      {!SUPPORTED_NETWORKS.includes(walletNetwork ?? 'other') && (
        <StyledNavbar>
          {title && (
            <>
              <BannerWarningText toneDown={secondTitleEnabled}>
                Your wallet is connected to an unsupported network.
                <br></br>
                <br></br>
                Please switch to a supported network.
              </BannerWarningText>
              {secondTitleEnabled && <StyledText>{subTitle}</StyledText>}
            </>
          )}
        </StyledNavbar>
      )}
    </div>
  );
};
