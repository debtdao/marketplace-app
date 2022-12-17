import { BigNumber, ContractFunction, PopulatedTransaction, ethers } from 'ethers';
import { Interface } from '@ethersproject/abi';

import { TransactionService, Web3Provider, Config, ExecuteTransactionProps, Address, Network } from '@types';
import { getConfig } from '@config';
import { getLineFactoryforNetwork } from '@src/utils';

import { TransactionResponse } from '../types';

import { LineFactoryABI } from './contracts';

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
    // console.log(props);
    return <TransactionResponse>(
      await this.executeContractMethod( getLineFactoryforNetwork(props.network), 'deploySecuredLine', [borrower, ttl], props.network, true)
    );
  }

  public async deploySecuredLineWtihConfig(props: {
    borrower: string;
    ttl: BigNumber;
    network: Network;
    cratio: BigNumber;
    revenueSplit: BigNumber;
  }): Promise<TransactionResponse | PopulatedTransaction> {
    const { borrower, ttl, cratio, revenueSplit, network } = props;
    return await this.executeContractMethod(
      getLineFactoryforNetwork(network),
      'deploySecuredLineWithConfig',
      [{ borrower, ttl: ttl.toString(), cratio: cratio.toString(), revenueSplit: revenueSplit.toString() }],
      network,
      false
    );
  }

  public async deploySecuredLineWtihModules(props: {
    oldLine: string;
    network: Network;
    escrow: Address;
    spigot: Address;
  }): Promise<TransactionResponse | PopulatedTransaction> {
    const { oldLine, escrow, spigot, network } = props;
    const contractAddress = getLineFactoryforNetwork(props.network) as string;

    return await this.executeContractMethod(
      getLineFactoryforNetwork(network),
      'deploySecuredLineWithModules',
      [{ oldLine: oldLine.toString(), escrow: escrow.toString(), spigot: spigot.toString() }],
      network,
      false
    );
  }

  public async rolloverSecuredLine(
    contractAddress: Address,
    oldLine: string,
    borrower: string,
    ttl: BigNumber,
    dryRun: boolean,
    network: Network
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod(
      contractAddress,
      'rolloverSecuredLine',
      [oldLine, borrower, ttl],
      network,
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
