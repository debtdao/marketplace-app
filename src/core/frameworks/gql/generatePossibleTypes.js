// Purpose: Generate possibleTypes.json to pass as parameter when initializing
// InMemoryChache in frameworks/gql/index. Enables usage of fragments with
// unions and interfaces in GraphQL queries.

// Source Documentation: https://www.apollographql.com/docs/react/data/fragments/#using-fragments-with-unions-and-interfaces

const fs = require('fs');
const path = require('path');

const fetch = require('cross-fetch');

const GRAPH_API_URL = process.env.GRAPH_API_URL;

const homeDirectory = path.resolve(process.cwd());
const destinationDirectory = '/src/core/frameworks/gql/possibleTypes.json';
const destinationPath = path.join(homeDirectory, destinationDirectory);

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

    fs.writeFile(destinationPath, JSON.stringify(possibleTypes), (err) => {
      if (err) {
        console.error('Error writing possibleTypes.json', err);
      } else {
        console.log('Fragment types successfully extracted!');
      }
    });
  });
