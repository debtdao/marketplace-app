import { trackAnalyticsEvent, trackPage } from '@src/core/frameworks/segment';
import {
  BaseAnalyticsEventData,
  EVENT_NAVIGATE_EXTERNAL_1ST_PARTY,
  EVENT_NAVIGATE_EXTERNAL_3RD_PARTY,
} from '@src/core/types';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

// want to track segment.page for everytime link is pressed

export const useLink = () => {
  const onNavigate = (url: string, eventdata?: BaseAnalyticsEventData) => {
    const history = useHistory();
    // TODO do Regex for different  parts of url

    const isSubdomain = () => false;
    if (window.location.host === url) {
      trackPage();
      // history.push()
    } else if (isSubdomain()) {
      trackAnalyticsEvent(EVENT_NAVIGATE_EXTERNAL_1ST_PARTY)({ url });
      // external links are always opened in another tab
      const tab = window.open(url, '_blank');
      // try focusing on our content if we opne it
      // tab?.focus();
    } else {
      trackAnalyticsEvent(EVENT_NAVIGATE_EXTERNAL_3RD_PARTY)({ url });
      // external links are always opened in another tab
      window.open(url, '_blank');
    }
  };

  return (to: string, eventdata?: BaseAnalyticsEventData) => onNavigate(to);
};
