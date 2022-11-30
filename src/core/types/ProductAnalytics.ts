import { Address } from "./Blockchain"

// EVENT NAMES

// Auth Events
type EVENT_LOGIN = 'login'
const EVENT_LOGIN: EVENT_LOGIN = 'login'
type EVENT_LOGOUT = 'logout'
const EVENT_LOGOUT: EVENT_LOGOUT = 'logout'

export type AnalyticsEventNames = EVENT_LOGIN
  | EVENT_LOGOUT


// EVENT DATA FORMATS

// Auth Events
export interface LoginEventData {
  address: Address
}

// Arbiter Events
