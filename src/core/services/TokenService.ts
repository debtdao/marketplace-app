import { ethers } from 'ethers';
import { ERC20 } from '@yfi/sdk';

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
import {
  get,
  getUniqueAndCombine,
  normalizeUsdc,
  toBN,
  toTargetDecimalUnits,
  USD_PRICE_DECIMALS,
  USDC_DECIMALS,
} from '@utils';
import { getConstants } from '@config/constants';
import { getSupportedOracleTokens } from '@frameworks/gql';
import { getBalances } from '@src/utils/getTokenBalances';
import { tokens } from '@config/constants/supportedNetworks.json';

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
    // old token price fetching using yearn api
    // const yearn = this.yearnSdk.getInstanceOf(network);
    // TODO: only pulling 100 tokens from this repo instead of ~300: https://github.com/yearn/yearn-assets/tree/master/icons/multichain-tokens/1
    // const supportedTokens = await yearn.tokens.supported();

    const geckoNetworkName = network === 'mainnet' ? 'ethereum' : network;
    const networkTokens: ERC20[] = Object.values(tokens[network as keyof object]);

    const tokenPrices = await get(`https://api.coingecko.com/api/v3/simple/token_price/${geckoNetworkName}`, {
      withCredentials: false,
      params: {
        contract_addresses: networkTokens.map((token: any) => token.address).join(','),
        vs_currencies: 'usd',
      },
    });

    const formattedTokens: Token[] = Object.entries<any>(tokenPrices.data).map(
      ([address, price]: [string, any]): Token => {
        const tokenData = tokens[network as keyof object][ethers.utils.getAddress(address)] as ERC20;
        return {
          ...tokenData,
          priceUsdc: toTargetDecimalUnits(price.usd, 0, USDC_DECIMALS),
          dataSource: 'sdk',
          supported: {},
          metadata: {
            ...tokenData,
            description: '',
            website: '',
            localization: {
              en: {
                description: '',
              },
            },
          },
        };
      }
    );

    return formattedTokens;
  }

  public async getSupportedOracleTokens(): Promise<SupportedOracleTokenResponse | undefined> {
    const response = getSupportedOracleTokens(undefined)
      .then((data) => {
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

  public async getUserTokensData({ network, accountAddress }: GetUserTokensDataProps): Promise<Balance[]> {
    const { USE_MAINNET_FORK } = this.config;
    const yearn = this.yearnSdk.getInstanceOf(network);
    const balances = await getBalances(yearn, network, accountAddress);
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
    return (await this.transactionService.execute({
      network,
      methodName: 'approve',
      contractAddress: tokenAddress,
      abi: erc20Abi,
      args: [spenderAddress, amount],
    })) as TransactionResponse;
  }
}
