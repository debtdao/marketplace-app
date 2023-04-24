import { Network } from './Blockchain';
import { Theme, Language } from './Settings';

export interface Wallet {
  selectedAddress: string | undefined;
  networkVersion: number | undefined;
  balance: string | undefined;
  name: string | undefined;
  provider: any | undefined;
  isCreated: Promise<boolean> | boolean;
  isConnected: Promise<boolean> | boolean;
  connectedWallet: () => Promise<BlocknativeWalletState | undefined>;
  create: (
    network: Network,
    subscriptions: Subscriptions,
    theme?: Theme,
    language?: Language
  ) => Promise<boolean> | boolean;
  connect: (args?: any) => Promise<boolean>;
  changeTheme?: (theme: Theme) => void;
  changeNetwork?: (network: Network) => Promise<boolean>;
  networkChange?: (id: number) => any;
  addToken?: (tokenAddress: string, tokenSymbol: string, tokenDecimals: number, tokenImage: string) => Promise<boolean>;
}

export interface Subscriptions {
  address?: (address: string) => void;
  network?: (networkId: number) => void;
  balance?: (balance: string) => void;
  wallet?: (wallet: any) => void;
}

// block native integration
// Onboard doesnt export types anymore so manually import

export type BlocknativeAppState = {
  wallets: BlocknativeWalletState[];
  // chains: Chain[]
  // accountCenter: AccountCenter
  // walletModules: WalletModule[]
  // locale: Locale
  // notify: Notify
  // notifications: Notification[]
};

// Onboard doesnt export types anymore so manually import
export type BlocknativeWalletState = {
  label: string;
  icon: string;
  provider: any;
  accounts: BlocknativeAccount[];
  chains: BlocknativeConnectedChain[];
  instance?: unknown;
};

type BlocknativeConnectedChain = {
  namespace: 'evm';
  id: string; // 0x or integer format
};

type BlocknativeAccount = {
  address: string;
  ens: {
    name?: string;
    avatar?: string;
    contentHash?: string;
    getText?: (key: string) => Promise<string | undefined>;
  };
  balance: Record<string, string>; // token symbol -> amount
};
