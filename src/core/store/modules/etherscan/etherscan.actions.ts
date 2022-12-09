import { createAsyncThunk } from '@reduxjs/toolkit';
import { Interface } from '@ethersproject/abi';

import { ThunkAPI } from '@frameworks/redux';

const getABI = createAsyncThunk<{ ABI: []; Functions: [] }, String, ThunkAPI>(
  'etherscan/getABI',
  //@ts-ignore
  async (address, { extra, getState }) => {
    const { onChainMetaDataService } = extra.services;
    const { wallet } = getState();
    const { services } = extra;
    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    const OnChainMetaDataServiceResponse = await onChainMetaDataService.getContractABI(address);
    const ABI = OnChainMetaDataServiceResponse.data.result;

    console.log('on chain meta data', OnChainMetaDataServiceResponse);
    const iface = new Interface(OnChainMetaDataServiceResponse.data.result);
    const Functions = [];

    for (const k in iface.functions) {
      Functions.push(iface.functions[k].name);
    }
    console.log(iface.functions);
    return {
      ABI,
      Functions,
    };
  }
);
export const OnChainMetaDataActions = { getABI };
