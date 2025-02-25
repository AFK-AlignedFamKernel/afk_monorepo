# indexer-v2

A new indexer that use the apibara v2 (currently in preview version)
He currently used a new database, see `.env.example`

## How generate ABI files

The more simple to generate ABI files is to use the `abi-wan-kanabi` tool that will convert json contract class file
into typescript file.

```shell
npx abi-wan-kanabi --input ../../onchain/cairo/afk/target/dev/[contract_name].contract_class.json --output indexers/abi/[contract_name].abi.ts
```

## How to run

### Dev

In dev, we can run all indexers or chose one indexer to run.

```shell
pnpm dev 
pnpm dev --indexer index_name 
```

### Prod

In production, we can only run one indexer at time.

```shell
pnpm start --indexer index_name 
```