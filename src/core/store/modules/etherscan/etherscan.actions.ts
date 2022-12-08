import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { ThunkAPI } from '@frameworks/redux';

const getABI = createAsyncThunk<{ ABI: any[] }, String, ThunkAPI>(
  'etherscan/getABI',
  async (props, { extra, getState }) => {
    const { onChainMetaDataService } = extra.services;
    const { wallet } = getState();
    const { services } = extra;
    const userAddress = wallet.selectedAddress;
    if (!userAddress) throw new Error('WALLET NOT CONNECTED');
    console.log('made it into etherscan actions');
    const OnChainMetaDataServiceResponse = await onChainMetaDataService.getContractABI(props);
    console.log('on chain meta data', OnChainMetaDataServiceResponse);
    return {
      ABI: OnChainMetaDataServiceResponse,
    };
  }
);
export const OnChainMetaDataActions = { getABI };
