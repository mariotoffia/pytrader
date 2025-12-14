FROM node:20-alpine

WORKDIR /app

# Copy workspace root files
COPY package*.json ./
COPY tsconfig.json ./

# Copy shared package
COPY shared/package*.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/types ./shared/types
COPY shared/schemas ./shared/schemas

# Copy market-data service files
COPY services/market-data/package*.json ./services/market-data/
COPY services/market-data/tsconfig.json ./services/market-data/
COPY services/market-data/src ./services/market-data/src

# Install dependencies for workspace
RUN npm ci --workspace=shared --workspace=services/market-data

# Build shared types first
RUN npm run build --workspace=shared

# Build market-data service
RUN npm run build --workspace=services/market-data

WORKDIR /app/services/market-data

# Create data directory
RUN mkdir -p /data

EXPOSE 4001

CMD ["node", "dist/index.js"]
