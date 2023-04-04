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
// navigate to an external 1st party site e.g. debtdao.org
type EVENT_NAVIGATE_EXTERNAL_1ST_PARTY = 'nav_out_1st';
export const EVENT_NAVIGATE_EXTERNAL_1ST_PARTY: EVENT_NAVIGATE_EXTERNAL_1ST_PARTY = 'nav_out_1st';

export type AnalyticsEventNames =
  | EVENT_LOGIN
  | EVENT_LOGOUT
  | EVENT_NAVIGATE_EXTERNAL_3RD_PARTY
  | EVENT_NAVIGATE_EXTERNAL_1ST_PARTY;

export type AnalyticsTrackingTypes = 'track' | 'page' | 'id';

// EVENT DATA FORMATS

export interface BaseAnalyticsEventData {
  wallet?: WalletState;
  [key: string]: any;
}

export interface TrackEventData extends BaseAnalyticsEventData {
  eventName: AnalyticsEventNames;
}

export interface TrackExternalNavigationEvent extends BaseAnalyticsEventData {
  to: string;
  target?: '_blank';
}
export interface TrackInternalNavigationEvent extends BaseAnalyticsEventData {
  name?: string; // custom name for page not in html
  category?: string;
  data?: object; // e.g. referrer, SEO keywords
}

export interface LogAppAnalyticsActionProps {
  type: AnalyticsTrackingTypes;
  data: TrackEventData | TrackExternalNavigationEvent | TrackInternalNavigationEvent;
}

export interface NavigateActionProps {
  onNavigate: Function; // callback to react router histrory for navigating
  to: string; // path or url to navigate to
  target?: string; // html <a> tag target
}

// Navigation Events

// Auth Events
export interface LoginEventData {
  address: Address;
}

// Arbiter Events
