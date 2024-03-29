import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Interface } from '@ethersproject/abi';

import { ThunkAPI } from '@frameworks/redux';

const getABI = createAsyncThunk<
  { abi: string; functionSigs: { [funcSelector: string]: string }; address: string },
  String,
  ThunkAPI
>(
  'metadata/getABI',
  //@ts-ignore
  async (address, { extra, getState }) => {
    const { onchainMetaDataService } = extra.services;
    const { wallet } = getState();
    const userAddress = wallet.selectedAddress;
    const network = wallet.networkVersion;

    if (!userAddress) throw new Error('WALLET NOT CONNECTED');

    const OnchainMetaDataServiceResponse = await onchainMetaDataService.getContractABI(address, network!);
    const abi = OnchainMetaDataServiceResponse.data.result;

    const contract = new Interface(OnchainMetaDataServiceResponse.data.result);
    const functionSigs: { [funcSelector: string]: string } = {};
    const inputs = [];
    console.log(contract);

    for (const key in contract.functions) {
      functionSigs[contract.getSighash(key)] = contract.functions[key].name;
      const obj = { funcname: contract.functions[key].name, funcinputs: contract.functions[key].inputs };
      inputs.push(obj);
    }
    return {
      address,
      abi,
      functionSigs,
    };
  }
);

const clearABI = createAction<void>('metadata/clearABI');

// TODO get ens names of any addresses
const getENS = createAsyncThunk<{ address: string; ens: string }, string, ThunkAPI>(
  'metadata/getENS',
  async (address, { extra, getState }) => {
    const { onchainMetaDataService } = extra.services;
    const { wallet } = getState();
    const userAddress = wallet.selectedAddress;
    //console.log(address, 'ens');

    if (!userAddress) throw new Error('WALLET NOT CONNECT');
    const onchainMetaDataResponse = await onchainMetaDataService.getAddressEnsName(address);
    const ens = onchainMetaDataResponse;
    return {
      address,
      ens,
    };
  }
);

//Export actions
export const OnchainMetaDataActions = { getABI, clearABI, getENS };
