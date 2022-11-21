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

export const depositAndRepayUpdate = (position: PositionInt, amount: string) => {
  const repayAmount = toWei(amount, +position['tokenDecimals']);
  let prinicipalToRepay = '';
  let remainingInterest = '';
  let UpdatedPositon: any = {};

  if (+repayAmount > +position['interestAccrued']) {
    prinicipalToRepay = `${+repayAmount - +position['interestAccrued']}`;
    UpdatedPositon = {
      drate: position['drate'],
      frate: position['frate'],
      id: position['id'],
      interestAccrued: '0',
      interestRepaid: `${+position['interestRepaid'] + +position['interestAccrued']}`,
      lender: position['lender'],
      deposit: position['deposit'],
      principal: `${+position['principal'] - +prinicipalToRepay}`,
      status: position['status'],
      tokenAddress: position['tokenAddress'],
      tokenSymbol: position['tokenSymbol'],
      tokenDecimals: position['tokenDecimals'],
    };
  }

  if (+repayAmount <= +position['interestAccrued']) {
    remainingInterest = `${+position['interestAccrued'] - +repayAmount}`;
    UpdatedPositon = {
      drate: position['drate'],
      frate: position['frate'],
      id: position['id'],
      interestAccrued: remainingInterest,
      interestRepaid: `${+position['interestRepaid'] + +repayAmount}`,
      lender: position['lender'],
      deposit: position['deposit'],
      principal: position['principal'],
      status: position['status'],
      tokenAddress: position['tokenAddress'],
      tokenSymbol: position['tokenSymbol'],
      tokenDecimals: position['tokenDecimals'],
    };
  }
  console.log('repay remaining', prinicipalToRepay);
  return UpdatedPositon;
};
