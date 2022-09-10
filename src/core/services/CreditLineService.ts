import {
  CreditLineService,
  YearnSdk,
  CreditLine,
  TransactionService,
  Web3Provider,
  Config,
  GetCreditLinesProps, Address, TransactionResponse, STATUS,
} from '@types';
import { getConfig } from '@config';
import { BigNumberish, ethers, PopulatedTransaction } from "ethers";
import { lineOfCreditABI } from "@services/contracts";
import { BytesLike } from "@ethersproject/bytes/src.ts";
import { getContract } from "@frameworks/ethers";
import { keccak256 } from "ethers/lib/utils";

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
      method: 'POST',
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
    }`
      }),
    })
    return await result.json();
  }

  public async addCredit(drate: BigNumberish,
                         frate: BigNumberish,
                         amount: BigNumberish,
                         token: Address,
                         lender: Address,
                         dryRun: boolean): Promise<TransactionResponse | PopulatedTransaction> {

    try {
      if (dryRun) {
        return await this.transactionService.populateTransaction({
          network: "mainnet",
          args: [drate, frate, amount, token, lender],
          methodName: "addCredit",
          abi: this.abi,
          contractAddress: "" // Either read from config or from params 
        })
      }

      let tx;
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
      console.log(`An error occured while adding credit, error = [${JSON.stringify(e)}]`);
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
    frate: BigNumberish,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      if (dryRun) {
        return await this.transactionService.populateTransaction({
            network: "mainnet",
            args: [id, drate, frate],
            methodName: "setRates",
            abi: this.abi,
            contractAddress: "" // Either read from config or from params 
          }
        )
      }

      let tx;
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
      console.log(`An error occured while setRate of CreditLine [${id}], error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async increaseCredit(id: BytesLike, amount: BigNumberish, dryRun: boolean): Promise<TransactionResponse | PopulatedTransaction> {

    try {
      if (dryRun) {
        return await this.transactionService.populateTransaction({
            network: "mainnet",
            args: [id, amount],
            methodName: "increaseCredit",
            abi: this.abi,
            contractAddress: "" // Either read from config or from params 
          }
        )
      }

      let tx;
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
      console.log(`An error occured while increaseCredit of CreditLine [${id}], error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async getCredit(contractAddress: Address, id: BytesLike): Promise<Address> {
    try {
      const contract = getContract(contractAddress, this.abi, this.web3Provider.getInstanceOf('ethereum'));
      return (await contract.credits(id)).lender;
    } catch (e) {
      console.log(`An error occured while getting credit [${contractAddress}] with id [${id}], error = [${JSON.stringify(e)}]`);
      return Promise.reject(false);
    }
  }


  public async isActive(contractAddress: Address): Promise<boolean> {
    try {
      const contract = getContract(contractAddress, this.abi, this.web3Provider.getInstanceOf('ethereum'));
      return (await contract.status()) === STATUS.ACTIVE;
    } catch (e) {
      console.log(`An error occured while getting creditLine [${contractAddress}] status, error = [${JSON.stringify(e)}]`);
      return Promise.reject(false);
    }
  }

  public async isMutualConsent(contractAddress: Address, trxData: string | undefined, lender: Address): Promise<boolean> {
    try {
      const contract = getContract(contractAddress, this.abi, this.web3Provider.getInstanceOf('ethereum'));
      const expectedHash = keccak256(ethers.utils.solidityPack(['string', 'address'], [trxData, lender]));
      return contract.mutualConsents(expectedHash);
    } catch (e) {
      console.log(`An error occured while getting creditLine [${contractAddress}] status, error = [${JSON.stringify(e)}]`);
      return Promise.reject(false);
    }
  }
}
