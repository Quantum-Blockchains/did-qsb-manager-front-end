# QSB DID Manager Frontend

Frontend for QSB DID and Schema operations on a Substrate-based chain.

## Features

- DID management UI (details, update, deactivate).
- Schema registration and schema list workflows.
- Substrate wallet/account integration via Polkadot libraries.
- Production build output ready for static hosting (Nginx, Caddy, CDN).

## Tech Stack

- React 17 + `react-app-rewired`
- Semantic UI React
- Polkadot JS (`@polkadot/api`, keyring, util-crypto)
- Yarn 3 (`yarnPath` committed in repo)

## Requirements

- Node.js 16.x
- Corepack enabled (recommended)

## Local Development

```bash
git clone <your-repo-url>
cd did-qsb-manager-front-end
corepack enable
yarn install
yarn start
```

Default dev port is taken from `.env` (`PORT=8000`).

## Production Build

```bash
corepack enable
yarn install
yarn build
```

Build artifacts are generated in `build/`.

## Runtime Configuration

Chain endpoint is configured in:

- `src/config/common.json`
- `src/config/development.json`
- `src/config/production.json`

You can override provider socket via env:

- `REACT_APP_PROVIDER_SOCKET`

You can also override socket from URL query:

- `?rpc=ws://...` or `?rpc=wss://...`

## Deploy (Nginx)

Recommended approach: build in CI/local, deploy only static artifacts.

```bash
yarn build
tar -czf qsb-frontend-build.tgz build
scp qsb-frontend-build.tgz user@server:/var/www/qsb/
ssh user@server "cd /var/www/qsb && tar -xzf qsb-frontend-build.tgz"
```

Nginx should point `root` to unpacked `build/` and use SPA fallback:

```nginx
location / {
  try_files $uri /index.html;
}
```

## CI and Release

Workflows live in:

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`

Current CI gates:

- install (`yarn install --immutable --inline-builds`)
- eslint
- tests (`--passWithNoTests`)
- production build

Release flow (tag `v*`) builds app and publishes a GitHub Release artifact:

- `qsb-frontend-<tag>.tar.gz`
- `qsb-frontend-<tag>.tar.gz.sha256`

## Notes

- `homepage` in `package.json` should be the real deployment URL of this app (not company website).
- `private: true` is intentional to prevent accidental npm publish.
