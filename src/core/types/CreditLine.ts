import { Address } from './Blockchain';
import { Status } from './Status';
import { TokenView } from './Token';

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

// Individual lender positoin status types
type ProposedStatus = 'PROPOSED';
export const PROPOSED_STATUS: ProposedStatus = 'PROPOSED';
type OpenedStatus = 'OPEN';
export const OPENED_STATUS: OpenedStatus = 'OPEN';
type ClosedStatus = 'CLOSED';
export const CLOSED_STATUS: ClosedStatus = 'CLOSED';

export type PositionStatusTypes = ProposedStatus | OpenedStatus | ClosedStatus;

export interface LineOfCredit {
  id: Address;
  borrower: string;
  arbiter: string;
  status: LineStatusTypes;
  start: number;
  end: number;
  // display data of aggregate usd values accross all positions at current time
  principal: string;
  deposit: string;
  interest: string;
  // lifetime stats
  defaultSplit: string;
  totalInterestRepaid: string;
  // id, symbol, APY (4 decimals)
  highestApy: [string, string, string];

  // metadata to pull in additional data from state
  spigotId: string;
  escrowId: string;
  positionIds?: string[]; // referential ids stored in redux state
}

export type PositionMap = { [id: string]: CreditPosition };

export type LineCollateral = {
  // real-time aggregate usd value across all credits
  escrow?: AggregatedEscrow;
  spigot?: AggregatedSpigot;
};

export interface SecuredLine extends LineOfCredit, LineCollateral {
  positionIds?: string[]; // referential ids stored in redux state
  positions?: PositionMap;
}

export interface Item extends SecuredLine {
  header?: string;
  icon: string;
  info: string;
  infoDetail?: string;
  action?: string;
  onAction?: () => void;
}
// data that isnt included in SecuredLine that we need to fetch for full SecuredLineWithEvents dattype
// gets merged into existing SecuredLine to form SecuredLineWithEvents
export interface LineEvents {
  collateralEvents: CollateralEvent[];
  creditEvents: CreditEvent[];
}

export interface SecuredLineWithEvents extends SecuredLine, LineEvents {}

export interface Proposal {
  id: string;
  proposedAt: number;
  revokedAt: number;
  acceptedAt: number;
  endedAt: number;
  maker: string;
  taker: string;
  mutualConsentFunc: string;
  msgData: string;
  args: string[];
}

export interface CreditPosition {
  id: string;
  line: string;
  status: PositionStatusTypes;
  lender: string;
  token: TokenView;
  deposit: string;
  principal: string;
  interestAccrued: string;
  interestRepaid: string;
  totalInterestRepaid: string;
  // borrower: Address;
  dRate: string;
  fRate: string;
  proposal: Proposal[];
}

// bare minimum to display about a user on a position

type LenderRole = 'lender';
export const LENDER_POSITION_ROLE: LenderRole = 'lender';
type BorrowerRole = 'borrower';
export const BORROWER_POSITION_ROLE: BorrowerRole = 'borrower';
type ArbiterRole = 'arbiter';
export const ARBITER_POSITION_ROLE: ArbiterRole = 'arbiter';
type PositionRole = LenderRole | BorrowerRole | ArbiterRole;

type CollateralTypeAsset = 'asset';
export const COLLATERAL_TYPE_ASSET: CollateralTypeAsset = 'asset';
type CollateralTypeRevenue = 'revenue';
export const COLLATERAL_TYPE_REVENUE: CollateralTypeRevenue = 'revenue';

export type LinesByRole = { borrowing: Address[]; arbiting: Address[] };

export type CollateralTypes = CollateralTypeAsset | CollateralTypeRevenue | undefined;

export interface UserPositionMetadata {
  role: PositionRole; // borrower/lender/arbiter
  amount: string; // principal/deposit/collateral
  available: string; // borrowable/withdrawable/liquidatable
}

export interface UserPositionSummary extends CreditPosition, UserPositionMetadata {}

// Collateral Module Types
export interface BaseCollateralModule {
  type: CollateralTypes;
  line: string;
}

export interface Collateral {
  type: CollateralTypes;
  token: TokenView;
  amount: string;
  value: string;
}

export interface BaseEscrow extends BaseCollateralModule {
  id: Address;
  cratio: string;
  minCRatio: number;
  collateralValue: string;
}

export interface EscrowDeposit extends Collateral {
  type: CollateralTypeAsset;
  token: TokenView;
  amount: string;
  value: string;
  enabled: boolean;
  displayIcon?: string; // url to token icon
  events?: CollateralEvent[];
}

export interface EscrowDepositMap {
  [token: string]: EscrowDeposit;
}

export interface SpigotRevenueContractMap {
  [address: string]: SpigotRevenueContract;
}

export interface AggregatedEscrow extends BaseEscrow {
  id: Address;
  cratio: string;
  minCRatio: number;
  collateralValue: string;
  type: CollateralTypes;
  line: string;
  events?: CollateralEvent[];
  deposits?: EscrowDepositMap;
}

export interface RevenueSummary extends Collateral {
  type: CollateralTypeRevenue;
  token: TokenView;
  amount: string;
  value: string;
  timeOfFirstIncome: number;
  timeOfLastIncome: number;
}

export interface RevenueSummaryMap {
  [key: string]: RevenueSummary;
}
export interface AggregatedSpigot extends BaseCollateralModule {
  id: Address;
  revenueValue: string;
  // aggregated revenue in USD by token across all spigots
  revenueSummary: RevenueSummaryMap;
  events?: CollateralEvent[];
  spigots?: { [address: string]: SpigotRevenueContract };
}

export interface MarketLines {
  [key: string]: SecuredLine[];
}

export interface MarketPageData {
  linesData: MarketLines;
  allBorrowers: string[];
}

export type CollateralModule = AggregatedEscrow | AggregatedSpigot;
export type CollateralMap = { [address: string]: CollateralModule };
export type ReservesMap = {
  [address: string]: { [address: string]: { operatorTokens: string; ownerTokens: string; unusedTokens: string } };
};

export interface SpigotRevenueContract extends Collateral {
  id: Address;
  type: CollateralTypeRevenue;
  active: boolean;
  contract: Address;
  claimFunc: string;
  transferFunc: string;
  startTime: number;
  ownerSplit: number;
  totalVolumeUsd: string;
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
  amount?: string;
  value?: string;
  valueNow?: string;
  [key: string]: any;
}

// Credit Events
export interface CreditEvent extends EventWithValue {
  __typename: string;
  id: string; // position id
  token?: string;
  timestamp: number;
  amount: string;
  valueAtTime?: string;
  valueNow?: string;
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
  type: CollateralTypes;
  id: Address; // token earned as revenue or used as collateral
  timestamp: number;
  amount: string;
  value?: string;
}

// Spigot Events
type SpigotEvents = ClaimRevenueEvent;

export interface ClaimRevenueEvent extends CollateralEvent {
  revenueToken: TokenView;
  amount: string;
  value: string;
}

// Redux State
export interface LineActionsStatusMap {
  get: Status;
  approve: Status;
  deposit: Status;
  withdraw: Status;
}

export interface UserLineMetadataStatusMap {
  getUserPortfolio: Status;
  linesActionsStatusMap: { [lineAddress: string]: LineActionsStatusMap };
}
