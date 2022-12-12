import { _getContractABI } from '@src/utils';
import { OnChainMetaDataService, GetAddressEnsNameProps, UserService, Web3Provider, Config, Network } from '@types';
import {} from '@ethersproject/address';

export class OnChainMetaDataServiceImpl implements OnChainMetaDataService {
  private web3Provider: Web3Provider;
  constructor({ web3Provider }: { web3Provider: Web3Provider }) {
    this.web3Provider = web3Provider;
  }

  public async getContractABI(address: String, network: number): Promise<any | undefined> {
    return await _getContractABI(address, network);
  }

  public async getAddressEnsName(props: GetAddressEnsNameProps) {
    const { address } = props;
    const provider = this.web3Provider.getInstanceOf('ethereum');
    const addressEnsName = await provider.lookupAddress(address);
    return addressEnsName;
  }
}
