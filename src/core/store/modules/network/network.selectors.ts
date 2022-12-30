import { RootState } from '@types';

// Not in use to be removed.
const selectCurrentNetwork = (state: RootState) => state.network.current;

export const NetworkSelectors = {
  selectCurrentNetwork,
};
