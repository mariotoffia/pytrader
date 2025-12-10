#!/bin/bash
# Frontend test runner - runs tests file-by-file to avoid memory issues
# This is a production-ready approach for large test suites

set -e

echo "🧪 Running PyTrader Frontend Tests (File-by-File Mode)"
echo "========================================================"
echo ""

TOTAL_FILES=0
PASSED_FILES=0
FAILED_FILES=0
TOTAL_TESTS=0

# Array of test files
TEST_FILES=(
  "tests/components/SymbolSelector.test.tsx"
  "tests/components/IntervalSelector.test.tsx"
  "tests/hooks/useWebSocket.test.ts"
  "tests/hooks/useCandles.test.ts"
  "tests/hooks/useIndicators.test.ts"
  "tests/hooks/useSignals.test.ts"
  "tests/App.test.tsx"
)

# Run each test file individually
for file in "${TEST_FILES[@]}"; do
  TOTAL_FILES=$((TOTAL_FILES + 1))
  echo "📝 Testing: $file"

  if npm test -- "$file" --run 2>&1 | tee /tmp/test-output.txt | grep -q "Test Files.*passed"; then
    # Extract test count
    TEST_COUNT=$(grep -oE 'Tests.*[0-9]+ passed' /tmp/test-output.txt | grep -oE '[0-9]+' | head -1)
    TOTAL_TESTS=$((TOTAL_TESTS + TEST_COUNT))
    PASSED_FILES=$((PASSED_FILES + 1))
    echo "✅ PASSED ($TEST_COUNT tests)"
  else
    FAILED_FILES=$((FAILED_FILES + 1))
    echo "❌ FAILED"
  fi
  echo ""
done

echo "========================================================"
echo "📊 Test Summary:"
echo "   Files: $PASSED_FILES/$TOTAL_FILES passed"
echo "   Tests: $TOTAL_TESTS total"
echo "========================================================"

if [ $FAILED_FILES -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ $FAILED_FILES file(s) failed"
  exit 1
fi
