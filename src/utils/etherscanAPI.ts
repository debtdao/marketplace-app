import { useState, useEffect } from 'react';
import { get } from './http';
import { Address } from '../core/types/Blockchain';
import { getEnv } from '@config/env';


function getContractABI(address: Address){

    const {ETHERSCAN_API_KEY} = getEnv();
    const [abi, setABI] = useState([]);
    const queryString = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`
    const getABI = async () => {
        const data =  await get(queryString);
        
        setABI(abi);
    }

    useEffect(() => {
        getABI();
      }, []);

}


export { getContractABI };