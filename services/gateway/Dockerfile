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

# Copy gateway service files
COPY services/gateway/package*.json ./services/gateway/
COPY services/gateway/tsconfig.json ./services/gateway/
COPY services/gateway/src ./services/gateway/src

# Install dependencies for workspace
RUN npm ci --workspace=shared --workspace=services/gateway

# Build shared types first
RUN npm run build --workspace=shared

# Build gateway service
RUN npm run build --workspace=services/gateway

WORKDIR /app/services/gateway

EXPOSE 4000

CMD ["node", "dist/index.js"]
