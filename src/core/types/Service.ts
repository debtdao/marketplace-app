import { BigNumber } from 'ethers';
import { BytesLike } from '@ethersproject/bytes/src.ts';
import { PopulatedTransaction } from '@ethersproject/contracts/src.ts';

import {
  Vault,
  VaultDynamic,
  Token,
  TokenDynamicData,
  Position,
  TransactionResponse,
  Address,
  Integer,
  Wei,
  Balance,
  TransactionOutcome,
  TransactionReceipt,
  VaultsUserSummary,
  VaultUserMetadata,
  GasFees,
  Overrides,
  Network,
  Wallet,
  TokenAllowance,
  SecuredLine,
  CreditPosition,
  GetLineArgs,
  GetLinesArgs,
  GetLinePageArgs,
  GetLineEventsArgs,
  GetLinesResponse,
  GetLinePageResponse,
  GetUserPortfolioArgs,
  SecuredLineWithEvents,
  SupportedOracleTokenResponse,
  GetUserPortfolioResponse,
  GetLineEventsResponse,
  LineEventFragResponse,
  TokenView,
} from '@types';

// *************** USER ***************

export interface UserService {
  getAddressEnsName: (props: GetAddressEnsNameProps) => Promise<string>;
}

export interface GetAddressEnsNameProps {
  address: string;
}

// *************** VAULT ***************
export interface VaultService {
  getSupportedVaults: (props: GetSupportedVaultsProps) => Promise<Vault[]>;
  getVaultsDynamicData: (props: GetVaultsDynamicDataProps) => Promise<VaultDynamic[]>;
  getUserVaultsPositions: (props: GetUserVaultsPositionsProps) => Promise<Position[]>;
  getUserVaultsSummary: (props: GetUserVaultsSummaryProps) => Promise<VaultsUserSummary>;
  getUserVaultsMetadata: (props: GetUserVaultsMetadataProps) => Promise<VaultUserMetadata[]>;
  getExpectedTransactionOutcome: (props: GetExpectedTransactionOutcomeProps) => Promise<TransactionOutcome>;
  signPermit: (props: SignPermitProps) => Promise<string>;
  deposit: (props: DepositProps) => Promise<TransactionResponse>;
  withdraw: (props: WithdrawProps) => Promise<TransactionResponse>;
  approveDeposit: (props: ApproveDepositProps) => Promise<TransactionResponse>;
  approveZapOut: (props: ApproveZapOutProps) => Promise<TransactionResponse>;
  getDepositAllowance: (props: GetDepositAllowanceProps) => Promise<TokenAllowance>;
  getWithdrawAllowance: (props: GetWithdrawAllowanceProps) => Promise<TokenAllowance>;
}

export interface GetSupportedVaultsProps {
  network: Network;
  addresses?: Address[];
}

export interface GetVaultsDynamicDataProps {
  network: Network;
  addresses?: Address[];
}

export interface GetUserVaultsPositionsProps {
  network: Network;
  userAddress: Address;
  vaultAddresses?: string[];
}

export interface GetUserVaultsSummaryProps {
  network: Network;
  userAddress: Address;
}

export interface GetUserVaultsMetadataProps {
  network: Network;
  userAddress: Address;
  vaultsAddresses?: string[];
}

export interface GetExpectedTransactionOutcomeProps {
  network: Network;
  transactionType: 'DEPOSIT' | 'WITHDRAW';
  accountAddress: Address;
  sourceTokenAddress: Address;
  sourceTokenAmount: Wei;
  targetTokenAddress: Address;
  slippageTolerance?: number;
}

export interface SignPermitProps {
  network: Network;
  accountAddress: Address;
  vaultAddress: Address;
  spenderAddress: Address;
  amount: Wei;
  deadline: string;
}

export interface DepositProps {
  network: Network;
  accountAddress: Address;
  tokenAddress: Address;
  vaultAddress: Address;
  amount: Wei;
  slippageTolerance?: number;
}

export interface WithdrawProps {
  network: Network;
  accountAddress: Address;
  tokenAddress: Address;
  vaultAddress: Address;
  amountOfShares: Wei;
  slippageTolerance?: number;
  signature?: string;
}

