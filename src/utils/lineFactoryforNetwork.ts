import { networks } from '../config/constants/supportedNetworks.json';

const getLineFactoryforNetwork = (network: number | string) => {
  console.log('get factory for network', network);
  switch (network) {
    default:
    case 'mainnet' || 1:
      return networks.mainnet.lineFactory;
    case 'gnosis' || 100:
      return networks.gnosis.lineFactory;
    case 'goerli' || 5:
      return networks.goerli.lineFactory;
  }
  // Add case that if its any other chain, we inform the user that we are not deployed to that chain
};

export { getLineFactoryforNetwork };
