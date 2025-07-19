# Use a Node.js base image
FROM node:20-alpine AS base

# Set the working directory inside the container
WORKDIR /build

ARG DNA_TOKEN INDEXER_DATABASE_URL INDEXER_v2_DATABASE_URL STARTING_BLOCK STARTING_CURSOR_ORDER_KEY INDEXER_NAME

ENV INDEXER_NAME=${INDEXER_NAME:-dao-factory}
ENV INDEXER_DATABASE_URL=${INDEXER_DATABASE_URL:-}
ENV INDEXER_v2_DATABASE_URL=${INDEXER_v2_DATABASE_URL:-}
ENV STARTING_BLOCK=${STARTING_BLOCK:-}
ENV STARTING_CURSOR_ORDER_KEY=${STARTING_CURSOR_ORDER_KEY:-}
ENV DNA_TOKEN=${DNA_TOKEN:-}

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
    echo "Building indexer-v2-db package..." && \
    pnpm run build:indexer-v2-db && \
    echo "Building indexer-v2 app..." && \
    pnpm --filter indexer-v2 build:all && \
    echo "Build completed successfully"

WORKDIR /app



## Copy the node_modules and built files from the base stage
RUN echo "Copying files to production stage..." && \
    ls -la /build/packages/ && \
    ls -la /build/apps/ && \
    mv /build/node_modules . && \
    [ -d "/build/packages/common" ] && mv /build/packages/common ./node_modules/ || echo "common package not found" && \
    [ -d "/build/packages/indexer-v2-db" ] && mv /build/packages/indexer-v2-db ./node_modules/ || echo "indexer-v2-db package not found" && \
    mkdir -p apps/indexer-v2 && \
    [ -d "/build/apps/indexer-v2/node_modules" ] && mv /build/apps/indexer-v2/node_modules ./apps/indexer-v2/ || echo "indexer-v2 node_modules not found" && \
    [ -d "/build/apps/indexer-v2/.apibara/build" ] && mv /build/apps/indexer-v2/.apibara/build ./apps/indexer-v2/ || echo "apibara build not found" && \
    [ -f "/build/apps/indexer-v2/package.json" ] && mv /build/apps/indexer-v2/package.json ./apps/indexer-v2/ || echo "indexer-v2 package.json not found" && \
    [ -d "/build/apps/indexer-v2/.apibara" ] && mv /build/apps/indexer-v2/.apibara ./apps/indexer-v2/ || echo "apibara directory not found" && \
    echo "File copying completed"

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
CMD node build/start.mjs start --indexer ${INDEXER_NAME:-dao-factory} --allow-env .env