export interface WithdrawCreditProps {
  id: string;
  amount: BigNumber;
}

export interface MigrateProps {
  network: Network;
  accountAddress: Address;
  vaultFromAddress: Address;
  vaultToAddress: Address;
  migrationContractAddress: Address;
}

// *************** LINE ***************
export enum STATUS {
  UNINITIALIZED,
  ACTIVE,
  LIQUIDATABLE,
  REPAID,
  INSOLVENT,
}

export interface InterestRateCreditService {
  accrueInterest: (props: InterestRateAccrueInterestProps) => Promise<BigNumber>;
}

export interface CreditLineService {
  getLine: (props: GetLineArgs) => Promise<SecuredLine | undefined>;
  getLines: (props: GetLinesArgs) => Promise<GetLinesResponse[] | undefined>;
  getLineEvents: (props: GetLineEventsArgs) => Promise<GetLineEventsResponse | undefined>;
  getLinePage: (props: GetLinePageArgs) => Promise<GetLinePageResponse | undefined>;
  getUserLinePositions: (...args: any) => Promise<any | undefined>;
  getUserPortfolio: (props: GetUserPortfolioArgs) => Promise<GetUserPortfolioResponse | undefined>;
  getExpectedTransactionOutcome: (...args: any) => Promise<any | undefined>;

  // Repay from wallet
  depositAndRepay: (
    props: DepositAndRepayProps
    //interest: InterestRateCreditService
  ) => Promise<TransactionResponse | PopulatedTransaction>;
  depositAndClose: (props: DepositAndCloseProps) => Promise<TransactionResponse | PopulatedTransaction>;
  close: (props: CloseProps) => Promise<TransactionResponse | PopulatedTransaction>;

  // Repay with revenue collateral
  claimAndTrade(props: ClaimAndTradeProps): Promise<TransactionResponse | PopulatedTransaction>;
  claimAndRepay(props: ClaimAndRepayProps): Promise<TransactionResponse | PopulatedTransaction>;
  useAndRepay(props: UseAndRepayProps): Promise<TransactionResponse | PopulatedTransaction>;

  addCredit: (props: AddCreditProps) => Promise<TransactionResponse | PopulatedTransaction>;
  borrow: (props: BorrowCreditProps) => Promise<TransactionResponse | PopulatedTransaction>;
  withdraw: (props: WithdrawLineProps) => Promise<TransactionResponse | PopulatedTransaction>;
  revokeConsent: (props: RevokeConsentProps) => Promise<TransactionResponse | PopulatedTransaction>;
  setRates: (props: SetRatesProps) => Promise<TransactionResponse | PopulatedTransaction>;
  // increaseCredit: (props: IncreaseCreditProps) => Promise<TransactionResponse | PopulatedTransaction>;

  // helpers
  getFirstID: (contractAddress: string) => Promise<BytesLike>;
  getInterestAccrued: (contractAddress: string, id: BytesLike) => Promise<BigNumber>;
  getCredit: (contractAddress: string, id: BytesLike) => Promise<CreditPosition>;
  getLenderByCreditID: (contractAddress: string, id: BytesLike) => Promise<Address>;
  getInterestRateContract: (contractAddress: string) => Promise<Address>;
  arbiter: (contractAddress: string) => Promise<Address>;
  borrower: (contractAddress: string) => Promise<Address>;
  isActive: (contractAddress: string) => Promise<boolean>;
  isBorrowing: (contractAddress: string) => Promise<boolean>;
  isBorrower: (contractAddress: string) => Promise<boolean>;
  isLender: (contractAddress: string, id: BytesLike) => Promise<boolean>;

  isMutualConsent: (
    contractAddress: string,
    trxData: string | undefined,
    signerOne: Address,
    signerTwo: Address
  ) => Promise<boolean>;
  isSignerBorrowerOrLender: (contractAddress: Address, id: BytesLike) => Promise<boolean>;

  // utils
  approveDeposit: (props: ApproveLineDepositProps) => Promise<any | undefined>;
  // approveZapOut: (...args: any) => Promise<any | undefined>;
  // signPermit: (...args: any) => Promise<any | undefined>;
  getDepositAllowance: (props: GetLineDepositAllowanceProps) => Promise<any | undefined>;
  getWithdrawAllowance: (props: GetLineWithdrawAllowanceProps) => Promise<any | undefined>;
}

