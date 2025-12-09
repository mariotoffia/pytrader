# PyTrader Implementation Plan

## Architecture Overview

Monorepo structure with 3 backend services (TypeScript + Python) and 1 frontend:
- **gateway-service** (Node/TS): API + WebSocket gateway for clients
- **market-data-service** (Node/TS): Data ingestion, normalization, SQLite storage
- **analytics-service** (Python): Indicators, signals using pandas + ta
- **frontend** (React + Vite + TS): TradingView charts + real-time updates

## Project Structure

```
pytrader/
├── AGENT.md                          # Architecture & design principles
├── package.json                      # Root workspace config
├── tsconfig.json                     # Shared TypeScript config
├── services/
│   ├── gateway/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # Main entry
│   │   │   ├── routes/               # REST endpoints
│   │   │   ├── websocket/            # WS handler
│   │   │   └── clients/              # HTTP clients for other services
│   │   └── tests/
│   ├── market-data/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # Main entry
│   │   │   ├── providers/            # Data provider abstraction
│   │   │   │   ├── base.ts           # Abstract provider
│   │   │   │   ├── binance.ts        # Binance implementation
│   │   │   │   ├── coinbase.ts       # Coinbase implementation
│   │   │   │   └── mock.ts           # Mock implementation
│   │   │   ├── storage/              # SQLite DAL
│   │   │   ├── routes/               # Internal API
│   │   │   └── normalizer.ts         # Data normalization
│   │   └── tests/
│   └── analytics/
│       ├── pyproject.toml (or requirements.txt)
│       ├── src/
│       │   ├── main.py               # FastAPI app
│       │   ├── routers/              # API routes
│       │   ├── indicators.py         # TA calculations
│       │   ├── signals.py            # Signal generation
│       │   └── models.py             # Pydantic models
│       └── tests/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                  # Entry point
│   │   ├── App.tsx                   # Main app
│   │   ├── components/
│   │   │   ├── Chart.tsx             # TradingView chart wrapper
│   │   │   └── SymbolSelector.tsx    # Symbol picker
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts       # WS hook
│   │   └── types/
│   └── tests/
└── shared/
    ├── types/
    │   └── index.ts                  # Shared TypeScript types
    └── schemas/
        └── index.ts                  # Zod schemas
```

## Implementation Phases

### Phase 1: Project Setup & AGENT.md
**Files to create:**
- `/AGENT.md` - Architecture, design, testing principles
- `/package.json` - Root workspace config (npm workspaces)
- `/tsconfig.json` - Base TypeScript configuration
- `/.gitignore` - Comprehensive ignores
- `/README.md` - Setup and run instructions

**Key decisions:**
- Use npm workspaces for monorepo
- Node.js ≥ 20, Python ≥ 3.11
- TypeScript ≥ 5

### Phase 2: Shared Types & Schemas
**Files to create:**
- `/shared/types/index.ts` - TypeScript interfaces
- `/shared/schemas/index.ts` - Zod schemas

**Schemas needed:**
- `OHLCVCandle` - timestamp, open, high, low, close, volume, symbol, interval
- `Symbol` - symbol, exchange, type (crypto/stock)
- `Signal` - timestamp, symbol, action (buy/sell/hold), confidence, strategy_id
- `SubscribeMessage`, `CandleUpdateMessage`, `SignalUpdateMessage`

### Phase 3: Market Data Service
**Priority: High** (foundation for other services)

**Files to create:**
- `/services/market-data/package.json`
- `/services/market-data/tsconfig.json`
- `/services/market-data/src/index.ts` - Fastify server
- `/services/market-data/src/providers/base.ts` - Abstract provider interface
- `/services/market-data/src/providers/binance.ts` - Binance WebSocket + REST
- `/services/market-data/src/providers/coinbase.ts` - Coinbase WebSocket + REST
- `/services/market-data/src/providers/mock.ts` - Mock with synthetic data
- `/services/market-data/src/normalizer.ts` - Normalize to canonical format
- `/services/market-data/src/storage/database.ts` - SQLite connection & schema
- `/services/market-data/src/storage/repository.ts` - CRUD operations
- `/services/market-data/src/routes/candles.ts` - GET /internal/candles
- `/services/market-data/src/config.ts` - Configuration management
- `/services/market-data/tests/providers.test.ts`
- `/services/market-data/tests/normalizer.test.ts`

**SQLite Schema:**
```sql
CREATE TABLE candles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL,
  UNIQUE(symbol, interval, timestamp)
);
CREATE INDEX idx_candles_symbol_interval_time ON candles(symbol, interval, timestamp);
```

