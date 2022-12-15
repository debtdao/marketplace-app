import { _getContractABI } from '@src/utils';
import { OnchainMetaDataService, Web3Provider } from '@types';
import {} from '@ethersproject/address';

export class OnchainMetaDataServiceImpl implements OnchainMetaDataService {
  private web3Provider: Web3Provider;
  constructor({ web3Provider }: { web3Provider: Web3Provider }) {
    this.web3Provider = web3Provider;
  }

  public async getContractABI(address: String, network: number): Promise<{} | undefined> {
    return await _getContractABI(address, network);
  }

  public async getAddressEnsName(address: string): Promise<string | null> {
    const addressEnsName = await this.web3Provider.getInstanceOf('ethereum').lookupAddress(address);
    return addressEnsName;
  }
}
