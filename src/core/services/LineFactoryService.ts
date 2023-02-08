import { BigNumber, ContractFunction, PopulatedTransaction, ethers } from 'ethers';

import { TransactionService, Web3Provider, Config, ExecuteTransactionProps, Address, Network } from '@types';
import { getConfig } from '@config';
import { getLineFactoryforNetwork } from '@src/utils';
import { decodeErrorData } from '@src/utils/decodeError';
import { getContract } from '@frameworks/ethers';

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

  private _getLineFactoryContract(contractAddress: string) {
    return getContract(contractAddress.toString(), this.abi, this.web3Provider.getSigner().provider);
  }

  public async deploySpigot(
    contractAddress: Address,
    owner: string,
    borrower: string,
    operator: string,
    network: Network,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod(
      contractAddress,
      'deploySpigot',
      [owner, borrower, operator],
      network,
      dryRun
    );
  }

  public async deployEscrow(
    contractAddress: Address,
    owner: string,
    borrower: string,
    network: Network,
    dryRun: boolean
  ): Promise<TransactionResponse | PopulatedTransaction> {
    return await this.executeContractMethod(contractAddress, 'deployEscrow', [owner, borrower], network, dryRun);
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
      factoryAddress: getLineFactoryforNetwork(props.network),
    };
    console.log(data);
    return (await this.executeContractMethod(
      data.factoryAddress!,
      'deploySecuredLine',
      [data.borrower, data.ttl],
      props.network,
      true
    )) as TransactionResponse;
  }

  public async deploySecuredLineWtihConfig(props: {
    borrower: string;
    ttl: BigNumber;
    network: Network;
    cratio: BigNumber;
    revenueSplit: BigNumber;
  }): Promise<[transaction: TransactionResponse | PopulatedTransaction, lineAddress: string]> {
    const { borrower, ttl, cratio, revenueSplit, network } = props;
    const data = {
      borrower,
      ttl,
      cratio,
      revenueSplit,
      network,
      factoryAddress: getLineFactoryforNetwork(props.network),
    };
    const tx = await this.executeContractMethod(
      data.factoryAddress!,
      'deploySecuredLineWithConfig',
      [{ borrower, ttl: ttl.toString(), cratio: cratio.toString(), revenueSplit: revenueSplit.toString() }],
      network,
      false
    );
    const rc = await tx.wait();
    const [spigot, escrow, securedLine, x, y, z] = [...rc.logs];
    const { address: lineAddress } = securedLine;
    console.log('Tx Events: ', rc);
    console.log('Secured Line: ', securedLine);
    return [tx, lineAddress];
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
      contractAddress,
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
      // console.log('subgraph network props: ', props.network);
      tx = await this.transactionService.execute(props);
      // const rc = await tx.wait();
      // const [spigot, escrow, securedLine, x, y, z] = [...rc.logs];
      // const { address: lineAddress } = securedLine;
      // console.log('Tx Events: ', rc);
      // console.log('Secured Line: ', securedLine);
      return tx;
    } catch (e) {
      const txnData = JSON.parse(JSON.stringify(e)).transaction.data;
      // const humanErrorMsg = ethers.utils.formatBytes32String(txnData);
      console.log('Just the error 1', txnData);
      decodeErrorData(txnData);
      //console.log('Just the error 2', humanErrorMsg);
      console.log(
        `An error occured while ${methodName} with params [${params}] on FactoryLine [${props?.contractAddress}], error = [${e}]`
      );
      return Promise.reject(e);
    }
  }

  /* ============================= Helpers =============================*/

  public async arbiter(network: string): Promise<string> {
    const factoryAddress = getLineFactoryforNetwork(network)!;
    return (await this._getLineFactoryContract(factoryAddress)).arbiter();
  }
}
