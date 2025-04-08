# Algorithm backend of AFK

## Description
Express typescript backend.
Routes for  Algorithm scoring, classication, trending, mindshare of profiles.
This backend is gonna be link with some Cairo contracts in WIP and connected to the indexer db corresponding:

- AFK_Profile
- AFK_nostr_fi

## TODO

MVP stuff

- [] algorithm trending Nostr
- [] Scoring Nostr note algorithms
- [] Classification Nostr Note with ML
- [] Classify Nostr note with LLM 

## Kill process issues
```
sudo lsof -t -i:5050

sudo kill -9 [ID_RECEIVED_BEFORE]
```

# Setup

Copy the .env.example

Init all db corresponding after setup POSTGREES_DB for both: prisma-db, indexer-prisma

##
```
 pnpm run build:all
```
