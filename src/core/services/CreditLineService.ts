import {
  CreditLineService,
  YearnSdk,
  TokenDynamicData,
  CreditLine,
  ApproveProps,
  TransactionService,
  Web3Provider,
  Balance,
  Token,
  Integer,
  Config,
  Network,
  CreditLinePage,
  GetLineProps,
  GetLinesProps,
  GetLinePageProps,
} from '@types';
import { getConfig } from '@config';
import { getLine, getLinePage, getLines, getUserLinePositions } from '@frameworks/gql';

export class CreditLineServiceImpl implements CreditLineService {
  private graphUrl: string;
  private web3Provider: Web3Provider;
  private transactionService: TransactionService;
  private config: Config;

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
  }

  public async getLine(prop: GetLineProps): Promise<CreditLine> {
    // graphURL
    return (await getLine(prop.params)).data;
  }

  public async getLines(prop: GetLinesProps): Promise<CreditLine[]> {
    return [];
  }

  public async getLinePage(prop: GetLinePageProps): Promise<CreditLinePage> {
    return {};
  }
  public async getUserLinePositions(): Promise<any> {
    return null;
  }
  public async getExpectedTransactionOutcome(): Promise<any> {
    return null;
  }
  public async approveDeposit(): Promise<any> {
    return null;
  }
  // public async approveZapOu:  () => Promise<any>t: {
  //   return null;
  // };
  // public async signPermi:  () => Promise<any>t: {
  //   return null;
  // };
  public async deposit(): Promise<any> {
    return null;
  }
  public async withdraw(): Promise<any> {
    return null;
  }
  public async getDepositAllowance(): Promise<any> {
    return null;
  }
  public async getWithdrawAllowance(): Promise<any> {
    return null;
  }
}
