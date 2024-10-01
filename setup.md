# Setup the repo

- Install pnpm
- Run: pnpm i

Go to the apps you want to run with the corresponding README.md

## Folders structure

### Turborepo

We use Turborepo for the monorepo, for the Turborepo folders we have:
Apps:

- Mobile: apps/mobile
- Website landing page: apps/website
- Backend: apps/data-backend
- Indexer Apibara: apps/indexer

Packages:

- Common: packages/common
- Prisma indexer pull: packages/indexer-prisma
- Nostr sdk: packages/afk_nostr_sdk

### Onchain folders

Some folders are outside the monorepo at the moment:

- Onchain (Cairo & Solidity): /onchain
- Scripts: Run & deploy Cairo code

### Setup a local relayer to test it with Docker

docker run -p 8080:8080 scsibug/nostr-rs-relay
