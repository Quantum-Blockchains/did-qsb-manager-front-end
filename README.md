# Substrate Front End Template

This template allows you to create a front-end application that connects to a
[Substrate](https://github.com/paritytech/substrate) node back-end with minimal
configuration. To learn about Substrate itself, visit the
[Substrate Documentation](https://docs.substrate.io).

The template is built with [Create React App](https://github.com/facebook/create-react-app)
and [Polkadot JS API](https://polkadot.js.org/docs/api/). Familiarity with these tools
will be helpful, but the template strives to be self-explanatory.

## Using The Template

### Install Locally

The codebase is installed using [git](https://git-scm.com/) and [yarn](https://yarnpkg.com/). Make sure you have installed yarn globally prior to installing it within the subdirectories. For the most recent version and how to install yarn, please refer to [Yarn](https://yarnpkg.com/) documentation and installation guides.

```bash
# Clone the repository
git clone https://github.com/substrate-developer-hub/substrate-front-end-template.git
cd substrate-front-end-template
yarn install
```

### Usage

You can start the template in development mode to connect to a locally running node

```bash
yarn start
```

You can also build the app in production mode,

```bash
yarn build
```

and open `build/index.html` in your favorite browser.

### Try the Hosted Version

Connecting to your local Substrate node (Chrome and Firefox only):

https://substrate-developer-hub.github.io/substrate-front-end-template?rpc=ws://localhost:9944

Connecting to Polkadot:

https://substrate-developer-hub.github.io/substrate-front-end-template?rpc=wss://rpc.polkadot.io


## Configuration

The template's configuration is stored in the `src/config` directory, with
`common.json` being loaded first, then the environment-specific JSON file,
and finally environment variables, with precedence.

- `development.json` affects the development environment
- `test.json` affects the test environment, triggered in `yarn test` command.
- `production.json` affects the production environment, triggered with the `yarn build` command.

To deploy your own front-end to production, you need to configure:

- `PROVIDER_SOCKET` in `src/config/production.json` pointing to your own
  deployed node.

Some environment variables are read and integrated in the template `config` object,
including:

- `REACT_APP_PROVIDER_SOCKET` overriding `config[PROVIDER_SOCKET]`

More on [React environment variables](https://create-react-app.dev/docs/adding-custom-environment-variables).



### How to Specify the WebSocket to Connect to

There are two ways to specify the websocket to connect to:

- With `PROVIDER_SOCKET` in `{common, development, production}.json`.
- With `rpc=<ws or wss connection>` query parameter after the URL. This overrides the above setting.

## Reusable Components

### useSubstrate Custom Hook

The custom hook `useSubstrate()` provides access to the Polkadot js API and thus the
keyring and the blockchain itself. Specifically it exposes this API.

```js
{
  setCurrentAccount: func(acct) {...}
  state: {
    socket,
    keyring,
    keyringState,
    api,
    apiState,
    currentAccount
  }
}
```

- `socket` - The remote provider socket it is connecting to.
- `keyring` - A keyring of accounts available to the user.
- `keyringState` - One of `"READY"` or `"ERROR"` states. `keyring` is valid
  only when `keyringState === "READY"`.
- `api` - The remote api to the connected node.
- `apiState` - One of `"CONNECTING"`, `"READY"`, or `"ERROR"` states. `api` is valid
  only when `apiState === "READY"`.
- `currentAccount` - The current selected account pair in the application context.
- `setCurrentAccount` - Function to update the `currentAccount` value in the application context.

If you are only interested in reading the `state`, there is a shorthand `useSubstrateState()` just to retrieve the state.

### TxButton Component

The [TxButton](./src/substrate-lib/components/TxButton.js) handles basic [query](https://polkadot.js.org/docs/api/start/api.query) and [transaction](https://polkadot.js.org/docs/api/start/api.tx) requests to the connected node.
You can reuse this component for a wide variety of queries and transactions in your own feature modules.

### Account Selector

The [Account Selector](./src/AccountSelector.js) provides the user with a unified way to
select their account from a keyring. If the Balances module is installed in the runtime,
it also displays the user's token balance. It is included in the template already.

## Miscellaneous

- Polkadot-js API and related crypto libraries depend on [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) that is only supported by modern browsers. To ensure that react-scripts properly transpile your webapp code, update the `package.json` file:

  ```json
  {
    "browserslist": {
      "production": [
        ">0.2%",
        "not ie <= 99",
        "not android <= 4.4.4",
        "not dead",
        "not op_mini all"
      ]
    }
  }
  ```

  Refer to [this doc page](https://github.com/vacp2p/docs.wakuconnect.dev/blob/develop/content/docs/guides/07_reactjs_relay.md).

## QSB DID Manager Roadmap

This repository has moved beyond the original Substrate template and now contains custom QSB DID and Schema workflows.  
Below is the recommended implementation roadmap to finish the product in a production-ready way.

### Stage 1: Schema Logic Extraction (In Progress)

- Move Schema state and actions out of `src/DidDataStorage.js` into dedicated hook(s).
- Keep UI behavior unchanged while reducing container complexity.
- Done criteria:
- `DidDataStorage` only wires view components and shared DID helpers.
- Schema flows (`register`, `preview`, `deprecate`, fetch-by-URL) are handled in isolated module(s).

### Stage 2: DID Actions Extraction

- Create `useDidActions` hook for key/service/metadata/deactivate operations.
- Move tx payload preparation and validation from the component layer to hook/service layer.
- Done criteria:
- `src/DidDataStorage.js` drops below ~700 lines.
- DID operations are unit-testable without rendering UI components.

### Stage 3: Shared Transaction Engine

- Unify duplicated tx lifecycle logic into one reusable utility/hook.
- Standardize: status updates, dispatch error decoding, finalized handling, audit events, toast notifications.
- Done criteria:
- One tx execution path for both DID and Schema operations.
- No duplicated `signAndSend` branches across feature handlers.

### Stage 4: Data Access and Services Layer

- Add `src/did-data-storage/services/` for chain/RPC adapters.
- Separate transport concerns from UI/hook concerns.
- Done criteria:
- Hooks call service methods, not raw `api.query/api.tx` directly.
- Data normalization functions live in services/helpers, not in screen containers.

### Stage 5: Schema Query Scalability

- Replace full `schemas.entries()` scans with indexed query strategy in runtime or dedicated RPC.
- Avoid client-side full-chain filtering by DID issuer for large datasets.
- Done criteria:
- Preview/list operations remain fast with large schema counts.
- No full storage scans in default UI path.

### Stage 6: Validation and UX Hardening

- Enforce register flow: `Issuer DID -> Schema URL -> Fetch -> Read-only preview -> Sign`.
- Validate URL + JSON + DID consistency; improve error messages with actionable hints.
- Add explicit “review before submit” panels for destructive actions (`deprecate`, `deactivate`, `revoke`).
- Done criteria:
- Users can complete all flows without guessing payload rules.
- All blocking errors are explained in plain language.

### Stage 7: Test Coverage

- Add unit tests for helpers/hook logic (`normalizeDidInput`, payload builders, schema id decoding).
- Add integration tests for key user flows (register schema, add/revoke key, metadata set/remove).
- Done criteria:
- Critical logic has automated coverage.
- PRs fail on regressions in validation and tx preparation.

### Stage 8: Observability and Diagnostics

- Add debug-friendly structured logs for tx lifecycle and RPC failures in development mode.
- Add lightweight error boundaries around major feature panels.
- Done criteria:
- Failure root cause is traceable without manual console archaeology.

### Stage 9: Security and Safety Checks

- Review signature handling and payload construction for strict consistency with pallet expectations.
- Sanitize and constrain externally fetched schema content handling.
- Done criteria:
- No implicit unsafe assumptions about remote content or signature formats.

### Stage 10: Release and Operational Readiness

- Add stable release notes/changelog discipline.
- Add CI checks for lint, tests, and production build.
- Document runtime compatibility matrix (node version, pallets, RPC assumptions).
- Done criteria:
- Versioned, repeatable release process with predictable quality gates.

## Current Priorities

- Finish Stage 1 and Stage 2 to reduce architectural risk.
- Stabilize Schema UX flow and DID tx correctness before adding new features.
- Defer visual polish tasks until logic extraction and test baseline are complete.
