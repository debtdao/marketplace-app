import {
  CreditLineService,
  YearnSdk,
  CreditLine,
  TransactionService,
  Web3Provider,
  Config,
  GetCreditLinesProps, Address, TransactionResponse,
} from '@types';
import { getConfig } from '@config';
import { BigNumberish } from "ethers";
import { lineOfCreditABI } from "@services/contracts";
import { BytesLike } from "@ethersproject/bytes/src.ts";

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
    // graphURL
    return [];
  }

  public async addCredit(drate: BigNumberish,
                         frate: BigNumberish,
                         amount: BigNumberish,
                         token: Address,
                         lender: Address): Promise<TransactionResponse> {
    let tx;
    try {
      tx = await this.transactionService.execute(
        {
          network: "mainnet",
          args: [drate, frate, amount, token, lender],
          methodName: "addCredit",
          abi: this.abi,
          contractAddress: "" // Either read from config or from params 
        }
      )
      await tx.wait();
      return tx
    } catch (e) {
      console.log(`An error occured while adding credit by [${tx?.from}], error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async close(id: BytesLike): Promise<TransactionResponse> {
    let tx;
    try {
      tx = await this.transactionService.execute(
        {
          network: "mainnet",
          args: [id],
          methodName: "close",
          abi: this.abi,
          contractAddress: "" // Either read from config or from params 
        }
      )
      await tx.wait();
      return tx
    } catch (e) {
      console.log(`An error occured while close CreditLine [${id}] by [${tx?.from}], error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async setRates(
    id: BytesLike,
    drate: BigNumberish,
    frate: BigNumberish
  ): Promise<TransactionResponse> {
    let tx;
    try {
      tx = await this.transactionService.execute(
        {
          network: "mainnet",
          args: [id, drate, frate],
          methodName: "setRates",
          abi: this.abi,
          contractAddress: "" // Either read from config or from params 
        }
      )
      await tx.wait();
      return tx
    } catch (e) {
      console.log(`An error occured while setRate of CreditLine [${id}] by [${tx?.from}], error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async increaseCredit(id: BytesLike, amount: BigNumberish): Promise<TransactionResponse> {
    let tx;
    try {
      tx = await this.transactionService.execute(
        {
          network: "mainnet",
          args: [id, amount],
          methodName: "increaseCredit",
          abi: this.abi,
          contractAddress: "" // Either read from config or from params 
        }
      )
      await tx.wait();
      return tx
    } catch (e) {
      console.log(`An error occured while increaseCredit of CreditLine [${id}] by [${tx?.from}], error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }
}
