import styled from 'styled-components';
import _ from 'lodash';

import { ConnectWalletButton } from '@components/app';
import { OptionList, EthereumIcon, ArbitrumIcon, Link } from '@components/common';
import { WalletSelectors } from '@src/core/store';
import { useAppSelector, useWindowDimensions } from '@hooks';
import { Network } from '@types';
import { device } from '@themes/default';
import { getConfig } from '@config';
import { getConstants } from '@src/config/constants';
import { isGoerli } from '@src/utils';

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
  // text-align: center;
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

const StyledNavbar = styled.header<{ warning?: boolean }>`
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
  ${({ warning, theme }) =>
    !warning &&
    `
    z-index: ${theme.zindex.navbar};
  `}
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
    case 'goerli':
      return EthereumIcon;
    case 'arbitrum':
      return ArbitrumIcon;
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

  const { SUPPORTED_NETWORKS } = getConstants();

  // TODO: goerli is not included in SUPPORTED_NETWORKS from config/constants because doing so causes issues with the Yearn SDK which does not support Goerli test network.
  const SUPPORTED_NETWORK_OPTIONS = SUPPORTED_NETWORKS.concat('goerli').map((network) => {
    return {
      value: network,
      label: NETWORK_SETTINGS[network].name ?? 'other',
    };
  });

  const dropdownSelectedWalletNetwork = {
    value: walletNetwork,
    label: walletNetworkName,
    Icon: getNetworkIcon(walletNetwork!),
  };

  const secondTitleEnabled = !!subTitle?.length;

  const titleText = secondTitleEnabled ? <>{title}&nbsp;/&nbsp;</> : title;
  const isThisGoerli = isGoerli(walletNetwork);

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
              selected={dropdownSelectedWalletNetwork}
              setSelected={(option) => onNetworkChange(option.value)}
              hideIcons={isMobile}
              disabled={disableNetworkChange}
              options={SUPPORTED_NETWORK_OPTIONS}
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
      {/* TODO: Add goerli to SUPPORTED_NETWORKS. Difficult to do because goerli is not supported by Yearn SDK. */}

      {!(SUPPORTED_NETWORKS.includes(walletNetwork ?? 'other') || isThisGoerli) && (
        <StyledNavbar warning={true}>
          {title && (
            <>
              <BannerWarningText toneDown={secondTitleEnabled}>
                Your wallet is connected to an unsupported network.
                <br></br>
                <br></br>
                Please connect to one of the supported networks to use the Debt DAO market.
              </BannerWarningText>
              {secondTitleEnabled && <StyledText>{subTitle}</StyledText>}
            </>
          )}
        </StyledNavbar>
      )}
    </div>
  );
};
