#!/bin/bash

# PyTrader End-to-End Test Script
# Tests the complete data flow through all services

set -e

echo "🚀 PyTrader End-to-End Test"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MARKET_DATA_URL="http://localhost:4001"
GATEWAY_URL="http://localhost:4000"
ANALYTICS_URL="http://localhost:4002"
WEBSOCKET_URL="ws://localhost:4000/stream"

# Test functions
test_service_health() {
    local service_name=$1
    local url=$2

    echo -n "Testing $service_name health... "
    response=$(curl -s -w "%{http_code}" -o /dev/null "$url/health")

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response)"
        return 1
    fi
}

test_candles_endpoint() {
    echo -n "Testing candles endpoint... "

    local now=$(date +%s)000
    local one_hour_ago=$((now - 3600000))

    response=$(curl -s "$GATEWAY_URL/candles?symbol=BTC/USDT&interval=1m&from=$one_hour_ago&to=$now")

    # Check if response contains "candles" array
    if echo "$response" | grep -q '"candles"'; then
        candle_count=$(echo "$response" | grep -o '"timestamp"' | wc -l)
        echo -e "${GREEN}✓ OK${NC} ($candle_count candles)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

test_symbols_endpoint() {
    echo -n "Testing symbols endpoint... "

    response=$(curl -s "$GATEWAY_URL/symbols")

    # Check if response contains symbols array
    if echo "$response" | grep -q '"symbols"'; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

test_indicators_endpoint() {
    echo -n "Testing indicators endpoint... "

    local now=$(date +%s)000
    local two_hours_ago=$((now - 7200000))

    response=$(curl -s -X POST "$ANALYTICS_URL/internal/indicators" \
        -H "Content-Type: application/json" \
        -d "{
            \"symbol\": \"BTC/USDT\",
            \"interval\": \"1m\",
            \"from\": $two_hours_ago,
            \"to\": $now,
            \"indicators\": [\"ema_20\", \"ema_50\", \"rsi_14\"]
        }")

    # Check if response contains results
    if echo "$response" | grep -q '"results"'; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

test_signals_endpoint() {
    echo -n "Testing signals endpoint... "

    local now=$(date +%s)000
    local two_hours_ago=$((now - 7200000))

    response=$(curl -s -X POST "$ANALYTICS_URL/internal/signals" \
        -H "Content-Type: application/json" \
        -d "{
            \"symbol\": \"BTC/USDT\",
            \"interval\": \"1m\",
            \"from\": $two_hours_ago,
            \"to\": $now,
            \"strategy_id\": \"ema_crossover_rsi\"
        }")

    # Check if response contains signals
    if echo "$response" | grep -q '"signals"'; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Main test execution
main() {
    echo "1. Health Checks"
    echo "----------------"
    test_service_health "Market Data" "$MARKET_DATA_URL" || exit 1
    test_service_health "Gateway" "$GATEWAY_URL" || exit 1
    test_service_health "Analytics" "$ANALYTICS_URL" || exit 1
    echo ""

    echo "2. API Endpoints"
    echo "----------------"
    test_symbols_endpoint || exit 1
    test_candles_endpoint || exit 1
    echo ""

    echo "3. Analytics"
    echo "------------"
    test_indicators_endpoint || exit 1
    test_signals_endpoint || exit 1
    echo ""

    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "✅ End-to-End Test Complete"
    echo ""
    echo "📝 Summary:"
    echo "  - All services are healthy"
    echo "  - REST APIs working correctly"
    echo "  - Data flow verified"
    echo "  - Analytics calculating indicators & signals"
    echo ""
    echo "🌐 Access Points:"
    echo "  - Frontend: http://localhost:4003"
    echo "  - Gateway API: $GATEWAY_URL"
    echo "  - Analytics Docs: $ANALYTICS_URL/docs"
    echo ""
}

# Run main function
main
