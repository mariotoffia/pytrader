.PHONY: help setup python-env build build-clean rebuild test test-watch test-coverage clean clean-dist clean-db clean-logs clean-all clean-python-env dev dev-analytics stop serve lint lint-fix format format-check typecheck quality check-deps status quick-start

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(BLUE)PyTrader - Makefile Commands$(NC)"
	@echo "=============================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Common Workflows:$(NC)"
	@echo "  First time:  make setup && make build && make dev"
	@echo "  Development: make dev"
	@echo "  Testing:     make test"
	@echo "  Quality:     make quality"
	@echo "  Stop all:    make stop"
	@echo ""

## SETUP COMMANDS

check-deps: ## Verify all required tools are installed
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Error: node is not installed$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)Error: npm is not installed$(NC)"; exit 1; }
	@command -v python3 >/dev/null 2>&1 || { echo "$(RED)Error: python3 is not installed$(NC)"; exit 1; }
	@command -v uv >/dev/null 2>&1 || { echo "$(YELLOW)Warning: uv not found (optional)$(NC)"; }
	@echo "$(GREEN)✓ All required dependencies installed$(NC)"
	@echo ""
	@node --version | awk '{print "Node.js: " $$0}'
	@npm --version | awk '{print "npm: " $$0}'
	@python3 --version | awk '{print "Python: " $$0}'
	@echo ""

setup: check-deps ## Install all dependencies (Node.js + Python)
	@echo "$(BLUE)Running setup...$(NC)"
	npm run setup
	@echo ""
	@echo "$(GREEN)✓ Setup complete$(NC)"

python-env: ## Create/refresh Python virtual environment with uv
	@command -v uv >/dev/null 2>&1 || { echo "$(RED)Error: uv is not installed$(NC)"; exit 1; }
	@echo "$(BLUE)Setting up Python virtual environment with uv...$(NC)"
	cd services/analytics && uv venv .venv
	@echo "$(YELLOW)→ Installing Python dependencies via uv...$(NC)"
	cd services/analytics && UV_PROJECT_ENVIRONMENT=.venv uv pip install -r requirements.txt
	@echo ""
	@echo "$(GREEN)✓ Python environment ready!$(NC)"
	@echo "Activate: source services/analytics/.venv/bin/activate"
	@echo "Or run with: cd services/analytics && .venv/bin/uvicorn src.main:app --reload --port 4002"

## BUILD COMMANDS

build: ## Build all TypeScript projects (shared → services → frontend)
	@echo "$(BLUE)Building all projects...$(NC)"
	npm run build
	@echo ""
	@echo "$(GREEN)✓ Build complete$(NC)"

build-clean: ## Clean and rebuild all projects
	@echo "$(BLUE)Clean build...$(NC)"
	npm run build:clean
	@echo ""
	@echo "$(GREEN)✓ Clean build complete$(NC)"

rebuild: clean-dist build ## Alias for build-clean (backwards compatibility)

## TEST COMMANDS

test: ## Run all tests (TypeScript + Python)
	@echo "$(BLUE)Running tests...$(NC)"
	npm run test
	@cd services/analytics && .venv/bin/pytest tests/ -v || true
	@echo ""
	@echo "$(GREEN)✓ Tests complete$(NC)"

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test:coverage

## CODE QUALITY COMMANDS

lint: ## Run ESLint on all TypeScript files
	@echo "$(BLUE)Running linter...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Linting complete$(NC)"

lint-fix: ## Fix ESLint issues automatically
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)✓ Linting fixes applied$(NC)"

format: ## Format all code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	npm run format
	@echo "$(GREEN)✓ Code formatted$(NC)"

format-check: ## Check code formatting without changes
	@echo "$(BLUE)Checking code formatting...$(NC)"
	npm run format:check

typecheck: ## Run TypeScript type checking (no build)
	@echo "$(BLUE)Type checking...$(NC)"
	npm run typecheck
	@echo "$(GREEN)✓ Type check complete$(NC)"

quality: lint format-check typecheck ## Run all code quality checks

## DEVELOPMENT COMMANDS

dev: ## Start all services in development mode (foreground, parallel)
	@echo "$(BLUE)Starting development mode...$(NC)"
	@echo "$(YELLOW)Note: This starts TypeScript services only$(NC)"
	@echo "$(YELLOW)For analytics, run: make dev-analytics (in separate terminal)$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop all services$(NC)"
	@echo ""
	npm run dev