**Provider Interface:**
```typescript
interface IDataProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribeCandles(symbol: string, interval: string): void;
  unsubscribeCandles(symbol: string, interval: string): void;
  getHistoricalCandles(symbol: string, interval: string, from: number, to: number): Promise<RawCandle[]>;
  on(event: 'candle', handler: (candle: RawCandle) => void): void;
}
```

**Endpoints:**
- `GET /internal/candles?symbol=BTC/USDT&from=<ms>&to=<ms>&interval=1m`
- `GET /internal/latest-candle?symbol=BTC/USDT&interval=1m`
- `GET /health`

**Implementation details:**
- Use `better-sqlite3` for synchronous SQLite access
- Implement idempotent writes (INSERT OR IGNORE)
- Automatic backfill on service start for last 24h
- Reconnection logic with exponential backoff
- Configuration via environment variables

### Phase 4: Gateway Service
**Priority: High** (API entry point)

**Files to create:**
- `/services/gateway/package.json`
- `/services/gateway/tsconfig.json`
- `/services/gateway/src/index.ts` - Fastify + WS server
- `/services/gateway/src/routes/health.ts` - GET /health
- `/services/gateway/src/routes/symbols.ts` - GET /symbols
- `/services/gateway/src/routes/candles.ts` - GET /candles (proxies to market-data)
- `/services/gateway/src/websocket/handler.ts` - WebSocket message routing
- `/services/gateway/src/websocket/sessionManager.ts` - Track client subscriptions
- `/services/gateway/src/clients/marketDataClient.ts` - HTTP client for market-data
- `/services/gateway/src/clients/analyticsClient.ts` - HTTP client for analytics
- `/services/gateway/tests/routes.test.ts`
- `/services/gateway/tests/websocket.test.ts`

**REST Endpoints:**
- `GET /health`
- `GET /symbols` - Returns list of supported symbols
- `GET /candles?symbol=BTC/USDT&from=<ms>&to=<ms>&interval=1m`

**WebSocket Protocol:**

*Incoming (client → server):*
```json
{
  "type": "subscribe_candles",
  "payload": { "symbol": "BTC/USDT", "interval": "1m" }
}
{
  "type": "unsubscribe_candles",
  "payload": { "symbol": "BTC/USDT", "interval": "1m" }
}
{
  "type": "subscribe_signals",
  "payload": { "symbol": "BTC/USDT" }
}
```

*Outgoing (server → client):*
```json
{
  "type": "candle_update",
  "payload": { "symbol": "BTC/USDT", "interval": "1m", "timestamp": 1234567890000, ... }
}
{
  "type": "signal_update",
  "payload": { "symbol": "BTC/USDT", "timestamp": 1234567890000, "action": "buy", "confidence": 0.75 }
}
```

**Implementation details:**
- Use `@fastify/websocket`
- Maintain session state (which client subscribed to what)
- Forward subscriptions to market-data-service
- Poll analytics-service for signals (or implement push)
- Validate all messages with Zod schemas
- Broadcast candle updates to subscribed clients

### Phase 5: Analytics Service
**Priority: Medium** (can work with historical data initially)

**Files to create:**
- `/services/analytics/pyproject.toml` (or requirements.txt)
- `/services/analytics/src/main.py` - FastAPI app
- `/services/analytics/src/routers/indicators.py` - POST /internal/indicators
- `/services/analytics/src/routers/signals.py` - POST /internal/signals
- `/services/analytics/src/indicators.py` - TA calculations (EMA, RSI, etc.)
- `/services/analytics/src/signals.py` - Signal strategies
- `/services/analytics/src/models.py` - Pydantic models
- `/services/analytics/src/clients.py` - HTTP client for market-data
- `/services/analytics/tests/test_indicators.py`
- `/services/analytics/tests/test_signals.py`

**Dependencies:**
```toml
[project]
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn[standard]>=0.23.0",
    "pandas>=2.0.0",
    "numpy>=1.24.0",
    "ta>=0.11.0",
    "httpx>=0.24.0",
    "pydantic>=2.0.0"
]
```

**Endpoints:**
- `POST /internal/indicators`
  - Request: `{ "symbol": "BTC/USDT", "interval": "1m", "from": 123, "to": 456, "indicators": ["ema_20", "ema_50", "rsi_14"] }`
  - Response: `[{ "timestamp": 123, "ema_20": 45000.5, "ema_50": 44500.2, "rsi_14": 65.5 }, ...]`
- `POST /internal/signals`
  - Request: `{ "symbol": "BTC/USDT", "interval": "1m", "from": 123, "to": 456, "strategy_id": "ema_crossover_rsi" }`
  - Response: `[{ "timestamp": 123, "action": "buy", "confidence": 0.75, "metadata": {...} }, ...]`

