import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import { Layout } from '@containers';
import { NetworkSelectors } from '@src/core/store';
import { useAppSelector, useAppTranslation } from '@hooks';
import { ErrorBoundary } from '@components/app/ErrorBoundary';

import { Portfolio } from './Portfolio';
import { LineDetail } from './LineDetail';
import { Spigot } from './Spigot';
import { Market } from './Market';
import { Settings } from './Settings';
import { Disclaimer } from './Disclaimer';
import { Health } from './Health';

const routes = [
  {
    path: `/:network/portfolio/:userAddress?`,
    component: Portfolio,
  },
  {
    path: '/:network/market',
    component: Market,
  },
  {
    path: `/:network/lines/:lineAddress`,
    component: LineDetail,
  },
  {
    path: '/:network/lines/:lineAddress/spigots/:spigotAddress',
    component: Spigot,
  },
  {
    path: '/settings',
    component: Settings,
  },
  {
    path: '/disclaimer',
    component: Disclaimer,
  },
];

export const Routes = () => {
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const { t } = useAppTranslation(['errors']);

  return (
    <ErrorBoundary message={t('errors:global-app-error')} boundaryId="global">
      <Router basename="/#">
        <Switch>
          <Route exact path="/health" component={Health} />

          <Route>
            <Layout>
              <Switch>
                {routes.map((route, index) => {
                  return <Route key={index} exact path={route.path} component={route.component} />;
                })}
                <Route path="*">
                  <Redirect to={`/${currentNetwork}/market`} />
                </Route>
              </Switch>
            </Layout>
          </Route>
        </Switch>
      </Router>
    </ErrorBoundary>
  );
};
