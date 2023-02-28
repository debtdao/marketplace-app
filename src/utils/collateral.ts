import { isEmpty, zipWith } from 'lodash';
import { BigNumber, ethers, utils } from 'ethers';
import { getAddress } from '@ethersproject/address';
import _ from 'lodash';
import { formatUnits } from 'ethers/lib/utils';

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
  ReservesMap,
} from '@types';

import { humanize, normalizeAmount, normalize, format, toUnit, toTargetDecimalUnits, BASE_DECIMALS } from './format';
import { unnullify, _createTokenView } from './line';

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

export const formatCollateralRevenue = (
  spigot: AggregatedSpigot,
  reserves: {
    [tokenAddress: string]: {
      unusedTokens: string;
      ownerTokens: string;
      operatorTokens: string;
    };
  },
  tokenPrices: {
    [address: string]: BigNumber;
  }
): AggregatedSpigot => {
  const { revenueValue, revenueSummary, ...rest } = spigot;
  const newRevenueSummary: RevenueSummaryMap = Object.values(revenueSummary).reduce<RevenueSummaryMap>(
    (agg, { token, amount, ...summary }) => {
      const checkSumAddress = ethers.utils.getAddress(token.address);
      const usdcPrice = tokenPrices[checkSumAddress] ?? BigNumber.from(0);
      const ownerTokens = BigNumber.from(reserves[checkSumAddress]?.ownerTokens ?? BigNumber.from(0));
      const unusedTokens = BigNumber.from(reserves[checkSumAddress]?.unusedTokens ?? BigNumber.from(0));
      const totalUsableTokens = toTargetDecimalUnits(
        ownerTokens.add(unusedTokens).toString(),
        token.decimals,
        BASE_DECIMALS
      );
      return {
        ...agg,
        [getAddress(token.address)]: {
          ...summary,
          type: COLLATERAL_TYPE_REVENUE,
          token: token,
          amount: totalUsableTokens,
          value: formatUnits(usdcPrice.mul(unnullify(totalUsableTokens).toString()), 6).toString(),
        },
      };
    },
    {} as RevenueSummaryMap
  );

  const updatedSpigot = {
    revenueValue,
    revenueSummary: newRevenueSummary,
    ...rest,
  };
  return updatedSpigot;
};
