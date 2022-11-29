import {
  TokenService,
  YearnSdk,
  TokenDynamicData,
  ApproveProps,
  Web3Provider,
  Balance,
  Token,
  SupportedOracleTokenResponse,
  Integer,
  Config,
  TransactionResponse,
  TransactionService,
  GetSupportedTokensProps,
  GetTokensDynamicDataProps,
  GetUserTokensDataProps,
  GetTokenAllowanceProps,
} from '@types';
import { getContract } from '@frameworks/ethers';
import { get, getUniqueAndCombine, toBN, USDC_DECIMALS } from '@utils';
import { getConstants } from '@config/constants';
import { getSupportedOracleTokens } from '@frameworks/gql';

import erc20Abi from './contracts/erc20.json';

export class TokenServiceImpl implements TokenService {
  private transactionService: TransactionService;
  private yearnSdk: YearnSdk;
  private web3Provider: Web3Provider;
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
    this.yearnSdk = yearnSdk;
    this.web3Provider = web3Provider;
    this.config = config;
  }

  /* -------------------------------------------------------------------------- */
  /*                                Fetch Methods                               */
  /* -------------------------------------------------------------------------- */
  public async getSupportedTokens({ network }: GetSupportedTokensProps): Promise<Token[]> {
    const { WETH } = this.config.CONTRACT_ADDRESSES;
    const yearn = this.yearnSdk.getInstanceOf(network);
    console.log('TokenService Network: ', network);
    const supportedTokens = await yearn.tokens.supported();
    console.log('Yearn Supported Tokens Network: ', supportedTokens);

    // TODO: remove fixedSupportedTokens when WETH symbol is fixed on sdk
    const fixedSupportedTokens = supportedTokens.map((token) => ({
      ...token,
      symbol: token.address === WETH ? 'WETH' : token.symbol,
    }));
    return getUniqueAndCombine(fixedSupportedTokens, [], 'address');
  }

  // prop: GetSupportedOracleTokensProps
  public async getSupportedOracleTokens(): Promise<SupportedOracleTokenResponse | undefined> {
    // todo get all token prices from yearn add update store with values
    const response = getSupportedOracleTokens(undefined)
      .then((data) => {
        console.log('TokenService Response: ', data);
        return data;
      })
      .catch((err) => {
        console.log('TokenService: error fetching supported oracle tokens from subgraph', err);
        return undefined;
      });
    return response;
  }

  public async getTokensDynamicData({ network, addresses }: GetTokensDynamicDataProps): Promise<TokenDynamicData[]> {
    const yearn = this.yearnSdk.getInstanceOf(network);
    const pricesUsdcMap: any = await yearn.tokens.priceUsdc(addresses);
    return addresses.map((address: string) => ({ address, priceUsdc: pricesUsdcMap[address] }));
  }

  public async getUserTokensData({
    network,
    accountAddress,
    tokenAddresses,
  }: GetUserTokensDataProps): Promise<Balance[]> {
    const { USE_MAINNET_FORK } = this.config;
    const yearn = this.yearnSdk.getInstanceOf(network);
    const balances = await yearn.tokens.balances(accountAddress);
    if (USE_MAINNET_FORK) {
      return this.getBalancesForFork(balances, accountAddress);
    }
    return balances;
  }

  public async getTokenAllowance({
    network,
    accountAddress,
    tokenAddress,
    spenderAddress,
  }: GetTokenAllowanceProps): Promise<Integer> {
    // TODO use sdk when new method added.
    // const yearn = this.yearnSdk.getInstanceOf(network);
    // return await yearn.tokens.allowance(address);
    const signer = this.web3Provider.getSigner();
    const erc20Contract = getContract(tokenAddress, erc20Abi, signer);
    const allowance = await erc20Contract.allowance(accountAddress, spenderAddress);
    return allowance.toString();
  }

  private async getYvBoostToken(): Promise<Token> {
    const { YVBOOST } = this.config.CONTRACT_ADDRESSES;
    const { ASSETS_ICON_URL } = getConstants();
    const pricesResponse = await get('https://api.coingecko.com/api/v3/simple/price?ids=yvboost&vs_currencies=usd');
    const yvBoostPrice = pricesResponse.data['yvboost']['usd'];
    return {
      address: YVBOOST,
      decimals: '18',
      name: 'yvBOOST',
      priceUsdc: toBN(yvBoostPrice)
        .multipliedBy(10 ** USDC_DECIMALS)
        .toString(),
      dataSource: 'labs',
      supported: {
        zapper: false,
      },
      symbol: 'yvBOOST',
      icon: `${ASSETS_ICON_URL}${YVBOOST}/logo-128.png`,
    };
  }

  private async getBalancesForFork(balances: Balance[], userAddress: string): Promise<Balance[]> {
    const signer = this.web3Provider.getSigner();
    const provider = this.web3Provider.getInstanceOf('custom');
    const { DAI, YFI, ETH } = this.config.CONTRACT_ADDRESSES;

    const daiContract = getContract(DAI, erc20Abi, signer);
    const userDaiData = balances.find((balance) => balance.address === DAI);

    const yfiContract = getContract(YFI, erc20Abi, signer);
    const userYfiData = balances.find((balance) => balance.address === YFI);

    const userEthData = balances.find((balance) => balance.address === ETH);

    const [daiBalance, ethBalance, yfiBalance] = await Promise.all([
      daiContract.balanceOf(userAddress),
      provider.getBalance(userAddress),
      yfiContract.balanceOf(userAddress),
    ]);

    const newBalances: Balance[] = [];

    if (userDaiData) {
      const newUserDaiData = {
        ...userDaiData,
        balance: daiBalance.toString(),
        balanceUsdc: toBN(userDaiData.priceUsdc)
          .times(daiBalance.toString())
          .div(10 ** parseInt(userDaiData.token.decimals))
          .toFixed(0),
      };
      newBalances.push(newUserDaiData);
    }

    if (userYfiData) {
      const newUserYfiData = {
        ...userYfiData,
        balance: yfiBalance.toString(),
        balanceUsdc: toBN(userYfiData.priceUsdc)
          .times(yfiBalance.toString())
          .div(10 ** parseInt(userYfiData.token.decimals))
          .toFixed(0),
      };
      newBalances.push(newUserYfiData);
    }

    if (userEthData) {
      const newUserEthData = {
        ...userEthData,
        balance: ethBalance.toString(),
        balanceUsdc: toBN(userEthData.priceUsdc)
          .times(ethBalance.toString())
          .div(10 ** parseInt(userEthData.token.decimals))
          .toFixed(0),
      };
      newBalances.push(newUserEthData);
    }

    return newBalances;
  }

  /* -------------------------------------------------------------------------- */
  /*                             Transaction Methods                            */
  /* -------------------------------------------------------------------------- */
  public async approve(props: ApproveProps): Promise<TransactionResponse> {
    const { network, tokenAddress, spenderAddress, amount } = props;
    return await this.transactionService.execute({
      network,
      methodName: 'approve',
      contractAddress: tokenAddress,
      abi: erc20Abi,
      args: [spenderAddress, amount],
    });
  }
}
