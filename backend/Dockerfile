FROM golang:1.22.2-alpine

RUN apk add --no-cache bash curl git jq

SHELL ["/bin/bash", "-c"]
RUN curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | bash -s -- -v 2.6.3
RUN curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | bash
RUN /bin/bash /root/.local/bin/snfoundryup --version 0.21.0

# Copy over the configs
COPY ./configs/docker-backend.config.json ./backend.config.json

# Copy over the scripts
WORKDIR /scripts
COPY ./tests/integration/docker/ .

# Copy over the app
WORKDIR /app
COPY ./backend/go.mod ./backend/go.sum ./
RUN go mod download
COPY ./backend .

# Argument for Redis host and port
ARG REDIS_HOST
ARG REDIS_PORT

# Set Redis host and port environment variables
ENV REDIS_HOST=${REDIS_HOST}
ENV REDIS_PORT=${REDIS_PORT}

# Argument for Postgres host, port, user, and database
ARG POSTGRES_HOST
ARG POSTGRES_PORT
ARG POSTGRES_USER
ARG POSTGRES_DATABASE

# Set Postgres host, port, user, and database environment variables
ENV POSTGRES_HOST=${POSTGRES_HOST}
ENV POSTGRES_PORT=${POSTGRES_PORT}
ENV POSTGRES_USER=${POSTGRES_USER}
ENV POSTGRES_DATABASE=${POSTGRES_DATABASE}

# Build the app & run it
RUN go build -o main ./cmd/backend/backend.go

EXPOSE 8080

CMD ["./main", "--admin"]
