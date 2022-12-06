import { Address } from './Blockchain';
import { WalletState } from './State';

// EVENT NAMES

// Auth Events
type EVENT_LOGIN = 'login';
export const EVENT_LOGIN: EVENT_LOGIN = 'login';
type EVENT_LOGOUT = 'logout';
export const EVENT_LOGOUT: EVENT_LOGOUT = 'logout';

// go to eternal 4rd party site e.g. twitter.com
type EVENT_NAVIGATE_EXTERNAL_3RD_PARTY = 'nav_out_3rd';
export const EVENT_NAVIGATE_EXTERNAL_3RD_PARTY: EVENT_NAVIGATE_EXTERNAL_3RD_PARTY = 'nav_out_3rd';
// navigate to an external 1st party site e.g. docs.debtdao.finance
type EVENT_NAVIGATE_EXTERNAL_1ST_PARTY = 'nav_out_1st';
export const EVENT_NAVIGATE_EXTERNAL_1ST_PARTY: EVENT_NAVIGATE_EXTERNAL_1ST_PARTY = 'nav_out_1st';

export type AnalyticsEventNames =
  | EVENT_LOGIN
  | EVENT_LOGOUT
  | EVENT_NAVIGATE_EXTERNAL_3RD_PARTY
  | EVENT_NAVIGATE_EXTERNAL_1ST_PARTY;

// EVENT DATA FORMATS
export interface BaseAnalyticsEventData {
  wallet?: WalletState;
  [key: string]: any;
}

export interface LogAppAnalyticsActionProps {
  event: AnalyticsEventNames;
  data: BaseAnalyticsEventData;
}

// Navigation Events

export interface TrackNavigationEvent extends BaseAnalyticsEventData {
  name?: string; // custom name for page not in html
  category?: string;
  data?: object; // e.g. referrer, SEO keywords
}

// Auth Events
export interface LoginEventData {
  address: Address;
}

// Arbiter Events
