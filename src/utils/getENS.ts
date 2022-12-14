import { ENSAddressPair } from '@types';

export function getENS(address: string, ENSRegistry: ENSAddressPair[]): ENSAddressPair {
  const result = ENSRegistry.filter((ENS) => {
    return address === ENS.address;
  });

  //@ts-ignore
  return result;
}
