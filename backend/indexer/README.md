# art/peace Indexer

This directory contains the Apibara indexer setup for `art/peace`, which indexes and relays `art/peace` state change information to be stored in the Redis and Postgres DBs.

## Running

```
# Setup Indexer/DNA w/ docker compose or other options
# Create an .env file with the following :
#  ART_PEACE_CONTRACT_ADDRESS=... # Example: 0x78223f7ab13216727ed426380079c169578cafad83a3178c7b33ba7ca307713
#  APIBARA_STREAM_URL=... # Example: http://localhost:7171
#  CONSUMER_TARGET_URL=... # Example: http://localhost:8081/consume-indexer-msg
apibara run scripts.js --allow-env indexer.env --allow-net
```

## Deploy on Railway

To deploy, follow the following steps:

1.  Create a new service on [Railway](https://railway.app/) and connect AFK GitHub repository.
2.  Set the following environment variables
    - `APIBARA_STREAM_URL`=https://sepolia.starknet.a5a.ch
    - `ART_PEACE_CONTRACT_ADDRESS`=0x1c3e2cae24f0f167fb389a7e4c797002c4f0465db29ecf1753ed944c6ae746e
    - `AUTH_TOKEN`=your dna_xxxx token
    - `CONSUMER_TARGET_URL`=https://afk-monorepo.onrender.com/consume-indexer-msg
    - `NFT_CONTRACT_ADDRESS`=0x1c3e2cae24f0f167fb389a7e4c797002c4f0465db29ecf1753ed944c6ae746e
    - `USERNAME_STORE_ADDRESS`=0x1c3e2cae24f0f167fb389a7e4c797002c4f0465db29ecf1753ed944c6ae746e
3.  Deploy indexer.
