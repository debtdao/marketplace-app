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
  // TODO: update collateralMap to remove operatorTokens from amount and usdValue of type === REVENUE
  // update revenueValue
  // update revenueSummary
  console.log(spigot);
  const { revenueValue, revenueSummary, ...rest } = spigot;
  // for each revenue token, update the amount and value
  // const [newRevenueValue, newRevenueSummary]: [BigNumber, RevenueSummaryMap] = revenueSummary.reduce<any>()
  // get the usdcPrice for each revenue token
  // subtract the operatorTokens from the amount
  // recalculate the value field with the usdcPrice and amount

  // aggregated revenue in USD by token across all spigots
  const [newRevenueValue, newRevenueSummary]: [BigNumber, RevenueSummaryMap] = Object.values(
    revenueSummary
  ).reduce<any>(
    (agg, { token, amount, ...summary }) => {
      const checkSumAddress = ethers.utils.getAddress(token.address);
      console.log(token.address);
      const usdcPrice = tokenPrices[checkSumAddress] ?? BigNumber.from(0);
      const amountLessOperatorTokens = BigNumber.from(amount).sub(
        BigNumber.from(reserves[checkSumAddress]?.operatorTokens ?? 0)
      );

      const totalRevenueVolume = toTargetDecimalUnits(
        amountLessOperatorTokens.toString(),
        token.decimals,
        BASE_DECIMALS
      );

      return [
        agg[0].add(unnullify(totalRevenueVolume).toString()).mul(usdcPrice),
        {
          ...agg[1],
          [getAddress(token.address)]: {
            ...summary,
            type: COLLATERAL_TYPE_REVENUE,
            token: token,
            amount: totalRevenueVolume,
            value: formatUnits(usdcPrice.mul(unnullify(totalRevenueVolume).toString()), 6).toString(),
          },
        },
      ];
    },
    [BigNumber.from(0), {} as RevenueSummaryMap]
  );
  console.log('Values: ', newRevenueValue.toString(), newRevenueSummary);
  const updatedSpigot = {
    revenueValue: formatUnits(unnullify(newRevenueValue), 6).toString(),
    revenueSummary: newRevenueSummary,
    ...rest,
  };
  return updatedSpigot;
};
