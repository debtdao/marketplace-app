import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { ThunkAPI } from '@frameworks/redux';
import { Address } from '@types';


const getABI = createAsyncThunk<{ address: String }, String, ThunkAPI>(
    'etherscan/getABI',
   async ({ id }, { getState, extra }) => {
    const { onChainMetaDataService } = extra.services;
    const OnChainMetaDataServiceResponse = await onChainMetaDataService.getContractABI({address: string});
   }
)
export const OnChainMetaDataActions = { getABI };