import { ContractFunction, ethers, PopulatedTransaction, BigNumber } from 'ethers';
import { BytesLike } from '@ethersproject/bytes/src.ts';
import { keccak256 } from 'ethers/lib/utils';

import {
  BorrowCreditProps,
  CreditLineService,
  SecuredLine,
  TransactionService,
  Web3Provider,
  Config,
  Address,
  TransactionResponse,
  STATUS,
  ExecuteTransactionProps,
  CreditPosition,
  GetUserLinesProps,
  GetLineArgs,
  GetLinesArgs,
  GetLineEventsArgs,
  GetLinePageArgs,
  GetUserPortfolioArgs,
  AddCreditProps,
  CloseProps,
  WithdrawLineProps,
  RevokeConsentProps,
  SetRatesProps,
  IncreaseCreditProps,
  DepositAndRepayProps,
  DepositAndCloseProps,
  GetLinesResponse,
  GetLinePageResponse,
  Network,
  GetUserPortfolioProps,
  GetUserPortfolioResponse,
  UseAndRepayProps,
  ClaimAndRepayProps,
  ClaimAndTradeProps,
  GetLineEventsProps,
  GetLineEventsResponse,
  LineEventFragResponse,
} from '@types';
import { getConfig } from '@config';
import { SecuredLineABI } from '@services/contracts';
import { getContract } from '@frameworks/ethers';
import {
  getLineEvents as queryLineEvents,
  getLinePage as queryLinePage,
  getLines as queryLines,
  getUserPortfolio as queryPortfolio,
} from '@frameworks/gql';
import { decodeErrorData } from '@src/utils/decodeError';

const { MAINNET_GRAPH_API_URL } = getConfig();

export class CreditLineServiceImpl implements CreditLineService {
  private web3Provider: Web3Provider;
  private transactionService: TransactionService;
  private config: Config;
  private readonly abi: Array<any>;
  private readonly contract: ContractFunction | any;

  constructor({
    transactionService,
    web3Provider,
    config,
  }: {
    transactionService: TransactionService;
    web3Provider: Web3Provider;
    config: Config;
  }) {
    this.transactionService = transactionService;
    this.web3Provider = web3Provider;
    this.config = config;

    this.abi = SecuredLineABI;
  }

  private _getContract(contractAddress: string) {
    return getContract(contractAddress.toString(), SecuredLineABI, this.web3Provider.getSigner().provider);
  }

  private async getSignerAddress(): Promise<Address> {
    return await this.web3Provider.getSigner().getAddress();
  }

