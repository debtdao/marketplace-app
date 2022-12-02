import { get } from './http';
import { Address } from '../core/types/Blockchain';
import { getEnv } from '@config/env';


const _getContractABI = async (address: Address) => {

    const {ETHERSCAN_API_KEY} = getEnv();
    const queryString = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`
    const abi =  await get(queryString);
    return abi;
}

export { _getContractABI };