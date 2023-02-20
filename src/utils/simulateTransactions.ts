import { BigNumber } from 'ethers';

import { CLOSED_STATUS, CreditPosition, CreditProposal, OPENED_STATUS } from '@src/core/types';

import { toWei } from './format';

export const borrowUpdate = (position: CreditPosition, amount: string) => {
  const borrowedAmount = toWei(amount, Number(+position.token.decimals));
  const updatedPrincipal = BigNumber.from(position.principal).add(BigNumber.from(borrowedAmount)).toString();
  return { ...position, principal: `${updatedPrincipal}` };
};

export const withdrawUpdate = (position: CreditPosition, amount: string) => {
  const withdrawnAmount = toWei(amount, Number(position.token.decimals));
  const updatedDeposit = BigNumber.from(position.deposit).sub(BigNumber.from(withdrawnAmount)).toString();
  return { ...position, deposit: `${updatedDeposit}` };
};

export const depositAndRepayUpdate = (position: CreditPosition, amount: string) => {
  const repayAmount = toWei(amount, Number(position.token.decimals));
  const interestPaid = BigNumber.from(repayAmount).gt(BigNumber.from(position.interestAccrued))
    ? position.interestAccrued
    : repayAmount;
  const prinicipalToRepay = BigNumber.from(position.principal)
    .sub(BigNumber.from(repayAmount))
    .add(BigNumber.from(interestPaid))
    .toString();
  const remainingInterest = BigNumber.from(position.interestAccrued).sub(BigNumber.from(interestPaid)).toString();
  const updatedInterestPaid = BigNumber.from(position.interestRepaid).add(BigNumber.from(remainingInterest)).toString();
  return {
    ...position,
    principal: `${prinicipalToRepay}`,
    interestAccrued: `${remainingInterest}`,
    interestPaid: `${updatedInterestPaid}`,
  };
};

export const addCreditUpdate = (position: CreditPosition, proposal: CreditProposal): CreditPosition => {
  const [dRate, fRate, deposit, tokenAddress, lender] = proposal.args;
  return {
    ...position,
    status: OPENED_STATUS,
    dRate,
    fRate,
    deposit,
    lender,
  };
};

export const repayCreditUpdate = (position: CreditPosition): CreditPosition => {
  return {
    ...position,
    status: CLOSED_STATUS,
  };
};
