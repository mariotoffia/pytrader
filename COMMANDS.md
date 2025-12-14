# PyTrader Command Guide for Automation

This document provides a clear, standardized command reference optimized for LLMs and automation tools.

## Essential Commands (In Order)

### 1. Initial Setup (Run Once)

```bash
make setup
```

**What it does:**
- Installs Node.js dependencies (npm install)
- Creates Python virtual environment
- Installs Python dependencies
- Automatically builds shared types package

**When to use:** First-time setup or after cleaning node_modules

---

### 2. Build All Projects

```bash
make build
```

**What it does:**
- Builds shared types package (required first)
- Builds gateway service
- Builds market-data service
- Builds frontend

**Build order enforced:** shared → services → frontend

**When to use:** After code changes, before testing or deployment

---

### 3. Start Development

**Option A: Foreground (Recommended for Development)**
```bash
make dev
```
- All services run in parallel with live reload
- Logs shown in terminal
- Press Ctrl+C to stop all services


---

### 4. Verify Everything Works

```bash
make test
```

**What it does:**
- Runs all TypeScript tests (vitest)
- Runs all Python tests (pytest)

---

### 5. Code Quality (Before Committing)

```bash
make quality
```

**What it does:**
- Runs ESLint
- Checks Prettier formatting
- Runs TypeScript type checking

**To auto-fix issues:**
```bash
make lint-fix
make format
```

---

### 6. Cleanup

```bash
make clean      # Remove all build artifacts
```

---

## Service Ports

| Service      | Port | URL                       |
|--------------|------|---------------------------|
| Frontend     | 4003 | http://localhost:4003     |
| Gateway      | 4000 | http://localhost:4000     |
| Market Data  | 4001 | http://localhost:4001     |
| Analytics    | 4002 | http://localhost:4002     |

---

## Common Workflows

### Workflow: Add New Feature

1. Start development environment
   ```bash
   make dev
   ```

2. Edit code (changes auto-reload)

3. Verify types
   ```bash
   make typecheck
   ```

4. Run tests
   ```bash
   make test
   ```

5. Check code quality
   ```bash
   make quality
   ```

6. Fix any issues
   ```bash
   make lint-fix
   make format
   ```

---

### Workflow: Fix Build Issues

1. Clean everything
   ```bash
   make clean
   ```

2. Reinstall dependencies
   ```bash
   make setup
   ```

3. Rebuild
   ```bash
   make build
   ```

4. Verify
   ```bash
   make test
   ```

---

### Workflow: Change Shared Types

1. Edit files in `shared/types/**` or `shared/schemas/**`

2. Rebuild shared types
   ```bash
   npm run build --workspace=shared
   ```

3. Rebuild dependent services
   ```bash
   make build
   ```

4. Verify no breakage
   ```bash
   make test
   make typecheck
   ```

---

### Workflow: Update Dependencies

1. Update package.json files

2. Install
   ```bash
   npm install
   ```

3. Rebuild (shared types auto-built via postinstall)
   ```bash
   make build
   ```

4. Test
   ```bash
   make test
   ```

---

### Workflow: Stop All Services (Clean Shutdown)

```bash
make stop
```

**What it does:**
1. Kills any processes on ports 4000-4003 (orphans)
2. Removes PID files

**When to use:**
- Services won't stop with Ctrl+C
- Ports are still in use after stopping
- You have orphan processes
- Clean slate before restart

---

## All Available Commands

### Setup & Build
```bash
make check-deps      # Verify required tools installed
make setup           # Install all dependencies (Node.js + Python)
make python-env      # Create/refresh Python venv with uv
make build           # Build all projects
make build-clean     # Clean + rebuild
make rebuild         # Alias for build-clean
```

### Development
```bash
make dev             # Start all services (foreground)
make dev-analytics   # Start Python analytics service only
make stop            # Stop all services and kill orphans
make serve           # Show manual start commands for all services
```

### Testing
```bash
make test            # Run all tests
make test-watch      # Run tests in watch mode
make test-coverage   # Run tests with coverage
```

### Code Quality
```bash
make lint            # Check linting
make lint-fix        # Fix linting issues
make format          # Format code
make format-check    # Check formatting
make typecheck       # Type check without building
make quality         # Run all quality checks
```

### Cleanup
```bash
make clean           # Remove artifacts + node_modules
make clean-dist      # Remove only dist folders
make clean-db        # Remove database files
make clean-logs      # Remove logs
make clean-python-env # Remove Python venv and caches
make clean-all       # Complete cleanup
```

### Utilities
```bash
make status          # Show service status
make help            # Show all commands
make quick-start     # Setup + build + start (first time)
```

---

## NPM Scripts Reference

You can also use npm scripts directly:

### Build Scripts
```bash
npm run build                # Build all (shared → services → frontend)
npm run build:shared         # Build only shared types
npm run build:services       # Build only services
npm run build:frontend       # Build only frontend
npm run build:clean          # Clean + rebuild
```

### Dev Scripts
```bash
npm run dev                  # All services (parallel)
npm run dev:ts               # TypeScript services only (parallel)
npm run dev:gateway          # Gateway only
npm run dev:market-data      # Market-data only
npm run dev:frontend         # Frontend only
npm run dev:analytics        # Analytics only (Python)
```

### Test Scripts
```bash
npm run test                 # All tests
npm run test:watch           # Watch mode
npm run test:coverage        # With coverage
```

### Quality Scripts
```bash
npm run lint                 # Check linting
npm run lint:fix             # Fix linting
npm run format               # Format code
npm run format:check         # Check formatting
npm run typecheck            # Type check
```

### Cleanup Scripts
```bash
npm run clean                # All artifacts
npm run clean:dist           # Dist folders only
npm run clean:modules        # node_modules only
npm run clean:db             # Databases only
npm run clean:logs           # Logs only
```

---

## Dependencies Graph

```
shared (no dependencies)
  ↑
  ├── gateway
  ├── market-data
  └── analytics
      ↑
      └── (uses market-data API)

frontend (uses gateway API)
```

**Key Points:**
- `shared` must be built first
- Services depend on `shared` types
- `analytics` calls `market-data` API
- `frontend` calls `gateway` API
- No circular dependencies

---

## Troubleshooting

### "Cannot find module '@pytrader/shared'"

```bash
make clean
npm run build:shared
make build
```

### Services Won't Start

```bash
make status             # Check what's running
make clean-logs         # Clean PID files (if any)
make dev
```

### Tests Failing

```bash
npm run typecheck       # Check types first
npm run lint            # Check linting
npm run test            # Run tests
```

### Build Errors After Changing Shared Types

```bash
npm run build:shared    # Rebuild shared
make build              # Rebuild everything
make test               # Verify
```

---

## Best Practices for LLMs

1. **Always check dependencies first:**
   ```bash
   make check-deps
   ```

2. **Use `make` commands for common tasks** (they handle npm scripts correctly)

3. **Build order matters:**
   - Always build `shared` before services
   - Use `make build` (not `npm run build`) to enforce order

4. **For development, prefer `make dev`** (foreground) over docker

5. **Before committing, always run:**
   ```bash
   make quality
   make test
   ```

6. **Clean builds when in doubt:**
   ```bash
   make build-clean
   ```

7. **Check status when debugging:**
   ```bash
   make status
   ```
