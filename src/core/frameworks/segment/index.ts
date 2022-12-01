import { AnalyticsBrowser, Context } from '@segment/analytics-next'
import { getEnv } from '@src/config/env'
import { AnalyticsEventNames } from '@src/core/types/ProductAnalytics'

 
const { SEGMENT_API_KEY } = getEnv()

let analytics: AnalyticsBrowser | undefined;

const getAnalytics = () => {
  if(analytics) return analytics;
  if(SEGMENT_API_KEY) {
    return analytics = new AnalyticsBrowser();
  }
}

export const init = () => getAnalytics()?.load({ writeKey: SEGMENT_API_KEY! });


// TODO check that getAnalytics()? has loaded before calling
export const idUser = (id: string) => getAnalytics()?.identify(id);
export const groupUser =  (groupName: string) => getAnalytics()?.group(`${groupName} Group ID`, { groupName })
export const createEventTracker = (eventName: AnalyticsEventNames) =>
  (eventData?: any): Promise<Context> | undefined =>
    getAnalytics()?.track(eventName, eventData); // should event data be an obj or spread op?
