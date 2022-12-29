import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import { NetworkSelectors } from '@src/core/store';
import { Layout } from '@containers';

import { useAppSelector } from '../hooks/store';

import { Portfolio } from './Portfolio';
import { LineDetail } from './LineDetail';
import { Market } from './Market';
import { Settings } from './Settings';
import { Disclaimer } from './Disclaimer';
import { Health } from './Health';

function routesMap(network: string): any[] {
  return [
    {
      path: `/portfolio/:network/:userAddress?`,
      component: Portfolio,
    },
    {
      path: '/market',
      component: Market,
    },
    {
      path: `/lines/:network/:lineAddress`,
      component: LineDetail,
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
}

export const Routes = () => {
  const currentNetwork = useAppSelector(NetworkSelectors.selectCurrentNetwork);
  const routes = routesMap(currentNetwork);
  return (
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
                <Redirect to="/market" />
              </Route>
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Router>
  );
};
