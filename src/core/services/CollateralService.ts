import { BytesLike } from '@ethersproject/bytes/src.ts';
import { BigNumber, ethers, PopulatedTransaction } from 'ethers';

import {
  TransactionService,
  Web3Provider,
  Config,
  ExecuteTransactionProps,
  Address,
  ISpigotSetting,
  CollateralService,
  LiquidateEscrowAssetProps,
  CreditLineService,
  TransactionResponse,
  Network,
  UserPositionMetadata,
  BORROWER_POSITION_ROLE,
  LENDER_POSITION_ROLE,
  EnableCollateralAssetProps,
  AddCollateralProps,
  ReleaseCollateraltProps,
  ARBITER_POSITION_ROLE,
  ClaimAndRepayProps,
  ClaimAndTradeProps,
  SweepSpigotProps,
  ReleaseSpigotProps,
  AddSpigotProps,
  ACTIVE_STATUS,
  LIQUIDATABLE_STATUS,
  UseAndRepayProps,
  UpdateSpigotOwnerSplitProps,
  ClaimRevenueProps,
  TradeableProps,
} from '@types';
import { getConfig } from '@config';
import { getContract } from '@frameworks/ethers';
import { unnullify } from '@src/utils';

import { SecuredLineABI, SpigotABI } from './contracts';
import { EscrowABI } from './contracts';
// import { SpigotABI } from './contracts';

export class CollateralServiceImpl implements CollateralService {
  private graphUrl: string;
  private web3Provider: Web3Provider;
  private transactionService: TransactionService;
  private creditLineService: CreditLineService;
  private config: Config;
  private readonly lineAbi: Array<any>;
  private readonly spigotAbi: Array<any>;
  private readonly escrowAbi: Array<any>;

  constructor({
    transactionService,
    creditLineService,
    web3Provider,
    config,
  }: {
    transactionService: TransactionService;
    web3Provider: Web3Provider;
    config: Config;
    creditLineService: CreditLineService;
  }) {
    this.transactionService = transactionService;
    this.creditLineService = creditLineService;
    this.web3Provider = web3Provider;
    this.config = config;
    const { GRAPH_API_URL } = getConfig();
    this.graphUrl = GRAPH_API_URL || 'https://api.thegraph.com';
    this.lineAbi = SecuredLineABI;
    this.spigotAbi = SpigotABI;
    this.escrowAbi = EscrowABI;
  }

  private _getLineContract(contractAddress: string) {
    return getContract(contractAddress.toString(), this.lineAbi, this.web3Provider.getSigner().provider);
  }

  private _getEscrowContract(contractAddress: string) {
    return getContract(contractAddress.toString(), this.escrowAbi, this.web3Provider.getSigner().provider);
  }

  private _getSpigotContract(contractAddress: string) {
    return getContract(contractAddress.toString(), this.spigotAbi, this.web3Provider.getSigner().provider);
  }

  public async enableCollateral(
    props: EnableCollateralAssetProps
  ): Promise<TransactionResponse | PopulatedTransaction> {
    const { escrowAddress, network, dryRun, token } = props;

    // if (userPositionMetadata.role !== ARBITER_POSITION_ROLE)
    //   return Promise.reject(new Error("Can't enable collateral, not arbiter on line"));

    return await this.executeContractMethod(
      escrowAddress,
      this.escrowAbi,
      'enableCollateral',
      [token],
      network,
      dryRun
    );
  }

  public async addCollateral(props: AddCollateralProps): Promise<TransactionResponse | PopulatedTransaction> {
    // should have already approved tokens from user wallet to Escrow contract
    const { escrowAddress, network, dryRun, token, amount } = props;
    console.log('add collateral srv props', props);
    return await this.executeContractMethod(
      escrowAddress,
      this.escrowAbi,
      'addCollateral',
      [amount, token],
      network,
      dryRun
    );
  }

  public async releaseCollateral(props: ReleaseCollateraltProps): Promise<TransactionResponse | PopulatedTransaction> {
    const { escrowAddress, network, dryRun, token, amount, to } = props;
    // if (userPositionMetadata.role !== BORROWER_POSITION_ROLE)
    //   return Promise.reject(new Error("Can't release collateral, not borrower on line"));

    return await this.executeContractMethod(
      escrowAddress,
      this.escrowAbi,
      'releaseCollateral',
      [amount, token, to],
      network,
      dryRun
    );
  }

