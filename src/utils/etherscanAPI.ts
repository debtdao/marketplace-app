import { getEnv } from '@config/env';

import { getNetwork } from './network';
import { get } from './http';

const _getContractABI = async (address: String, network: number) => {
  const { ETHERSCAN_API_KEY } = getEnv();
  const networkAPI = getNetwork(network) == 'mainnet' ? '' : '-' + getNetwork(network);
  const queryString = `https://api${networkAPI}.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
  const abi = await get(queryString);
  return abi;
};

export { _getContractABI };
