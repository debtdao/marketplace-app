import { Token } from 'graphql';

import { Address } from './Blockchain';
import { TokenView } from './Token';
import { Status } from './Status';

export interface BaseCreditLine {
  id: Address;
  type?: string;
  status: string;
  borrower: Address;

  principal?: number;
}

export interface CreditLine extends BaseCreditLine {
  id: Address;
  end: string;
  start: string;
  type?: string;
  status: string;

  principal?: number;

  borrower: Address;
  escrow?: { id: Address };
  spigot?: { id: Address };
}

export interface CreditLinePage extends BaseCreditLine {
  id: Address;
  end: string;
  start: string;
  type?: string;
  status: string;
  borrower: Address;

  // real-time aggregate usd value across all credits
  principal?: number;
  interest?: number;
  // id, symbol, APY (4 decimals
  highestApy: [string, string, number];
  // aggregated revenue in USD by token across all spigots
  tokenRevenue: { [key: string]: number };

  // subgraph id -> depsoit/spigot
  credits: { [key: string]: LinePageCreditPosition };
  escrow?: { [key: string]: Escrow };
  spigot?: {
    revenue: { [key: string]: number };
    spigots: { [key: string]: Spigot };
  };

  collateralEvents: CollateralEvent[];
  creditEvents: CreditLineEvents[];
}

export interface BaseCreditPosition {
  id: string;
  lender: Address;
  principal: number;
  interestAccrued: number;
  interestRepaid: number;
  events?: CreditLineEvents[];
}

export interface LinePageCreditPosition extends BaseCreditPosition {
  id: string;
  lender: Address;
  deposit: number;
  principal: number;
  interestAccrued: number;
  interestRepaid: number;
  drawnRate: number;
  token: {
    symbol: string;
    lastPriceUSD?: number; // Can be live data not from subgraph
  };
  events?: CreditLineEvents[];
}

export interface PositionSummary {
  id: string;
  borrower: Address;
  lender: Address;
  line: Address;
  token: Address;
  deposit: string;
  principal: string;
  drate: number;
  frate: number;
}

// bare minimum to display about a user on a position
export interface LineUserMetadata {
  token: Address;
  isBorrower: boolean; // borrower/lender
  amount: number; // principal/deposit
  available: number; // borrowerable/withdrawable
}

// Collateral Module Types
export interface Collateral {
  token: Address;
  amount: string;
  value: string;
}

export interface BaseEscrow {
  cratio: string;
  minCRatio: string;
  collateralValue: string;
}

export interface Escrow extends BaseEscrow {
  cratio: string;
  minCRatio: string;
  collateralValue: string;
  deposits?: {
    amount: string;
    enabled: boolean;
    token: BaseToken;
  }[];
  events?: {
    __typename: string;
    timestamp: number;
    amount?: number;
    value?: number;
  }[];
}

export interface Spigot {
  startTime: string;
  active: boolean;
  token: BaseToken;
  spigots?: RevenueContract[];
}

export interface LinePageSpigot {
  startTime: string;
  active: boolean;
  // aggregate token revenue accross all spigots
  revenue: { [key: string]: number };
  spigots?: RevenueContract[];
}

export interface RevenueContract {
  active: boolean;
  contract: Address;
  startTime: string;
  ownerSplit: number;
  token: BaseToken;

  events?: SpigotEvents[];
}

export interface BaseToken {
  id: Address;
  name: string;
  symbol: string;
  decimals: number;
  lastPriceUSD?: string;
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
export interface EventWithValue {
  __typename?: string;
  timestamp: number;
  amount?: string;
  symbol: string;
  value?: number;
  [key: string]: any;
}

// Credit Events
export interface CreditEvent extends EventWithValue {
  __typename: string;
  id: string; // position id
  timestamp: number;
  amount: string;
  symbol: string;
  value?: number;
}

export interface SetRateEvent {
  __typename: string;
  id: string; // position id
  timestamp: number;
  drawnRate: string;
  facilityRate: string;
}

export type CreditLineEvents = CreditEvent | SetRateEvent;

// Collateral Events
export interface CollateralEvent extends EventWithValue {
  type: ModuleNames;
  timestamp: number;
  amount: string;
  symbol: string;
  value?: number;
}

// Spigot Events
type SpigotEvents = EventWithValue | ClaimRevenueEvent;

export interface ClaimRevenueEvent {
  timestamp: number;
  revenueToken: { id: string };
  escrowed: string;
  netIncome: string;
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
  getUserLinePositions: Status;
  linesActionsStatusMap: { [lineAddress: Address]: LineActionsStatusMap };
}
