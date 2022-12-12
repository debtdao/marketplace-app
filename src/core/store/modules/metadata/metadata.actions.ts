import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Interface } from '@ethersproject/abi';

import { ThunkAPI } from '@frameworks/redux';

const getABI = createAsyncThunk<{ ABI: string; Functions: [] }, String, ThunkAPI>(
  'metadata/getABI',
  //@ts-ignore
  async (address, { extra, getState }) => {
    const { onChainMetaDataService } = extra.services;
    const { wallet, metadata } = getState();
    const { services } = extra;
    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    const OnChainMetaDataServiceResponse = await onChainMetaDataService.getContractABI(address);
    const ABI = OnChainMetaDataServiceResponse.data.result;

    // console.log('on chain meta data', OnChainMetaDataServiceResponse);
    const iface = new Interface(OnChainMetaDataServiceResponse.data.result);
    const Functions = [];
    const Inputs = [];

    for (const key in iface.functions) {
      Functions.push(iface.functions[key].name);
      const obj = { funcname: iface.functions[key].name, funcinputs: iface.functions[key].inputs };
      Inputs.push(obj);
    }
    return {
      ABI,
      Functions,
      // might add state variables
    };
  }
);

const clearABI = createAction<void>('metadata/clearABI');

// TODO get ens names of any addresses
const getENS = createAction;

export const OnChainMetaDataActions = { getABI, clearABI };
