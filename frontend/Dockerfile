FROM node:20-alpine

WORKDIR /app

# Copy workspace root files
COPY package*.json ./
COPY tsconfig.json ./

# Copy frontend files
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig*.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/index.html ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public

# Install dependencies
RUN npm ci --workspace=frontend

WORKDIR /app/frontend

EXPOSE 4003

# Use Vite dev server (for development)
# For production, you would build first and use a static server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4003"]
