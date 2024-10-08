# Setup

## Install Apibara

## Install Postgres and Init the tables

```
docker run --name afk-indexer -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=admin -e POSTGRES_DB=indexer -d -p 5432:5432 -v ./:/docker-entrypoint-initdb.d postgres:latest
```

# Test

buy-token deploy

```
apibara run ./src/buy-token.ts --allow-env .env --allow-net=localhost -A dna_xxx

```

## Docker test

```
 docker build -t afk-indexer .

```

### Run it

docker run -it --env-file ./.env afk-indexer run /app/buy-token.ts --tls-accept-invalid-certificates=true --allow-env-from-env POSTGRES_CONNECTION_STRING
