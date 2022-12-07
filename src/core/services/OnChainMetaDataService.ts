import { _getContractABI } from '@src/utils';
import { OnChainMetaDataService, OnChainMetaDataState, OnChainMetaDataServiceProps } from '@types';

export class OnChainMetaDataServiceImpl implements OnChainMetaDataService {
  private onChainMetaDataService: OnChainMetaDataService;
  constructor({ onChainMetaDataService }: { onChainMetaDataService: OnChainMetaDataService }) {
    this.onChainMetaDataService = onChainMetaDataService;
  }

  public async getContractABI(props: OnChainMetaDataServiceProps): Promise<any> {
    console.log('Made it to Service');
    return await _getContractABI(props.address);
  }
}
