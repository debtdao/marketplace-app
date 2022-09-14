import { Token } from 'graphql';

import { Address } from './Blockchain';
import { TokenView } from './Token';

export interface BaseCreditLine {
  id: string;
  end: string;
  start: string;
  type?: string;
  status: string;
  borrower: Address;

  principal?: number;
  interest?: number;
}

export interface CreditLinePage extends BaseCreditLine {
  id: string;
  end: string;
  start: string;
  type?: string;
  status: string;

  principal?: number;
  interest?: number;

  borrower: Address;

  // subgraph id -> depsoit/spigot
  credits: { [key: string]: LinePageCreditPosition };
  escrow?: { [key: string]: Escrow };
  spigot?: { [key: string]: Spigot };

  events?: CreditLineEvents[];
}

export interface CreditLine extends BaseCreditLine {
  id: string;
  end: string;
  start: string;
  type?: string;
  status: string;

  principal?: number;
  interest?: number;

  borrower: Address;
  escrow?: { id: Address };
  spigot?: { id: Address };
}

export interface BaseCreditPosition {
  lender: Address;
  principal: number;
  interest: number;
  interestClaimable: string;
  events?: CreditLineEvents[];
}

export interface LinePageCreditPosition extends BaseCreditPosition {
  lender: Address;
  principal: number;
  deposit: number;
  interest: number;
  interestRepaid: number;
  interestAccrued: number;
  events?: CreditLineEvents[];
  token: {
    symbol: string;
    lastPriceUsd: number;
  };
}

type CreditLineEvents = BaseEvent | SetRateEvent;

export interface SetRateEvent {
  timestamp: number;
  drawnRate: string;
  facilityRate: string;
}

export interface Collateral {
  token: Address;
  amount: string;
  value: string;
}

export interface BaseEvent {
  timestamp: number;
  amount?: string;
  value?: string;
  [key: string]: any;
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
  deposits: {
    amount: string;
    enabled: boolean;
    token: BaseToken;
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

type SpigotEvents = BaseEvent | ClaimRevenueEvent;

export interface ClaimRevenueEvent {
  timestamp: number;
  revenueToken: { id: string };
  escrowed: string;
  netIncome: string;
  value: string;
}

export interface BaseToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  lastPriceUSD?: string;
}

type EscrowTypes = 'spigot' | 'escrow';
export interface CollateralEvent {
  type: EscrowTypes;
  timestamp: string;
  amount: string;
  symbol: string;
  value?: number;
}

export interface CreditEvent {
  id: string; // position id
  timestamp: string;
  amount: string;
  symbol: string;
  value?: number;
}
