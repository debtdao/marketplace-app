import { BigNumberish, ethers } from 'ethers';
import { BytesLike } from '@ethersproject/bytes/src.ts';

import {
  Address,
  CreditLineService,
  EscrowService,
  ISpigotSetting,
  SpigotedLineService,
  TransactionResponse,
} from '@types';
import { EscrowServiceImpl, SpigotedLineServiceImpl } from '@services';

interface ContractAddressesProps {
  creditLineAddress: string;
  spigotedLineAddress: string;
  escrowAddress: string;
}

export function borrower(
  creditLineService: CreditLineService,
  spigotedLineService: SpigotedLineService,
  escrowService: EscrowService,
  props: ContractAddressesProps
) {
  const addCredit = async (
    drate: BigNumberish,
    frate: BigNumberish,
    amount: BigNumberish,
    token: Address,
    lender: Address
  ): Promise<string> => {
    // check if status is ACTIVE
    if (!(await creditLineService.isActive(props.creditLineAddress))) {
      throw new Error(
        `Adding credit is not possible. reason: "The given creditLine [${props.creditLineAddress}] is not active`
      );
    }
    const populatedTrx = await creditLineService.addCredit(drate, frate, amount, token, lender, true);
    // check mutualConsent
    if (!(await creditLineService.isMutualConsent(props.creditLineAddress, populatedTrx.data, lender))) {
      throw new Error(
        `Adding credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`
      );
    }
    return (<TransactionResponse>await creditLineService.addCredit(drate, frate, amount, token, lender, false)).hash;
  };

  const close = async (id: BytesLike): Promise<string> => {
    return (await creditLineService.close(id)).hash;
  };

  const setRates = async (id: BytesLike, drate: BigNumberish, frate: BigNumberish): Promise<string> => {
    // check mutualConsentById
    const populatedTrx = await creditLineService.setRates(id, drate, frate, true);
    const nonCaller = await creditLineService.getCredit(props.creditLineAddress, id);
    if (!(await creditLineService.isMutualConsent(props.creditLineAddress, populatedTrx.data, nonCaller))) {
      console.log(
        `Setting rate is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`
      );
      return '';
    }

    return (<TransactionResponse>await creditLineService.setRates(id, drate, frate, false)).hash;
  };

  const increaseCredit = async (id: BytesLike, amount: BigNumberish): Promise<string> => {
    // if(status != LineLib.STATUS.ACTIVE) { revert NotActive(); }
    if (await creditLineService.isActive(props.creditLineAddress)) {
      console.log(
        `Increasing credit is not possible. reason: "The given creditLine [${props.creditLineAddress}] is not active"`
      );
      return '';
    }

    // check mutualConsentById
    const populatedTrx = await creditLineService.increaseCredit(id, amount, true);
    const nonCaller = await creditLineService.getCredit(props.creditLineAddress, id);
    if (!(await creditLineService.isMutualConsent(props.creditLineAddress, populatedTrx.data, nonCaller))) {
      console.log(
        `Increasing credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`
      );
      return '';
    }

    return (<TransactionResponse>await creditLineService.increaseCredit(id, amount, false)).hash;
  };

  const depositAndRepay = async (amount: BigNumberish): Promise<string> => {
    if (!(await creditLineService.isBorrowing(props.creditLineAddress))) {
      throw new Error('Deposit and repay is not possible because not borrowing');
    }

    return (<TransactionResponse>await creditLineService.depositAndRepay(amount, false)).hash;
  };

  const depositAndClose = async (): Promise<string> => {
    if (!(await creditLineService.isBorrowing(props.creditLineAddress))) {
      throw new Error('Deposit and close is not possible because not borrowing');
    }
    return (<TransactionResponse>await creditLineService.depositAndClose(false)).hash;
  };

  const claimAndTrade = async (claimToken: Address, calldata: BytesLike): Promise<string> => {
    if (!(await creditLineService.isBorrowing(props.creditLineAddress))) {
      throw new Error('Claim and trade is not possible because not borrowing');
    }
    if (!(await creditLineService.isBorrower(props.creditLineAddress))) {
      throw new Error('Claim and trade is not possible because signer is not borrower');
    }
    return (<TransactionResponse>await spigotedLineService.claimAndTrade(claimToken, calldata, false)).hash;
  };

  const claimAndRepay = async (claimToken: Address, calldata: BytesLike): Promise<string> => {
    return (<TransactionResponse>await spigotedLineService.claimAndRepay(claimToken, calldata, false)).hash;
  };

  const addSpigot = async (revenueContract: Address, setting: ISpigotSetting): Promise<string> => {
    return (<TransactionResponse>await spigotedLineService.addSpigot(revenueContract, setting, false)).hash;
  };

  const addCollateral = async (amount: BigNumberish, token: Address): Promise<string> => {
    return (<TransactionResponse>await escrowService.addCollateral(amount, token, false)).hash;
  };

  const releaseCollateral = async (amount: BigNumberish, token: Address, to: Address): Promise<string> => {
    return (<TransactionResponse>await escrowService.releaseCollateral(amount, token, to, false)).hash;
  };

  return {
    addCredit,
    close,
    setRates,
    increaseCredit,
    depositAndRepay,
    depositAndClose,
    claimAndTrade,
    claimAndRepay,
    addSpigot,
    addCollateral,
    releaseCollateral,
  };
}
