import { Network } from '@src/core/types';
import { GetTradeQuoteProps } from '@types';

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

export const getTradeQuote = async ({ network = 'mainnet', ...params }: GetTradeQuoteProps) => {
  console.log('get 0x quote params', params);

  // revenue go brrrrr
  const referralFees = {
    buyTokenPercentageFee: 10,
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
  } catch (e) {
    console.log('failed getting 0x price  quote', e);
  }
};
