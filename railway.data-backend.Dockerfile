# Use a Node.js base image
FROM node:20-alpine AS base

# Set the working directory inside the container
WORKDIR /app

ARG TELEGRAM_BOT_TOKEN
ARG INDEXER_DATABASE_URL
ARG BACKEND_DATABASE_URL
ARG TELEGRAM_WEB_APP
ARG BACKEND_DATABASE_URL
ARG STRIPE_SERVER_API_KEY
ARG CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG STARKNET_RPC_PROVIDER_URl
ARG STARKNET_RPC_NETWORK
ARG SN_NETWORK
ARG RPC_NODE_API_KEY
ARG JWT_SECRET
ARG ACCESS_TOKEN_EXPIRY
ARG REFRESH_TOKEN_EXPIRY

ARG CLOUDFARE_ACCOUNT_ID
ARG CLOUDFARE_AUTH_TOKEN
ARG CLOUDFARE_R2_BUCKET
ARG CLOUDFARE_R2_ACCESS
ARG CLOUDFARE_R2_SECRET
ARG CLOUDFARE_R2_DOMAIN

RUN echo ${TELEGRAM_BOT_TOKEN}
RUN echo $INDEXER_DATABASE_URL
RUN echo ${BACKEND_DATABASE_URL}
RUN echo ${TELEGRAM_WEB_APP}
RUN echo ${STRIPE_SERVER_API_KEY}
RUN echo ${CLOUDINARY_CLOUD_NAME}
RUN echo ${CLOUDINARY_API_KEY}
RUN echo ${CLOUDINARY_API_SECRET}
RUN echo ${STARKNET_RPC_PROVIDER_URl}
RUN echo ${SN_NETWORK}
RUN echo ${RPC_NODE_API_KEY}
RUN echo ${JWT_SECRET}
RUN echo ${ACCESS_TOKEN_EXPIRY}
RUN echo ${REFRESH_TOKEN_EXPIRY}

RUN echo ${CLOUDFARE_ACCOUNT_ID}
RUN echo ${CLOUDFARE_AUTH_TOKEN}
RUN echo ${CLOUDFARE_R2_BUCKET}
RUN echo ${CLOUDFARE_R2_ACCESS}
RUN echo ${CLOUDFARE_R2_SECRET}
RUN echo ${CLOUDFARE_R2_DOMAIN}

ARG TELEGRAM_WEB_APP
RUN echo ${TELEGRAM_WEB_APP}


ARG CLOUDINARY_CLOUD_NAME
RUN echo ${CLOUDINARY_CLOUD_NAME}

ARG CLOUDINARY_API_KEY
RUN echo ${CLOUDINARY_API_KEY}

ARG CLOUDINARY_API_SECRET
RUN echo ${CLOUDINARY_API_SECRET}

# Twilio keys

ARG TWILIO_ACCOUNT_SSID
RUN echo ${TWILIO_ACCOUNT_SSID}

ARG TWILIO_SERVICE_ID
RUN echo ${TWILIO_SERVICE_ID}

ARG TWILIO_AUTH_TOKEN
RUN echo ${TWILIO_AUTH_TOKEN}


ARG STARKNET_RPC_PROVIDER_URL
RUN echo ${STARKNET_RPC_PROVIDER_URL}

ARG STARKNET_RPC_NETWORK
RUN echo ${STARKNET_RPC_NETWORK}

ARG RPC_NODE_API_KEY
RUN echo ${RPC_NODE_API_KEY}

ARG SN_NETWORK
RUN echo ${SN_NETWORK}


ARG ACCOUNT_ADDRESS
RUN echo ${ACCOUNT_ADDRESS}


ARG ACCOUNT_PRIVATE_KEY
RUN echo ${ACCOUNT_PRIVATE_KEY}



ARG JWT_SECRET
RUN echo ${JWT_SECRET}

# Install open ssl
RUN apk add --no-cache \
    openssl \
    libc6-compat 

# Copy root-level package files
COPY package.json pnpm-workspace.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Copy the entire repository into the Docker container
COPY . .



# RUN apk add --no-cache openssl
# Install all dependencies for the workspace, including common and data-backend
RUN pnpm install --force

# RUN pnpm run build:prisma-db
# RUN pnpm run build:backend:prisma
# RUN pnpm run build:indexer-prisma
# RUN pnpm run build:backend:all_repo
# Build the indexer-prisma package
# RUN pnpm --filter indexer-prisma build

# Build the data-backend package
# RUN pnpm --filter data-backend build:all_repo
# RUN pnpm --filter data-backend build:all 
# RUN pnpm --filter data-backend build:prisma
# RUN pnpm --filter data-backend build

RUN pnpm --filter data-backend build:all

# Use a smaller production base image
FROM node:20-alpine AS production


# Install necessary dependencies in production
RUN apk add --no-cache \
    openssl \
    libc6-compat 

# Set the working directory in the production container
WORKDIR /app

# Copy the node_modules and built files from the base stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/common ./node_modules/common
COPY --from=base /app/packages/prisma-db ./node_modules/prisma-db
COPY --from=base /app/packages/indexer-prisma ./node_modules/indexer-prisma
COPY --from=base /app/apps/data-backend/dist ./apps/data-backend/dist

# Copy only necessary files for the application to run
COPY apps/data-backend/package.json ./

# Set the environment variable to production
ENV NODE_ENV=production

# Expose the port your app runs on
EXPOSE 3000

# Command to start the application
CMD ["node", "apps/data-backend/dist/index.js"]
