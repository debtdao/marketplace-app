import { PositionInt } from '@src/core/types';

import { toWei } from './format';

export const borrowUpdate = (position: PositionInt, amount: string) => {
  const borrowedAmount = toWei(amount, +position['tokenDecimals']);
  const updatedPrincipal = +position['principal'] + +borrowedAmount;
  return { ...position, principal: updatedPrincipal }
};

export const withdrawUpdate = (position: PositionInt, amount: string) => {
  const withdrawnAmount = toWei(amount, +position['tokenDecimals']);
  const updatedDeposit = +position['deposit'] - +withdrawnAmount;
  return { ...position, deposit: updatedDeposit }
};

export const depositAndRepayUpdate = (position: PositionInt, amount: string) => {
  const repayAmount = toWei(amount, +position['tokenDecimals']);
  const interestPaid = +repayAmount > +position['interestAccrued'] ? position['interestAccrued']: repayAmount
  // let prinicipalToRepay = position['principal'] - repayAmount + interestPaid ;
  // let remainingInterest = position['interestAccrued'] - interestPaid;
  return  {
    ...position,
    principal: prinicipalToRepay
  }
};
