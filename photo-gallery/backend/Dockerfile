# backend/Dockerfile - Production-grade containerization for the Express API
FROM node:20-alpine

# Set directory inside the container
WORKDIR /app

# Copy dependency mappings
COPY package*.json ./

# Install dependencies using clean install
RUN npm ci

# Copy backend source code files
COPY . .

# Expose the backend port (default to 5000)
EXPOSE 5000

# Set default port env
ENV PORT=5000

# Start Express server
CMD ["node", "server.js"]
