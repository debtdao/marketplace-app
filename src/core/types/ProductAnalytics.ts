import { Address } from './Blockchain';
import { WalletState } from './State';

// EVENT NAMES

// Auth Events
type EVENT_LOGIN = 'login';
export const EVENT_LOGIN: EVENT_LOGIN = 'login';
type EVENT_LOGOUT = 'logout';
export const EVENT_LOGOUT: EVENT_LOGOUT = 'logout';

export type AnalyticsEventNames = EVENT_LOGIN | EVENT_LOGOUT;

// EVENT DATA FORMATS
export interface BaseAnalyticsEventData {
  wallet: WalletState;
  [key: string]: any;
}
export interface LogAppAnalyticsActionProps {
  event: AnalyticsEventNames;
  data: object;
}

// Auth Events
export interface LoginEventData {
  address: Address;
}

// Arbiter Events
