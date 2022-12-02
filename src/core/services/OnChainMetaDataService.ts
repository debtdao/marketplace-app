import { _getContractABI } from '@src/utils';

import { RevenueContract } from '../types';

import { OnChainMetadataService } from '@types';

export class OnChainMetadataServiceImpl implements OnChainMetadataService {

    getContractABI(address: string): Promise<any> {
       return  _getContractABI(address);
    }

}