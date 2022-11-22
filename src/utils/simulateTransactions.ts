import { PositionInt } from '@src/core/types';

import { toWei } from './format';

export const borrowUpdate = (position: PositionInt, amount: string) => {
  const borrowedAmount = toWei(amount, Number(+position['tokenDecimals']));
  const updatedPrincipal = Number(position['principal']) + Number(borrowedAmount);
  return { ...position, principal: `${updatedPrincipal}` };
};

export const withdrawUpdate = (position: PositionInt, amount: string) => {
  const withdrawnAmount = toWei(amount, Number(position['tokenDecimals']));
  const updatedDeposit = Number(position['deposit']) - Number(withdrawnAmount);
  return { ...position, deposit: `${updatedDeposit}` };
};

export const depositAndRepayUpdate = (position: PositionInt, amount: string) => {
  const repayAmount = toWei(amount, Number(position['tokenDecimals']));
  const interestPaid =
    Number(repayAmount) > Number(position['interestAccrued']) ? position['interestAccrued'] : repayAmount;
  const prinicipalToRepay = Number(position['principal']) - Number(repayAmount) + interestPaid;
  const remainingInterest = Number(position['interestAccrued']) - Number(interestPaid);
  return {
    ...position,
    principal: `${prinicipalToRepay}`,
    interestAccrued: `${remainingInterest}`,
    interestPaid: `${Number(position['interestRepaid']) + remainingInterest}`,
  };
};
