import { BigNumberish, ContractFunction, ethers, PopulatedTransaction } from 'ethers';
import { BytesLike } from '@ethersproject/bytes/src.ts';
import { keccak256 } from 'ethers/lib/utils';

import {
  CreditLineService,
  YearnSdk,
  CreditLine,
  TransactionService,
  Web3Provider,
  Config,
  Address,
  TransactionResponse,
  STATUS,
  ExecuteTransactionProps,
  AddCreditProps,
  Credit,
} from '@types';
import { getConfig } from '@config';
import { lineOfCreditABI } from '@services/contracts';
import { getContract } from '@frameworks/ethers';

export class CreditLineServiceImpl implements CreditLineService {
  private graphUrl: string;
  private web3Provider: Web3Provider;
  private transactionService: TransactionService;
  private config: Config;
  private readonly abi: Array<any>;
  private readonly contract: ContractFunction | any;
  private readonly contractAddress: Address;

  constructor({
    transactionService,
    yearnSdk,
    web3Provider,
    config,
    contractAddress,
  }: {
    transactionService: TransactionService;
    web3Provider: Web3Provider;
    yearnSdk: YearnSdk;
    config: Config;
    contractAddress: Address;
  }) {
    this.transactionService = transactionService;
    this.web3Provider = web3Provider;
    this.config = config;
    const { GRAPH_API_URL } = getConfig();
    this.graphUrl = GRAPH_API_URL || 'https://api.thegraph.com';
    this.abi = lineOfCreditABI;
    this.contractAddress = contractAddress;
    this.contract = getContract(contractAddress, lineOfCreditABI, this.web3Provider.getSigner().provider);
  }

  private async getSignerAddress(): Promise<Address> {
    return await this.web3Provider.getSigner().getAddress();
  }

  public async getCreditLines(): Promise<CreditLine[]> {
    const result = await fetch(`${this.graphUrl}/subgraphs/name/LineOfCredit/loan`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            Borrower {
              id          
            }
            Lender {
              id          
            }
        }`,
      }),
    });
    return await result.json();
  }

  public async addCredit(props: AddCreditProps, dryRun: boolean): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      if (dryRun) {
        return await this.transactionService.populateTransaction({
          network: 'mainnet',
          args: [props.drate, props.frate, props.amount, props.token, props.lender],
          methodName: 'addCredit',
          abi: this.abi,
          contractAddress: this.contractAddress,
        });
      }

      let tx;
      tx = await this.transactionService.execute({
        network: 'mainnet',
        args: [props.drate, props.frate, props.amount, props.token, props.lender],
        methodName: 'addCredit',
        abi: this.abi,
        contractAddress: this.contractAddress,
      });
      await tx.wait();
      return tx;
    } catch (e) {
      console.log(`An error occured while adding credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async close(id: BytesLike): Promise<TransactionResponse> {
    return <TransactionResponse>await this.executeContractMethod('close', [id], false);
  }

  public async setRates(
    id: BytesLike,
    drate: BigNumberish,
    frate: BigNumberish,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod('setRates', [id, drate, frate], dryRun);
  }

  public async increaseCredit(
    id: BytesLike,
    amount: BigNumberish,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod('increaseCredit', [id, amount], dryRun);
  }

  public async depositAndRepay(
    amount: BigNumberish,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod('depositAndRepay', [amount], dryRun);
  }

  public async depositAndClose(dryRun: boolean): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod('depositAndClose', [], dryRun);
  }

  private async executeContractMethod(methodName: string, params: any[], dryRun: boolean) {
    let props: ExecuteTransactionProps | undefined = undefined;
    try {
      props = {
        network: 'mainnet',
        args: params,
        methodName: methodName,
        abi: this.abi,
        contractAddress: this.contractAddress,
      };
      if (dryRun) {
        return await this.transactionService.populateTransaction(props);
      }

      let tx;
      tx = await this.transactionService.execute(props);
      await tx.wait();
      return tx;
    } catch (e) {
      console.log(
        `An error occured while ${methodName} with params [${params}] on CreditLine [${
          props?.contractAddress
        }], error = [${JSON.stringify(e)}] `
      );
      return Promise.reject(e);
    }
  }

  /* ============================= Helpers =============================*/

  public async getLenderByCreditID(id: BytesLike): Promise<Address> {
    return (await this.contract.credits(id)).lender;
  }

  public async getFirstID(): Promise<BytesLike> {
    return await this.contract.ids(0);
  }

  public async getCredit(id: BytesLike): Promise<Credit> {
    return await this.contract.credits(id);
  }

  public async borrower(): Promise<Address> {
    return await this.contract.borrower();
  }

  public async isActive(): Promise<boolean> {
    return (await this.contract.status()) === STATUS.ACTIVE;
  }

  public async isBorrowing(): Promise<boolean> {
    const id = await this.contract.ids(0);
    return (await this.contract.count()) !== 0 && (await this.contract.credits(id)).principal !== 0;
  }

  public async isBorrower(): Promise<boolean> {
    return (await this.getSignerAddress()) === (await this.contract.borrower());
  }

  public async isLender(): Promise<boolean> {
    return (await this.getSignerAddress()) === (await this.contract.lender());
  }

  public async isMutualConsent(
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

  public async isSignerBorrowerOrLender(id: BytesLike): Promise<boolean> {
    const signer = await this.getSignerAddress();
    const credit = await this.contract.credits(id);
    return signer === credit.lender || signer === (await this.contract.borrower());
  }
}