  public async close(props: CloseProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      if (!(await this.isSignerBorrowerOrLender(props.lineAddress, props.id))) {
        throw new Error('Unable to close. Signer is not borrower or lender');
      }
      return this.executeContractMethod(props.lineAddress, 'close', [props.id], props.network);
    } catch (e) {
      console.log(`An error occured while closing credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async withdraw(props: WithdrawLineProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      if (!(await this.isLender(props.lineAddress, props.id))) {
        throw new Error('Cannot withdraw. Signer is not lender');
      }

      return (await this.executeContractMethod(
        props.lineAddress,
        'withdraw',
        [props.id, props.amount],
        props.network
      )) as TransactionResponse;
    } catch (e) {
      console.log(`An error occured while withdrawing credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async revokeConsent(props: RevokeConsentProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      // TODO: Add a check to see if the signer is the maker of the proposal.
      // if (!(await this.isLender(props.lineAddress, props.id))) {
      //   throw new Error('Cannot revoke consent. Signer is not lender');
      // }
      return (await this.executeContractMethod(
        props.lineAddress,
        'revokeConsent',
        [props.msgData],
        props.network
      )) as TransactionResponse;
    } catch (e) {
      console.log(`An error occured while revoking consent, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async setRates(props: SetRatesProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      const { lineAddress: line, id } = props;
      // check mutualConsentById
      const populatedTrx = (await this.executeContractMethod(
        props.lineAddress,
        'setRates',
        [props.id, props.drate, props.frate],
        props.network,
        true
      )) as TransactionResponse;
      const borrower = await this.borrower(line);
      const lender = await this.getLenderByCreditID(line, id);
      if (!(await this.isMutualConsent(line, populatedTrx.data, borrower, lender))) {
        throw new Error(
          `Setting rate is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.lineAddress}]`
        );
      }
      return populatedTrx;
    } catch (e) {
      console.log(`An error occured while setting rate, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async increaseCredit(props: IncreaseCreditProps): Promise<string> {
    try {
      const line = props.lineAddress;
      if (await this.isActive(line)) {
        throw new Error(`Increasing credit is not possible. reason: "The given creditLine [${line}] is not active"`);
      }

      // check mutualConsentById
      const populatedTrx = await this.executeContractMethod(
        props.lineAddress,
        'increaseCredit',
        [props.id, props.amount],
        props.network,
        true
      );

      const borrower = await this.borrower(line);
      const lender = await this.getLenderByCreditID(line, props.id);
      if (!(await this.isMutualConsent(line, populatedTrx.data, borrower, lender))) {
        throw new Error(
          `Increasing credit is not possible. reason: "Consent has not been initialized by other party for the given creditLine [${props.lineAddress}]`
        );
      }

      return (<TransactionResponse>(
        await this.executeContractMethod(props.lineAddress, 'increaseCredit', [props.id, props.amount], props.network)
      )).hash;
    } catch (e) {
      console.log(`An error occured while increasing credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async depositAndRepay(props: DepositAndRepayProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      //if (!(await this.isBorrowing(props.lineAddress))) {
      //  throw new Error('Deposit and repay is not possible because not borrowing');
      //}

      //const id = await this.getFirstID(props.lineAddress);
      //const credit = await this.getCredit(props.lineAddress, id);

      // check interest accrual
      // note: `accrueInterest` will not be called because it has a modifier that is expecting
      // line of credit to be the msg.sender. We should probably update that modifier since
      // it only does the calculation and doesn't change state.
      //const calcAccrue = await interest.accrueInterest({
      //contractAddress: await this.getInterestRateContract(props.lineAddress),
      //id,
      //drawnBalance: utils.parseUnits(credit.principal, 'ether'),
      //facilityBalance: utils.parseUnits(credit.deposit, 'ether'),
      //});
      //const simulateAccrue = unnullify(credit.interestAccrued, true).add(calcAccrue);
      //if (unnullify(props.amount, true).gt(unnullify(credit.principal, true).add(simulateAccrue))) {
      //  throw new Error('Amount is greater than (principal + interest to be accrued). Enter lower amount.');
      //}

      console.log('Deposit and Repay Params: ', props.lineAddress, props.amount, props.network);
      return <TransactionResponse>(
        await this.executeContractMethod(props.lineAddress, 'depositAndRepay', [props.amount], props.network)
      );
    } catch (e) {
      console.log(e);
      const txnData = JSON.parse(JSON.stringify(e)).transaction.data;
      console.log('Just the error 1', txnData);
      decodeErrorData(txnData);
      console.log(`An error occured while depositAndRepay credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async depositAndClose(props: DepositAndCloseProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      if (!(await this.isBorrowing(props.lineAddress))) {
        throw new Error('Deposit and close is not possible because not borrowing');
      }
      if (!(await this.isBorrower(props.lineAddress))) {
        throw new Error('Deposit and close is not possible because signer is not borrower');
      }

      return <TransactionResponse>(
        await this.executeContractMethod(props.lineAddress, 'depositAndClose', [], props.network)
      );
    } catch (e) {
      console.log(`An error occured while depositAndClose credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  // Trade and repay functions from spigot revenue collateral
  public async claimAndTrade(props: ClaimAndTradeProps): Promise<TransactionResponse | PopulatedTransaction> {
    console.log('credit svc: claimAndtrade()', props, await this.isBorrowing(props.lineAddress));

    if (!(await this.isBorrowing(props.lineAddress))) {
      throw new Error('Claim and trade is not possible because not borrowing');
    }

    // TODO call contract for first position and check that props.buyToken == credits[0].token
    if ((await this.getSignerAddress()) !== (await this.arbiter(props.lineAddress))) {
      throw new Error('Claim and trade is blocked if not from arbiter address');
    }

    // TODO check that there are tokens to claim on spigot
    // TODO simulate trade and try to check against known token prices

    return await this.executeContractMethod(
      props.lineAddress,
      'claimAndTrade',
      [props.claimToken, props.zeroExTradeData],
      props.network
    );
  }

  public async claimAndRepay(props: ClaimAndRepayProps): Promise<TransactionResponse | PopulatedTransaction> {
    console.log('credit svc: claimAndRepay()', props, await this.isBorrowing(props.lineAddress));
    if (!(await this.isBorrowing(props.lineAddress))) {
      throw new Error('Claim and repay is not possible because not borrowing');
    }

    if ((await this.getSignerAddress()) !== (await this.arbiter(props.lineAddress))) {
      throw new Error('Claim and trade is blocked if not from arbiter address');
    }

    console.log('sending claim and repay tx');
    return await this.executeContractMethod(
      props.lineAddress,
      'claimAndRepay',
      [props.claimToken, props.zeroExTradeData],
      props.network
    );
  }

  public async useAndRepay(props: UseAndRepayProps): Promise<TransactionResponse | PopulatedTransaction> {
    // TODO check unused is <= amount
    // TODO Only borrower or lender
    return await this.executeContractMethod(props.lineAddress, 'useAndRepay', [props.amount], props.network);
  }

  public async addCredit(props: AddCreditProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      const line = props.lineAddress;
      // check if status is ACTIVE
      //if (!(await this.isActive(line))) {
      // throw new Error(`Adding credit is not possible. reason: "The given creditLine [${line}] is not active`);
      // }
      //const populatedTrx = await this.executeContractMethod(
      //props.lineAddress,
      //'addCredit',
      //[props.drate, props.frate, props.amount, props.token, props.lender],
      //true
      //);
      // check mutualConsent
      console.log('this is line address', line);

      let data = {
        drate: props.drate,
        frate: props.frate,
        amount: props.amount,
        token: props.token,
        lender: props.lender,
        network: props.network,
      };

      return (await this.executeContractMethod(
        line,
        'addCredit',
        [data.drate, data.frate, data.amount, data.token.address, data.lender],
        props.network,
        true
      )) as TransactionResponse;
    } catch (e) {
      console.log(`An error occured while adding credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async borrow(props: BorrowCreditProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      const line = props.line;

      let data = {
        id: props.positionId,
        amount: props.amount,
      };

      return <TransactionResponse>(
        await this.executeContractMethod(line, 'borrow', [data.id, data.amount], props.network, false)
      );
    } catch (e) {
      console.log(`An error occured while borrowing credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  private async executeContractMethod(
    contractAddress: string,
    methodName: string,
    params: any[],
    network: Network,
    dryRun: boolean = false
  ): Promise<TransactionResponse | PopulatedTransaction> {
    let props: ExecuteTransactionProps | undefined = undefined;
    // TODO. pass network as param all the way down from actions
    // const { getSigner } = this.web3Provider;
    // const user = getSigner();
    console.log(`CreditService Tx - ${network}: ${contractAddress}.${methodName}(${params.join(', ')})`);
    try {
      props = {
        network: network,
        contractAddress: contractAddress,
        abi: this.abi,
        args: params,
        methodName: methodName,
        overrides: {
          gasLimit: 600000,
        },
      };

      const tx = await this.transactionService.execute(props);
      await tx.wait();
      return tx;
    } catch (e) {
      // console.log(e);
      // const txnData = JSON.parse(JSON.stringify(e)).transaction.data;
      // console.log('Just the error 1', txnData);
      // decodeErrorData(txnData);
      console.log(
        `An error occured while ${methodName} with params [${params}] on CreditLine [${props?.contractAddress}], error = ${e} `
      );
      return Promise.reject(e);
    }
  }

  /* ============================= Helpers =============================*/

  public async getLenderByCreditID(contractAddress: string, id: BytesLike): Promise<Address> {
    return (await this._getContract(contractAddress).credits(id)).lender;
  }

  public async getInterestAccrued(contractAddress: string, id: BytesLike): Promise<BigNumber> {
    return await this._getContract(contractAddress).interestAccrued(id);
  }

  public async getInterestRateContract(contractAddress: string): Promise<Address> {
    return await this._getContract(contractAddress).interestRate();
  }

  public async getFirstID(contractAddress: string): Promise<BytesLike> {
    return await this._getContract(contractAddress).ids(0);
  }

  public async getCredit(contractAddress: string, id: BytesLike): Promise<CreditPosition> {
    return await this._getContract(contractAddress).credits(id);
  }

  public async borrower(contractAddress: string): Promise<Address> {
    return await this._getContract(contractAddress).borrower();
  }

  public async arbiter(contractAddress: string): Promise<Address> {
    return await this._getContract(contractAddress).arbiter();
  }

  public async isActive(contractAddress: string): Promise<boolean> {
    return (await this._getContract(contractAddress).status()) === STATUS.ACTIVE;
  }

  public async isBorrowing(contractAddress: string): Promise<boolean> {
    const id = await this._getContract(contractAddress).ids(0);
    return (
      (await this._getContract(contractAddress).counts()[0]) !== 0 &&
      (await this._getContract(contractAddress).credits(id)).principal !== 0
    );
  }

  public async isBorrower(contractAddress: string): Promise<boolean> {
    return (await this.getSignerAddress()) === (await this._getContract(contractAddress).borrower());
  }

  public async isLender(contractAddress: string, id: BytesLike): Promise<boolean> {
    return (await this.getSignerAddress()) === (await this.getLenderByCreditID(contractAddress, id));
  }

  // public async isLenderOnLine(contractAddress: string): Promise<boolean> {
  //   return (await this.getSignerAddress()) === (await this.getLenderByCreditID(contractAddress, id));
  // }

  public async isMutualConsent(
    contractAddress: string,
    trxData: string | undefined,
    signerOne: Address,
    signerTwo: Address
  ): Promise<boolean> {
    const signer = await this.getSignerAddress();
    const isSignerValid = signer === signerOne || signer === signerTwo;
    const nonCaller = signer === signerOne ? signerTwo : signerOne;
    const expectedHash = keccak256(ethers.utils.solidityPack(['string', 'address'], [trxData, nonCaller]));
    return isSignerValid && this.contract.mutualConsents(expectedHash);
  }

  public async isSignerBorrowerOrLender(contractAddress: string, id: BytesLike): Promise<boolean> {
    const signer = await this.getSignerAddress();
    const credit = await this._getContract(contractAddress).credits(id);
    return signer === credit.lender || signer === (await this.borrower(contractAddress));
  }

  /* Subgraph Getters */

  public async getLine(props: GetLineArgs): Promise<SecuredLine | undefined> {
    return;
  }

  public async getLines(prop: GetLinesArgs): Promise<GetLinesResponse[] | undefined> {
    // todo get all token prices from yearn add update store with values
    const response = queryLines(prop)
      .then((data) => {
        return data;
      })
      .catch((err) => {
        console.log('CreditLineService: error fetching lines', err);
        return undefined;
      });
    return response;
  }

  public async getLineEvents(prop: GetLineEventsArgs): Promise<GetLineEventsResponse | undefined> {
    const response = queryLineEvents(prop)
      .then((data) => data)
      .catch((err) => {
        console.log('CreditLineService: error fetching line events', err);
        return undefined;
      });
    return response;
  }

  public async getLinePage(prop: GetLinePageArgs): Promise<GetLinePageResponse | undefined> {
    const response = queryLinePage(prop)
      .then((data) => data)
      .catch((err) => {
        console.log('CreditLineService: error fetching line page data', err);
        return undefined;
      });

    return response;
  }

  public async getUserLinePositions(prop: GetLinesArgs): Promise<any | undefined> {
    const response = queryLines(prop)
      .then((data) => {
        console.log(data);
      })
      .catch((err) => {
        console.log('CreditLineService error fetching user lines', err);
        return undefined;
      });
    return response;
  }

  public async getUserPortfolio(prop: GetUserPortfolioArgs): Promise<GetUserPortfolioResponse | undefined> {
    const response = queryPortfolio(prop)
      .then((data) => data)
      .catch((err) => {
        console.log('CreditLineService error fetching user portfolio', err);
        return undefined;
      });
    return response;
  }

  public async getExpectedTransactionOutcome(): Promise<any | undefined> {
    return;
  }

  public async approveDeposit(): Promise<any | undefined> {
    return;
  }

  // public async approveZapOu:  () => Promise<any>t: {
  //   return;
  // };
  // public async signPermi:  () => Promise<any>t: {
  //   return;
  // };
  public async getDepositAllowance(): Promise<any | undefined> {
    return;
  }

  public async getWithdrawAllowance(): Promise<any | undefined> {
    return;
  }
}
