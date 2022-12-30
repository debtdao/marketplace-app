import { createAsyncThunk, createAction } from '@reduxjs/toolkit';

import { ThunkAPI } from '@frameworks/redux';
import { isGnosisApp, isLedgerLive, isCoinbaseApp, get } from '@utils';
import { ExternalServiceId, EVENT_NAVIGATE_EXTERNAL_1ST_PARTY, EVENT_NAVIGATE_EXTERNAL_3RD_PARTY } from '@types';
import { idUser, trackPage, trackAnalyticsEvent } from '@frameworks/segment';
import { AnalyticsEventNames, LogAppAnalyticsActionProps } from '@src/core/types/ProductAnalytics';

import { WalletActions } from '../wallet/wallet.actions';
import { TokensActions } from '../tokens/tokens.actions';
// import { LabsActions } from '../labs/labs.actions';
import { AlertsActions } from '../alerts/alerts.actions';
import { NetworkActions } from '../network/network.actions';
import { PartnerActions } from '../partner/partner.actions';
import { SettingsActions } from '../settings/settings.actions';

/* -------------------------------------------------------------------------- */
/*                                   Setters                                  */
/* -------------------------------------------------------------------------- */

const disableService = createAction<{ service: ExternalServiceId }>('app/disableService');

/* -------------------------------------------------------------------------- */
/*                                 Clear State                                */
/* -------------------------------------------------------------------------- */

const clearAppData = createAsyncThunk<void, void, ThunkAPI>('app/clearAppData', async (_, { dispatch }) => {
  await Promise.all([
    dispatch(TokensActions.clearTokensData()),
    // dispatch(LabsActions.clearLabsData()),
  ]);
});

const clearUserAppData = createAsyncThunk<void, void, ThunkAPI>('app/clearUserAppData', async (_, { dispatch }) => {
  await Promise.all([
    dispatch(TokensActions.clearUserTokenState()),
    // dispatch(LabsActions.clearUserData()),
  ]);
});

/* -------------------------------------------------------------------------- */
/*                                 Fetch Data                                 */
/* -------------------------------------------------------------------------- */

const initApp = createAsyncThunk<void, void, ThunkAPI>('app/initApp', async (_arg, { dispatch, getState, extra }) => {
  const { CONTRACT_ADDRESSES, NETWORK } = extra.config;
  const { wallet, settings, network } = getState();
  if (isLedgerLive()) {
    if (NETWORK !== 'mainnet') await dispatch(NetworkActions.changeNetwork({ network: 'mainnet' }));
    if (settings.signedApprovalsEnabled) await dispatch(SettingsActions.toggleSignedApprovals());
    await dispatch(WalletActions.walletSelect({ walletName: 'Iframe', network: 'mainnet' }));
    await dispatch(PartnerActions.changePartner({ id: 'ledger', address: CONTRACT_ADDRESSES.LEDGER }));
  } else if (isGnosisApp()) {
    const walletName = 'Gnosis Safe';
    if (NETWORK !== 'mainnet') await dispatch(NetworkActions.changeNetwork({ network: 'mainnet' }));
    if (settings.signedApprovalsEnabled) await dispatch(SettingsActions.toggleSignedApprovals());
    await dispatch(WalletActions.walletSelect({ walletName, network: 'mainnet' }));
  } else if (isCoinbaseApp()) {
    const walletName = 'Coinbase Wallet';
    await dispatch(WalletActions.walletSelect({ walletName, network: 'mainnet' }));
  } else if (wallet.name && wallet.name !== 'Iframe') {
    await dispatch(WalletActions.walletSelect({ walletName: wallet.name, network: NETWORK }));
    // await dispatch(WalletActions.walletSelect({ walletName: wallet.name, network: network.current }));
  }
  dispatch(checkExternalServicesStatus());
  // TODO use when sdk ready
  // dispatch(initSubscriptions());
});

/* -------------------------------------------------------------------------- */
/*                                  Services                                  */
/* -------------------------------------------------------------------------- */

const checkExternalServicesStatus = createAsyncThunk<void, void, ThunkAPI>(
  'app/checkExternalServicesStatus',
  async (_arg, { dispatch, extra }) => {
    const { DEBT_DAO_ALERTS_API } = extra.config;
    try {
      const { status, data } = await get(`${DEBT_DAO_ALERTS_API}/health`);
      if (status !== 200) throw new Error('Service status provider not currently accessible');

      const errorMessageTemplate =
        'service is currently experiencing technical issues and have been temporarily disabled. We apologize for any inconvenience this may cause, we are actively working on resolving these issues';
      const downgradedServicesMessages = [];
      const { zapper, simulations } = data;

      // TODO: Reenable Zapper alerts if that is a desired feature.
      // if (!zapper) {
      //   dispatch(disableService({ service: 'zapper' }));
      //   downgradedServicesMessages.push(`Zapper ${errorMessageTemplate}`);
      // }

      if (!simulations) {
        dispatch(disableService({ service: 'tenderly' }));
        downgradedServicesMessages.push(`Simulations ${errorMessageTemplate}`);
      }

      downgradedServicesMessages.forEach(async (message) => {
        dispatch(
          AlertsActions.openAlert({
            message,
            type: 'warning',
            persistent: true,
          })
        );
      });
    } catch (error) {
      console.log(error);
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                                Subscriptions                               */
/* -------------------------------------------------------------------------- */

// const initSubscriptions = createAsyncThunk<void, void, ThunkAPI>(
//   'app/initSubscriptions',
//   async (_arg, { dispatch }) => {
//     dispatch(TokensActions.initSubscriptions());
//     dispatch(VaultsActions.initSubscriptions());
//   }
// );

/* -------------------------------------------------------------------------- */
/*                                Analytics                               */
/* -------------------------------------------------------------------------- */

const logAppAnalytics = createAsyncThunk<void, LogAppAnalyticsActionProps, ThunkAPI>(
  'app/logAnalytics',
  async ({ type, data }, { dispatch, getState, extra }) => {
    const { wallet, ...state } = getState();
    switch (type) {
      case 'track':
        if (data.eventName) return;
        trackAnalyticsEvent(data.eventName!)({ wallet, ...data });
        break;
      case 'id':
        const { selectedAddress } = wallet;
        if (!selectedAddress) return;
        idUser(selectedAddress);
        break;
      case 'page':
        const { to } = data;
        if (!to) return;

        // TODO do Regex for different  parts of url
        const isInternal = to.startsWith('/') || window.location.host === to;
        const isSubdomain = to.split('.').length > 2; // false positive on files (.pdf) but we want those in new tabs too"

        if (isInternal) {
          trackPage({ data: { wallet } });
          break;
        } else if (isSubdomain) {
          trackAnalyticsEvent(EVENT_NAVIGATE_EXTERNAL_1ST_PARTY)({ ...data });
          break;
        } else {
          trackAnalyticsEvent(EVENT_NAVIGATE_EXTERNAL_3RD_PARTY)({ ...data });
          break;
        }
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export const AppActions = {
  disableService,
  clearAppData,
  clearUserAppData,
  initApp,

  logAppAnalytics,
  // initSubscriptions,
};