**Baseline Strategy (EMA Crossover + RSI):**
- Calculate EMA(20) and EMA(50)
- Calculate RSI(14)
- **Buy signal**: EMA(20) crosses above EMA(50) AND RSI < 70
- **Sell signal**: EMA(20) crosses below EMA(50) AND RSI > 30
- **Hold**: Otherwise

**Implementation details:**
- Fetch candles from market-data-service via HTTP
- Use pandas DataFrame for vectorized calculations
- Use `ta` library for indicators
- Return deterministic results (no randomness)
- Handle edge cases (not enough data, missing candles)

### Phase 6: Frontend
**Priority: Medium-High**

**Files to create:**
- `/frontend/package.json`
- `/frontend/tsconfig.json`
- `/frontend/vite.config.ts`
- `/frontend/index.html`
- `/frontend/src/main.tsx` - React entry point
- `/frontend/src/App.tsx` - Main app component
- `/frontend/src/components/Chart.tsx` - TradingView Lightweight Charts wrapper
- `/frontend/src/components/SymbolSelector.tsx` - Dropdown for symbol selection
- `/frontend/src/components/IntervalSelector.tsx` - 1m, 5m, 1h, etc.
- `/frontend/src/hooks/useWebSocket.ts` - WebSocket connection management
- `/frontend/src/hooks/useCandles.ts` - Fetch historical + subscribe to updates
- `/frontend/src/types/index.ts` - Frontend-specific types
- `/frontend/src/utils/chartHelpers.ts` - Chart data formatting
- `/frontend/tests/components.test.tsx`

**Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lightweight-charts": "^4.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

**Features:**
- Symbol selector (BTC/USDT, ETH/USDT)
- Interval selector (1m, 5m, 15m, 1h)
- Candlestick chart with TradingView Lightweight Charts
- EMA(20) and EMA(50) overlays
- Signal markers (arrows for buy/sell)
- Real-time updates via WebSocket
- Initial historical data load via REST

**Implementation details:**
- Use `createChart()` from lightweight-charts
- Add candlestick series + line series for EMAs
- Add markers for signals
- WebSocket reconnection logic
- Loading states and error handling

### Phase 7: Testing & Documentation

**Unit Tests:**
- Market-data: Provider abstraction, normalizer, storage
- Gateway: Route handlers, WebSocket message validation
- Analytics: Indicator calculations, signal generation
- Frontend: Component rendering, hooks

**Integration Tests:**
- End-to-end: Start all services, subscribe to candles, verify data flow
- API contracts: Ensure gateway ↔ market-data ↔ analytics work together

**Documentation:**
- Update `/README.md` with setup instructions
- Add API documentation (could use Swagger/OpenAPI later)
- Add architecture diagram to `/AGENT.md`

### Phase 8: Configuration & Environment

**Files to create:**
- `/services/market-data/.env.example`
- `/services/gateway/.env.example`
- `/services/analytics/.env.example`

**Key configuration:**
- Market-data: `PROVIDER=binance|coinbase|mock`, `SQLITE_PATH=./data.db`, `SYMBOLS=BTC/USDT,ETH/USDT`
- Gateway: `PORT=3000`, `MARKET_DATA_URL=http://localhost:3001`, `ANALYTICS_URL=http://localhost:3002`
- Analytics: `PORT=3002`, `MARKET_DATA_URL=http://localhost:3001`

## AGENT.md Content

The following will be written to `/AGENT.md` during implementation:

