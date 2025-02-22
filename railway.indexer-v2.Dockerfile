# Use a Node.js base image
FROM node:20-alpine AS base

# Set the working directory inside the container
WORKDIR /build

ARG INDEXER_DATABASE_URL INDEXER_v2_DATABASE_URL

# Copy repository into the Docker container
COPY . .
# when building image on local machine, remove .env files
RUN find . -name ".env" -type f | xargs rm -f

# Install libs + pnpm
# Install dependencies
# Build the project
RUN apk add --no-cache \
    openssl \
    libc6-compat && \
    npm install -g pnpm && \
    pnpm install && \
    pnpm --filter indexer-v2 build:all

WORKDIR /app

## Copy the node_modules and built files from the base stage
RUN mv /build/node_modules . && \
    mv /build/packages/common ./node_modules/ && \
    mv /build/packages/indexer-v2-db ./node_modules/ && \
    mkdir -p apps/indexer-v2 && \
    mv /build/apps/indexer-v2/node_modules ./apps/indexer-v2/ && \
    mv /build/apps/indexer-v2/.apibara/build ./apps/indexer-v2/ && \
    mv /build/apps/indexer-v2/package.json ./apps/indexer-v2/

# Use a smaller production base image
FROM node:20-alpine AS production

# Install necessary dependencies in production
RUN apk add --no-cache \
    openssl \
    libc6-compat

# Set the working directory in the production container
WORKDIR /app

# Copy all necessary files in a single layer
COPY --from=base /app .

# Set the environment variable to production
ENV NODE_ENV=production

# Expose the port your app runs on
EXPOSE 3000

# Command to start the application
WORKDIR /app/apps/indexer-v2
CMD node build/start.mjs start --indexer dao-factory
