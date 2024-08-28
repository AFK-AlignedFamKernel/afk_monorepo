# art/peace Backend

This directory contains the Go backend for `art/peace`, which provides routes for managing and retrieving `art/peace` info from the Redis and Postgres DBs. Also, it contains other utilities to do things like get the contract address, use devnet transaction invoke scripts for easy devnet testing, maintain websocket connections for pixel updates, and more.

## Running

```
go run main.go

go run ./cmd/backend/backend.go

```

## Build

```
go mod download
go build
```

## TODO 
- [] Fix env Database Redis and Postgres in DockerFile
- [] More coming soon