export interface AddCreditProps {
  lineAddress: string;
  token: TokenView;
  drate: BigNumber;
  frate: BigNumber;
  amount: BigNumber;
  lender: Address;
  network: Network;
  dryRun?: boolean;
}

export interface BorrowCreditProps {
  line: string;
  positionId: string;
  amount: BigNumber;
  network: Network;
  dryRun?: boolean;
}
export interface CloseProps {
  lineAddress: string;
  id: string;
  network: Network;
}
export interface WithdrawLineProps {
  dryRun?: boolean;
  lineAddress: string;
  id: string;
  network: Network;
  amount: BigNumber;
}

// TODO: add back when implementing RevokeConsent.
export interface RevokeConsentProps {
  lineAddress: string;
  id: string;
  network: Network;
  msgData: string;
}

export interface SetRatesProps {
  dryRun?: boolean;
  lineAddress: string;
  id: string;
  frate: string;
  drate: string;
  network: Network;
}
export interface IncreaseCreditProps {
  lineAddress: string;
  id: string;
  amount: BigNumber;
  network: Network;
}
export interface DepositAndRepayProps {
  lineAddress: string;
  amount: BigNumber;
  network: Network;
}
export interface DepositAndCloseProps {
  lineAddress: string;
  network: Network;
}
export interface ClaimAndTradeProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: string;
  claimToken: Address;
  zeroExTradeData: BytesLike;
  network: Network;
  dryRun?: boolean;
}
export interface ClaimAndRepayProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: string;
  claimToken: Address;
  zeroExTradeData: BytesLike;
  network: Network;
  dryRun?: boolean;
}
export interface UseAndRepayProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: string;
  amount: BigNumber;
  network: Network;
  dryRun?: boolean;
}

export interface ApproveLineDepositProps {
  lineAddress: string;
  tokenAddress: string;
  accountAddress: string;
  amount: BigNumber;
}

export interface GetLineDepositAllowanceProps {
  network: Network;
  lineAddress: string;
  tokenAddress: string;
  accountAddress: string;
}

export interface GetLineWithdrawAllowanceProps {
  network: Network;
  lineAddress: string;
  accountAddress: string;
  id: string;
}

export interface InterestRateAccrueInterestProps {
  contractAddress: Address;
  id: BytesLike;
  drawnBalance: BigNumber;
  facilityBalance: BigNumber;
}

export interface GetLineProps {
  id: string;
}

export interface GetLinesProps {
  first: number;
  status: 'ACTIVE' | 'REPAID' | 'LIQUIDATABLE' | 'UNINITIALIZED' | 'INSOLVENT';
  orderBy: string;
  orderDirection: 'asc' | 'desc';
  currentTime: number;
}

export interface GetUserLinesProps {
  walletAddress: Address;
}

export interface GetLineEventsProps {
  id: string;
}

export interface GetLinePageProps {
  id: string;
}

export interface GetUserLineProps {
  id: string;
}

export interface GetUserPortfolioProps {
  user: string;
}

// Colalteral Service Function Props
export interface EnableCollateralAssetProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: Address;
  escrowAddress: Address;
  token: TokenView;
  network: Network;
  dryRun?: boolean;
}

export interface AddCollateralProps {
  // userPositionMetadata: UserPositionMetadata;
  escrowAddress: Address;
  token: Address;
  amount: BigNumber;
  network: Network;
  dryRun?: boolean;
}

export interface ClaimRevenueProps {
  spigotAddress: Address;
  revenueContract: Address;
  token: Address;
  claimData: BytesLike;
  network: Network;
  dryRun?: boolean;
}

export interface TradeableProps {
  tokenAddress: Address;
  network: Network;
  lineAddress: Address;
  spigotAddress: Address;
}

export interface LiquidateEscrowAssetProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: Address;
  token: Address;
  amount: BigNumber;
  to: Address;
  network: Network;
  dryRun?: boolean;
}

