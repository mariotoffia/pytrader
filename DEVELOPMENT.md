# PyTrader Development Guide

Complete guide for developers working on the PyTrader monorepo.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Build System](#build-system)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### First-Time Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd pytrader

# 2. Install dependencies and build
make setup
make build

# 3. Start development environment
make dev
```

Access the application at [http://localhost:4003](http://localhost:4003)

---

## Architecture

### Project Structure

```
pytrader/
├── shared/                 # Shared TypeScript types and Zod schemas
│   ├── types/             # TypeScript type definitions
│   └── schemas/           # Zod validation schemas
├── services/
│   ├── gateway/           # API and WebSocket gateway (TypeScript)
│   ├── market-data/       # Market data service (TypeScript)
│   └── analytics/         # Analytics service (Python)
├── frontend/              # React frontend with Vite
├── docker-compose.yml     # Service orchestration
├── Makefile              # Development commands
└── package.json          # Root workspace configuration
```

### Service Dependency Graph

```
┌─────────────┐
│   shared    │  (TypeScript types + Zod schemas)
└──────┬──────┘
       │
   ┌───┴───────────────┐
   │                   │
┌──▼──────┐     ┌─────▼────────┐
│ gateway │     │ market-data  │
└────┬────┘     └──────▲───────┘
     │                 │
     │          ┌──────┴───────┐
     │          │  analytics   │
     │          └──────────────┘
     │
┌────▼────┐
│frontend │
└─────────┘
```

**Key Points:**
- `shared` has no dependencies (must build first)
- `gateway` and `market-data` depend on `shared`
- `analytics` (Python) calls `market-data` API
- `frontend` calls `gateway` API only

---

## Build System

### NPM Workspaces

The project uses npm workspaces for monorepo management:

```json
{
  "workspaces": [
    "services/gateway",
    "services/market-data",
    "frontend",
    "shared"
  ]
}
```

**Benefits:**
- Shared dependencies are deduplicated
- Cross-workspace dependency support (`@pytrader/shared`)
- Unified script execution across packages

### Build Order

**Critical:** `shared` must be built before any service.

```bash
# Correct order (enforced by `make build`):
npm run build --workspace=shared
npm run build --workspace=services/gateway
npm run build --workspace=services/market-data
npm run build --workspace=frontend
```

**Why:** Services import types from `@pytrader/shared`, which requires the compiled output in `shared/dist/`.

### Automatic Shared Build

The `postinstall` hook automatically builds `shared` after `npm install`:

```json
{
  "scripts": {
    "postinstall": "npm run build:shared"
  }
}
```

This ensures fresh installs always have shared types available.

---

## Development Workflow

### Starting Development Environment

**Option 1: Foreground Mode (Recommended)**

```bash
# Single terminal: all services (shared, gateway, market-data, analytics, frontend)
make dev
```

**What happens:**
- All services start in parallel using `concurrently`
- Shared types rebuild automatically in watch mode
- Services auto-restart on code changes
- Frontend has hot module replacement (HMR)
- Analytics service runs with uvicorn auto-reload
- Press Ctrl+C to stop all services

**Option 2: Manual Service Start (More Control)**

```bash
make serve  # Shows individual commands
```

This displays commands to run each service in separate terminals:
- Terminal 1: `npm run dev:market-data`
- Terminal 2: `npm run dev:gateway`
- Terminal 3: `npm run dev:analytics`
- Terminal 4: `npm run dev:frontend`

### Making Changes

#### Changing Shared Types

```bash
# Edit files in shared/types/ or shared/schemas/

# In dev mode, changes auto-rebuild
# Services auto-restart

# Manual rebuild if needed:
npm run build --workspace=shared
```

#### Changing a Service

```bash
# Edit files in services/{name}/src/

# In dev mode, changes auto-reload (tsx watch mode)
# No manual rebuild needed

# Manual rebuild:
npm run build --workspace=services/{name}
```

#### Changing Frontend

```bash
# Edit files in frontend/src/

# In dev mode, changes trigger HMR
# Page updates without full reload

# Manual rebuild:
npm run build --workspace=frontend
```

---

## Testing

### Running All Tests

```bash
make test
```

**What it runs:**
- All TypeScript tests (vitest)
- All Python tests (pytest)

### Running Tests in Watch Mode

```bash
make test-watch
```

**What it does:**
- Runs tests automatically on file changes
- TypeScript tests only (vitest)

### Running Tests with Coverage

```bash
make test-coverage
```

**What it generates:**
- Coverage reports for all packages
- Located in each package's `coverage/` directory

### Running Tests for Specific Package

```bash
# Gateway tests
npm run test --workspace=services/gateway

# Market-data tests
npm run test --workspace=services/market-data

# Frontend tests
npm run test --workspace=frontend

# Analytics tests (Python)
cd services/analytics && .venv/bin/pytest tests/ -v
```

### Writing Tests

**TypeScript (Vitest):**
```typescript
// services/gateway/tests/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Example Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
```

**Python (Pytest):**
```python
# services/analytics/tests/test_example.py
def test_example():
    assert True
```

---

## Code Quality

### ESLint

**Check linting:**
```bash
make lint
```

**Auto-fix issues:**
```bash
make lint-fix
```

**Configuration:**
- Root: `.eslintrc.json`
- Frontend (React): `frontend/.eslintrc.json`

**Rules:**
- Max file length: 400 lines
- Strict TypeScript checking
- No unused variables (prefix with `_` to ignore)
- Console warnings (except `console.warn` and `console.error`)

### Prettier

**Format all code:**
```bash
make format
```

**Check formatting:**
```bash
make format-check
```

**Configuration:** `.prettierrc.json`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### TypeScript Type Checking

**Run type checking:**
```bash
make typecheck
```

**What it does:**
- Runs `tsc --noEmit` on all packages
- Checks types without generating output
- Faster than full build

### All Quality Checks

**Run everything:**
```bash
make quality
```

**Equivalent to:**
```bash
make lint
make format-check
make typecheck
```

---


### Service Configuration

Each service has its own Dockerfile:
- `services/gateway/Dockerfile`
- `services/market-data/Dockerfile`
- `services/analytics/Dockerfile`
- `frontend/Dockerfile`

**Environment variables:** Configured in `docker-compose.yml`

**Example (market-data):**
```yaml
environment:
  - PORT=4001
  - PROVIDER=mock
  - SQLITE_PATH=/data/market-data.db
  - SYMBOLS=BTC/USDT,ETH/USDT
  - LOG_LEVEL=info
```

### Volume Mounts

Development containers mount source code for live reload:
```yaml
volumes:
  - ./services/market-data:/app/services/market-data
  - ./shared:/app/shared
  - /app/services/market-data/node_modules  # Prevent overwrite
```

---

## Troubleshooting

### "Cannot find module '@pytrader/shared'"

**Cause:** Shared types not built

**Solution:**
```bash
npm run build:shared
# OR
make build
```

### Services Won't Start

**Easiest solution - Stop everything:**
```bash
make stop     # Stops all services and kills orphans
make dev      # Start again
```

**Check what's running:**
```bash
make status
```

**Manual cleanup (if needed):**
```bash
# Find process
lsof -i :4000

# Kill it
kill -9 <PID>
```


### Build Fails After Changing Shared Types

**Clean and rebuild:**
```bash
make clean-dist
make build
```

### Tests Failing Unexpectedly

**Check types first:**
```bash
make typecheck
```

**Check linting:**
```bash
make lint
```

**Clean and rebuild:**
```bash
make clean
make setup
make build
make test
```

### Python Environment Issues

**Recreate virtual environment:**
```bash
cd services/analytics
rm -rf .venv
uv venv .venv
UV_PROJECT_ENVIRONMENT=.venv uv pip install -r requirements.txt
```

### npm Install Issues

**Clear cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Command Reference

See [COMMANDS.md](./COMMANDS.md) for complete command reference.

**Most Common:**
```bash
make help          # Show all commands
make setup         # Install dependencies
make build         # Build all projects
make dev           # Start development
make test          # Run tests
make quality       # Code quality checks
make clean         # Clean artifacts
```

---

## Best Practices

### Before Committing

```bash
make quality       # Lint + format + typecheck
make test          # All tests
```

### Changing Shared Types

1. Edit types in `shared/types/` or `shared/schemas/`
2. Build shared: `npm run build --workspace=shared`
3. Rebuild services: `make build`
4. Run tests: `make test`
5. Check for breakage across all services

### Adding New Dependency

**TypeScript package:**
```bash
cd services/{package-name}
npm install {dependency}
```

**Shared dependency (root):**
```bash
npm install -D {dependency}  # Dev dependency
npm install {dependency}     # Production dependency
```

**Python dependency:**
```bash
cd services/analytics
UV_PROJECT_ENVIRONMENT=.venv uv pip install {dependency}
UV_PROJECT_ENVIRONMENT=.venv uv pip freeze > requirements.txt
```

### File Size Limits

ESLint enforces a **400-line limit** per file.

**If you exceed:**
1. Refactor into smaller modules
2. Split by responsibility
3. Extract utilities/helpers

**Exception:** Only for unavoidable cases

---

## Additional Resources

- [COMMANDS.md](./COMMANDS.md) - Command reference for automation
- [README.md](./README.md) - Project overview
- Root [package.json](./package.json) - Workspace configuration

---

## Support

For issues or questions:
1. Check this guide
2. Check [COMMANDS.md](./COMMANDS.md)
3. Check [Troubleshooting](#troubleshooting)
4. Open an issue in the repository
