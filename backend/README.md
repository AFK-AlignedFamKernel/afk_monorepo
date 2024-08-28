# AFK Backend

This directory contains the Go backend for `AFK`, which provides routes for managing and retrieving `AFK` info from the Redis and Postgres DBs. Also, it contains other utilities to do things like get the contract address, use devnet transaction invoke scripts for easy devnet testing, maintain websocket connections for pixel updates, and more.

## Environment Variables

The following environment variables need to be set in `.env`

```sh
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
POSTGRES_HOST=your_postgres_host
POSTGRES_PORT=your_postgres_port
POSTGRES_USER=your_postgres_user
POSTGRES_DATABASE=your_postgres_database

```

## Running

```sh
go run main.go

go run ./cmd/backend/backend.go

```

## Build

```sh
go mod download
go build
```

## Using Docker

Build the image

```sh
docker build -f Dockerfile.consumer.prod -t afk-backend .
```

Run the container

```sh
docker run --env-file .env -d -p 8082:8082 --name afk-backend afk-backend
```

## TODO 
- [] Fix env Database Redis and Postgres in DockerFile
- [] More coming soon