```markdown
# PyTrader Agent Guidelines

## Architecture

Monorepo with 3 backend services (gateway, market-data, analytics) and 1 frontend, using provider abstraction for market data, SQLite storage, WebSocket for real-time updates, and TradingView charts for visualization.

## Design Principles

1. **File Size Limit**: All source files MUST be ≤ 400 lines of code. After generating any file, verify with `wc -l <file>` and split if exceeded.

2. **Provider Abstraction**: All market data access through abstract provider interface. Implementations: Binance, Coinbase, Mock. Easy to add new providers.

3. **Separation of Concerns**:
   - **Gateway**: Client-facing API, WebSocket routing, no business logic
   - **Market-data**: Data ingestion, normalization, storage only
   - **Analytics**: Pure computation (indicators, signals), no I/O

4. **Database Abstraction**: SQLite for development, but design for easy migration to TimescaleDB:
   - Abstract repository layer
   - No SQLite-specific queries in business logic
   - Configuration-driven database selection

5. **Idempotency**: All database writes must be idempotent (use `INSERT OR IGNORE` or `UPSERT`). No duplicate candles.

6. **Type Safety**:
   - TypeScript: Zod schemas for runtime validation, strict TypeScript config
   - Python: Pydantic models for all API payloads
   - Shared type definitions across services

7. **Error Handling & Resilience**:
   - Services MUST recover from external API failures (exchanges, network)
   - Implement retry with exponential backoff
   - Log all errors with context (service, operation, timestamp)
   - Return proper HTTP status codes (4xx for client errors, 5xx for server errors)
   - WebSocket reconnection logic on both client and server

8. **Stateless Services**:
   - Gateway: Only transient WebSocket session state
   - Market-data: Stateless (state in database)
   - Analytics: Pure functions, no state
   - Enables horizontal scaling

9. **Configuration Management**:
   - Environment variables for all configuration
   - `.env.example` files for documentation
   - Fail fast on missing required config
   - No hardcoded credentials or URLs

## Testing Principles

1. **Test Location**: ALL tests MUST be in proper `tests/` directories within each service. NEVER in `.temp-files/`.

2. **Test Coverage**:
   - Unit tests for business logic (providers, normalizers, indicators, signals)
   - Integration tests for API endpoints
   - End-to-end test for full data flow (subscribe → candle → display)

3. **Test Structure**:
   - TypeScript: Use `vitest` or `jest`
   - Python: Use `pytest`
   - Naming: `*.test.ts` or `test_*.py`

4. **Mock External Dependencies**:
   - Mock exchange APIs (Binance, Coinbase) in tests
   - Use mock provider for deterministic tests
   - Mock HTTP clients between services

5. **Deterministic Tests**:
   - No randomness (or use fixed seeds)
   - Fixed timestamps in test data
   - Assertions on exact values, not ranges

6. **Test Data**:
   - Use realistic OHLCV data
   - Test edge cases: empty data, missing candles, invalid intervals
   - Test error scenarios: API failures, network timeouts

## Code Organization

```
pytrader/
├── AGENT.md (this file)
├── README.md
├── services/
│   ├── gateway/          # Node.js/TypeScript
│   │   ├── src/
│   │   └── tests/        ← Tests here
│   ├── market-data/      # Node.js/TypeScript
│   │   ├── src/
│   │   └── tests/        ← Tests here
│   └── analytics/        # Python
│       ├── src/
│       └── tests/        ← Tests here
├── frontend/             # React + Vite + TypeScript
│   ├── src/
│   └── tests/            ← Tests here
└── shared/               # Shared TypeScript types/schemas
    ├── types/
    └── schemas/
```

## File Size Enforcement

After generating ANY file, immediately run:
```bash
wc -l <file>
```

If line count > 400, refactor into multiple files with clear separation of concerns.

## Implementation Checklist

Before considering any service complete:
- [ ] All files ≤ 400 lines (verified with `wc -l`)
- [ ] All tests passing
- [ ] Error handling implemented
- [ ] Configuration via environment variables
- [ ] Type validation (Zod/Pydantic) on all boundaries
- [ ] Logging added
- [ ] README updated with setup instructions
```

## Critical Design Principles Summary

1. **File Size Limit**: All source files must be ≤ 400 lines. Verify with `wc -l <file>` after generation. Split into multiple files if needed.

2. **Data Provider Abstraction**: All market data access goes through provider interface. Easy to add new providers or switch between them.

3. **Separation of Concerns**:
   - Gateway: Routing, WebSocket, client-facing
   - Market-data: Ingestion, normalization, storage
   - Analytics: Pure computation, no I/O

4. **Idempotency**: Database writes must be idempotent (no duplicate candles).

5. **Testing**: Tests in proper `tests/` directories within each service. Not in `.temp-files/`.

6. **Error Handling**:
   - Services recover from external API failures
   - Retry with exponential backoff
   - Log all errors
   - Return proper HTTP status codes

7. **Type Safety**:
   - Zod schemas for runtime validation (TypeScript)
   - Pydantic models for validation (Python)
   - Shared types across frontend/backend

8. **Scalability Hooks**:
   - SQLite now, but abstract database layer for easy TimescaleDB migration
   - Configuration-driven (env vars)
   - Stateless services (except session state in gateway)

## Execution Order

1. **AGENT.md** + Project setup
2. **Shared schemas** (needed by all services)
3. **Market-data service** (foundation)
4. **Gateway service** (depends on market-data)
5. **Analytics service** (depends on market-data)
6. **Frontend** (depends on gateway)
7. **Testing** (throughout, but comprehensive suite at end)

## Validation Checklist

Before marking complete:
- [ ] All files ≤ 400 lines (verify with `wc -l`)
- [ ] All services start without errors
- [ ] Can fetch historical candles from gateway
- [ ] WebSocket delivers real-time updates
- [ ] Analytics returns indicators and signals
- [ ] Frontend displays chart with candles and indicators
- [ ] Tests pass for all services
- [ ] README has clear setup instructions

## Time Estimate

This is a substantial implementation. Expected: 50-70 files across all services. No time estimate provided per user preference - focus is on complete, high-quality implementation.
