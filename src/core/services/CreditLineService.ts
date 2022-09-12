import { BigNumberish, ethers, PopulatedTransaction } from 'ethers';
import { BytesLike } from '@ethersproject/bytes/src.ts';
import { keccak256 } from 'ethers/lib/utils';

import {
  CreditLineService,
  YearnSdk,
  CreditLine,
  TransactionService,
  Web3Provider,
  Config,
  GetCreditLinesProps,
  Address,
  TransactionResponse,
  STATUS,
  ExecuteTransactionProps,
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

  constructor({
    transactionService,
    yearnSdk,
    web3Provider,
    config,
  }: {
    transactionService: TransactionService;
    web3Provider: Web3Provider;
    yearnSdk: YearnSdk;
    config: Config;
  }) {
    this.transactionService = transactionService;
    this.web3Provider = web3Provider;
    this.config = config;
    const { GRAPH_API_URL } = getConfig();
    this.graphUrl = GRAPH_API_URL || 'https://api.thegraph.com';
    this.abi = lineOfCreditABI;
  }

  public async getCreditLines(params: GetCreditLinesProps): Promise<CreditLine[]> {
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

  public async addCredit(
    drate: BigNumberish,
    frate: BigNumberish,
    amount: BigNumberish,
    token: Address,
    lender: Address,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      if (dryRun) {
        return await this.transactionService.populateTransaction({
          network: 'mainnet',
          args: [drate, frate, amount, token, lender],
          methodName: 'addCredit',
          abi: this.abi,
          contractAddress: '', // Either read from config or from params
        });
      }

      let tx;
      tx = await this.transactionService.execute({
        network: 'mainnet',
        args: [drate, frate, amount, token, lender],
        methodName: 'addCredit',
        abi: this.abi,
        contractAddress: '', // Either read from config or from params
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

  public async getCredit(contractAddress: Address, id: BytesLike): Promise<Address> {
    try {
      const contract = getContract(contractAddress, this.abi, this.web3Provider.getInstanceOf('ethereum'));
      return (await contract.credits(id)).lender;
    } catch (e) {
      console.log(
        `An error occured while getting credit [${contractAddress}] with id [${id}], error = [${JSON.stringify(e)}]`
      );
      return Promise.reject(false);
    }
  }

  public async isActive(contractAddress: Address): Promise<boolean> {
    try {
      const contract = getContract(contractAddress, this.abi, this.web3Provider.getInstanceOf('ethereum'));
      return (await contract.status()) === STATUS.ACTIVE;
    } catch (e) {
      console.log(
        `An error occured while getting creditLine [${contractAddress}] status, error = [${JSON.stringify(e)}]`
      );
      return Promise.reject(false);
    }
  }

  public async isMutualConsent(
    contractAddress: Address,
    trxData: string | undefined,
    lender: Address
  ): Promise<boolean> {
    try {
      const contract = getContract(contractAddress, this.abi, this.web3Provider.getInstanceOf('ethereum'));
      const expectedHash = keccak256(ethers.utils.solidityPack(['string', 'address'], [trxData, lender]));
      return contract.mutualConsents(expectedHash);
    } catch (e) {
      console.log(
        `An error occured while getting creditLine [${contractAddress}] status, error = [${JSON.stringify(e)}]`
      );
      return Promise.reject(false);
    }
  }

  private async executeContractMethod(methodName: string, params: any[], dryRun: boolean) {
    let props: ExecuteTransactionProps | undefined = undefined;
    try {
      props = {
        network: 'mainnet',
        args: params,
        methodName: methodName,
        abi: this.abi,
        contractAddress: '', // Either read from config or from params
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
}
