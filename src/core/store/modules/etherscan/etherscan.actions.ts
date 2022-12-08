import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { ThunkAPI } from '@frameworks/redux';

const getABI = createAsyncThunk<{ ABI: String }, String, ThunkAPI>(
  'etherscan/getABI',
  async (address, { extra, getState }) => {
    const { onChainMetaDataService } = extra.services;
    const { wallet } = getState();
    const { services } = extra;
    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');
    console.log('made it into etherscan actions');
    console.log('Mad it to Actions');
    console.log(address);
    //@ts-ignore
    const OnChainMetaDataServiceResponse = await onChainMetaDataService.getContractABI(address);
    console.log('on chain meta data', OnChainMetaDataServiceResponse);
    return {
      ABI: OnChainMetaDataServiceResponse,
    };
  }
);
export const OnChainMetaDataActions = { getABI };
