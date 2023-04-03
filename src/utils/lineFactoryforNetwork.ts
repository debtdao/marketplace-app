import { networks } from '../config/constants/supportedNetworks.json';

const getLineFactoryforNetwork = (network: number | string) => {
  switch (network) {
    case 'mainnet' || 1:
      return networks.mainnet.lineFactory;
    case 'gnosis' || 100:
      return networks.gnosis.lineFactory;
    case 'goerli' || 5:
      return networks.gnosis.lineFactory;
  }
  // Add case that if its any other chain, we inform the user that we are not deployed to that chain
};

export { getLineFactoryforNetwork };
