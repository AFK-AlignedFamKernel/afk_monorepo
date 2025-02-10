# Use a Node.js base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the application
ARG APP_PATH
RUN pnpm run build --filter=${APP_PATH}

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start"]