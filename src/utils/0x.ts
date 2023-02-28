import { PopulatedTransaction } from 'ethers';

import { Network, GetTradeQuoteProps, ZeroExAPIQuoteResponse, ZeroExAPIValidationError } from '@types';

import { get } from './http';

const getBaseURLForNetwork = (network: Network) => {
  switch (network) {
    case 'mainnet':
    default:
      return 'https://api.0x.org/';
  }
};

const getReferrerForNetwork = (network: Network) => {
  switch (network) {
    case 'mainnet':
    default:
      return '0xE9039a6968ED998139e023ed8D41c7fA77B7fF7A';
  }
};

export const getTradeQuote = async ({
  network = 'mainnet',
  ...params
}: GetTradeQuoteProps): Promise<ZeroExAPIQuoteResponse> => {
  console.log('0x: quote params', params);

  const genericError = {
    reason: 'Validation Failed',
    validationErrors: {
      field: 'n/a',
      code: 0,
      reason: 'no api request made',
      description: 'default error messsage',
    },
  };

  // to track all usage data about debt dao in 0x db
  const affiliateMetadata = { affiliateAddress: getReferrerForNetwork(network) };

  // TODO: revenue go brrrrr
  const referralFees = {
    buyTokenPercentageFee: '0.0', // TODO: Arbiter can adjust to profit from trades
    feeRecipient: getReferrerForNetwork(network),
  };

  try {
    const response = await get(`${getBaseURLForNetwork(network)}swap/v1/quote`, {
      params: { ...referralFees, ...affiliateMetadata, ...params },
    });
    console.log('0x: response', response);
    if (response?.data) {
      const { buyTokenAddress, sellTokenAddress } = response.data;
      return { ...response.data, buyToken: buyTokenAddress, sellToken: sellTokenAddress };
    } else throw genericError;
  } catch (e: any) {
    console.log('0x: quote failed', e);
    if (e?.validationErrors) {
      throw e.validationErrors[0];
    }
  }

  throw genericError;
};
