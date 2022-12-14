// Purpose: Generate possibleTypes.json to pass as parameter when initializing
// InMemoryChache in frameworks/gql/index. Enables usage of fragments with
// unions and interfaces in GraphQL queries.

// Source Documentation: https://www.apollographql.com/docs/react/data/fragments/#using-fragments-with-unions-and-interfaces

// import { getEnv } from '@config/env';

const fs = require('fs');

const fetch = require('cross-fetch');

const { getEnv } = require('@config/env');

const { GRAPH_API_URL } = getEnv();

// const GRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/kibagateaux/dd-test';

fetch(`${GRAPH_API_URL}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variables: {},
    query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
  }),
})
  .then((result) => result.json())
  .then((result) => {
    const possibleTypes = {};

    result.data.__schema.types.forEach((supertype) => {
      if (supertype.possibleTypes) {
        possibleTypes[supertype.name] = supertype.possibleTypes.map((subtype) => subtype.name);
      }
    });

    fs.writeFile('./possibleTypes.json', JSON.stringify(possibleTypes), (err) => {
      if (err) {
        console.error('Error writing possibleTypes.json', err);
      } else {
        console.log('Fragment types successfully extracted!');
      }
    });
  });
