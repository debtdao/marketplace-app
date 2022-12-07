import { _getContractABI } from '@src/utils';
import { OnChainMetadataService, OnChainMetaDataState, OnChainMetadataServiceProps } from '@types';

export class OnChainMetadataServiceImpl implements OnChainMetadataService {
  getContractABI(props: OnChainMetadataServiceProps): Promise<any> {
    return _getContractABI(props.address);
  }
}
