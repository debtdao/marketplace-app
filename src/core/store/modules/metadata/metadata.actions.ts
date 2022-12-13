import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Interface } from '@ethersproject/abi';

import { ThunkAPI } from '@frameworks/redux';

const getABI = createAsyncThunk<{ ABI: string; Functions: string[] }, String, ThunkAPI>(
  'metadata/getABI',
  async (address, { extra, getState }) => {
    const { onChainMetaDataService } = extra.services;
    const { wallet } = getState();
    const userAddress = wallet.selectedAddress;
    const network = wallet.networkVersion;

    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    const OnChainMetaDataServiceResponse = await onChainMetaDataService.getContractABI(address, network!);
    const ABI = OnChainMetaDataServiceResponse.data.result;

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
    };
  }
);

const clearABI = createAction<void>('metadata/clearABI');

// TODO get ens names of any addresses
//const getENS = createAction;

//Export actions
export const OnChainMetaDataActions = { getABI, clearABI };
