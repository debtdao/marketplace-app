import { PositionInt } from '@src/core/types';

import { toWei } from './format';

export const borrowUpdate = (position: PositionInt, amount: string) => {
  const borrowedAmount = toWei(amount, +position['tokenDecimals']);
  const updatedPrincipal = +position['principal'] + +borrowedAmount;

  let UpdatedPositon = {
    drate: position['drate'],
    frate: position['frate'],
    id: position['id'],
    interestAccrued: position['interestAccrued'],
    interestRepaid: position['interestRepaid'],
    lender: position['lender'],
    deposit: position['deposit'],
    principal: `${updatedPrincipal}`,
    status: position['status'],
    tokenAddress: position['tokenAddress'],
    tokenSymbol: position['tokenSymbol'],
    tokenDecimals: position['tokenDecimals'],
  };

  return UpdatedPositon;
};

export const withdrawUpdate = (position: PositionInt, amount: string) => {
  const withdrawnAmount = toWei(amount, +position['tokenDecimals']);
  const updatedDeposit = +position['deposit'] - +withdrawnAmount;

  let UpdatedPositon = {
    drate: position['drate'],
    frate: position['frate'],
    id: position['id'],
    interestAccrued: position['interestAccrued'],
    interestRepaid: position['interestRepaid'],
    lender: position['lender'],
    deposit: `${updatedDeposit}`,
    principal: position['principal'],
    status: position['status'],
    tokenAddress: position['tokenAddress'],
    tokenSymbol: position['tokenSymbol'],
    tokenDecimals: position['tokenDecimals'],
  };

  return UpdatedPositon;
};
