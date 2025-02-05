# Use a Node.js base image
FROM node:20-alpine AS base

# Set the working directory inside the container
WORKDIR /app

ARG DATABASE_URL
ARG INDEXER_DATABASE_URL
ARG APP_ENV
ARG APP_PORT
ARG NETWORK
ARG DNA_TOKEN
ARG DNA_CLIENT_URL

RUN echo ${DATABASE_URL}
RUN echo ${INDEXER_DATABASE_URL}
RUN echo ${APP_ENV}
RUN echo ${APP_PORT}
RUN echo ${TELEGRAM_WEB_APP}
RUN echo ${NETWORK}
RUN echo ${DNA_TOKEN}
RUN echo ${DNA_CLIENT_URL}

RUN apk add --no-cache \
    openssl \
    libc6-compat 
    # openssl1.1-compat

# Copy root-level package files
COPY package.json pnpm-workspace.yaml ./

# Install pnpm globally
RUN npm install -g pnpm
RUN apk add --no-cache openssl

# Copy the entire repository into the Docker container
COPY . .

# RUN apk add --no-cache openssl


# Install all dependencies for the workspace
RUN pnpm install --force

#RUN pnpm run build:indexer-prisma
#RUN pnpm --filter indexer-prisma build

# Build nestjs-indexer
RUN pnpm --filter nestjs-indexer build:all

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
COPY --from=base /app/packages/common ../node_modules/common
COPY --from=base /app/packages/indexer-prisma ././node_modules/indexer-prisma
COPY --from=base /app/apps/nestjs-indexer/dist ./apps/nestjs-indexer/dist

# Copy only necessary files for the application to run
COPY apps/nestjs-indexer/package.json ./

# Set the environment variable to production
ENV NODE_ENV=production

# Expose the port your app runs on
EXPOSE 3000

# Command to start the application
CMD ["node", "apps/nestjs-indexer/dist/main"]
