import { AnalyticsBrowser, Context } from '@segment/analytics-next';

import { getEnv } from '@src/config/env';
import { AnalyticsEventNames, BaseAnalyticsEventData } from '@src/core/types/ProductAnalytics';

const { SEGMENT_API_KEY } = getEnv();

let analytics: AnalyticsBrowser | undefined;

const getAnalytics = () => {
  if (analytics) return analytics;
  if (SEGMENT_API_KEY) {
    return (analytics = new AnalyticsBrowser());
  }
};

// segment wont track until we explicitly tell it to with .load() for privacy.
export const init = () => getAnalytics()?.load({ writeKey: SEGMENT_API_KEY! });
init();
// attach user id (wallet address) to all future events emitted by segment
export const idUser = (id: string) => getAnalytics()?.identify(id);

// TODO implement other segment functions
// console.log(getAnalytics());
// export const groupUser = (groupName: string) => getAnalytics()?.group(`${groupName} Group ID`, { groupName });

export const trackAnalyticsEvent =
  <T>(eventName: AnalyticsEventNames) =>
  (eventData: BaseAnalyticsEventData & T): Promise<Context> | undefined => {
    const a = getAnalytics();
    const {
      wallet: { name, networkVersion: chainId, selectedAddress: address },
      ...data
    } = eventData;
    console.log('segmet', a, eventName, eventData);
    return a?.track(eventName, { ...data, wallet: { name, chainId, address } }); // should event data be an obj or spread op?
  };
