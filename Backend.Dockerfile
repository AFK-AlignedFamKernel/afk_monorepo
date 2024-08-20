# Use a Node.js base image
FROM node:18-alpine AS base

# Set the working directory inside the container
WORKDIR /app

# Add an argument for the Telegram bot token
ARG TELEGRAM_BOT_TOKEN

# Set the environment variable
ENV TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}

# Add an argument for th Indexer postgres url
ARG INDEXER_DATABASE_URL

# Set the environment variable
ENV INDEXER_DATABASE_URL=${INDEXER_DATABASE_URL}


# Add an argument for Telegram webapp
ARG TELEGRAM_WEB_APP

# Set the environment variable
ENV TELEGRAM_WEB_APP=${TELEGRAM_WEB_APP}

# Copy root-level package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install all dependencies for the workspace, including common and data-backend
RUN pnpm install --no-frozen-lockfile

# Copy the entire repository into the Docker container
COPY . .

# Build the indexer-prisma package
RUN pnpm --filter indexer-prisma build

# Build the data-backend package
RUN pnpm --filter data-backend build

# Use a smaller production base image
FROM node:18-alpine AS production

# Set the working directory in the production container
WORKDIR /app

# Copy the node_modules and built files from the base stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/common ./packages/common
COPY --from=base /app/packages/indexer-prisma ./packages/indexer-prisma
COPY --from=base /app/apps/data-backend/dist ./apps/data-backend/dist

# Copy only necessary files for the application to run
COPY apps/data-backend/package.json ./

# Set the environment variable to production
ENV NODE_ENV=production

# Expose the port your app runs on
EXPOSE 3000

# Command to start the application
CMD ["node", "apps/data-backend/dist/index.js"]
