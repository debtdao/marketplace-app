import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import { Layout } from '@containers';

import { Portfolio } from './Portfolio';
import { LineDetail } from './LineDetail';
import { Spigot } from './Spigot';
import { Market } from './Market';
import { Settings } from './Settings';
import { Disclaimer } from './Disclaimer';
import { Health } from './Health';

const routes = [
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
    path: '/lines/:network/:lineAddress/spigots/:spigotAddress',
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
