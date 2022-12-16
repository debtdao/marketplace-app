import { BigNumber, ContractFunction, PopulatedTransaction, ethers } from 'ethers';

import { TransactionService, Web3Provider, Config, ExecuteTransactionProps, Address, Network } from '@types';
import { getConfig } from '@config';

import { TransactionResponse } from '../types';

import { LineFactoryABI } from './contracts';

const { LINEFACTORY_GOERLI } = getConfig();

export class LineFactoryServiceImpl {
  private graphUrl: string;
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
    contractAddress: Address;
  }) {
    this.transactionService = transactionService;
    this.web3Provider = web3Provider;
    this.config = config;
    const { GRAPH_API_URL } = getConfig();
    this.graphUrl = GRAPH_API_URL || 'https://api.thegraph.com';
    this.abi = LineFactoryABI;
  }

  public async deploySpigot(
    contractAddress: Address,
    owner: string,
    borrower: string,
    operator: string,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod(
      contractAddress,
      'deploySpigot',
      [owner, borrower, operator],
      'goerli',
      dryRun
    );
  }

  public async deployEscrow(
    contractAddress: Address,
    owner: string,
    borrower: string,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod(contractAddress, 'deployEscrow', [owner, borrower], 'goerli', dryRun);
  }

  public async deploySecuredLine(props: {
    borrower: string;
    ttl: number;
    network: Network;
  }): Promise<ethers.providers.TransactionResponse | PopulatedTransaction> {
    const { borrower, ttl } = props;
    const data = {
      borrower,
      ttl,
      factoryAddress: LINEFACTORY_GOERLI,
    };
    console.log(data);
    return <TransactionResponse>(
      await this.executeContractMethod(
        data.factoryAddress,
        'deploySecuredLine',
        [data.borrower, data.ttl],
        props.network,
        true
      )
    );
  }

  public async deploySecuredLineWtihConfig(props: {
    borrower: Address;
    ttl: number;
    network: Network;
    cratio: number;
    revenueSplit: number;
  }): Promise<TransactionResponse | PopulatedTransaction> {
    const { borrower, ttl, cratio, revenueSplit, network } = props;

    // {"internalType":"address","name":"borrower","type":"address"},
    // {"internalType":"uint256","name":"ttl","type":"uint256"},
    // {"internalType":"uint32","name":"cratio","type":"uint32"},
    // {"internalType":"uint8","name":"revenueSplit","type":"uint8"}

    const coreParams = ethers.utils.defaultAbiCoder.encode(
      ['tuple(address b,uint256 t,uint32 c,uint8 r)'],
      [{ b: borrower, t: ttl, c: cratio, r: revenueSplit }]
    );

    return await this.executeContractMethod(
      LINEFACTORY_GOERLI,
      'deploySecuredLineWithConfig',
      [coreParams],
      network,
      false
    );
  }

  public async rolloverSecuredLine(
    contractAddress: Address,
    oldLine: string,
    borrower: string,
    ttl: BigNumber,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod(
      contractAddress,
      'rolloverSecuredLine',
      [oldLine, borrower, ttl],
      'goerli',
      dryRun
    );
  }

  private async executeContractMethod(
    contractAddress: string,
    methodName: string,
    params: any[],
    network: Network,
    dryRun: boolean
  ) {
    let props: ExecuteTransactionProps | undefined = undefined;
    try {
      props = {
        network: network,
        args: params,
        methodName: methodName,
        abi: this.abi,
        contractAddress: contractAddress,
      };

      let tx;
      tx = await this.transactionService.execute(props);
      await tx.wait();
      return tx;
    } catch (e) {
      console.log(
        `An error occured while ${methodName} with params [${params}] on FactoryLine [${props?.contractAddress}], error = [${e}]`
      );
      return Promise.reject(e);
    }
  }
}
