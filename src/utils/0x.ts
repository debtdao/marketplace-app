import { PopulatedTransaction } from 'ethers';

import { Network, GetTradeQuoteProps } from '@types';

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

interface ZeroExAPIValidationError {
  reason: 'Validation Failed';
  validationErrors: {
    field: string; // field in order
    code: number;
    reason: string; // e.g. "INSUFFICIENT_ASSET_LIQUIDITY"
    description: string; // e.g. "We cant trade this token pair at the requested amount due to a lack of liquidity"}
  };
}

export const getTradeQuote = async ({
  network = 'mainnet',
  ...params
}: GetTradeQuoteProps): Promise<PopulatedTransaction | ZeroExAPIValidationError> => {
  console.log('get 0x quote params', params);

  // revenue go brrrrr
  const referralFees = {
    buyTokenPercentageFee: '0.1',
    feeRecipient: getReferrerForNetwork(network),
  };

  // to track all data from debt dao in 0x db
  const affiliateMetadata = { affiliateAddress: getReferrerForNetwork(network) };

  try {
    const response = await get(`${getBaseURLForNetwork(network)}swap/v1/quote`, {
      params: { ...referralFees, ...affiliateMetadata, ...params },
    });
    console.log('0x api response', response);
    // console.log('price + trade data', );
    // return price, + trade exchange addy+ calldata
    if (response) {
      return response;
    }
  } catch (e: any) {
    // example failed response
    // {"code":100,,"]}
    console.log('failed getting 0x price  quote', e);
    if (e?.validationErrors) {
      return e.validationErrors[0];
    }
  }

  return {
    reason: 'Validation Failed',
    validationErrors: {
      field: 'n/a',
      code: 0,
      reason: 'no api request made',
      description: 'default error messsage',
    },
  } as ZeroExAPIValidationError;
};
