import { networks } from './networks.json';

const getLineFactoryforNetwork = (network: number | string) => {
  var LineFactory: string = '';
  switch (network) {
    case 'mainnet' || 1:
      return (LineFactory = networks.mainnet.lineFactory);
    case 'goerli' || 5:
      return (LineFactory = networks.goerli.lineFactory);
  }
};

export { getLineFactoryforNetwork };
