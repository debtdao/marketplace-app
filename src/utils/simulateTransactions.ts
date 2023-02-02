import { CreditPosition, CreditProposal, OPENED_STATUS } from '@src/core/types';

import { toWei } from './format';

// TODO: replace all instances of Number with BigNumber
export const borrowUpdate = (position: CreditPosition, amount: string) => {
  const borrowedAmount = toWei(amount, Number(+position['token'].decimals));
  const updatedPrincipal = Number(position['principal']) + Number(borrowedAmount);
  return { ...position, principal: `${updatedPrincipal}` };
};

// TODO: replace all instances of Number with BigNumber
export const withdrawUpdate = (position: CreditPosition, amount: string) => {
  const withdrawnAmount = toWei(amount, Number(position['token'].decimals));
  const updatedDeposit = Number(position['deposit']) - Number(withdrawnAmount);
  return { ...position, deposit: `${updatedDeposit}` };
};

// TODO: replace all instances of Number with BigNumber
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

export const addCreditUpdate = (position: CreditPosition, proposal: CreditProposal): CreditPosition => {
  const [dRate, fRate, deposit, tokenAddress, lender] = [...proposal.args];
  return {
    ...position,
    status: OPENED_STATUS,
    dRate,
    fRate,
    deposit,
    lender,
  };
};
