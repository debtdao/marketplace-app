import { Address } from './Blockchain';
import { Status } from './Status';

type UninitializedStatus = 'uninitialized';
export const UNINITIALIZED_STATUS: UninitializedStatus = 'uninitialized';
type ActiveStatus = 'active';
export const ACTIVE_STATUS: ActiveStatus = 'active';
type LiquidatableStatus = 'liquidatable';
export const LIQUIDATABLE_STATUS: LiquidatableStatus = 'liquidatable';
type RepaidStatus = 'repaid';
export const REPAID_STATUS: RepaidStatus = 'repaid';
type InsolventStatus = 'insolvent';
export const INSOLVENT_STATUS: InsolventStatus = 'insolvent';
type NoStatus = 'no status';
export const NO_STATUS: NoStatus = 'no status';

export type LineStatusTypes =
  | UninitializedStatus
  | ActiveStatus
  | LiquidatableStatus
  | RepaidStatus
  | InsolventStatus
  | NoStatus;

export interface BaseCreditLine {
  id: Address;
  type?: string;
  start: number;
  end: number;
  status: LineStatusTypes;
  borrower: Address;
  credits?: { [key: string]: BaseCreditPosition };
  escrow?: { id: Address };
  spigot?: { id: Address };
}

export interface AggregatedCreditLine extends BaseCreditLine {
  // real-time aggregate usd value across all credits
  principal: string; // | Promise<string>;
  deposit: string; // | Promise<string>;
  // id, symbol, APY (4 decimals)
  highestApy: [string, string, string];

  credits?: { [key: string]: BaseCreditPosition };

  escrow?: AggregatedEscrow;
  spigot?: AggregatedSpigot;
}

export interface CreditLinePage extends AggregatedCreditLine {
  // total value of asssets repaid *AT TIME OF REPAYMENT*
  interest: string; // | Promise<string>;
  totalInterestRepaid: string; // | Promise<string>;

  credits?: { [key: string]: LinePageCreditPosition };

  collateralEvents: CollateralEvent[];
  creditEvents: CreditEvent[];
}

// data that isnt included in AggregatedCreditLine that we need to fetch for full CreditLinePage dattype
// gets merged into existing AggregatedCredit to form LinePageData
export interface CreditLinePageAuxData {
  credits: {
    [id: string]: {
      dRate: string;
      token: Address;
    };
  }[];
  collateralEvents: CollateralEvent[];
  creditEvents: CreditEvent[];
}

// TODO consolidate Credit and BaseCreditPosition and resolve type conflicts across codebase
export interface BaseCreditPosition {
  id: string;
  lender: Address;
  token: Address;
  principal: string;
  interestAccrued: string;
  interestRepaid: string;
}

export interface Credit {
  deposit: string;
  principal: string;
  interestAccrued: string;
  interestRepaid: string;
  decimals: string;
  token: Address;
  lender: Address;
}

export interface LinePageCreditPosition extends BaseCreditPosition {
  id: string;
  lender: Address;
  deposit: string;
  principal: string;
  interestAccrued: string;
  interestRepaid: string;
  totalInterestRepaid: string;
  dRate: string;
  token: Address;
  // events?: CreditEvent[];
}

// bare minimum to display about a user on a position

type LenderRole = 'lender';
export const LENDER_POSITION_ROLE: LenderRole = 'lender';
type BorrowerRole = 'borrower';
export const BORROWER_POSITION_ROLE: BorrowerRole = 'borrower';
type ArbiterRole = 'arbiter';
export const ARBITER_POSITION_ROLE: ArbiterRole = 'arbiter';
type PositionRole = LenderRole | BorrowerRole | ArbiterRole;

export interface UserPositionMetadata {
  role: PositionRole; // borrower/lender/arbiter
  amount: string; // principal/deposit/collateral
  available: string; // borrowable/withdrawable/liquidatable
}

export interface PositionSummary {
  id: string;
  borrower: Address;
  lender: Address;
  token: Address;
  line: Address;
  deposit: string;
  principal: string;
  drate: string;
  frate: string;
}

export interface UserPositionSummary extends PositionSummary, UserPositionMetadata {}

// Collateral Module Types
export interface Collateral {
  token: Address;
  amount: string;
  value: string;
}

export interface BaseEscrow {
  id: Address;
  cratio: string;
  minCRatio: string;
  collateralValue: string;
}

export interface AggregatedEscrow extends BaseEscrow {
  id: Address;
  cratio: string;
  minCRatio: string;
  collateralValue: string;
  deposits?: {
    [token: string]: {
      amount: string;
      enabled: boolean;
      token: Address;
    };
  };
}

export interface AggregatedSpigot {
  id: Address;
  // aggregated revenue in USD by token across all spigots
  tokenRevenue: { [key: string]: string }; // TODO:  tuple it (revenue, totalTime) 2023Q2
}

export interface LinePageSpigot extends AggregatedSpigot {
  spigots?: { [address: string]: RevenueContract };
}

export interface RevenueContract {
  active: boolean;
  contract: Address;
  startTime: number;
  ownerSplit: number;
  token: Address;

  events?: SpigotEvents[];
}

type SPIGOT_NAME = 'spigot';
export const SPIGOT_MODULE_NAME: SPIGOT_NAME = 'spigot';
type ESCROW_NAME = 'escrow';
export const ESCROW_MODULE_NAME: ESCROW_NAME = 'escrow';
type CREDIT_NAME = 'credit';
export const CREDIT_MODULE_NAME: CREDIT_NAME = 'credit';

export type ModuleNames = SPIGOT_NAME | CREDIT_NAME | ESCROW_NAME;

//  Events Types

// Common

/**
 *
 *
 * @export
 * @typedef {Object} EventWithValue
 * @interface EventWithValue
 * @property timestamp - unix (seconds) time that event happened at
 * @property value     - value of total amount at time of event
 * @property valueNow  - value of total amount of tokens at present time
 */
export interface EventWithValue {
  __typename?: string;
  timestamp: number;
  amount?: number;
  value?: number;
  valueNow?: number;
  [key: string]: any;
}

// Credit Events
export interface CreditEvent extends EventWithValue {
  __typename: string;
  id: string;
  positionId: string; // position id
  token?: string;
  timestamp: number;
  amount: number;
  valueAtTime?: number;
  valueNow?: number;
}

export interface SetRateEvent {
  __typename: string;
  id: string; // position id
  timestamp: number;
  dRate: number;
  fRate: number;
}

// Collateral Events
export interface CollateralEvent extends EventWithValue {
  type: ModuleNames;
  id: Address; // token earned as revenue or used as collateral
  timestamp: number;
  amount: number;
  value?: number;
}

// Spigot Events
type SpigotEvents = EventWithValue | ClaimRevenueEvent;

export interface ClaimRevenueEvent {
  timestamp: number;
  revenueToken: { id: string };
  escrowed: number;
  netIncome: number;
  value: number;
}

// Redux State
export interface LineActionsStatusMap {
  get: Status;
  approve: Status;
  deposit: Status;
  withdraw: Status;
}

export interface UserLineMetadataStatusMap {
  getUserLinePositions: Status;
  linesActionsStatusMap: { [lineAddress: string]: LineActionsStatusMap };
}

// Transaction data

export interface DeploySecuredLineTxData {
  oracle: Address;
  arbiter: Address;
  factoryAddress: Address;
  swapTarget: Address;
  borrower: Address;
  ttl: number;
}
