# Multi-stage build for smaller image size
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production=false

# Copy all source files
COPY . .

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy from base stage
COPY --from=base /app .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]