  public async addSpigot(props: AddSpigotProps): Promise<TransactionResponse | PopulatedTransaction> {
    // if (!(await this.isSpigotOwner(undefined, props.lineAddress))) {
    //   throw new Error('Cannot add spigot. Signer is not owner.');
    // }

    console.log('add spigot props', props);

    if (props.revenueContract === props.spigotAddress) {
      throw new Error('Invalid revenue contract address. `revenueContract` address is same as `spigotedLineAddress`');
    }

    if (props.revenueContract === props.lineAddress) {
      throw new Error('Invalid revenue contract address. `revenueContract` address is same as `spigotedLineAddress`');
    }

    if (props.setting.transferOwnerFunction.length === 0) {
      throw new Error('addSpigot: no tranfer owner function');
    }

    if (
      unnullify(props.setting.ownerSplit, true).lt(BigNumber.from(0)) ||
      unnullify(props.setting.ownerSplit, true).gt(this.maxSplit())
    ) {
      throw new Error('addSpigot: bad owner split');
    }

    const {
      setting: { ownerSplit, claimFunction, transferOwnerFunction },
    } = props;

    console.log(
      'line address ',
      props.lineAddress,
      'abi ',
      this.lineAbi,
      'settings ',
      [{ ownerSplit, claimFunction, transferOwnerFunction }],
      'settings ownersplit',
      props.setting.ownerSplit
    );

    return await this.executeContractMethod(
      props.lineAddress,
      this.lineAbi,
      'addSpigot',
      [
        props.revenueContract,
        {
          ownerSplit,
          claimFunction,
          transferOwnerFunction,
        },
      ],
      props.network
    );
  }

  public async updateOwnerSplit(
    props: UpdateSpigotOwnerSplitProps
  ): Promise<TransactionResponse | PopulatedTransaction> {
    // TODO get current status and split from subgraph and simulate calling updateSplit if it will change anything *return false)
    return await this.executeContractMethod(
      props.lineAddress,
      this.lineAbi,
      'updateOwnerSplit',
      [props.revenueContract],
      props.network
    );
  }

  // public async tradeable(props: TradeableProps): Promise<TransactionResponse | PopulatedTransaction> {
  //   return await this.executeContractMethod(
  //     props.lineAddress,
  //     this.lineAbi,
  //     'tradeable',
  //     [props.tokenAddress],
  //     props.network
  //   );
  // }

  public async claimRevenue(props: ClaimRevenueProps): Promise<TransactionResponse | PopulatedTransaction> {
    // TODO get current status and split from subgraph and simulate calling updateSplit if it will change anything *return false)

    const data = !props.claimData ? '0x00000000' : props.claimData; // default to push payment if no data passed

    console.log('collat svc: claimRevenu()', this.spigotAbi, data);
    return await this.executeContractMethod(
      props.spigotAddress,
      this.spigotAbi,
      'claimRevenue',
      [props.revenueContract, props.token, data],
      props.network
    );
  }

  // Liquidate functions

  public async releaseSpigot(props: ReleaseSpigotProps): Promise<TransactionResponse | PopulatedTransaction> {
    if (props.status === ACTIVE_STATUS) return Promise.reject();

    return await this.executeContractMethod(
      props.lineAddress,
      this.lineAbi,
      'releaseSpigot',
      [props.to],
      props.network,
      props.dryRun
    );
  }

  public async liquidate(props: LiquidateEscrowAssetProps): Promise<TransactionResponse | PopulatedTransaction> {
    try {
      const line = props.lineAddress;
      // TODO check that line is liquidatable

      // TODO check that collateral exists on contract
      // call Escrow.deposits(props.token) to get current escrowed amount to liquidate
      let data = {
        amount: props.amount,
        targetToken: props.token,
      };
      return <TransactionResponse>(
        await this.executeContractMethod(
          line,
          this.lineAbi,
          'liquidate',
          [data.amount, data.targetToken],
          props.network,
          false
        )
      );
    } catch (e) {
      console.log(`An error occured while borrowing credit, error = [${JSON.stringify(e)}]`);
      return Promise.reject(e);
    }
  }

