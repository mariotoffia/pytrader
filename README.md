# PyTrader

A real-time trading system with Python analytics and TypeScript services, featuring live candlestick charts and technical analysis.

## Architecture

Monorepo containing:
- **Gateway Service** (Node.js/TypeScript): API + WebSocket gateway with real-time signal broadcasting
- **Market Data Service** (Node.js/TypeScript): Data ingestion from exchanges (Binance, Coinbase, Mock) + SQLite storage
- **Analytics Service** (Python/FastAPI): Technical indicators (EMA, RSI, Bollinger Bands) + trading signals
- **Frontend** (React + Vite): TradingView charts with EMA overlays, signal markers, and real-time updates

## Features

- ✅ **Real-time Candlestick Charts** - Live OHLCV data with TradingView Lightweight Charts
- ✅ **Technical Indicators** - EMA 20 (blue), EMA 50 (orange) overlays on charts
- ✅ **Trading Signals** - Buy/sell markers with confidence scores
- ✅ **Real-time Updates** - WebSocket streaming for candles and signals
- ✅ **Multiple Exchanges** - Support for Binance, Coinbase, and Mock data
- ✅ **Trading Strategies** - EMA Crossover + RSI filter strategy
- ✅ **Provider Tracking** - Database tracks data source for quality analysis

## Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0
- **Python** ≥ 3.11
- **pip** or **uv** for Python package management

## Quick Start

### Option 1: One-Command Setup (Recommended)

```bash
make quick-start
```

This single command will:
1. Check dependencies (Node.js, Python)
2. Install all packages
3. Build all projects
4. Start all services in background
5. Open at http://localhost:5173

### Option 2: Manual Setup

```bash
# 1. Install dependencies
make install

# 2. Build projects
make build

# 3. Start services
make serve-all

# Open browser to http://localhost:5173
```

### Stop Services

```bash
make stop
```

For more commands, run `make help`

---

## Development Commands

### Quick Reference

```bash
make help         # Show all available commands
make install      # Install dependencies (Node.js + Python)
make build        # Build all TypeScript projects
make test         # Run all tests
make serve-all    # Start all services in background
make stop         # Stop all services
make status       # Check service status
make logs         # View service logs
make clean        # Remove build artifacts
```

### Detailed Setup

### 1. Install Dependencies

```bash
# Install all Node.js dependencies
npm install

# Install Python dependencies
cd services/analytics
pip install -r requirements.txt
# or with uv: uv pip install -r requirements.txt
cd ../..
```

### 2. Configure Services

Create `.env` files based on the examples:

```bash
# Market Data Service
cp services/market-data/.env.example services/market-data/.env

# Gateway Service
cp services/gateway/.env.example services/gateway/.env

# Analytics Service
cp services/analytics/.env.example services/analytics/.env
```

Edit the `.env` files to configure:
- Data provider (binance/coinbase/mock)
- Port numbers
- Service URLs
- Trading symbols

### 3. Start Services

**Option A: Start each service in separate terminals**

```bash
# Terminal 1: Market Data Service (port 3001)
npm run dev:market-data

# Terminal 2: Gateway Service (port 3000)
npm run dev:gateway

# Terminal 3: Analytics Service (port 3002)
npm run dev:analytics

# Terminal 4: Frontend (port 5173)
npm run dev:frontend
```

**Option B: Use a process manager (e.g., pm2 or tmux)**

### 4. Access the Application

Open your browser to:
- **Frontend**: http://localhost:5173
- **Gateway API**: http://localhost:3000/health
- **Market Data API**: http://localhost:3001/health (internal)
- **Analytics API**: http://localhost:3002/docs (FastAPI Swagger UI)

## Project Structure

```
pytrader/
├── services/
│   ├── gateway/          # API + WebSocket gateway
│   ├── market-data/      # Data ingestion + storage
│   └── analytics/        # Indicators + signals (Python)
├── frontend/             # React UI with charts
├── shared/               # Shared TypeScript types/schemas
├── AGENT.md              # Development guidelines
└── package.json          # Workspace configuration
```

## Configuration

### Market Data Service

`.env` example:
```bash
PORT=3001
PROVIDER=mock              # binance | coinbase | mock
SQLITE_PATH=./data.db
SYMBOLS=BTC/USDT,ETH/USDT
LOG_LEVEL=info
```

