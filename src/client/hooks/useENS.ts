import { getENS } from '@src/utils';
import { useAppSelector } from '@hooks';
import { OnchainMetaDataSelector } from '@src/core/store';

interface ENSAddressProps {
  address: string;
}

interface ENSAddress {
  name: string;
}

export const useENS = ({ address }: ENSAddressProps): string => {
  const ensMap = useAppSelector(OnchainMetaDataSelector.selectENSPairs);
  const ensName = getENS(address, ensMap) ?? address;
  return ensName;
};
