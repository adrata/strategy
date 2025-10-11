#!/bin/bash

# Adrata Authentication E2E Test Runner
# This script helps run authentication tests with proper setup

set -e

echo "🚀 Adrata Authentication E2E Test Runner"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo "❌ Error: .env.test file not found"
    echo "   Please create .env.test with test user credentials"
    exit 1
fi

# Check if test user credentials are set
if [ -z "$TEST_USER_EMAIL" ] && [ -z "$(grep TEST_USER_EMAIL .env.test)" ]; then
    echo "⚠️  Warning: TEST_USER_EMAIL not found in environment or .env.test"
    echo "   Using default test credentials"
fi

# Load environment variables from .env.test
if [ -f ".env.test" ]; then
    echo "📋 Loading test environment variables..."
    export $(grep -v '^#' .env.test | xargs)
fi

# Check if dev server is running
echo "🔍 Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Development server not running on port 3000"
    echo "   Starting development server..."
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✅ Development server is running"
            break
        fi
        sleep 2
    done
    
    if [ $i -eq 30 ]; then
        echo "❌ Failed to start development server"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi
else
    echo "✅ Development server is already running"
fi

# Check if test user exists (basic check)
echo "🔍 Verifying test user setup..."
if [ -n "$TEST_USER_EMAIL" ]; then
    echo "   Test user email: $TEST_USER_EMAIL"
else
    echo "   Using default test user: test@adrata.com"
fi

# Run the tests
echo ""
echo "🧪 Running authentication E2E tests..."
echo "======================================"

# Parse command line arguments
MODE="default"
if [ "$1" = "headed" ]; then
    MODE="headed"
    echo "   Mode: Headed (browser visible)"
elif [ "$1" = "ui" ]; then
    MODE="ui"
    echo "   Mode: UI (Playwright UI)"
elif [ "$1" = "debug" ]; then
    MODE="debug"
    echo "   Mode: Debug (step through)"
elif [ "$1" = "ci" ]; then
    MODE="ci"
    echo "   Mode: CI (GitHub reporter)"
else
    echo "   Mode: Default (headless)"
fi

# Run tests based on mode
case $MODE in
    "headed")
        npm run test:e2e:auth -- --headed
        ;;
    "ui")
        npm run test:e2e:auth -- --ui
        ;;
    "debug")
        npm run test:e2e:auth -- --debug
        ;;
    "ci")
        npm run test:e2e:auth -- --reporter=github
        ;;
    *)
        npm run test:e2e:auth
        ;;
esac

TEST_EXIT_CODE=$?

# Cleanup
if [ -n "$DEV_PID" ]; then
    echo ""
    echo "🧹 Cleaning up development server..."
    kill $DEV_PID 2>/dev/null || true
fi

# Show results
echo ""
echo "📊 Test Results"
echo "==============="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All authentication tests passed!"
    echo ""
    echo "🎉 Your authentication system is working correctly!"
    echo "   - Sign-in page loads properly"
    echo "   - Authentication flow works"
    echo "   - Security measures are in place"
    echo "   - Session management is functional"
else
    echo "❌ Some tests failed (exit code: $TEST_EXIT_CODE)"
    echo ""
    echo "🔍 Check the test results:"
    echo "   - HTML Report: tests/results/html-report/index.html"
    echo "   - Screenshots: test-results/"
    echo "   - Videos: test-results/"
    echo ""
    echo "💡 Common fixes:"
    echo "   - Ensure test user exists in database"
    echo "   - Check .env.test configuration"
    echo "   - Verify development server is running"
    echo "   - Update test selectors if UI changed"
fi

echo ""
echo "📚 For more information, see tests/README.md"

exit $TEST_EXIT_CODE
