# Indexer V2

## How to run

```
docker compose up -d
```

Run indexer

```
docker run -it --env-file ./.env dao-indexer run /app/main.ts --tls-accept-invalid-certificates=true --allow-env-from-env POSTGRES_CONNECTION_STRING,AUTH_TOKEN

```

```
docker run -it --env-file ./.env dao-indexer run /app/main.ts --tls-accept-invalid-certificates=true --allow-env-from-env POSTGRES_CONNECTION_STRING
```

## Install

Example:
https://github.com/apibara/typescript-sdk/tree/main/examples/cli

# Todo

- Fix script in Typescript:  indexer script operation failed
  ├╴at /build/source/script/src/script.rs:339:22
  ├╴failed to run indexer event loop
  ╰╴error: TypeError: No such file or di


- Saved DAO AA Created in db
- Saved DAO Proposal Created in db
- Saved DAO Proposal Voted in db
- Saved DAO Proposal Executed in db
- Saved DAO Proposal Whitelisted in db
- Saved DAO Proposal Ended in db
- Saved DAO Proposal Failed in db
- Saved DAO Proposal Succeeded in db