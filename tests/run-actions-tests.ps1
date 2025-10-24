# Test runner for Actions Delete and Validation features
Write-Host "🧪 Running Actions Delete and Validation Tests" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Set environment variables for testing
$env:NODE_ENV = "test"
$env:DATABASE_URL = "file:./test.db"
$env:NEXTAUTH_URL = "http://localhost:3000"
$env:NEXTAUTH_SECRET = "test-secret"

# Function to run tests and capture results
function Run-TestSuite {
    param(
        [string]$TestName,
        [string]$TestCommand
    )
    
    Write-Host ""
    Write-Host "🔍 Running $TestName..." -ForegroundColor Yellow
    Write-Host "Command: $TestCommand" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    try {
        Invoke-Expression $TestCommand
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $TestName PASSED" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $TestName FAILED" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $TestName FAILED with error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Track overall results
$totalTests = 0
$passedTests = 0

# Run unit tests for UniversalActionsTab
if (Run-TestSuite "UniversalActionsTab Unit Tests" "npm test -- tests/unit/UniversalActionsTab.test.tsx --verbose") {
    $passedTests++
}
$totalTests++

# Run integration tests for API validation
if (Run-TestSuite "Actions API Validation Integration Tests" "npm test -- tests/integration/actions-api-validation.test.ts --verbose") {
    $passedTests++
}
$totalTests++

# Run end-to-end tests
if (Run-TestSuite "Actions E2E Tests" "npx playwright test tests/e2e/actions-delete-and-validation.e2e.ts --reporter=list") {
    $passedTests++
}
$totalTests++

# Run specific test scenarios
Write-Host ""
Write-Host "🎯 Running Specific Test Scenarios" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Test 1: Delete functionality
Write-Host ""
Write-Host "Test 1: Delete Button and Confirmation Modal" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Yellow

if (Run-TestSuite "Delete Button Visibility" "npm test -- --testNamePattern='should show delete button after timestamp'") {
    $passedTests++
}
$totalTests++

if (Run-TestSuite "Delete Confirmation Modal" "npm test -- --testNamePattern='should open delete confirmation modal'") {
    $passedTests++
}
$totalTests++

if (Run-TestSuite "Delete Confirmation Required" "npm test -- --testNamePattern='should require typing delete'") {
    $passedTests++
}
$totalTests++

# Test 2: API validation
Write-Host ""
Write-Host "Test 2: API Validation Logic" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

if (Run-TestSuite "No Validation on Description Update" "npm test -- --testNamePattern='should NOT validate company when only description is being updated'") {
    $passedTests++
}
$totalTests++

if (Run-TestSuite "Validation on Company Change" "npm test -- --testNamePattern='should validate company when companyId is being changed'") {
    $passedTests++
}
$totalTests++

if (Run-TestSuite "No Validation on Same Company" "npm test -- --testNamePattern='should NOT validate company when companyId is the same as existing'") {
    $passedTests++
}
$totalTests++

# Test 3: Error handling
Write-Host ""
Write-Host "Test 3: Error Handling" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Yellow

if (Run-TestSuite "Company Not Found Error" "npm test -- --testNamePattern='should return error when companyId is changed to non-existent company'") {
    $passedTests++
}
$totalTests++

if (Run-TestSuite "Delete API Error Handling" "npm test -- --testNamePattern='should show error message when deletion fails'") {
    $passedTests++
}
$totalTests++

# Test 4: Real-world scenarios
Write-Host ""
Write-Host "Test 4: Real-world Scenarios" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow

if (Run-TestSuite "Invalid Company Reference Fix" "npm test -- --testNamePattern='should allow updating description of action with invalid company reference'") {
    $passedTests++
}
$totalTests++

if (Run-TestSuite "Valid Company Change" "npm test -- --testNamePattern='should validate when trying to change to a valid company'") {
    $passedTests++
}
$totalTests++

# Summary
Write-Host ""
Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor Red
$successRate = [math]::Round(($passedTests * 100) / $totalTests, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

if ($passedTests -eq $totalTests) {
    Write-Host ""
    Write-Host "🎉 All tests passed! The delete functionality and validation fixes are working correctly." -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. Please review the output above for details." -ForegroundColor Yellow
    exit 1
}
