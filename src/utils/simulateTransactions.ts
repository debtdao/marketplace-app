import { CreditPosition, OPENED_STATUS } from '@src/core/types';

import { toWei } from './format';

export const borrowUpdate = (position: CreditPosition, amount: string) => {
  const borrowedAmount = toWei(amount, Number(+position['token'].decimals));
  const updatedPrincipal = Number(position['principal']) + Number(borrowedAmount);
  return { ...position, principal: `${updatedPrincipal}` };
};

export const withdrawUpdate = (position: CreditPosition, amount: string) => {
  const withdrawnAmount = toWei(amount, Number(position['token'].decimals));
  const updatedDeposit = Number(position['deposit']) - Number(withdrawnAmount);
  return { ...position, deposit: `${updatedDeposit}` };
};

export const depositAndRepayUpdate = (position: CreditPosition, amount: string) => {
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

export const addCreditUpdate = (position: CreditPosition) => {
  return {
    ...position,
    status: OPENED_STATUS,
  };
};
