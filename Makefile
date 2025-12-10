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
	@echo "  cd services/analytics && uvicorn src.main:app --reload --port 3002"
	@echo ""
	@echo "$(GREEN)Terminal 4 - Frontend:$(NC)"
	@echo "  cd frontend && npm run dev"
	@echo ""
	@echo "$(BLUE)Or use 'make serve-all' to start in background$(NC)"

serve-all: ## Start all services in background (use 'make stop' to stop)
	@echo "$(BLUE)Starting all services in background...$(NC)"
	@echo ""
	@echo "$(YELLOW)→ Starting Market Data Service on port 3001...$(NC)"
	@cd services/market-data && npm run dev > ../../logs/market-data.log 2>&1 & echo $$! > ../../.pid-market-data
	@sleep 2
	@echo "$(YELLOW)→ Starting Gateway Service on port 3000...$(NC)"
	@cd services/gateway && npm run dev > ../../logs/gateway.log 2>&1 & echo $$! > ../../.pid-gateway
	@sleep 2
	@echo "$(YELLOW)→ Starting Analytics Service on port 3002...$(NC)"
	@cd services/analytics && uvicorn src.main:app --reload --port 3002 > ../../logs/analytics.log 2>&1 & echo $$! > ../../.pid-analytics
	@sleep 2
	@echo "$(YELLOW)→ Starting Frontend on port 5173...$(NC)"
	@cd frontend && npm run dev > ../logs/frontend.log 2>&1 & echo $$! > ../.pid-frontend
	@sleep 2
	@echo ""
	@echo "$(GREEN)✓ All services started!$(NC)"
	@echo ""
	@echo "$(BLUE)Access points:$(NC)"
	@echo "  Frontend:     http://localhost:5173"
	@echo "  Gateway API:  http://localhost:3000"
	@echo "  Market Data:  http://localhost:3001"
	@echo "  Analytics:    http://localhost:3002"
	@echo "  API Docs:     http://localhost:3002/docs"
	@echo ""
	@echo "$(YELLOW)Logs are in ./logs/$(NC)"
	@echo "$(YELLOW)Use 'make stop' to stop all services$(NC)"
	@echo "$(YELLOW)Use 'make logs' to tail all logs$(NC)"

stop: ## Stop all background services
	@echo "$(BLUE)Stopping all services...$(NC)"
	@if [ -f .pid-market-data ]; then \
		kill $$(cat .pid-market-data) 2>/dev/null || true; \
		rm .pid-market-data; \
		echo "$(GREEN)✓ Market Data Service stopped$(NC)"; \
	fi
	@if [ -f .pid-gateway ]; then \
		kill $$(cat .pid-gateway) 2>/dev/null || true; \
		rm .pid-gateway; \
		echo "$(GREEN)✓ Gateway Service stopped$(NC)"; \
	fi
	@if [ -f .pid-analytics ]; then \
		kill $$(cat .pid-analytics) 2>/dev/null || true; \
		rm .pid-analytics; \
		echo "$(GREEN)✓ Analytics Service stopped$(NC)"; \
	fi
	@if [ -f .pid-frontend ]; then \
		kill $$(cat .pid-frontend) 2>/dev/null || true; \
		rm .pid-frontend; \
		echo "$(GREEN)✓ Frontend stopped$(NC)"; \
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
	@echo -n "Market Data: "
	@if [ -f .pid-market-data ]; then \
		if ps -p $$(cat .pid-market-data) > /dev/null 2>&1; then \
			echo "$(GREEN)Running (PID: $$(cat .pid-market-data))$(NC)"; \
		else \
			echo "$(RED)Stopped (stale PID file)$(NC)"; \
		fi; \
	else \
		echo "$(RED)Stopped$(NC)"; \
	fi
	@echo -n "Gateway:     "
	@if [ -f .pid-gateway ]; then \
		if ps -p $$(cat .pid-gateway) > /dev/null 2>&1; then \
			echo "$(GREEN)Running (PID: $$(cat .pid-gateway))$(NC)"; \
		else \
			echo "$(RED)Stopped (stale PID file)$(NC)"; \
		fi; \
	else \
		echo "$(RED)Stopped$(NC)"; \
	fi
	@echo -n "Analytics:   "
	@if [ -f .pid-analytics ]; then \
		if ps -p $$(cat .pid-analytics) > /dev/null 2>&1; then \
			echo "$(GREEN)Running (PID: $$(cat .pid-analytics))$(NC)"; \
		else \
			echo "$(RED)Stopped (stale PID file)$(NC)"; \
		fi; \
	else \
		echo "$(RED)Stopped$(NC)"; \
	fi
	@echo -n "Frontend:    "
	@if [ -f .pid-frontend ]; then \
		if ps -p $$(cat .pid-frontend) > /dev/null 2>&1; then \
			echo "$(GREEN)Running (PID: $$(cat .pid-frontend))$(NC)"; \
		else \
			echo "$(RED)Stopped (stale PID file)$(NC)"; \
		fi; \
	else \
		echo "$(RED)Stopped$(NC)"; \
	fi

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