export interface ReleaseCollateraltProps {
  // userPositionMetadata: UserPositionMetadata;
  escrowAddress: Address;
  token: Address;
  amount: BigNumber;
  to: Address;
  network: Network;
  dryRun?: boolean;
}

export interface SweepSpigotProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: string;
  to: Address;
  token: Address;
  amount: BigNumber;
  status: string;
  borrower: Address;
  arbiter: Address;
  network: Network;
  dryRun?: boolean;
}

export interface ClaimOperatorTokensProps {
  spigotAddress: Address;
  token: Address;
  network: Network;
  dryRun?: boolean;
}

export interface ISpigotSetting {
  ownerSplit: string; // x/100 % to Owner, rest to Treasury
  claimFunction: string; // function signature on contract to call and claim revenue
  transferOwnerFunction: string; // function signature on conract to call and transfer ownership
}

export interface AddSpigotProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: string;
  spigotAddress: string; // dont strictly need data atm but good for double checking things
  revenueContract: Address;
  setting: ISpigotSetting;
  network: Network;
  dryRun?: boolean;
}

export interface ReleaseSpigotProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: string;
  status: string;
  to: Address;
  network: Network;
  dryRun?: boolean;
}

export interface UpdateSpigotOwnerSplitProps {
  // userPositionMetadata: UserPositionMetadata;
  lineAddress: string;
  revenueContract: string;
  network: Network;
  dryRun?: boolean;
}

export interface CollateralService {
  // collateral maintenance
  // escrow
  enableCollateral(props: EnableCollateralAssetProps): Promise<TransactionResponse | PopulatedTransaction>;
  addCollateral(props: AddCollateralProps): Promise<TransactionResponse | PopulatedTransaction>;
  releaseCollateral(props: ReleaseCollateraltProps): Promise<TransactionResponse | PopulatedTransaction>;
  // spigot
  claimRevenue(props: ClaimRevenueProps): Promise<TransactionResponse | PopulatedTransaction>;
  updateOwnerSplit(props: UpdateSpigotOwnerSplitProps): Promise<TransactionResponse | PopulatedTransaction>;
  addSpigot(props: AddSpigotProps): Promise<TransactionResponse | PopulatedTransaction>;
  claimOperatorTokens(props: ClaimOperatorTokensProps): Promise<TransactionResponse | PopulatedTransaction>;

  // liquidate collateral
  // Escrow assets
  liquidate: (props: LiquidateEscrowAssetProps) => Promise<TransactionResponse | PopulatedTransaction>;
  // unused spigot revenue
  sweep(props: SweepSpigotProps): Promise<TransactionResponse | PopulatedTransaction>;

  // spigot itself
  releaseSpigot(props: ReleaseSpigotProps): Promise<TransactionResponse | PopulatedTransaction>;

  // view functions
  isSpigotOwner(spigotAddress?: string, lineAddress?: string): Promise<boolean>;
  defaultSplit(lineAddress: string): Promise<BigNumber>;
  maxSplit(): BigNumber; // always 100
  getTradeableTokens(lineAddress: string, tokenAddress: string): Promise<BigNumber>;
  getOwnerTokens(spigotAddress: string, tokenAddress: string): Promise<BigNumber>;
  getOperatorTokens(spigotAddress: string, tokenAddress: string): Promise<BigNumber>;
}

export interface OnchainMetaDataService {
  getContractABI(address: String, network: number): Promise<any | undefined>;
  getAddressEnsName(address: string): Promise<any | undefined>;
}

export interface OnchainMetaDataServiceProps {
  address: string;
}

// *************** TOKEN ***************
export interface TokenService {
  getSupportedTokens: (props: GetSupportedTokensProps) => Promise<Token[]>;
  getSupportedOracleTokens: () => Promise<SupportedOracleTokenResponse | undefined>;
  getTokensDynamicData: (props: GetTokensDynamicDataProps) => Promise<TokenDynamicData[]>;
  getUserTokensData: (props: GetUserTokensDataProps) => Promise<Balance[]>;
  getTokenAllowance: (props: GetTokenAllowanceProps) => Promise<Integer>;
  approve: (props: ApproveProps) => Promise<TransactionResponse>;
}

export interface GetSupportedTokensProps {
  network: Network;
}

