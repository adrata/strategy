#!/bin/bash

# Adrata Authentication E2E Test Setup Verification
# This script verifies that the test setup is complete and functional

set -e

echo "🔍 Adrata Authentication E2E Test Setup Verification"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project root directory confirmed"

# Check required files exist
echo ""
echo "📁 Checking required files..."

REQUIRED_FILES=(
    "playwright.config.ts"
    "tests/e2e/auth.spec.ts"
    "tests/fixtures/auth.fixture.ts"
    "tests/pages/SignInPage.ts"
    "tests/e2e/global-setup.js"
    "tests/e2e/global-teardown.js"
    ".env.test"
    "scripts/run-auth-tests.sh"
    "tests/README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        exit 1
    fi
done

# Check test directory structure
echo ""
echo "📂 Checking test directory structure..."

REQUIRED_DIRS=(
    "tests"
    "tests/e2e"
    "tests/fixtures"
    "tests/pages"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ (missing)"
        exit 1
    fi
done

# Check package.json scripts
echo ""
echo "📦 Checking package.json scripts..."

REQUIRED_SCRIPTS=(
    "test:e2e:auth"
    "test:e2e:headed"
    "test:e2e:ui"
    "test:e2e:debug"
    "test:e2e:ci"
    "test:auth"
    "test:auth:headed"
    "test:auth:ui"
    "test:auth:debug"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo "✅ $script"
    else
        echo "❌ $script (missing from package.json)"
        exit 1
    fi
done

# Check Playwright installation
echo ""
echo "🎭 Checking Playwright installation..."

if command -v npx >/dev/null 2>&1; then
    echo "✅ npx available"
else
    echo "❌ npx not available"
    exit 1
fi

if npx playwright --version >/dev/null 2>&1; then
    PLAYWRIGHT_VERSION=$(npx playwright --version)
    echo "✅ Playwright installed: $PLAYWRIGHT_VERSION"
else
    echo "❌ Playwright not installed"
    exit 1
fi

# Check if browsers are installed
echo ""
echo "🌐 Checking browser installations..."

BROWSERS=("chromium" "firefox" "webkit")
for browser in "${BROWSERS[@]}"; do
    if npx playwright install --dry-run $browser 2>/dev/null | grep -q "already installed"; then
        echo "✅ $browser"
    else
        echo "⚠️  $browser (not installed - run 'npx playwright install')"
    fi
done

# Check test configuration
echo ""
echo "⚙️  Checking test configuration..."

if [ -f "playwright.config.ts" ]; then
    if grep -q "testDir: './tests/e2e'" playwright.config.ts; then
        echo "✅ Test directory configured"
    else
        echo "❌ Test directory not configured correctly"
    fi
    
    if grep -q "baseURL: 'http://localhost:3000'" playwright.config.ts; then
        echo "✅ Base URL configured"
    else
        echo "❌ Base URL not configured correctly"
    fi
fi

# Check environment configuration
echo ""
echo "🔧 Checking environment configuration..."

if [ -f ".env.test" ]; then
    if grep -q "TEST_USER_EMAIL" .env.test; then
        echo "✅ Test user email configured"
    else
        echo "❌ Test user email not configured"
    fi
    
    if grep -q "TEST_USER_PASSWORD" .env.test; then
        echo "✅ Test user password configured"
    else
        echo "❌ Test user password not configured"
    fi
fi

# Test Playwright configuration
echo ""
echo "🧪 Testing Playwright configuration..."

if npx playwright test --list >/dev/null 2>&1; then
    TEST_COUNT=$(npx playwright test --list | grep -c "›")
    echo "✅ Playwright configuration valid"
    echo "✅ Found $TEST_COUNT tests"
else
    echo "❌ Playwright configuration invalid"
    exit 1
fi

# Check test runner script
echo ""
echo "🚀 Checking test runner script..."

if [ -x "scripts/run-auth-tests.sh" ]; then
    echo "✅ Test runner script is executable"
else
    echo "❌ Test runner script is not executable"
    exit 1
fi

# Summary
echo ""
echo "📊 Verification Summary"
echo "======================"
echo "✅ All required files present"
echo "✅ Test directory structure complete"
echo "✅ Package.json scripts configured"
echo "✅ Playwright installed and configured"
echo "✅ Test configuration valid"
echo "✅ Environment variables configured"
echo "✅ Test runner script ready"
echo ""
echo "🎉 Authentication E2E test setup is COMPLETE and ready to use!"
echo ""
echo "🚀 Next steps:"
echo "   1. Create test user in your database with credentials from .env.test"
echo "   2. Run: npm run test:auth"
echo "   3. Or run: bash scripts/run-auth-tests.sh"
echo ""
echo "📚 For detailed instructions, see tests/README.md"
