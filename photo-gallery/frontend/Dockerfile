# frontend/Dockerfile - Multi-stage containerization configuration
# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency mappings
COPY package*.json ./

# Clean dependency installation
RUN npm ci

# Copy frontend source files
COPY . .

# Compile optimized static bundle
RUN npm run build

# ─── Production Serve Stage ───────────────────────────────────────────────────
FROM nginx:alpine

# Copy built assets from build stage to nginx folder
COPY --from=build /app/build /usr/share/nginx/html

# Replace default configuration with custom spa fallback config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
