#!/bin/bash

# Test runner for Actions Delete and Validation features
echo "🧪 Running Actions Delete and Validation Tests"
echo "=============================================="

# Set environment variables for testing
export NODE_ENV=test
export DATABASE_URL="file:./test.db"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="test-secret"

# Function to run tests and capture results
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    
    echo ""
    echo "🔍 Running $test_name..."
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo "✅ $test_name PASSED"
        return 0
    else
        echo "❌ $test_name FAILED"
        return 1
    fi
}

# Track overall results
total_tests=0
passed_tests=0

# Run unit tests for UniversalActionsTab
run_test_suite "UniversalActionsTab Unit Tests" "npm test -- tests/unit/UniversalActionsTab.test.tsx --verbose"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run integration tests for API validation
run_test_suite "Actions API Validation Integration Tests" "npm test -- tests/integration/actions-api-validation.test.ts --verbose"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run end-to-end tests
run_test_suite "Actions E2E Tests" "npx playwright test tests/e2e/actions-delete-and-validation.e2e.ts --reporter=list"
if [ $? -eq 0 ]; then
    ((passed_tests++))
fi
((total_tests++))

# Run specific test scenarios
echo ""
echo "🎯 Running Specific Test Scenarios"
echo "=================================="

# Test 1: Delete functionality
echo ""
echo "Test 1: Delete Button and Confirmation Modal"
echo "--------------------------------------------"
run_test_suite "Delete Button Visibility" "npm test -- --testNamePattern='should show delete button after timestamp'"
run_test_suite "Delete Confirmation Modal" "npm test -- --testNamePattern='should open delete confirmation modal'"
run_test_suite "Delete Confirmation Required" "npm test -- --testNamePattern='should require typing delete'"

# Test 2: API validation
echo ""
echo "Test 2: API Validation Logic"
echo "----------------------------"
run_test_suite "No Validation on Description Update" "npm test -- --testNamePattern='should NOT validate company when only description is being updated'"
run_test_suite "Validation on Company Change" "npm test -- --testNamePattern='should validate company when companyId is being changed'"
run_test_suite "No Validation on Same Company" "npm test -- --testNamePattern='should NOT validate company when companyId is the same as existing'"

# Test 3: Error handling
echo ""
echo "Test 3: Error Handling"
echo "----------------------"
run_test_suite "Company Not Found Error" "npm test -- --testNamePattern='should return error when companyId is changed to non-existent company'"
run_test_suite "Delete API Error Handling" "npm test -- --testNamePattern='should show error message when deletion fails'"

# Test 4: Real-world scenarios
echo ""
echo "Test 4: Real-world Scenarios"
echo "---------------------------"
run_test_suite "Invalid Company Reference Fix" "npm test -- --testNamePattern='should allow updating description of action with invalid company reference'"
run_test_suite "Valid Company Change" "npm test -- --testNamePattern='should validate when trying to change to a valid company'"

# Summary
echo ""
echo "📊 Test Results Summary"
echo "======================"
echo "Total Tests: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $((total_tests - passed_tests))"
echo "Success Rate: $(( (passed_tests * 100) / total_tests ))%"

if [ $passed_tests -eq $total_tests ]; then
    echo ""
    echo "🎉 All tests passed! The delete functionality and validation fixes are working correctly."
    exit 0
else
    echo ""
    echo "⚠️  Some tests failed. Please review the output above for details."
    exit 1
fi
