import { Address, CreditLineService, TransactionResponse } from "@types";
import { BigNumberish } from "ethers";
import { BytesLike } from "@ethersproject/bytes/src.ts";

interface ContractAddressesProps {
  lineOfCreditAddress: string;
  spigotedLineAddress: string;
  escrowAddress: string;
}

export function borrower(creditLineService: CreditLineService, props: ContractAddressesProps) {

  const addCredit = async (drate: BigNumberish,
                           frate: BigNumberish,
                           amount: BigNumberish,
                           token: Address,
                           lender: Address): Promise<TransactionResponse> => {
    // set creditLineService.contract address by props.lineOfCreditAddress
    // check if(status != LineLib.STATUS.ACTIVE) { revert NotActive(); }
    // check mutualConsent 
    return await creditLineService.addCredit(drate,
      frate,
      amount,
      token,
      lender
    )
  }

  const close = async (id: BytesLike): Promise<TransactionResponse> => {
    // set creditLineService.contract address by props.lineOfCreditAddress
    return await creditLineService.close(id);
  }

  const setRates = async (id: BytesLike,
                          drate: BigNumberish,
                          frate: BigNumberish): Promise<TransactionResponse> => {
    // set creditLineService.contract address by props.lineOfCreditAddress
    // check mutualConsentById 
    return await creditLineService.setRates(id,
      drate,
      frate,
    )
  }

  const increaseCredit = async (id: BytesLike, amount: BigNumberish): Promise<TransactionResponse> => {
    // set creditLineService.contract address by props.lineOfCreditAddress
    // if(status != LineLib.STATUS.ACTIVE) { revert NotActive(); }
    // mutualConsentById 
    return await creditLineService.increaseCredit(id, amount)
  }

  const depositAndRepay = async (): Promise<TransactionResponse> => {
    return Promise.resolve(<never>{});
  }

  const depositAndClose = async (): Promise<TransactionResponse> => {
    return Promise.resolve(<never>{});
  }

  const claimAndTrade = async (): Promise<TransactionResponse> => {
    return Promise.resolve(<never>{});
  }

  const claimAndRepay = async (): Promise<TransactionResponse> => {
    return Promise.resolve(<never>{});
  }

  const addCollateral = async (): Promise<TransactionResponse> => {
    return Promise.resolve(<never>{});
  }

  const removeCollateral = async (): Promise<TransactionResponse> => {
    return Promise.resolve(<never>{});
  }

  const addSpigot = async (): Promise<TransactionResponse> => {
    return Promise.resolve(<never>{});
  }

  return {
    addCredit,
    close,
    setRates,
    increaseCredit,
    depositAndRepay,
    depositAndClose,
    claimAndTrade,
    claimAndRepay,
    addCollateral,
    removeCollateral,
    addSpigot
  };
}
