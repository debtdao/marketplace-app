import { isEmpty, zipWith } from 'lodash';
import { BigNumber, ethers, utils } from 'ethers';
import { getAddress } from '@ethersproject/address';
import _ from 'lodash';

import {
  SecuredLineWithEvents,
  SecuredLine,
  CreditEvent,
  CollateralEvent,
  ModuleNames,
  ESCROW_MODULE_NAME,
  SPIGOT_MODULE_NAME,
  LineStatusTypes,
  GetLinePageResponse,
  LineOfCreditsResponse,
  CollateralTypes,
  GetLinesResponse,
  BaseEscrowDepositFragResponse,
  SpigotRevenueSummaryFragResponse,
  BasePositionFragResponse,
  LineEventFragResponse,
  EscrowEventFragResponse,
  // EscrowDepositList,
  EscrowDepositMap,
  TokenFragRepsonse,
  COLLATERAL_TYPE_REVENUE,
  COLLATERAL_TYPE_ASSET,
  CreditPosition,
  Address,
  GetUserPortfolioResponse,
  PositionMap,
  LENDER_POSITION_ROLE,
  BaseLineFragResponse,
  EscrowDeposit,
  GetLineEventsResponse,
  AggregatedEscrow,
  RevenueSummary,
  RevenueSummaryMap,
  AggregatedSpigot,
  SpigotEventFragResponse,
  SpigotRevenueContractFragResponse,
  SpigotRevenueContract,
  SpigotRevenueContractMap,
  ProposalFragResponse,
  CreditProposal,
  ProposalMap,
  TokenView,
} from '@types';

import { humanize, normalizeAmount, normalize, format, toUnit, toTargetDecimalUnits, BASE_DECIMALS } from './format';

export const formatEscrowDeposit = (tokenInfo: TokenView): EscrowDeposit => {
  const tokenInfoFormatted = { ...tokenInfo, balance: '0.00', icon: '' };
  const escrowDeposit = {
    type: 'asset',
    token: tokenInfoFormatted,
    amount: '0.00',
    value: '0.00',
    enabled: true,
    // displayIcon: tokenInfo.icon,
    // events: [];
  } as EscrowDeposit;
  return escrowDeposit;
};
