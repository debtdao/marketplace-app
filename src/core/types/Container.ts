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
  CollateralService,
  LineFactoryService,
  InterestRateCreditService,
  YearnSdk,
  OnChainMetadataService
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
  collateralService: CollateralService;
  interestRateCreditService: InterestRateCreditService;
  lineFactoryService: LineFactoryService;
  onChainMetaDataService: OnChainMetadataService;

}

export interface ConfigContainer extends Config {}
