import { Suspense, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { createGlobalStyle } from 'styled-components';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import '@i18n';

import { Container } from '@container';
import { getStore } from '@frameworks/redux';
import { AppContextProvider, NavSideMenuContextProvider } from '@context';
import { getClient, createClient, getGraphURL } from '@core/frameworks/gql';
// import { possibleTypes } from '@core/frameworks/gql/possibleTypes.js';
import { Routes } from '@routes';
import { Themable } from '@containers';
import { getEnv } from '@src/config/env';

import '@assets/fonts/RobotoFont.css';

const { GRAPH_API_URL } = getEnv();

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    scroll-behavior: unset;
  }

  html {
    font-size: 62.5%;
  }

  * {
    box-sizing: border-box;
  }

  body {
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.texts};
    font-size: 1.6rem;
    overflow: hidden;
    overflow-y: scroll;
    font-family: ${(props) => props.theme.globalFont};
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, -webkit-text-decoration-color;
    transition-timing-function: cubic-bezier(.4, 0, .2, 1);
    transition-duration: .15s
  }

  #root {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  a {
    text-decoration: none;
    &:visited {
      color: inherit;
    }
  }

  p {
    margin: 0;
  }

  p + p {
    margin-top: 1rem;
  }

  [disabled],
  .disabled {
    opacity: 0.7;
    cursor: default;
    pointer-events: none;
  }

  .bn-onboard-modal {
    z-index: ${(props) => props.theme.zindex.onboardModal}
  }
`;

export const App = () => {
  const container = new Container();
  const store = getStore(container);
  const state = store.getState();
  // TODO: remove original code
  // const graphQLClient = getClient(state.network.current);

  const graphApiUrL = getGraphURL(state.network.current);
  console.log('Graph QL Client URL: ', graphApiUrL);
  const [graphQLClient, setGraphQLClient] = useState<ApolloClient<{}>>(
    new ApolloClient({
      uri: graphApiUrL,
      // cache: new InMemoryCache({
      //   possibleTypes,
      // }),
      cache: new InMemoryCache(),
    })
  );

  // console.log('Graph QL Client URL: ', getGraphURL(state.network.current));
  // const [graphQLClient, setGraphQLClient] = useState<ApolloClient<{}>>(getClient(state.network.current));

  useEffect(() => {
    // asynchronous code
    // console.log('Graph QL Client - useEffect current network: ', state.network.current);
    // getClient(state.network.current).then((client: ApolloClient<{}>) => {
    //   console.log('Graph QL Client - useEffect current client: ', graphQLClient);
    //   setGraphQLClient(client);
    //   console.log('Graph QL Client - useEffect new client: ', graphQLClient);
    // });

    // synchronous code
    const newClient = createClient(state.network.current);
    setGraphQLClient(newClient);
    console.log('Graph QL Client - new client: ', newClient);
  }, [state.network.current]);

  console.log('Graph QL Client - current network: ', state.network.current);
  console.log('Graph QL Client - current client: ', graphQLClient);

  return (
    <Provider store={store}>
      <AppContextProvider context={container.context}>
        <ApolloProvider client={graphQLClient}>
          <NavSideMenuContextProvider>
            <Themable>
              <GlobalStyle />
              <Suspense fallback={null}>
                <Routes />
              </Suspense>
            </Themable>
          </NavSideMenuContextProvider>
        </ApolloProvider>
      </AppContextProvider>
    </Provider>
  );
};

export default App;