  public async sweep(props: SweepSpigotProps): Promise<TransactionResponse | PopulatedTransaction> {
    // const role = props.userPositionMetadata.role;
    // if (props.status === ACTIVE_STATUS) Promise.reject();
    // if (props.status === LIQUIDATABLE_STATUS && role !== ARBITER_POSITION_ROLE) Promise.reject();
    // if (props.status === REPAID_STATUS && role !== BORROWER_POSITION_ROLE) Promise.reject();

    return await this.executeContractMethod(
      props.lineAddress,
      this.lineAbi,
      'sweep',
      [props.to, props.token],
      props.network,
      props.dryRun
    );
  }

  /* ============================= Helpers =============================*/

  private async getSignerAddress(): Promise<Address> {
    return await this.web3Provider.getSigner().getAddress();
  }

  public async isSpigotOwner(spigotAddress?: string, lineAddress?: string): Promise<boolean> {
    const operator = spigotAddress && (await this._getSpigotContract(spigotAddress).operator());
    const arbiter = lineAddress && (await this._getLineContract(lineAddress).arbiter());
    // TODO return UserCollateralMetadata for spigot and include operator type path
    return this.getSignerAddress() === operator || this.getSignerAddress() === arbiter;
  }

  public maxSplit(): BigNumber {
    return BigNumber.from(100);
  }

  public async getFirstID(lineAddress: string): Promise<BytesLike> {
    return await this.creditLineService.getFirstID(lineAddress);
  }

  public async defaultSplit(lineAddress: string): Promise<BigNumber> {
    return (await this._getLineContract(lineAddress)).defaultRevenueSplit();
  }

  public async getTradeableTokens(lineAddress: string, tokenAddress: string): Promise<BigNumber> {
    return await this._getLineContract(lineAddress).tradeable(tokenAddress);
  }

  public async getOwnerTokens(spigotAddress: string, tokenAddress: string): Promise<BigNumber> {
    return await this._getSpigotContract(spigotAddress).getOwnerTokens(tokenAddress);
  }

  public async getOperatorTokens(spigotAddress: string, tokenAddress: string): Promise<BigNumber> {
    return await this._getSpigotContract(spigotAddress).getOperatorTokens(tokenAddress);
  }

  // todo pass in user position metadata state where used instead

  // public async isBorrower(lineAddress: string): Promise<boolean> {
  //   return (await this.getSignerAddress()) === (await this.borrower(lineAddress));
  // }

  // public async isSignerBorrowerOrLender(lineAddress: string, id: BytesLike): Promise<boolean> {
  //   const signer = await this.getSignerAddress();
  //   const credit = await this.creditLineService.getCredit(lineAddress, id);
  //   return signer === credit.lender || signer === (await this.borrower(lineAddress));
  // }

  private async executeContractMethod(
    contractAddress: string,
    abi: Array<any>,
    methodName: string,
    params: any[],
    network: Network,
    dryRun: boolean = false
  ): Promise<TransactionResponse | PopulatedTransaction> {
    let props: ExecuteTransactionProps | undefined = undefined;
    // TODO. pass network as param all the way down from actions
    // const { getSigner } = this.web3Provider;
    // const user = getSigner();

    console.log(`CollateralService Tx - ${network}: ${contractAddress}.${methodName}(${params.join(', ')})`);
    try {
      props = {
        network: network,
        contractAddress: contractAddress,
        abi,
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
      console.log(
        `An error occured while ${methodName} with params [${params}] on contract [${props?.contractAddress}], error = ${e} `
      );
      return Promise.reject(e);
    }
  }
}

// TODO: Remove this commented code from the original tradeable function call.
// import { Contract } from '@ethersproject/contracts';

// import { getConfig } from '@config';

// const { MAINNET_PROVIDER_HTTPS, ARBITRUM_PROVIDER_HTTPS, GOERLI_PROVIDER_HTTPS } = getConfig();
// const { NETWORK, CHAIN_IDS, CHAIN_NAMES } = getConfig();

// export const getTradeableTokens = (
//   lineAddress: string,
//   abi: any,
//   provider: any,
//   tokenAddress: string,
//   network: string
// ): string => {
//   const contract = new Contract(lineAddress, abi, provider);
//   const result = contract.functions.tradeable().call();
//   console.log('Tradeable Call: ', result);
//   return '';
// };
