# PyTrader Centralized Configuration Guide

This document describes the centralized configuration approach for the PyTrader application.

## Overview

All services use environment variables for configuration with sensible defaults. Configuration is managed through `.env` files in each service directory.

## Port Assignments

| Service | Port | Environment Variable |
|---------|------|---------------------|
| Frontend | 4003 | `VITE_PORT` |
| Gateway | 4000 | `PORT` |
| Market Data | 4001 | `PORT` |
| Analytics | 4002 | `PORT` |

## Service Configuration Files

### Frontend (`frontend/.env`)

```env
# Gateway Service Configuration
VITE_GATEWAY_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000/stream

# Frontend Development Port
VITE_PORT=4003

# Optional: enable verbose client-side debug logging (scopes: ws,http,candles,indicators,signals or "1"/"all")
# VITE_DEBUG=signals,indicators,ws
```

**Important**: Frontend environment variables must be prefixed with `VITE_` to be exposed to the client.

You can also enable debug logging at runtime (without rebuilding) from the browser console:

```js
localStorage.setItem('pytrader.debug', 'ws,http,candles,indicators,signals'); // or "1"
```

**Configuration File**: [`frontend/src/config.ts`](../frontend/src/config.ts)
- Centralizes all environment variable access
- Provides validation on application load
- Single source of truth for frontend configuration

### Gateway Service (`services/gateway/.env`)

```env
# Server port
PORT=4000

# Market Data Service URL
MARKET_DATA_URL=http://localhost:4001

# Analytics Service URL
ANALYTICS_URL=http://localhost:4002

# Maximum concurrent WebSocket connections
WS_MAX_CONNECTIONS=100

# Log level: debug | info | warn | error
LOG_LEVEL=info

# Optional: enable verbose request tracing (logs requestId + bodies)
# TRACE_REQUESTS=1
```

**Configuration File**: [`services/gateway/src/config.ts`](../services/gateway/src/config.ts)

### Market Data Service (`services/market-data/.env`)

```env
PORT=4001
PROVIDER=mock
SQLITE_PATH=./data/market-data.db
SYMBOLS=BTC/USDT,ETH/USDT
LOG_LEVEL=info
BACKFILL_HOURS=24
```

**Configuration File**: [`services/market-data/src/config.ts`](../services/market-data/src/config.ts)

### Analytics Service (`services/analytics/.env`)

```env
PORT=4002
MARKET_DATA_URL=http://localhost:4001
LOG_LEVEL=INFO
```

**Configuration File**: [`services/analytics/src/config.py`](../services/analytics/src/config.py)

## Service Communication

```
Frontend (4003)
    ↓ HTTP/WebSocket
Gateway (4000)
    ↓ HTTP
    ├── Market Data (4001)
    └── Analytics (4002)
            ↓ HTTP
        Market Data (4001)
```

### Communication Patterns

1. **Frontend → Gateway**: All frontend requests go through the gateway
   - REST API: `http://localhost:4000`
   - WebSocket: `ws://localhost:4000/stream`

2. **Gateway → Market Data**: Gateway proxies requests to market data service
   - Endpoints: `/internal/candles`, `/internal/latest-candle`

3. **Gateway → Analytics**: Gateway proxies requests to analytics service
   - Endpoints: `/internal/indicators`, `/internal/signals`

4. **Analytics → Market Data**: Analytics fetches candles for indicator calculations
   - Endpoint: `/internal/candles`

## Environment Variable Patterns

### Common Patterns Across Services

- `PORT`: Service listening port
- `*_URL`: Downstream service URLs (e.g., `MARKET_DATA_URL`, `ANALYTICS_URL`, `GATEWAY_URL`)
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)

### Frontend-Specific

- `VITE_*`: All client-exposed variables must use this prefix
- `VITE_GATEWAY_URL`: Gateway API base URL
- `VITE_WS_URL`: WebSocket connection URL

### Service-Specific

- `PROVIDER`: Market data provider (mock, binance, coinbase)
- `SQLITE_PATH`: Database file location
- `SYMBOLS`: Trading pairs to track
- `BACKFILL_HOURS`: Historical data to backfill
- `WS_MAX_CONNECTIONS`: WebSocket connection limits

## Configuration Validation

All services validate configuration on startup:

- **TypeScript Services**: Use Zod schemas for validation
- **Python Services**: Use Pydantic models for validation
- **Frontend**: Custom validation in `config.ts`

## Changing Ports

To change a service port:

1. Update the `.env` file in the service directory
2. Update the `.env.example` file
3. If changing Gateway port, also update:
   - `frontend/.env` (`VITE_GATEWAY_URL` and `VITE_WS_URL`)
   - `frontend/.env.example`
   - `Makefile` (display messages)
   - `README.md` and `QUICKSTART.md` (documentation)
4. Restart affected services

## Example: Changing Gateway Port from 4000 to 5000

```bash
# 1. Update gateway .env
echo "PORT=5000" > services/gateway/.env

# 2. Update frontend .env
cat > frontend/.env << EOF
VITE_GATEWAY_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/stream
VITE_PORT=4003
EOF

# 3. Update dependent service .env files (none for gateway)
# (Analytics and Market Data don't connect to Gateway)

# 4. Restart services
make stop
make serve-all
```

## Development vs Production

### Development (Local)
- Uses `.env` files with localhost URLs
- All services run on the same machine
- Direct port access

### Production
- Use environment variables set by deployment platform
- Services may be on different hosts/containers
- Use fully qualified domain names instead of localhost
- Consider using service discovery (e.g., Kubernetes DNS)

### Docker Deployment Example

```yaml
# docker-compose.yml
services:
  gateway:
    environment:
      - PORT=4000
      - MARKET_DATA_URL=http://market-data:4001
      - ANALYTICS_URL=http://analytics:4002

  market-data:
    environment:
      - PORT=4001

  analytics:
    environment:
      - PORT=4002
      - MARKET_DATA_URL=http://market-data:4001

  frontend:
    environment:
      - VITE_GATEWAY_URL=http://gateway:4000
      - VITE_WS_URL=ws://gateway:4000/stream
```

## Best Practices

1. **Never commit `.env` files** - Only commit `.env.example` files
2. **Use environment-specific configuration** - Dev, staging, production
3. **Validate all configuration on startup** - Fail fast with clear error messages
4. **Document all environment variables** - Keep `.env.example` up to date
5. **Use sensible defaults** - Services should work out of the box for development
6. **Centralize configuration access** - Use dedicated config modules/files
7. **Type your configuration** - Use TypeScript interfaces or Pydantic models

## Troubleshooting

### Port Conflicts

If a service fails to start with "EADDRINUSE" or "Address already in use":

```bash
# Check what's using the port
lsof -i :4000  # Replace with the port number

# Kill the process if needed
kill -9 <PID>
```

### Configuration Not Loading

1. Verify `.env` file exists in the correct directory
2. Check file permissions: `ls -la .env`
3. Verify environment variable names (especially `VITE_` prefix for frontend)
4. Restart the service after changing configuration
5. Check service logs for configuration validation errors

### Services Can't Communicate

1. Verify all services are running: `make status`
2. Check service URLs in `.env` files
3. Test connectivity: `curl http://localhost:4000/health`
4. Check firewall rules
5. Verify no port conflicts

## Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js process.env](https://nodejs.org/api/process.html#processenv)
- [Python os.getenv](https://docs.python.org/3/library/os.html#os.getenv)
