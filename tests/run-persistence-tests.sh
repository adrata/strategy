#!/bin/bash

# Test Runner for Company Field Persistence Tests
# This script runs all persistence tests and provides coverage reporting

set -e

echo "🧪 Running Company Field Persistence Tests"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if required dependencies are installed
print_status "Checking dependencies..."

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    print_error "npx is not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Create test results directory
mkdir -p test-results/persistence

print_status "Starting test execution..."

# Run unit tests
print_status "Running unit tests..."
if npx vitest run tests/unit/company-field-persistence.test.ts --reporter=verbose --coverage.enabled --coverage.reporter=text --coverage.reporter=html --coverage.outputDir=test-results/persistence/coverage-unit 2>&1 | tee test-results/persistence/unit-test-results.txt; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Run integration tests
print_status "Running integration tests..."
if npx vitest run tests/integration/company-persistence-flow.test.tsx --reporter=verbose --coverage.enabled --coverage.reporter=text --coverage.reporter=html --coverage.outputDir=test-results/persistence/coverage-integration 2>&1 | tee test-results/persistence/integration-test-results.txt; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# Run E2E tests
print_status "Running E2E tests..."
if npx playwright test tests/e2e/company-record-persistence.spec.ts --reporter=html --output-dir=test-results/persistence/e2e-results 2>&1 | tee test-results/persistence/e2e-test-results.txt; then
    print_success "E2E tests passed"
else
    print_error "E2E tests failed"
    exit 1
fi

# Generate combined coverage report
print_status "Generating combined coverage report..."
if [ -d "test-results/persistence/coverage-unit" ] && [ -d "test-results/persistence/coverage-integration" ]; then
    # Copy coverage files to a combined directory
    mkdir -p test-results/persistence/coverage-combined
    cp -r test-results/persistence/coverage-unit/* test-results/persistence/coverage-combined/ 2>/dev/null || true
    cp -r test-results/persistence/coverage-integration/* test-results/persistence/coverage-combined/ 2>/dev/null || true
    
    print_success "Combined coverage report generated at test-results/persistence/coverage-combined/"
fi

# Generate test summary
print_status "Generating test summary..."

cat > test-results/persistence/test-summary.md << EOF
# Company Field Persistence Test Results

## Test Execution Summary

### Unit Tests
- **Status**: $(grep -q "✓" test-results/persistence/unit-test-results.txt && echo "PASSED" || echo "FAILED")
- **Coverage**: Available in test-results/persistence/coverage-unit/
- **Details**: See test-results/persistence/unit-test-results.txt

### Integration Tests
- **Status**: $(grep -q "✓" test-results/persistence/integration-test-results.txt && echo "PASSED" || echo "FAILED")
- **Coverage**: Available in test-results/persistence/coverage-integration/
- **Details**: See test-results/persistence/integration-test-results.txt

### E2E Tests
- **Status**: $(grep -q "passed" test-results/persistence/e2e-test-results.txt && echo "PASSED" || echo "FAILED")
- **Results**: Available in test-results/persistence/e2e-results/
- **Details**: See test-results/persistence/e2e-test-results.txt

## Test Coverage Goals

- **Line Coverage**: 90%+ for modified files
- **Branch Coverage**: 85%+ for cache logic
- **Full User Flow Coverage**: E2E tests

## Files Tested

- \`src/frontend/components/pipeline/PipelineDetailPage.tsx\`
- \`src/platform/hooks/useFastSectionData.ts\`
- \`src/frontend/components/pipeline/UniversalRecordTemplate.tsx\`

## Test Scenarios Covered

1. **Force-refresh flag management**
   - Setting flags when saving fields
   - Clearing flags after detection
   - Flag detection logic

2. **Cache behavior**
   - Bypassing cache when flags exist
   - Using cache when no flags exist
   - Session storage management

3. **Full user flows**
   - Save field → navigate away → return
   - Multiple field edits
   - Browser back navigation
   - Direct link navigation
   - Rapid edits and navigation

4. **Edge cases**
   - Network errors
   - Concurrent edits
   - Multiple companies
   - Session storage edge cases

## Next Steps

If any tests fail:
1. Check the detailed logs in the test-results directory
2. Review the coverage reports to identify untested code paths
3. Update tests to cover any missing scenarios
4. Re-run tests to verify fixes

EOF

print_success "Test summary generated at test-results/persistence/test-summary.md"

# Display final results
echo ""
echo "🎉 Test Execution Complete!"
echo "=========================="
echo ""
echo "📊 Results Summary:"
echo "  • Unit Tests: $(grep -q "✓" test-results/persistence/unit-test-results.txt && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  • Integration Tests: $(grep -q "✓" test-results/persistence/integration-test-results.txt && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  • E2E Tests: $(grep -q "passed" test-results/persistence/e2e-test-results.txt && echo "✅ PASSED" || echo "❌ FAILED")"
echo ""
echo "📁 Test Results:"
echo "  • Unit Test Results: test-results/persistence/unit-test-results.txt"
echo "  • Integration Test Results: test-results/persistence/integration-test-results.txt"
echo "  • E2E Test Results: test-results/persistence/e2e-test-results.txt"
echo "  • Coverage Reports: test-results/persistence/coverage-*/"
echo "  • Test Summary: test-results/persistence/test-summary.md"
echo ""

# Check if all tests passed
if grep -q "✓" test-results/persistence/unit-test-results.txt && \
   grep -q "✓" test-results/persistence/integration-test-results.txt && \
   grep -q "passed" test-results/persistence/e2e-test-results.txt; then
    print_success "All tests passed! 🎉"
    exit 0
else
    print_error "Some tests failed. Please check the results above."
    exit 1
fi
