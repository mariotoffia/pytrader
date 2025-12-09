# PyTrader Quick Start Guide

## What's Been Built

**3 Backend Services - All Functional:**

1. **Market Data Service** (TypeScript) - Port 3001
   - Mock provider generating realistic synthetic candles
   - SQLite database with idempotent writes
   - REST API for historical data
   - Automatic 24-hour backfill on startup

2. **Gateway Service** (TypeScript) - Port 3000
   - REST API (health, symbols, candles)
   - WebSocket support for real-time streams
   - Session management for subscriptions
   - HTTP clients for downstream services

3. **Analytics Service** (Python/FastAPI) - Port 3002
   - Technical indicators (EMA, RSI, Bollinger Bands, etc.)
   - Trading signals (EMA Crossover + RSI strategy)
   - Interactive API docs at `/docs`

**Files Created:** 45+ files, 2,060+ lines of service code
**Code Quality:** ✅ All files ≤ 400 lines

## Quick Start (3 Steps)

### 1. Install Dependencies

```bash
# Install Node.js dependencies (all services)
npm install

# Install Python dependencies (analytics service)
cd services/analytics
pip install -r requirements.txt
cd ../..
```

### 2. Start Services (3 terminals)

**Terminal 1: Market Data Service**
```bash
cd services/market-data
npm install
npm run dev
```
Wait for: `Market Data Service listening on port 3001`

**Terminal 2: Gateway Service**
```bash
cd services/gateway
npm install
npm run dev
```
Wait for: `Gateway Service listening on port 3000`

**Terminal 3: Analytics Service**
```bash
cd services/analytics
python -m src.main
# or: uvicorn src.main:app --reload --port 3002
```
Wait for: `Application startup complete`

### 3. Test the System

**Check Health:**
```bash
curl http://localhost:3001/health  # Market Data
curl http://localhost:3000/health  # Gateway
curl http://localhost:3002/health  # Analytics
```

**Get Historical Candles:**
```bash
# Through Gateway (recommended)
curl "http://localhost:3000/candles?symbol=BTC/USDT&interval=1m&from=1000000000000&to=9999999999999"

# Directly from Market Data (internal)
curl "http://localhost:3001/internal/candles?symbol=BTC/USDT&interval=1m&from=1000000000000&to=9999999999999"
```

**Get Supported Symbols:**
```bash
curl http://localhost:3000/symbols
```

**Calculate Indicators:**
```bash
curl -X POST http://localhost:3002/internal/indicators \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "interval": "1m",
    "from": 1733745600000,
    "to": 1733835600000,
    "indicators": ["ema_20", "ema_50", "rsi_14"]
  }'
```

**Generate Trading Signals:**
```bash
curl -X POST http://localhost:3002/internal/signals \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "interval": "1m",
    "from": 1733745600000,
    "to": 1733835600000,
    "strategy_id": "ema_crossover_rsi"
  }'
```

**Interactive API Docs:**
Open browser to http://localhost:3002/docs for Swagger UI

## WebSocket Testing

### Using websocat (install: `brew install websocat` or `cargo install websocat`)

```bash
# Connect to Gateway WebSocket
websocat ws://localhost:3000/stream

# Subscribe to BTC/USDT 1m candles
{"type":"subscribe_candles","payload":{"symbol":"BTC/USDT","interval":"1m"}}

# You'll receive real-time candle updates every second:
# {"type":"candle_update","payload":{...}}

# Unsubscribe
{"type":"unsubscribe_candles","payload":{"symbol":"BTC/USDT","interval":"1m"}}
```

### Using wscat (install: `npm install -g wscat`)

```bash
wscat -c ws://localhost:3000/stream
> {"type":"subscribe_candles","payload":{"symbol":"ETH/USDT","interval":"1m"}}
```

## Project Structure

```
pytrader/
├── AGENT.md              # Development guidelines
├── README.md             # Full documentation
├── QUICKSTART.md         # This file
├── shared/               # Shared TypeScript types & Zod schemas
├── services/
│   ├── market-data/      # Data ingestion & storage (TypeScript)
│   ├── gateway/          # API & WebSocket gateway (TypeScript)
│   └── analytics/        # Indicators & signals (Python)
└── data/                 # SQLite databases (auto-created)
```

## Configuration

Each service has a `.env.example` file. Copy and customize as needed:

```bash
cp services/market-data/.env.example services/market-data/.env
cp services/gateway/.env.example services/gateway/.env
cp services/analytics/.env.example services/analytics/.env
```

**Key Settings:**
- Market Data: `PROVIDER=mock` (also supports: binance, coinbase - TODO)
- Market Data: `SYMBOLS=BTC/USDT,ETH/USDT` (which symbols to track)
- Market Data: `BACKFILL_HOURS=24` (historical data to load on startup)

## Troubleshooting

**Port already in use:**
```bash
# Check what's using a port
lsof -i :3001
# Kill the process
kill -9 <PID>
```

**Database locked:**
```bash
# Remove SQLite database and restart
rm -rf services/market-data/data
```

**Python dependencies error:**
```bash
# Create virtual environment
cd services/analytics
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m src.main
```

## Next Steps

1. **Add Frontend:** React + Vite + TradingView Lightweight Charts
2. **Add Binance Provider:** Real market data from Binance public API
3. **Add Coinbase Provider:** Real market data from Coinbase public API
4. **Add Tests:** Unit and integration tests for all services
5. **Add More Strategies:** Implement additional signal generation strategies
6. **Add Docker:** Docker Compose for one-command deployment

## What's Working

✅ Mock data provider generating realistic candles
✅ SQLite storage with automatic backfill
✅ REST API for historical data
✅ WebSocket for real-time updates
✅ Technical indicators (EMA, RSI, etc.)
✅ Trading signals (EMA Crossover + RSI)
✅ Session management & subscriptions
✅ All files ≤ 400 lines (verified)
✅ Type-safe with Zod (TS) and Pydantic (Python)

## Known Limitations

- Frontend not yet implemented
- Only Mock provider implemented (Binance/Coinbase TODO)
- No authentication/authorization
- Tests not yet written
- Single instance only (no horizontal scaling)

## Support

- Development guidelines: See [AGENT.md](./AGENT.md)
- Full documentation: See [README.md](./README.md)
- Report issues: Create a GitHub issue

---

**Happy Trading! 📈🚀**
