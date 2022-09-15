import {
  Wallet,
  Config,
  Web3Provider,
  UserService,
  CreditLineService,
  VaultService,
  TokenService,
  GasService,
  TransactionService,
  SubscriptionService,
  SpigotedLineService,
  EscrowService,
  YearnSdk,
} from '@types';

export interface DIContainer {
  context: ContextContainer;
  services: ServiceContainer;
  config: ConfigContainer;
}

export interface ContextContainer {
  wallet: Wallet;
  web3Provider: Web3Provider;
  yearnSdk: YearnSdk;
}
export interface ServiceContainer {
  userService: UserService;
  vaultService: VaultService;
  tokenService: TokenService;
  creditLineService: CreditLineService;
  gasService: GasService;
  transactionService: TransactionService;
  spigotedLineService: SpigotedLineService;
  escrowService: EscrowService;
}

export interface ConfigContainer extends Config {}
