import { PositionSummary } from '@src/core/types';

import { toWei } from './format';

export const borrowUpdate = (position: PositionSummary, amount: string) => {
  const borrowedAmount = toWei(amount, Number(+position['token'].decimals));
  const updatedPrincipal = Number(position['principal']) + Number(borrowedAmount);
  return { ...position, principal: `${updatedPrincipal}` };
};

export const withdrawUpdate = (position: PositionSummary, amount: string) => {
  const withdrawnAmount = toWei(amount, Number(position['token'].decimals));
  const updatedDeposit = Number(position['deposit']) - Number(withdrawnAmount);
  return { ...position, deposit: `${updatedDeposit}` };
};

export const depositAndRepayUpdate = (position: PositionSummary, amount: string) => {
  const repayAmount = toWei(amount, Number(position['token'].decimals));
  const interestPaid =
    Number(repayAmount) > Number(position['interestAccrued']) ? position['interestAccrued'] : repayAmount;
  const prinicipalToRepay = Number(position['principal']) - Number(repayAmount) + Number(interestPaid);
  const remainingInterest = Number(position['interestAccrued']) - Number(interestPaid);
  return {
    ...position,
    principal: `${prinicipalToRepay}`,
    interestAccrued: `${remainingInterest}`,
    interestPaid: `${Number(position['interestRepaid']) + remainingInterest}`,
  };
};

export const addCreditUpdate = (position: PositionSummary) => {
  return {
    ...position,
    status: 'OPEN',
  };
};
