import { BigNumberish, BigNumber, ethers } from 'ethers';
import { BytesLike } from '@ethersproject/bytes/src.ts';

import {
  Address,
  CreditLineService,
  EscrowService,
  ISpigotSetting,
  SpigotedLineService,
  TransactionResponse,
  InterestRateCreditService,
  AddCreditProps,
} from '@types';

interface ContractAddressesProps {
  creditLineAddress: string;
  spigotedLineAddress: string;
  escrowAddress: string;
}

export function borrowerHelper(
  creditLineService: CreditLineService,
  interestRateCreditService: InterestRateCreditService,
  spigotedLineService: SpigotedLineService,
  escrowService: EscrowService,
  props: ContractAddressesProps
) {
  const addCredit = async (addCreditProps: AddCreditProps): Promise<string> => {
    // check if status is ACTIVE
    if (!(await creditLineService.isActive(props.creditLineAddress))) {
      throw new Error(
        `Adding credit is not possible. reason: "The given creditLine [${props.creditLineAddress}] is not active`
      );
    }
    const populatedTrx = await creditLineService.addCredit(addCreditProps, true);
    // check mutualConsent
    const borrower = await creditLineService.borrower(props.creditLineAddress);
    if (
      !(await creditLineService.isMutualConsent(
        props.creditLineAddress,
        populatedTrx.data,
        addCreditProps.lender,
        borrower
      ))
    ) {
      throw new Error(
        `Adding credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`
      );
    }
    return (<TransactionResponse>await creditLineService.addCredit(addCreditProps, false)).hash;
  };

  const close = async (id: BytesLike): Promise<string> => {
    if (!(await creditLineService.isSignerBorrowerOrLender(props.creditLineAddress, id))) {
      throw new Error('Unable to close. Signer is not borrower or lender');
    }
    return (await creditLineService.close(id)).hash;
  };

  const setRates = async (id: BytesLike, drate: BigNumberish, frate: BigNumberish): Promise<string> => {
    // check mutualConsentById
    const populatedTrx = await creditLineService.setRates(id, drate, frate, true);
    const borrower = await creditLineService.borrower(props.creditLineAddress);
    const lender = await creditLineService.getLenderByCreditID(props.creditLineAddress, id);
    if (!(await creditLineService.isMutualConsent(props.creditLineAddress, populatedTrx.data, borrower, lender))) {
      throw new Error(
        `Setting rate is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`
      );
    }

    return (<TransactionResponse>await creditLineService.setRates(id, drate, frate, false)).hash;
  };

  const increaseCredit = async (id: BytesLike, amount: BigNumberish): Promise<string> => {
    // if(status != LineLib.STATUS.ACTIVE) { revert NotActive(); }
    if (await creditLineService.isActive(props.creditLineAddress)) {
      throw new Error(
        `Increasing credit is not possible. reason: "The given creditLine [${props.creditLineAddress}] is not active"`
      );
    }

    // check mutualConsentById
    const populatedTrx = await creditLineService.increaseCredit(id, amount, true);
    const borrower = await creditLineService.borrower(props.creditLineAddress);
    const lender = await creditLineService.getLenderByCreditID(props.creditLineAddress, id);
    if (!(await creditLineService.isMutualConsent(props.creditLineAddress, populatedTrx.data, borrower, lender))) {
      throw new Error(
        `Increasing credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`
      );
    }

    return (<TransactionResponse>await creditLineService.increaseCredit(id, amount, false)).hash;
  };

  const depositAndRepay = async (amount: BigNumber): Promise<string> => {
    if (!(await creditLineService.isBorrowing(props.creditLineAddress))) {
      throw new Error('Deposit and repay is not possible because not borrowing');
    }

    const id = await creditLineService.getFirstID(props.creditLineAddress);
    const credit = await creditLineService.getCredit(props.creditLineAddress, id);

    // check interest accrual
    // note: `accrueInterest` will not be called because it has a modifier that is expecting
    // line of credit to be the msg.sender. We should probably update that modifier since
    // it only does the calculation and doesn't change state.
    const calcAccrue = await interestRateCreditService.accrueInterest({
      id,
      drawnBalance: credit.principal,
      facilityBalance: credit.deposit,
    });
    const simulateAccrue = credit.interestAccrued.add(calcAccrue);
    if (amount.gt(credit.principal.add(simulateAccrue))) {
      throw new Error('Amount is greater than (principal + interest to be accrued). Enter lower amount.');
    }
    return (<TransactionResponse>await creditLineService.depositAndRepay(amount, false)).hash;
  };

  const depositAndClose = async (): Promise<string> => {
    if (!(await creditLineService.isBorrowing(props.creditLineAddress))) {
      throw new Error('Deposit and close is not possible because not borrowing');
    }
    if(!(await creditLineService.isBorrower(props.creditLineAddress))) {
      throw new Error('Deposit and close is not possible because signer is not borrower');
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
