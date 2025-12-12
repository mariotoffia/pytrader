.PHONY: help install build test clean clean-python-env python-env serve serve-all dev stop check-deps

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)PyTrader - Makefile Commands$(NC)"
	@echo "=============================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

check-deps: ## Check if required dependencies are installed
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Error: node is not installed$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)Error: npm is not installed$(NC)"; exit 1; }
	@command -v python3 >/dev/null 2>&1 || { echo "$(RED)Error: python3 is not installed$(NC)"; exit 1; }
	@command -v pip3 >/dev/null 2>&1 || { echo "$(RED)Error: pip3 is not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ All dependencies are installed$(NC)"
	@echo ""
	@node --version | awk '{print "Node.js: " $$0}'
	@npm --version | awk '{print "npm: " $$0}'
	@python3 --version | awk '{print "Python: " $$0}'
	@echo ""

install: check-deps ## Install all dependencies (Node.js + Python)
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@echo "$(YELLOW)→ Installing Node.js dependencies...$(NC)"
	npm install
	@echo ""
	@echo "$(YELLOW)→ Installing Python dependencies...$(NC)"
	cd services/analytics && pip3 install -r requirements.txt
	@echo ""
	@echo "$(GREEN)✓ All dependencies installed successfully!$(NC)"

build: ## Build all TypeScript projects
	@echo "$(BLUE)Building TypeScript projects...$(NC)"
	@echo "$(YELLOW)→ Building shared types...$(NC)"
	cd shared && npm run build
	@echo "$(YELLOW)→ Building market-data service...$(NC)"
	cd services/market-data && npm run build
	@echo "$(YELLOW)→ Building gateway service...$(NC)"
	cd services/gateway && npm run build
	@echo "$(YELLOW)→ Building frontend...$(NC)"
	cd frontend && npm run build
	@echo ""
	@echo "$(GREEN)✓ All projects built successfully!$(NC)"

test: ## Run all tests (TypeScript + Python)
	@echo "$(BLUE)Running tests...$(NC)"
	@echo "$(YELLOW)→ Running market-data tests...$(NC)"
	cd services/market-data && npm test || true
	@echo ""
	@echo "$(YELLOW)→ Running gateway tests...$(NC)"
	cd services/gateway && npm test || true
	@echo ""
	@echo "$(YELLOW)→ Running frontend tests...$(NC)"
	cd frontend && npm test || true
	@echo ""
	@echo "$(YELLOW)→ Running analytics tests...$(NC)"
	cd services/analytics && .venv/bin/python -m pytest tests/ -v || true
	@echo ""
	@echo "$(GREEN)✓ Tests completed!$(NC)"

test-e2e: ## Run end-to-end tests (requires services to be running)
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@chmod +x ./test-e2e.sh
	./test-e2e.sh

clean: ## Clean all build artifacts and node_modules
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@echo "$(YELLOW)→ Removing node_modules...$(NC)"
	rm -rf node_modules
	rm -rf services/gateway/node_modules
	rm -rf services/market-data/node_modules
	rm -rf frontend/node_modules
	rm -rf shared/node_modules
	@echo "$(YELLOW)→ Removing build directories...$(NC)"
	rm -rf services/gateway/dist
	rm -rf services/market-data/dist
	rm -rf frontend/dist
	rm -rf shared/dist
	@echo "$(YELLOW)→ Removing databases...$(NC)"
	rm -rf data/*.db data/*.db-* 2>/dev/null || true
	@echo "$(YELLOW)→ Removing logs and PID files...$(NC)"
	rm -rf logs
	rm -f .pid-market-data .pid-gateway .pid-analytics .pid-frontend .pid-*
	@echo ""
	@echo "$(GREEN)✓ Cleanup completed!$(NC)"

clean-python-env: ## Remove Python virtualenv and caches (analytics service)
	@echo "$(YELLOW)→ Removing Python virtual environments...$(NC)"
	rm -rf .venv services/analytics/.venv
	@echo "$(YELLOW)→ Removing Python cache...$(NC)"
	find services/analytics -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find services/analytics -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf services/analytics/.pytest_cache services/analytics/.mypy_cache services/analytics/.ruff_cache

python-env: ## Create/refresh Python env for analytics with uv
	@command -v uv >/dev/null 2>&1 || { echo "$(RED)Error: uv is not installed$(NC)"; exit 1; }
	@echo "$(BLUE)Setting up Python virtual environment with uv...$(NC)"
	cd services/analytics && uv venv .venv
	@echo "$(YELLOW)→ Installing Python dependencies via uv (services/analytics/requirements.txt)...$(NC)"
	cd services/analytics && UV_PROJECT_ENVIRONMENT=.venv uv pip install -r requirements.txt
	@echo ""
	@echo "$(GREEN)✓ Python environment ready!$(NC)"
	@echo "Activate: source services/analytics/.venv/bin/activate"
	@echo "Or run with uv: UV_PROJECT_ENVIRONMENT=services/analytics/.venv uv run python -m src.main"

serve: ## Start all services in development mode (requires 4 terminals)
	@echo "$(BLUE)Starting PyTrader services...$(NC)"
	@echo ""
	@echo "$(YELLOW)Run these commands in separate terminals:$(NC)"
	@echo ""
	@echo "$(GREEN)Terminal 1 - Market Data Service:$(NC)"
	@echo "  cd services/market-data && npm run dev"
	@echo ""
	@echo "$(GREEN)Terminal 2 - Gateway Service:$(NC)"
	@echo "  cd services/gateway && npm run dev"
	@echo ""
	@echo "$(GREEN)Terminal 3 - Analytics Service:$(NC)"
	@echo "  cd services/analytics && uvicorn src.main:app --reload --port 4002"
	@echo ""
	@echo "$(GREEN)Terminal 4 - Frontend:$(NC)"
	@echo "  cd frontend && npm run dev"
	@echo ""
	@echo "$(BLUE)Or use 'make serve-all' to start in background$(NC)"

serve-all: ## Start all services in background (use 'make stop' to stop)
	@echo "$(BLUE)Starting all services in background...$(NC)"
	@mkdir -p logs
	@echo ""
	@if lsof -Pi :4001 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)→ Market Data Service already running on port 4001, skipping...$(NC)"; \
	else \
		echo "$(YELLOW)→ Starting Market Data Service on port 4001...$(NC)"; \
		cd services/market-data && npm run dev > ../../logs/market-data.log 2>&1 & echo $$! > ../../.pid-market-data; \
		sleep 2; \
	fi
	@if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)→ Gateway Service already running on port 4000, skipping...$(NC)"; \
	else \
		echo "$(YELLOW)→ Starting Gateway Service on port 4000...$(NC)"; \
		cd services/gateway && npm run dev > ../../logs/gateway.log 2>&1 & echo $$! > ../../.pid-gateway; \
		sleep 2; \
	fi
	@if lsof -Pi :4002 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)→ Analytics Service already running on port 4002, skipping...$(NC)"; \
	else \
		echo "$(YELLOW)→ Starting Analytics Service on port 4002...$(NC)"; \
		cd services/analytics && .venv/bin/uvicorn src.main:app --reload --port 4002 > ../../logs/analytics.log 2>&1 & echo $$! > ../../.pid-analytics; \
		sleep 2; \
	fi
	@if lsof -Pi :4003 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)→ Frontend already running on port 4003, skipping...$(NC)"; \
	else \
		echo "$(YELLOW)→ Starting Frontend on port 4003...$(NC)"; \
		cd frontend && npm run dev > ../logs/frontend.log 2>&1 & echo $$! > ../.pid-frontend; \
		sleep 2; \
	fi
	@echo ""
	@echo "$(GREEN)✓ All services checked/started!$(NC)"
	@echo ""
	@echo "$(BLUE)Access points:$(NC)"
	@echo "  Frontend:     http://localhost:4003"
	@echo "  Gateway API:  http://localhost:4000"
	@echo "  Market Data:  http://localhost:4001"
	@echo "  Analytics:    http://localhost:4002"
	@echo "  API Docs:     http://localhost:4002/docs"
	@echo ""
	@echo "$(YELLOW)Logs are in ./logs/$(NC)"
	@echo "$(YELLOW)Use 'make stop' to stop all services$(NC)"
	@echo "$(YELLOW)Use 'make status' to check service status$(NC)"
	@echo "$(YELLOW)Use 'make logs' to tail all logs$(NC)"

stop: ## Stop all background services
	@echo "$(BLUE)Stopping all services...$(NC)"
	@if [ -f .pid-market-data ]; then \
		PID=$$(cat .pid-market-data); \
		if ps -p $$PID > /dev/null 2>&1; then \
			pkill -TERM -P $$PID 2>/dev/null; \
			kill $$PID 2>/dev/null; \
			sleep 1; \
			if ps -p $$PID > /dev/null 2>&1; then \
				pkill -KILL -P $$PID 2>/dev/null; \
				kill -9 $$PID 2>/dev/null; \
			fi; \
			echo "$(GREEN)✓ Market Data Service stopped (PID $$PID)$(NC)"; \
		else \
			echo "$(YELLOW)⚠ Market Data Service not running$(NC)"; \
		fi; \
		rm .pid-market-data; \
	fi
	@if lsof -Pi :4001 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		REMAINING_PID=$$(lsof -Pi :4001 -sTCP:LISTEN -t); \
		kill $$REMAINING_PID 2>/dev/null && echo "$(GREEN)✓ Cleaned up orphaned Market Data process (PID $$REMAINING_PID)$(NC)" || true; \
	fi
	@if [ -f .pid-gateway ]; then \
		PID=$$(cat .pid-gateway); \
		if ps -p $$PID > /dev/null 2>&1; then \
			pkill -TERM -P $$PID 2>/dev/null; \
			kill $$PID 2>/dev/null; \
			sleep 1; \
			if ps -p $$PID > /dev/null 2>&1; then \
				pkill -KILL -P $$PID 2>/dev/null; \
				kill -9 $$PID 2>/dev/null; \
			fi; \
			echo "$(GREEN)✓ Gateway Service stopped (PID $$PID)$(NC)"; \
		else \
			echo "$(YELLOW)⚠ Gateway Service not running$(NC)"; \
		fi; \
		rm .pid-gateway; \
	fi
	@if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		REMAINING_PID=$$(lsof -Pi :4000 -sTCP:LISTEN -t); \
		kill $$REMAINING_PID 2>/dev/null && echo "$(GREEN)✓ Cleaned up orphaned Gateway process (PID $$REMAINING_PID)$(NC)" || true; \
	fi
	@if [ -f .pid-analytics ]; then \
		PID=$$(cat .pid-analytics); \
		if ps -p $$PID > /dev/null 2>&1; then \
			pkill -TERM -P $$PID 2>/dev/null; \
			kill $$PID 2>/dev/null; \
			sleep 1; \
			if ps -p $$PID > /dev/null 2>&1; then \
				pkill -KILL -P $$PID 2>/dev/null; \
				kill -9 $$PID 2>/dev/null; \
			fi; \
			echo "$(GREEN)✓ Analytics Service stopped (PID $$PID)$(NC)"; \
		else \
			echo "$(YELLOW)⚠ Analytics Service not running$(NC)"; \
		fi; \
		rm .pid-analytics; \
	fi
	@if lsof -Pi :4002 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		REMAINING_PID=$$(lsof -Pi :4002 -sTCP:LISTEN -t); \
		kill $$REMAINING_PID 2>/dev/null && echo "$(GREEN)✓ Cleaned up orphaned Analytics process (PID $$REMAINING_PID)$(NC)" || true; \
	fi
	@if [ -f .pid-frontend ]; then \
		PID=$$(cat .pid-frontend); \
		if ps -p $$PID > /dev/null 2>&1; then \
			pkill -TERM -P $$PID 2>/dev/null; \
			kill $$PID 2>/dev/null; \
			sleep 1; \
			if ps -p $$PID > /dev/null 2>&1; then \
				pkill -KILL -P $$PID 2>/dev/null; \
				kill -9 $$PID 2>/dev/null; \
			fi; \
			echo "$(GREEN)✓ Frontend stopped (PID $$PID)$(NC)"; \
		else \
			echo "$(YELLOW)⚠ Frontend not running$(NC)"; \
		fi; \
		rm .pid-frontend; \
	fi
	@if lsof -Pi :4003 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		REMAINING_PID=$$(lsof -Pi :4003 -sTCP:LISTEN -t); \
		kill $$REMAINING_PID 2>/dev/null && echo "$(GREEN)✓ Cleaned up orphaned Frontend process (PID $$REMAINING_PID)$(NC)" || true; \
	fi
	@echo ""
	@echo "$(GREEN)✓ All services stopped!$(NC)"

logs: ## Tail all service logs
	@echo "$(BLUE)Tailing logs (Ctrl+C to stop)...$(NC)"
	@mkdir -p logs
	@tail -f logs/*.log 2>/dev/null || echo "$(YELLOW)No logs found. Services may not be running.$(NC)"

dev: install build ## Full development setup (install + build)
	@echo ""
	@echo "$(GREEN)✓ Development environment ready!$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Configure services (copy .env.example to .env in each service)"
	@echo "  2. Run 'make serve' to see manual start commands"
	@echo "  3. Or run 'make serve-all' to start in background"

status: ## Check status of all services
	@echo "$(BLUE)Service Status:$(NC)"
	@echo ""
	@echo -n "Market Data (4001): "
	@if lsof -Pi :4001 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		PID=$$(lsof -Pi :4001 -sTCP:LISTEN -t | head -1); \
		if [ -f .pid-market-data ]; then \
			SAVED_PID=$$(cat .pid-market-data); \
			PGREP_PID=$$(pgrep -P $$SAVED_PID 2>/dev/null | head -1); \
			if [ "$$PID" = "$$SAVED_PID" ] || [ "$$PID" = "$$PGREP_PID" ]; then \
				echo "$(GREEN)Running (PID: $$PID) [managed]$(NC)"; \
			else \
				echo "$(GREEN)Running (PID: $$PID) [unmanaged]$(NC)"; \
			fi; \
		else \
			echo "$(GREEN)Running (PID: $$PID) [unmanaged]$(NC)"; \
		fi; \
	else \
		if [ -f .pid-market-data ]; then \
			echo "$(RED)Stopped (stale PID file)$(NC)"; \
		else \
			echo "$(RED)Stopped$(NC)"; \
		fi; \
	fi
	@echo -n "Gateway (4000):     "
	@if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		PID=$$(lsof -Pi :4000 -sTCP:LISTEN -t | head -1); \
		if [ -f .pid-gateway ]; then \
			SAVED_PID=$$(cat .pid-gateway); \
			PGREP_PID=$$(pgrep -P $$SAVED_PID 2>/dev/null | head -1); \
			if [ "$$PID" = "$$SAVED_PID" ] || [ "$$PID" = "$$PGREP_PID" ]; then \
				echo "$(GREEN)Running (PID: $$PID) [managed]$(NC)"; \
			else \
				echo "$(GREEN)Running (PID: $$PID) [unmanaged]$(NC)"; \
			fi; \
		else \
			echo "$(GREEN)Running (PID: $$PID) [unmanaged]$(NC)"; \
		fi; \
	else \
		if [ -f .pid-gateway ]; then \
			echo "$(RED)Stopped (stale PID file)$(NC)"; \
		else \
			echo "$(RED)Stopped$(NC)"; \
		fi; \
	fi
	@echo -n "Analytics (4002):   "
	@if lsof -Pi :4002 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		PID=$$(lsof -Pi :4002 -sTCP:LISTEN -t | head -1); \
		if [ -f .pid-analytics ]; then \
			SAVED_PID=$$(cat .pid-analytics); \
			PGREP_PID=$$(pgrep -P $$SAVED_PID 2>/dev/null | head -1); \
			if [ "$$PID" = "$$SAVED_PID" ] || [ "$$PID" = "$$PGREP_PID" ]; then \
				echo "$(GREEN)Running (PID: $$PID) [managed]$(NC)"; \
			else \
				echo "$(GREEN)Running (PID: $$PID) [unmanaged]$(NC)"; \
			fi; \
		else \
			echo "$(GREEN)Running (PID: $$PID) [unmanaged]$(NC)"; \
		fi; \
	else \
		if [ -f .pid-analytics ]; then \
			echo "$(RED)Stopped (stale PID file)$(NC)"; \
		else \
			echo "$(RED)Stopped$(NC)"; \
		fi; \
	fi
	@echo -n "Frontend (4003):    "
	@if lsof -Pi :4003 -sTCP:LISTEN -t >/dev/null 2>&1; then \
		PID=$$(lsof -Pi :4003 -sTCP:LISTEN -t | head -1); \
		if [ -f .pid-frontend ]; then \
			SAVED_PID=$$(cat .pid-frontend); \
			PGREP_PID=$$(pgrep -P $$SAVED_PID 2>/dev/null | head -1); \
			if [ "$$PID" = "$$SAVED_PID" ] || [ "$$PID" = "$$PGREP_PID" ]; then \
				echo "$(GREEN)Running (PID: $$PID) [managed]$(NC)"; \
			else \
				echo "$(GREEN)Running (PID: $$PID) [unmanaged]$(NC)"; \
			fi; \
		else \
			echo "$(GREEN)Running (PID: $$PID) [unmanaged]$(NC)"; \
		fi; \
	else \
		if [ -f .pid-frontend ]; then \
			echo "$(RED)Stopped (stale PID file)$(NC)"; \
		else \
			echo "$(RED)Stopped$(NC)"; \
		fi; \
	fi
	@echo ""
	@echo "$(YELLOW)[managed] = started with 'make serve-all'$(NC)"
	@echo "$(YELLOW)[unmanaged] = started manually$(NC)"

quick-start: ## Quick start for first-time setup
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)   PyTrader Quick Start$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@$(MAKE) install
	@echo ""
	@$(MAKE) build
	@echo ""
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(BLUE)Starting services...$(NC)"
	@mkdir -p logs
	@$(MAKE) serve-all
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(GREEN)✓ PyTrader is running!$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "Open your browser: $(GREEN)http://localhost:5173$(NC)"
	@echo ""
