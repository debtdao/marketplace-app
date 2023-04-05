import React from 'react';
import * as Sentry from '@sentry/react';

import { getConfig } from '@config';

interface ErrorBoundarysProps {
  message: string; // user display message
  boundaryId: string; // lets us tag specific boundaries if multiple get triggered
  children: React.ReactElement; // things to bound
}

export const ErrorBoundary = ({ message, boundaryId, children }: ErrorBoundarysProps) => {
  const errorApi = getConfig().SENTRY_DSN;
  if (errorApi) {
    return (
      <Sentry.ErrorBoundary
        showDialog
        // fallback={<p>{message}</p>}
        beforeCapture={(scope) => {
          scope.setTag('location', boundaryId);
        }}
      >
        {children}
      </Sentry.ErrorBoundary>
    );
  } else {
    return <>{children}</>;
  }
};
