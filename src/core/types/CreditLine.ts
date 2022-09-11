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

  principal?: string;
  interest?: string;
}

export interface CreditLinePage extends BaseCreditLine {
  id: string;
  end: string;
  start: string;
  type?: string;
  status: string;

  principal?: string;
  interest?: string;

  borrower: Address;
  escrow?: Escrow;
  spigot?: Spigot;

  events?: CreditLineEvents[];
}

export interface CreditLine extends BaseCreditLine {
  id: string;
  end: string;
  start: string;
  type?: string;
  status: string;

  principal?: string;
  interest?: string;

  borrower: Address;
  escrow?: { id: Address };
  spigot?: { id: Address };
}

export interface CreditPosition {
  lender: Address;
  token: Address;
  principal: string;
  interest: string;
  interestClaimable: string;
  events?: CreditLineEvents[];
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
