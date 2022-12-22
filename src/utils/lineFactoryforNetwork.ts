import { networks } from '../config/constants/supportedNetworks.json';

const getLineFactoryforNetwork = (network: number | string) => {
  var LineFactory: string = '';
  switch (network) {
    case 'mainnet' || 1:
      return (LineFactory = networks.mainnet.lineFactory);
    case 'goerli' || 5:
    default:
      return (LineFactory = networks.goerli.lineFactory);
  }
  // Add case that if its any other chain, we inform the user that we are not deployed to that chain
};

export { getLineFactoryforNetwork };
