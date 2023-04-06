import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/react';

import App from '@client';

import { getEnv } from './config/env';

import '@yearn-finance/web-lib/dist/build.css';

// init Sentry error monitoring before rendering app
const errorApi = getEnv().SENTRY_DSN;
if (errorApi) {
  Sentry.init({
    dsn: errorApi,
    integrations: [new Sentry.Replay()],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    // replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
