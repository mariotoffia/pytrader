# PyTrader Agent Guidelines

## Current Status (Dec 10, 2025)

**89% Complete (24/27 items)** | Production-ready for trading with real-time charts, EMA overlays, and signal markers.

**Implemented:** Backend services, Binance/Coinbase/Mock providers, SignalPoller, frontend visualization with EMA 20/50 and buy/sell markers.
**Remaining:** Gateway tests (6-8h), Frontend tests (8-10h).

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
