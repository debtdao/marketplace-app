/**
 * @jest-environment jsdom
 */

import { Container } from "@container";
import * as frameworks_ethers from '@frameworks/ethers';
import * as frameworks_gql from '@frameworks/gql';
import { BigNumber, ethers } from "ethers";
import { getAddress, parseEther } from "ethers/lib/utils";
import { Address, InterestRateAccrueInterestProps, NO_STATUS } from "@types";
import { BytesLike } from "@ethersproject/bytes/src.ts";

describe('ClientLineService', () => {
  let container: Container;
  let WETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  let LINE_ADDRESS = '0x00a861995f9c2fce1031a2bc324afa5e01076b3d';
  let BORROWER_ADDRESS = '0x1a6784925814a13334190fd249ae0333b90b6443';

  (<any>frameworks_ethers)['getContract'] = jest.fn((
    address: string,
    contractABI: ethers.ContractInterface,
    provider: ethers.providers.Provider | ethers.Signer
  ) => {
    return {
      'credits': jest.fn((id) => {
        return Promise.resolve({
          deposit: parseEther('1'),
          principal: parseEther('1'),
          interestAccrued: parseEther('1'),
          interestRepaid: parseEther('1'),
          decimals: BigNumber.from('18'),
          token: getAddress(address),
          lender: getAddress(address)
        });
      }),
      'interestRate': jest.fn(() => {
        return Promise.resolve(getAddress(address));
      }),
      'ids': jest.fn((id) => {
        return Promise.resolve(getAddress(address));
      }),
      'borrower': jest.fn((id) => {
        return Promise.resolve(getAddress(address));
      }),
      'populateTransaction': {
        'addCredit': jest.fn(() => 'POPULATED_TRANSACTION'),
        'setRates': jest.fn(() => 'POPULATED_TRANSACTION'),
        'increaseCredit': jest.fn(() => 'POPULATED_TRANSACTION')
      }
    }
  });

  (<any>frameworks_gql)['getLines'] = jest.fn((args) => {
    return Promise.resolve(
      [
        {
          id: LINE_ADDRESS,
          end: 2,
          start: 1,
          borrower: BORROWER_ADDRESS,
          activeIds: ['0', '1']
        }
      ]
    )
  })

  beforeAll(() => {
    container = new Container();
  });

  it('ClientLineService should be defined', () => {
    const creditLineService = container.services.creditLineService;
    (<any>creditLineService)['web3Provider'].getSigner = () => {
      return {
        provider: {}
      }
    }
    expect(creditLineService).toBeDefined();
  });

  it('Calling getLenderByCreditID should return lender id', () => {
    const creditLineService = container.services.creditLineService;
    expect(
      creditLineService.getLenderByCreditID(
        WETH,
        getAddress(WETH))
    ).resolves.toBe(getAddress(WETH));
  });

  it('Calling getInterestRateContract should return interestRate', () => {
    const creditLineService = container.services.creditLineService;
    expect(
      creditLineService.getInterestRateContract(WETH)
    ).resolves.toBe(getAddress(WETH));
  });

  it('Calling getFirstID should return firstID', () => {
    const creditLineService = container.services.creditLineService;
    expect(
      creditLineService.getFirstID(WETH)
    ).resolves.toBe(getAddress(WETH));
  });

  it('Calling getCredit should return credit', async () => {
    const creditLineService = container.services.creditLineService;
    const credit = await creditLineService.getCredit(WETH, '0')
    expect(credit.deposit).toEqual(parseEther('1'));
    expect(credit.principal).toEqual(parseEther('1'));
    expect(credit.interestAccrued).toEqual(parseEther('1'));
    expect(credit.interestRepaid).toEqual(parseEther('1'));
    expect(credit.decimals).toEqual(BigNumber.from(18));
    expect(credit.token).toBe(WETH);
    expect(credit.lender).toBe(WETH);
  });

  it('Calling borrower should return borrower', () => {
    const creditLineService = container.services.creditLineService;
    expect(creditLineService.borrower(WETH))
      .resolves.toBe(getAddress(WETH));
  });

  it('Calling getLines should return lines', () => {
    const creditLineService = container.services.creditLineService;
    expect(creditLineService.getLines({ network: "mainnet", first: 1, orderBy: "1", orderDirection: "desc" }))
      .resolves.toEqual([
        {
          id: LINE_ADDRESS,
          end: 2,
          start: 1,
          borrower: undefined, //TODO: Since the borrower is passed in the mock object, it must return borrower
          activeIds: ['0', '1'],
          status: NO_STATUS,
        }
      ]
    );
  });

  it("Calling addCredit should throw exception when the line is not active or isMutualConsent returns false", () => {
    const creditLineService = container.services.creditLineService;

    // When the line is not active
    creditLineService.isActive = jest.fn((contractAddress: string) => Promise.resolve(false));
    expect(
      creditLineService.addCredit({
        lineAddress: LINE_ADDRESS,
        token: WETH,
        lender: BORROWER_ADDRESS,
        drate: parseEther('1'),
        frate: parseEther('1'),
        amount: parseEther('1'),
      })).rejects.toThrowError(`Adding credit is not possible. reason: "The given creditLine [${LINE_ADDRESS}] is not active`)

    // When isMutualConsent returns false
    creditLineService.isActive = jest.fn((contractAddress: string) => Promise.resolve(true));
    creditLineService.borrower = jest.fn((contractAddress: string) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.isMutualConsent = jest.fn((contractAddress: string,
                                                 trxData: string | undefined,
                                                 signerOne: Address,
                                                 signerTwo: Address) => Promise.resolve(false));
    expect(
      creditLineService.addCredit({
        lineAddress: LINE_ADDRESS,
        token: WETH,
        lender: BORROWER_ADDRESS,
        drate: parseEther('1'),
        frate: parseEther('1'),
        amount: parseEther('1'),
      })).rejects.toThrowError(`Adding credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${LINE_ADDRESS}]"`)

  })

  it("Calling addCredit should return hash code when the line is active and isMutualConsent returns true", () => {
    const creditLineService = container.services.creditLineService;

    // When the line is active and isMutualConsent returns true
    creditLineService.isActive = jest.fn((contractAddress: string) => Promise.resolve(true));
    creditLineService.isMutualConsent = jest.fn((contractAddress: string,
                                                 trxData: string | undefined,
                                                 signerOne: Address,
                                                 signerTwo: Address) => Promise.resolve(true));
    (<any>creditLineService)['transactionService'] = {
      'populateTransaction': jest.fn(() => 'POPULATED_TRANSACTION'),
      'execute': jest.fn(() => {
        return {
          hash: 'TRANSACTION_HASH',
          wait: jest.fn(() => {
            Promise.resolve();
          })
        }
      })
    };
    expect(
      creditLineService.addCredit({
        lineAddress: LINE_ADDRESS,
        token: WETH,
        lender: BORROWER_ADDRESS,
        drate: parseEther('1'),
        frate: parseEther('1'),
        amount: parseEther('1'),
      })).resolves.toBe('TRANSACTION_HASH');

  })

  it("Calling close should throw exception when isSignerBorrowerOrLender returns false", () => {
    const creditLineService = container.services.creditLineService;

    // When isSignerBorrowerOrLender returns false
    creditLineService.isSignerBorrowerOrLender = jest.fn((contractAddress: Address, id: BytesLike) => Promise.resolve(false));
    expect(
      creditLineService.close({
        lineAddress: LINE_ADDRESS,
        id: 'myId',
      })).rejects.toThrowError(`Unable to close. Signer is not borrower or lender`)
  })

  it("Calling close should return hash code when isSignerBorrowerOrLender returns true", () => {
    const creditLineService = container.services.creditLineService;

    // When isSignerBorrowerOrLender returns tue
    creditLineService.isSignerBorrowerOrLender = jest.fn((contractAddress: Address, id: BytesLike) => Promise.resolve(true));
    (<any>creditLineService)['transactionService'] = {
      'populateTransaction': jest.fn(() => 'POPULATED_TRANSACTION'),
      'execute': jest.fn(() => {
        return {
          hash: 'TRANSACTION_HASH',
          wait: jest.fn(() => {
            Promise.resolve();
          })
        }
      })
    };
    expect(
      creditLineService.close({
        lineAddress: LINE_ADDRESS,
        id: 'myId',
      })).resolves.toBe('TRANSACTION_HASH');
  })

  it("Calling withdraw should throw exception when isLender returns false", () => {
    const creditLineService = container.services.creditLineService;

    // When isLender returns false
    creditLineService.isLender = jest.fn((contractAddress: string, id: BytesLike) => Promise.resolve(false));
    expect(
      creditLineService.withdraw({
        lineAddress: LINE_ADDRESS,
        id: 'myId',
        amount: parseEther('1'),
      })).rejects.toThrowError(`Cannot withdraw. Signer is not lender`)
  })

  it("Calling withdraw should return hash code when the isLender returns true", () => {
    const creditLineService = container.services.creditLineService;

    // When isLender returns true
    creditLineService.isLender = jest.fn((contractAddress: string, id: BytesLike) => Promise.resolve(true));
    (<any>creditLineService)['transactionService'] = {
      'populateTransaction': jest.fn(() => 'POPULATED_TRANSACTION'),
      'execute': jest.fn(() => {
        return {
          hash: 'TRANSACTION_HASH',
          wait: jest.fn(() => {
            Promise.resolve();
          })
        }
      })
    };
    expect(
      creditLineService.withdraw({
        lineAddress: LINE_ADDRESS,
        id: 'myId',
        amount: parseEther('1'),
      })).resolves.toBe('TRANSACTION_HASH');

  })

  it("Calling setRates should throw exception when isMutualConsent returns false", () => {
    const creditLineService = container.services.creditLineService;

    // When isMutualConsent returns false
    creditLineService.borrower = jest.fn((contractAddress: string) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.getLenderByCreditID = jest.fn((contractAddress: string, id: BytesLike) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.isMutualConsent = jest.fn((contractAddress: string,
                                                 trxData: string | undefined,
                                                 signerOne: Address,
                                                 signerTwo: Address) => Promise.resolve(false));
    expect(
      creditLineService.setRates({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
          frate: parseEther('1'),
          drate: parseEther('1'),
        }
      )).rejects.toThrowError(`Setting rate is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${LINE_ADDRESS}]"`)
  })

  it("Calling setRates should return hash code when the isMutualConsent returns true", () => {
    const creditLineService = container.services.creditLineService;

    // When isMutualConsent returns true
    creditLineService.borrower = jest.fn((contractAddress: string) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.getLenderByCreditID = jest.fn((contractAddress: string, id: BytesLike) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.isMutualConsent = jest.fn((contractAddress: string,
                                                 trxData: string | undefined,
                                                 signerOne: Address,
                                                 signerTwo: Address) => Promise.resolve(true));
    (<any>creditLineService)['transactionService'] = {
      'populateTransaction': jest.fn(() => 'POPULATED_TRANSACTION'),
      'execute': jest.fn(() => {
        return {
          hash: 'TRANSACTION_HASH',
          wait: jest.fn(() => {
            Promise.resolve();
          })
        }
      })
    };
    expect(
      creditLineService.setRates({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
          frate: parseEther('1'),
          drate: parseEther('1'),
        }
      )).resolves.toBe('TRANSACTION_HASH');
  })

  it("Calling increaseCredit should throw exception when isActive or isMutualConsent returns false", () => {
    const creditLineService = container.services.creditLineService;

    // When the line is not active
    creditLineService.isActive = jest.fn((contractAddress: string) => Promise.resolve(false));
    expect(
      creditLineService.increaseCredit({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
          amount: parseEther('1'),
        }
      )).rejects.toThrowError(`Increasing credit is not possible. reason: "The given creditLine [${LINE_ADDRESS}] is not active"`)


    // When isMutualConsent returns false
    creditLineService.isActive = jest.fn((contractAddress: string) => Promise.resolve(true));
    creditLineService.borrower = jest.fn((contractAddress: string) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.getLenderByCreditID = jest.fn((contractAddress: string, id: BytesLike) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.isMutualConsent = jest.fn((contractAddress: string,
                                                 trxData: string | undefined,
                                                 signerOne: Address,
                                                 signerTwo: Address) => Promise.resolve(false));
    expect(
      creditLineService.increaseCredit({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
          amount: parseEther('1'),
        }
      )).rejects.toThrowError(`Increasing credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${LINE_ADDRESS}]"`)
  })

  it("Calling increaseCredit should return hash code when the isActive and isMutualConsent return true", () => {
    const creditLineService = container.services.creditLineService;

    // When isActive and isMutualConsent return true
    creditLineService.isActive = jest.fn((contractAddress: string) => Promise.resolve(true));
    creditLineService.borrower = jest.fn((contractAddress: string) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.getLenderByCreditID = jest.fn((contractAddress: string, id: BytesLike) => Promise.resolve(BORROWER_ADDRESS));
    creditLineService.isMutualConsent = jest.fn((contractAddress: string,
                                                 trxData: string | undefined,
                                                 signerOne: Address,
                                                 signerTwo: Address) => Promise.resolve(true));
    (<any>creditLineService)['transactionService'] = {
      'populateTransaction': jest.fn(() => 'POPULATED_TRANSACTION'),
      'execute': jest.fn(() => {
        return {
          hash: 'TRANSACTION_HASH',
          wait: jest.fn(() => {
            Promise.resolve();
          })
        }
      })
    };
    expect(
      creditLineService.increaseCredit({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
          amount: parseEther('1'),
        }
      )).resolves.toBe('TRANSACTION_HASH');
  })

  it("Calling depositAndRepay should throw exception when isBorrowing is false or the given amount is greater than credit.principal + credit.interestAccrued + calcAccrue", () => {
    const creditLineService = container.services.creditLineService;
    const interestRateCreditService = container.services.interestRateCreditService;

    // When isBorrowing return false
    creditLineService.isBorrowing = jest.fn((contractAddress: string) => Promise.resolve(false));
    expect(
      creditLineService.depositAndRepay({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
          amount: parseEther('1')
        }, interestRateCreditService
      )).rejects.toThrowError('Deposit and repay is not possible because not borrowing')

    // When isBorrowing return true but the given amount is greater than credit.principal + credit.interestAccrued + calcAccrue
    creditLineService.isBorrowing = jest.fn((contractAddress: string) => Promise.resolve(true));
    creditLineService.getInterestRateContract = jest.fn((contractAddress: string) => Promise.resolve(contractAddress));
    interestRateCreditService.accrueInterest = jest.fn((props: InterestRateAccrueInterestProps) => Promise.resolve(BigNumber.from('1')));
    expect(
      creditLineService.depositAndRepay({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
          amount: parseEther('4')
        }, interestRateCreditService
      )).rejects.toThrowError('Amount is greater than (principal + interest to be accrued). Enter lower amount.')
  }) 
  
  it("Calling depositAndRepay should return hash code when isBorrowing is true and the given amount is lower than credit.principal + credit.interestAccrued + calcAccrue", () => {
    const creditLineService = container.services.creditLineService;
    const interestRateCreditService = container.services.interestRateCreditService;

    // When isBorrowing return true but the given amount is lower than credit.principal + credit.interestAccrued + calcAccrue
    creditLineService.isBorrowing = jest.fn((contractAddress: string) => Promise.resolve(true));
    creditLineService.getInterestRateContract = jest.fn((contractAddress: string) => Promise.resolve(contractAddress));
    interestRateCreditService.accrueInterest = jest.fn((props: InterestRateAccrueInterestProps) => Promise.resolve(BigNumber.from('1')));
    (<any>creditLineService)['transactionService'] = {
      'populateTransaction': jest.fn(() => 'POPULATED_TRANSACTION'),
      'execute': jest.fn(() => {
        return {
          hash: 'TRANSACTION_HASH',
          wait: jest.fn(() => {
            Promise.resolve();
          })
        }
      })
    };
    expect(
      creditLineService.depositAndRepay({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
          amount: parseEther('1')
        }, interestRateCreditService
      )).resolves.toBe('TRANSACTION_HASH');
  })
  
  it("Calling depositAndClose should throw exception when isBorrowing or isBorrower returns false", () => {
    const creditLineService = container.services.creditLineService;

    // When isBorrowing return false
    creditLineService.isBorrowing = jest.fn((contractAddress: string) => Promise.resolve(false));
    expect(
      creditLineService.depositAndClose({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
        }
      )).rejects.toThrowError('Deposit and close is not possible because not borrowing')

    // When isBorrowing return false
    creditLineService.isBorrowing = jest.fn((contractAddress: string) => Promise.resolve(true));
    creditLineService.isBorrower = jest.fn((contractAddress: string) => Promise.resolve(false));
    expect(
      creditLineService.depositAndClose({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
        }
      )).rejects.toThrowError('Deposit and close is not possible because signer is not borrower')
  })

  it("Calling depositAndClose should return hash code when the isBorrowing and isBorrower return true", () => {
    const creditLineService = container.services.creditLineService;

    // When isActive and isMutualConsent return true
    creditLineService.isBorrowing = jest.fn((contractAddress: string) => Promise.resolve(true));
    creditLineService.isBorrower = jest.fn((contractAddress: string) => Promise.resolve(true));
    (<any>creditLineService)['transactionService'] = {
      'populateTransaction': jest.fn(() => 'POPULATED_TRANSACTION'),
      'execute': jest.fn(() => {
        return {
          hash: 'TRANSACTION_HASH',
          wait: jest.fn(() => {
            Promise.resolve();
          })
        }
      })
    };
    expect(
      creditLineService.depositAndClose({
          lineAddress: LINE_ADDRESS,
          id: 'myId',
        }
      )).resolves.toBe('TRANSACTION_HASH');
  })

});
