# Simple single-stage build
FROM node:20-alpine

WORKDIR /app

# Copy package.json only (not lock file to avoid platform issues)
COPY package.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy all source files
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]
