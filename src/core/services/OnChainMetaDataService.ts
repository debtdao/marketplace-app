import { _getContractABI } from '@src/utils';
import { OnChainMetaDataService } from '@types';

export class OnChainMetaDataServiceImpl implements OnChainMetaDataService {
  constructor() {}

  public async getContractABI(address: String): Promise<any | undefined> {
    console.log('Made it to Service');
    return await _getContractABI(address);
  }
}
