import { getEnv } from '@config/env';

import { get } from './http';

const _getContractABI = async (address: String) => {
  console.log('MAde it to utils');
  console.log(address);
  const { ETHERSCAN_API_KEY } = getEnv();
  const queryString = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
  const abi = await get(queryString);
  return abi;
};

export { _getContractABI };
