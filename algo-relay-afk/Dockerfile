# Use the official Golang image as the build environment
FROM golang:1.23.1 as builder

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum files from the algo-relay-afk directory
COPY algo-relay-afk/go.mod algo-relay-afk/go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the application source code from algo-relay-afk directory
COPY algo-relay-afk/ .

# Build the Go application with static linking to avoid GLIBC version issues
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

# Create an empty .env file for Railway compatibility
RUN touch .env

# Use a minimal base image for the final container
FROM scratch

# Set the working directory inside the container
WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/app .

# Copy .env file (created in builder stage for Railway compatibility)
COPY --from=builder /app/.env .env

# Copy any required static files, templates, or migrations if needed
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/sql ./sql

# Expose the port your app runs on (change if needed)
EXPOSE 8080

# Set environment variables for production (optional)
ENV GIN_MODE=release

# Command to run the application
CMD ["./app"]
