import { RootState } from '@types';
import { getConstants } from '@src/config/constants';

// const { SUPPORTED_NETWORK_NAMES } = getConstants();

const selectCurrentNetwork = (state: RootState) => state.network.current;
// const selectSupportedNetworkNames = () => SUPPORTED_NETWORK_NAMES;

export const NetworkSelectors = {
  selectCurrentNetwork,
  // selectSupportedNetworkNames,
};