### Gateway Service

`.env` example:
```bash
PORT=3000
MARKET_DATA_URL=http://localhost:3001
ANALYTICS_URL=http://localhost:3002
WS_MAX_CONNECTIONS=100
LOG_LEVEL=info
```

### Analytics Service

`.env` example:
```bash
PORT=3002
MARKET_DATA_URL=http://localhost:3001
LOG_LEVEL=info
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Test specific service
npm test --workspace=services/gateway
npm test --workspace=services/market-data
npm test --workspace=frontend

# Python tests
cd services/analytics
pytest
```

### Building for Production

```bash
# Build all services
npm run build

# Build specific service
npm run build --workspace=services/gateway
```

### Code Quality

All source files must be ≤ 400 lines. Check file size:
```bash
wc -l path/to/file.ts
```

## API Documentation

### Gateway Service REST API

- `GET /health` - Service health check
- `GET /symbols` - List supported trading symbols
- `GET /candles?symbol=BTC/USDT&from=<ms>&to=<ms>&interval=1m` - Historical candlestick data

### Gateway Service WebSocket

Connect to `ws://localhost:3000/stream`

**Subscribe to candles:**
```json
{
  "type": "subscribe_candles",
  "payload": { "symbol": "BTC/USDT", "interval": "1m" }
}
```

**Receive candle updates:**
```json
{
  "type": "candle_update",
  "payload": {
    "symbol": "BTC/USDT",
    "interval": "1m",
    "timestamp": 1234567890000,
    "open": 50000,
    "high": 50100,
    "low": 49900,
    "close": 50050,
    "volume": 100.5
  }
}
```

**Subscribe to signals:**
```json
{
  "type": "subscribe_signals",
  "payload": { "symbol": "BTC/USDT" }
}
```

**Receive signal updates:**
```json
{
  "type": "signal_update",
  "payload": {
    "symbol": "BTC/USDT",
    "timestamp": 1234567890000,
    "action": "buy",
    "confidence": 0.75,
    "strategy_id": "ema_crossover_rsi"
  }
}
```

### Analytics Service

Visit http://localhost:3002/docs for interactive Swagger documentation.

**Calculate indicators:**
```bash
POST /internal/indicators
{
  "symbol": "BTC/USDT",
  "interval": "1m",
  "from": 1234567890000,
  "to": 1234567990000,
  "indicators": ["ema_20", "ema_50", "rsi_14"]
}
```

**Generate signals:**
```bash
POST /internal/signals
{
  "symbol": "BTC/USDT",
  "interval": "1m",
  "from": 1234567890000,
  "to": 1234567990000,
  "strategy_id": "ema_crossover_rsi"
}
```

## Data Providers

### Mock Provider (Default)

Generates synthetic candlestick data for testing. No external API required.

### Binance Provider

Free public API. No authentication required for public market data.

Set `PROVIDER=binance` in market-data service `.env`

### Coinbase Provider

Free public API. No authentication required for public market data.

Set `PROVIDER=coinbase` in market-data service `.env`

## Trading Strategies

### EMA Crossover + RSI Filter

Default strategy implemented in analytics service:

- **Buy Signal**: EMA(20) crosses above EMA(50) AND RSI(14) < 70
- **Sell Signal**: EMA(20) crosses below EMA(50) AND RSI(14) > 30
- **Hold**: All other conditions

## Troubleshooting

### Services won't start

1. Check Node.js version: `node --version` (should be ≥ 20.0.0)
2. Check Python version: `python --version` (should be ≥ 3.11)
3. Ensure all dependencies are installed: `npm install`
4. Check port availability: `lsof -i :3000` (Gateway), `:3001` (Market Data), `:3002` (Analytics)

### No data in charts

1. Verify market-data service is running: `curl http://localhost:3001/health`
2. Check provider configuration in `.env`
3. View logs for errors
4. Try mock provider first: `PROVIDER=mock`

### WebSocket connection fails

1. Verify gateway service is running: `curl http://localhost:3000/health`
2. Check browser console for errors
3. Ensure no firewall blocking WebSocket connections

## License

MIT

## Contributing

See [AGENT.md](./AGENT.md) for development guidelines and architecture documentation.
