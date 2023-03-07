# debtdao.finance

<img src="https://img.shields.io/badge/dynamic/json.svg?style=plastic&color=2096F3&label=locize&query=%24.translatedPercentage&url=https://api.locize.app/badgedata/1c6d6900-5989-49fe-b221-0001423041d2&suffix=%+translated&link=https://www.locize.com" />

## Contributing

Code style follows prettier conventions (`yarn prettier`). Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) spec.

### Initial Setup

- Fork the [original repo](https://github.com/yearn/yearn-finance-v3/) into your GitHub account
- Clone the forked repo from your GitHub account to your local machine

  ```
  git clone https://github.com/<your-gh>/yearn-finance-v3.git
  ```

- Set origin to your fork. This is where you push your changes to. This is done automatically by the step above.

  ```
  git remote add origin https://github.com/<your-gh>/yearn-finance-v3
  ```

- Set upstream to original repo.

  ```
  git remote add upstream https://github.com/yearn/yearn-finance-v3.git
  ```

- Create `.env` file in root directory of repo then copy contents of `.env.example` to `.env`
  ```
  cp .env.example .env
  ```
  - `REACT_APP_INFURA_PROJECT_ID` should remain blank because we are currently using Alchemy as our provider
  - `REACT_APP_ALCHEMY_API_KEY` alchemy api key should be provided by the contributor if he hits api limits

### Making Changes

- Create a new local branch from upstream/develop for each PR that you will submit
  ```
  git fetch
  git checkout -b <your branch name> upstream/develop
  ```
- Commit your changes as you work
  ```
  git add .
  git commit -S -m "message"
  ```
  - [info about verified commits](https://docs.github.com/en/github/authenticating-to-github/managing-commit-signature-verification)

### Pushing Changes to your Repo

- Commits are squashed when PR is merged so rebasing is optional
- When ready to push
  ```
  git fetch
  git merge upstream/develop
  git push origin <branch-name>
  ```

### Submitting Pull Request

- Go to your GitHub and navigate to your forked repo
- Click on `Pull requests` and then click on `New pull request`
- Click on `compare across forks`
- Click on `compare:` and select branch that you want to create a pull request for then click on `create pull request`

## Development

```
yarn dev
```

or for Windows:

```
yarn dev-win
```

- To enable Dev Mode set `REACT_APP_ALLOW_DEV_MODE=true` in your `.env`
- Wallet Address Override can be activated by navigating to Settings in the app and clicking `Enable Dev Mode`

## Production

```
yarn build
yarn start
```

## Translations

We use i18n react with locize cli to update/download translations.

Refer to main repo for documentation:
https://github.com/locize/locize-cli

Sync with: `yarn syncDevLocales` **must provide api key**

Check sync changes with: `yarn checkDevLocales`

Download prod locales with: `yarn downloadProdLocales`



## Repo Structure

```
|
|- public
	|- locales = Where we store all copy translations that you see on the page
| src
	|- config = all env vars and constants
	|- client = all React/HTML/CSS
	|- tests = testing services
	|- utils = small helper functinos throughout the codebase 
	|- core
		|- types = data structs for entire codebase
			|- State = for redux state data structs
			|- Service = Credit + Collateral + other services
			|- CreditLine = anything related to credit specifically
		|- frameworks = 3rd party dependency integrations (ethersjs, subgraph, blocknative)
		|- services = Libs for composing frameworks in actions for users
			|- Tx = sending txs
			|- CreditLine = interacting with credit/debt positions
			|- Collateral = interacting with line collateral (Spigot + Escrow)
			|- OnchainMetadata = ens + abis + ?
		|- store = Redux. dynamic state about marketplace, user, tokens, etc. + actions to query/interact

```

## Code Practices / Styleguide

1. AWLAYS use translated text for anything user facing
    1. using i18n and public.locales
2. prefer constant immutable vars and functional programming
3. Type EVERYTHING
    1. We have types for every API call arg, expected API responses, and formatted API responses once processed.

### Code Structure

1. Always try to utilize state vars instead of local vars. Allows connecting workflows between ux components a lot more seamless across the app and its more proper modern react using hooks and selectors.

**BAD Practice** 

```jsx
const [activeAddress,setAddress] = useState();
setAddress(window.location.path.split('/')[2])
return <h1>User Address: {activeAddress} </h1>
```

**GOOD Practice**

```jsx
const activeAddress = useAppSelector(WalletSelectors.selectSelectedAddress)
const setAddress = () => dispatch(WalletActions.setSelectedAddress)
setAddress(window.location.path.split('/')[2])
return <h1>User Address: {activeAddress} </h1>
```

2. **Try to organize code by how/when you use it not by arbitrary taxonomies.** E.g. when making services, cbe originally had 1 service file for each contract and mapped functions 1<>1 between them. I refactored and combined anything related to borrowing/lending into CreditService and anything related to spigot/escrow to CollateralService (including liquidate() from LoC contract). Or i made “OnchainMetadataService” for ENS + ABIs + who knows what else we might want to get context about random hashes
