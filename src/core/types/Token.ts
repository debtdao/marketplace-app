import { Address, Network } from './Blockchain';
export interface UserTokenData {
  address: string;
  balance: string;
  balanceUsdc: string;
  allowancesMap: { [spenderAddress: string]: string };
}
export interface TokenView {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
  balance: string;
  balanceUsdc: string;
  priceUsdc: string;
  categories: string[];
  description: string;
  website?: string;
  allowancesMap?: { [tokenAddress: string]: string };
}

export interface TokenDynamicData {
  address: Address;
  priceUsdc: string;
}

// https://docs.0x.org/0x-api-swap/api-references/get-swap-v1-quote
export interface GetTradeQuoteProps {
  sellToken: string; // token symbol or address
  buyToken: string; // token symbol or address
  sellAmount: string; // in sellToken decimals
  buyAmount: string; // in buyToken decimals
  network?: Network;

  // optional protection fields
  slippagePercentage?: string;
  priceImpactProtectionPercentage?: string;
  enableSlippageProtection?: boolean;
}
