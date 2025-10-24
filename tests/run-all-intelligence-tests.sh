#!/bin/bash

# Comprehensive Test Runner for Company Intelligence API Fixes
# This script runs all tests to verify the Prisma relation fixes

set -e  # Exit on any error

echo "🧪 Company Intelligence API Fix - Comprehensive Test Suite"
echo "=========================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="tests"
RESULTS_DIR="test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "   Test Directory: $TEST_DIR"
echo "   Results Directory: $RESULTS_DIR"
echo "   Timestamp: $TIMESTAMP"
echo ""

# Function to run a test suite
run_test_suite() {
    local test_name="$1"
    local test_file="$2"
    local description="$3"
    
    echo -e "${YELLOW}🧪 Running: $test_name${NC}"
    echo "   File: $test_file"
    echo "   Description: $description"
    echo ""
    
    if [ ! -f "$test_file" ]; then
        echo -e "${RED}❌ Test file not found: $test_file${NC}"
        return 1
    fi
    
    # Run the test and capture output
    local result_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.txt"
    
    if npx jest "$test_file" --verbose --timeout=30000 > "$result_file" 2>&1; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        echo "   Results saved to: $result_file"
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        echo "   Results saved to: $result_file"
        echo "   Last 10 lines of output:"
        tail -10 "$result_file"
        return 1
    fi
}

# Function to run manual API tests
run_manual_tests() {
    echo -e "${YELLOW}🌐 Running Manual API Tests${NC}"
    echo "   Testing actual API endpoints..."
    echo ""
    
    # Check if server is running
    if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Server not running. Starting development server...${NC}"
        npm run dev &
        SERVER_PID=$!
        
        # Wait for server to start
        echo "   Waiting for server to start..."
        for i in {1..30}; do
            if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Server started successfully${NC}"
                break
            fi
            sleep 1
        done
        
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
            return 1
        fi
    fi
    
    # Run manual API tests
    local result_file="$RESULTS_DIR/manual_api_tests_${TIMESTAMP}.txt"
    
    if node tests/manual-api-test.js > "$result_file" 2>&1; then
        echo -e "${GREEN}✅ Manual API Tests PASSED${NC}"
        echo "   Results saved to: $result_file"
        return 0
    else
        echo -e "${RED}❌ Manual API Tests FAILED${NC}"
        echo "   Results saved to: $result_file"
        echo "   Last 10 lines of output:"
        tail -10 "$result_file"
        return 1
    fi
}

# Function to generate test report
generate_report() {
    local passed="$1"
    local failed="$2"
    local total=$((passed + failed))
    
    echo ""
    echo "=========================================================="
    echo -e "${BLUE}📊 Test Results Summary${NC}"
    echo "=========================================================="
    echo "   Total Test Suites: $total"
    echo -e "   ${GREEN}Passed: $passed${NC}"
    echo -e "   ${RED}Failed: $failed${NC}"
    echo "   Success Rate: $(( (passed * 100) / total ))%"
    echo ""
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Company Intelligence API fixes are working correctly.${NC}"
        echo -e "${GREEN}✅ No Prisma relation errors detected.${NC}"
        echo -e "${GREEN}✅ Intelligence APIs are functioning properly.${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Please check the individual result files.${NC}"
        echo -e "${YELLOW}💡 Check the following files for details:${NC}"
        ls -la "$RESULTS_DIR"/*_${TIMESTAMP}.txt 2>/dev/null || echo "   No result files found"
    fi
    
    echo ""
    echo "📁 All test results saved to: $RESULTS_DIR/"
    echo "🕒 Timestamp: $TIMESTAMP"
}

# Main test execution
echo -e "${BLUE}🚀 Starting Comprehensive Test Suite${NC}"
echo ""

# Initialize counters
PASSED=0
FAILED=0

# Test 1: Unit Tests for API Fixes
if run_test_suite "Unit Tests" "$TEST_DIR/api/company-intelligence-fix.test.ts" "Unit tests for Prisma relation fixes"; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Test 2: Integration Tests
if run_test_suite "Integration Tests" "$TEST_DIR/integration/company-intelligence-integration.test.ts" "Integration tests for complete workflows"; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Test 3: Manual API Tests
if run_manual_tests; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Test 4: Schema Validation
echo -e "${YELLOW}🔍 Running Schema Validation${NC}"
echo "   Validating Prisma schema consistency..."
echo ""

if npx prisma validate > "$RESULTS_DIR/schema_validation_${TIMESTAMP}.txt" 2>&1; then
    echo -e "${GREEN}✅ Schema Validation PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Schema Validation FAILED${NC}"
    echo "   Check schema_validation_${TIMESTAMP}.txt for details"
    ((FAILED++))
fi

# Test 5: TypeScript Compilation
echo -e "${YELLOW}🔧 Running TypeScript Compilation Check${NC}"
echo "   Checking for TypeScript errors in fixed files..."
echo ""

if npx tsc --noEmit --project tsconfig.json > "$RESULTS_DIR/typescript_check_${TIMESTAMP}.txt" 2>&1; then
    echo -e "${GREEN}✅ TypeScript Compilation PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ TypeScript Compilation FAILED${NC}"
    echo "   Check typescript_check_${TIMESTAMP}.txt for details"
    ((FAILED++))
fi

# Clean up server if we started it
if [ ! -z "$SERVER_PID" ]; then
    echo -e "${YELLOW}🧹 Cleaning up development server...${NC}"
    kill $SERVER_PID 2>/dev/null || true
fi

# Generate final report
generate_report $PASSED $FAILED

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
