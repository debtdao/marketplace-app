import { BigNumberish, BigNumber, ContractFunction, PopulatedTransaction } from 'ethers';

import {
  YearnSdk,
  TransactionService,
  Web3Provider,
  Config,
  ExecuteTransactionProps,
  Address,
  LineFactoryService,
} from '@types';

import { getConfig } from '@config';
import { getContract } from '@frameworks/ethers';

import { TransactionResponse } from '../types';

import { LineFactoryABI } from './contracts';


export class LineFactoryServiceImpl implements LineFactoryService {

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
    this.abi = LineFactoryABI;
    this.contractAddress = contractAddress;
    this.contract = getContract(contractAddress, LineFactoryABI, this.web3Provider.getSigner().provider);
  }


  public async deploySpigot(
    owner: string, 
    borrower: string, 
    operator: string
    ): Promise<TransactionResponse | PopulatedTransaction> {
      
  }

  public async deployEscrow(
    minCRatio: BigNumber, 
    oracle: string, 
    owner: string, 
    borrower: string
    ): Promise<TransactionResponse | PopulatedTransaction> {
      
  }

  public async deploySecuredLine(
    oracle: string, arbiter: 
    string, borrower: string, 
    ttl: BigNumber, 
    swapTarget: string
    ): Promise<TransactionResponse | PopulatedTransaction> {
      
  }

  public async deploySecuredLineWtihConfig(
    oracle: string, 
    arbiter: string, 
    borrower: string, 
    ttl: BigNumber, 
    revenueSplit: BigNumber, 
    cratio: BigNumber, 
    swapTarget: string
    ): Promise<TransactionResponse | PopulatedTransaction> {
      
  }

  public async rolloverSecuredLine(
    oldLine: string, 
    borrower: string, 
    oracle: string, 
    arbiter: string, 
    ttl: BigNumber
    ): Promise<TransactionResponse | PopulatedTransaction> {
      
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
        `An error occured while ${methodName} with params [${params}] on SpigotedLine [${
          props?.contractAddress
        }], error = [${JSON.stringify(e)}]`
      );
      return Promise.reject(e);
    }
  }
}