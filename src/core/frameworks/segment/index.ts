import { AnalyticsBrowser, Context } from '@segment/analytics-next'
import { getEnv } from '@src/config/env'
import { AnalyticsEventNames } from '@src/core/types/ProductAnalytics'

 
const { SEGMENT_API_KEY } = getEnv()
const analytics = new AnalyticsBrowser();

const init = () => SEGMENT_API_KEY && analytics.load({ writeKey: SEGMENT_API_KEY });

const id = (id: string) => analytics.identify(id);

const createEventTracker = (eventName: AnalyticsEventNames) => (eventData?: any): Promise<Context> =>
  analytics.track(eventName, eventData);

export default {
  id,
  init,
  createEventTracker
};
