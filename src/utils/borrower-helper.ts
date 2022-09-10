import { Address, CreditLineService, TransactionResponse } from "@types";
import { BigNumberish } from "ethers";
import { BytesLike } from "@ethersproject/bytes/src.ts";

interface ContractAddressesProps {
  creditLineAddress: string;
  spigotedLineAddress: string;
  escrowAddress: string;
}

export function borrower(creditLineService: CreditLineService, props: ContractAddressesProps) {

  const addCredit = async (drate: BigNumberish,
                           frate: BigNumberish,
                           amount: BigNumberish,
                           token: Address,
                           lender: Address): Promise<string> => {
    // check if status is ACTIVE     
    if (await creditLineService.isActive(props.creditLineAddress)) {
      console.log(`Adding credit is not possible. reason: "The given creditLine [${props.creditLineAddress}] is not active"`);
      return "";
    }
    const populatedTrx = await creditLineService.addCredit(drate,
      frate,
      amount,
      token,
      lender,
      true
    )
    // check mutualConsent
    if (!(await creditLineService.isMutualConsent(props.creditLineAddress, populatedTrx.data, lender))) {
      console.log(`Adding credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`);
      return "";
    }
    return (<TransactionResponse>(await creditLineService.addCredit(drate,
      frate,
      amount,
      token,
      lender,
      false
    ))).hash
  }

  const close = async (id: BytesLike): Promise<string> => {
    return (await creditLineService.close(id)).hash;
  }

  const setRates = async (id: BytesLike,
                          drate: BigNumberish,
                          frate: BigNumberish): Promise<string> => {
    // check mutualConsentById 
    const populatedTrx = await creditLineService.setRates(id,
      drate,
      frate,
      true
    )
    const nonCaller = await creditLineService.getCredit(props.creditLineAddress, id);
    if (!(await creditLineService.isMutualConsent(props.creditLineAddress, populatedTrx.data, nonCaller))) {
      console.log(`Setting rate is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`);
      return "";
    }
    
    return (<TransactionResponse>await creditLineService.setRates(id,
      drate,
      frate,
      false
    )).hash
  }

  const increaseCredit = async (id: BytesLike, amount: BigNumberish): Promise<string> => {
    // if(status != LineLib.STATUS.ACTIVE) { revert NotActive(); }
    if (await creditLineService.isActive(props.creditLineAddress)) {
      console.log(`Increasing credit is not possible. reason: "The given creditLine [${props.creditLineAddress}] is not active"`);
      return "";
    }
    
    // check mutualConsentById 
    const populatedTrx = await creditLineService.increaseCredit(id, amount, true);
    const nonCaller = await creditLineService.getCredit(props.creditLineAddress, id);
    if (!(await creditLineService.isMutualConsent(props.creditLineAddress, populatedTrx.data, nonCaller))) {
      console.log(`Increasing credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.creditLineAddress}]`);
      return "";
    }

    return (<TransactionResponse>await creditLineService.increaseCredit(id, amount, false)).hash;
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
