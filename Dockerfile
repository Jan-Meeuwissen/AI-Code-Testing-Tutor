# Use lightweight Node.js Alpine base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker layer caching
# If package.json hasn't changed, npm install won't re-run on rebuild
COPY package.json ./
#COPY package-lock.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application files
COPY server.js ./
COPY public/ ./public/
COPY config/ ./config/

# Expose the application port
EXPOSE 3000

# Set default environment variables
ENV OLLAMA_HOST=http://ollama:11434
ENV ROLE_CONFIG_PATH=./config/role.json

# Start the application
CMD ["node", "server.js"]