// TODO: use wallet state for props in getSupportedOracleTokens()
// to determine which subgraph to query from based on wallet's network
// export interface GetSupportedOracleTokensProps {
//   wallet: Wallet;
// }

export interface GetTokensDynamicDataProps {
  network: Network;
  addresses: string[];
}

export interface GetUserTokensDataProps {
  network: Network;
  accountAddress: string;
  tokenAddresses?: string[];
}

export interface GetTokenAllowanceProps {
  network: Network;
  accountAddress: string;
  tokenAddress: string;
  spenderAddress: string;
}

export interface ApproveDepositProps {
  network: Network;
  accountAddress: Address;
  tokenAddress: Address;
  amount: Wei;
  vaultAddress: string;
}

export interface ApproveZapOutProps {
  network: Network;
  amount: Wei;
  accountAddress: string;
  tokenAddress: string;
  vaultAddress: string;
}

export interface GetDepositAllowanceProps {
  network: Network;
  accountAddress: string;
  tokenAddress: string;
  vaultAddress: string;
}

export interface GetWithdrawAllowanceProps {
  network: Network;
  accountAddress: string;
  tokenAddress: string;
  vaultAddress: string;
}

export interface ApproveProps {
  network: Network;
  accountAddress: Address;
  tokenAddress: Address;
  spenderAddress: Address;
  amount: string;
}

// *************** TRANSACTION ***************

export interface TransactionService {
  execute: (props: ExecuteTransactionProps) => Promise<TransactionResponse>;

  populateTransaction(props: ExecuteTransactionProps): Promise<PopulatedTransaction>;

  handleTransaction: (props: HandleTransactionProps) => Promise<TransactionReceipt>;
}

export interface ExecuteTransactionProps {
  network: Network;
  args?: Array<any>;
  overrides?: Overrides;
  methodName: string;
  abi: any;
  contractAddress: Address;
}

export interface HandleTransactionProps {
  tx: TransactionResponse;
  network: Network;
  useExternalService?: boolean;
  renderNotification?: boolean;
}

// *************** GAS ***************

export interface GasService {
  getGasFees: () => Promise<GasFees>;
}

// *************** SUBSCRIPTION ***************
export interface SubscriptionProps {
  module: string;
  event: string;
  action: (...args: any[]) => void;
}

export interface SubscriptionService {
  subscribe: (props: SubscriptionProps) => void;
  unsubscribe: (props: SubscriptionProps) => void;
}

export interface DeploySpigotProps {
  factory: Address;
  owner: Address;
  borrower: Address;
  operator: Address;
  network: Network;
  dryRun?: boolean;
}

export interface DeployEscrowProps {
  factory: Address;
  minCRatio: BigNumber;
  oracle: Address;
  owner: Address;
  borrower: Address;
  network: Network;
  dryRun?: boolean;
}

export interface DeploySecuredLineProps {
  factory: Address;
  borrower: Address;
  ttl: BigNumber;
  network: Network;
  dryRun?: boolean;
}

export interface DeploySecuredLineWithConfigProps {
  factory: Address;
  borrower: Address;
  ttl: BigNumber;
  revenueSplit: BigNumber;
  cratio: BigNumber;
  network: Network;
  dryRun?: boolean;
}

export interface RolloverSecuredLineProps {
  factory: Address;
  oldLine: Address;
  borrower: Address;
  ttl: BigNumber;
  network: Network;
  dryRun?: boolean;
}

export interface LineFactoryService {
  deploySpigot(props: DeploySpigotProps): Promise<TransactionResponse | PopulatedTransaction>;

  deployEscrow(props: DeployEscrowProps): Promise<TransactionResponse | PopulatedTransaction>;

  deploySecuredLine(props: DeploySecuredLineProps): Promise<TransactionResponse | PopulatedTransaction>;

  deploySecuredLineWtihConfig(
    props: DeploySecuredLineWithConfigProps
  ): Promise<[transaction: TransactionResponse | PopulatedTransaction, lineAddress: string]>;

  rolloverSecuredLine(props: RolloverSecuredLineProps): Promise<TransactionResponse | PopulatedTransaction>;

  // view functions
  arbiter(network: string): Promise<string>;
}