dev-analytics: ## Start analytics service only (Python)
	@echo "$(BLUE)Starting analytics service...$(NC)"
	npm run dev:analytics

stop: ## Stop all services and kill any orphan processes
	@echo "$(BLUE)Stopping all services...$(NC)"
	@echo "$(YELLOW)→ Stopping docker-compose services...$(NC)"
	@docker-compose down 2>/dev/null || true
	@echo "$(YELLOW)→ Killing processes on ports 4000-4003...$(NC)"
	@lsof -ti :4000 | xargs kill -9 2>/dev/null || true
	@lsof -ti :4001 | xargs kill -9 2>/dev/null || true
	@lsof -ti :4002 | xargs kill -9 2>/dev/null || true
	@lsof -ti :4003 | xargs kill -9 2>/dev/null || true
	@echo "$(YELLOW)→ Cleaning up PID files...$(NC)"
	@rm -f .pid-* 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)✓ All services stopped$(NC)"

serve: ## Show commands to start services manually in separate terminals
	@echo "$(BLUE)Starting PyTrader services...$(NC)"
	@echo ""
	@echo "$(YELLOW)Run these commands in separate terminals:$(NC)"
	@echo ""
	@echo "$(GREEN)Terminal 1 - Market Data Service:$(NC)"
	@echo "  npm run dev:market-data"
	@echo ""
	@echo "$(GREEN)Terminal 2 - Gateway Service:$(NC)"
	@echo "  npm run dev:gateway"
	@echo ""
	@echo "$(GREEN)Terminal 3 - Analytics Service:$(NC)"
	@echo "  npm run dev:analytics"
	@echo ""
	@echo "$(GREEN)Terminal 4 - Frontend:$(NC)"
	@echo "  npm run dev:frontend"

## CLEANUP COMMANDS

clean: ## Remove build artifacts and node_modules
	@echo "$(BLUE)Cleaning all artifacts...$(NC)"
	npm run clean
	@echo ""
	@echo "$(GREEN)✓ Clean complete$(NC)"

clean-dist: ## Remove only dist folders (fast)
	@echo "$(BLUE)Cleaning dist folders...$(NC)"
	npm run clean:dist
	@echo "$(GREEN)✓ Dist folders cleaned$(NC)"

clean-db: ## Remove database files
	@echo "$(BLUE)Cleaning databases...$(NC)"
	npm run clean:db
	@echo "$(GREEN)✓ Databases cleaned$(NC)"

clean-logs: ## Remove logs and PID files
	@echo "$(BLUE)Cleaning logs...$(NC)"
	npm run clean:logs
	@echo "$(GREEN)✓ Logs cleaned$(NC)"

clean-all: clean clean-db clean-logs ## Full cleanup (all artifacts)
	@echo "$(GREEN)✓ Complete cleanup done$(NC)"

clean-python-env: ## Remove Python virtual environment and caches
	@echo "$(BLUE)Cleaning Python environment...$(NC)"
	@echo "$(YELLOW)→ Removing Python virtual environments...$(NC)"
	rm -rf .venv services/analytics/.venv
	@echo "$(YELLOW)→ Removing Python cache...$(NC)"
	find services/analytics -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find services/analytics -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf services/analytics/.pytest_cache services/analytics/.mypy_cache services/analytics/.ruff_cache 2>/dev/null || true
	@echo "$(GREEN)✓ Python environment cleaned$(NC)"

## UTILITY COMMANDS

status: ## Show development server status (ports 4000-4003)
	@echo "$(BLUE)Service Status:$(NC)"
	@echo ""
	@echo "$(YELLOW)Checking ports 4000-4003...$(NC)"
	@lsof -i :4000 -i :4001 -i :4002 -i :4003 2>/dev/null | grep LISTEN || echo "$(YELLOW)No services running on these ports$(NC)"

quick-start: python-env setup build dev ## Complete first-time setup and start
	@echo ""
	@echo "$(GREEN)✓✓✓ PyTrader is ready! ✓✓✓$(NC)"
	@echo ""
	@echo "$(BLUE)Access the application:$(NC)"
	@echo "  Frontend: $(GREEN)http://localhost:4003$(NC)"
