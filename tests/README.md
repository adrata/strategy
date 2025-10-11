# Adrata E2E Test Suite

This directory contains end-to-end tests for the Adrata application, with a focus on authentication testing to ensure the sign-in flow remains functional across deployments.

## Test Structure

```
tests/
├── e2e/                    # End-to-end test files
│   ├── auth.spec.ts        # Authentication flow tests
│   ├── global-setup.js     # Global test setup
│   └── global-teardown.js  # Global test teardown
├── fixtures/               # Test utilities and fixtures
│   └── auth.fixture.ts     # Authentication test utilities
├── pages/                  # Page Object Model
│   └── SignInPage.ts       # Sign-in page interactions
└── README.md              # This file
```

## Running Tests

### Prerequisites

1. **Test User Setup**: Ensure you have a test user in your database with the credentials specified in `.env.test`:
   - Email: `test@adrata.com`
   - Password: `TestPassword123!`

2. **Environment Variables**: Copy `.env.test` to `.env.local` and update the database URL:
   ```bash
   cp .env.test .env.local
   # Edit .env.local with your actual test database URL
   ```

3. **Database**: Make sure your test database is running and accessible.

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run only authentication tests
npm run test:e2e:auth

# Run tests with browser UI visible
npm run test:e2e:headed

# Run tests with Playwright UI
npm run test:e2e:ui

# Debug tests (step through)
npm run test:e2e:debug

# Run tests for CI/CD
npm run test:e2e:ci
```

## Test Coverage

The authentication test suite covers:

### ✅ Page Load & UI Validation
- Sign-in page loads correctly
- Form elements are present and functional
- No console errors on page load
- Proper form validation attributes

### ✅ Failed Authentication
- Empty form submission validation
- Invalid credentials handling
- User-friendly error messages
- Form remains functional after errors

### ✅ Successful Authentication
- Valid credentials authentication
- Proper redirect to dashboard
- Session token storage
- Protected route access
- Authenticated user redirects

### ✅ Remember Me Functionality
- Credential persistence when checked
- Credential clearing when unchecked
- Auto-login functionality

### ✅ Keyboard Shortcuts
- Cmd/Ctrl+Enter form submission
- Tab navigation support

### ✅ Security Validation
- No credentials in URL
- SQL injection protection
- XSS attack prevention
- Security headers validation

### ✅ Network Error Handling
- Network failure graceful handling
- Slow network response handling
- User-friendly error messages

### ✅ Session Management
- Valid session creation
- Session expiration handling
- Proper logout functionality

## Test Configuration

### Playwright Configuration
- **Base URL**: `http://localhost:3000`
- **Timeout**: 60 seconds for auth tests
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 attempts on CI
- **Screenshots**: On failure
- **Videos**: On failure

### Test Data
- Test users are defined in `tests/fixtures/auth.fixture.ts`
- Credentials are configurable via environment variables
- Test data generators for edge cases

## Troubleshooting

### Common Issues

1. **Test User Not Found**
   ```
   Error: Invalid credentials
   ```
   - Ensure test user exists in database
   - Check credentials in `.env.test`

2. **Database Connection Failed**
   ```
   Error: Database connection failed
   ```
   - Verify DATABASE_URL in environment
   - Ensure database is running

3. **Page Load Timeout**
   ```
   Error: Timeout waiting for page load
   ```
   - Check if dev server is running on port 3000
   - Verify application is accessible

4. **Element Not Found**
   ```
   Error: Element not found
   ```
   - Check if sign-in page structure changed
   - Update selectors in `SignInPage.ts`

### Debug Mode

Run tests in debug mode to step through issues:
```bash
npm run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through tests line by line
- Inspect page elements
- View console logs
- Take screenshots

## CI/CD Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: npm run test:e2e:ci
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Best Practices

1. **Test Isolation**: Each test clears session state
2. **Page Object Model**: Reusable page interactions
3. **Error Handling**: Comprehensive error scenario testing
4. **Security Testing**: SQL injection and XSS prevention
5. **Performance**: Tests run in under 60 seconds
6. **Maintainability**: Clear test structure and documentation

## Contributing

When adding new authentication tests:

1. Follow the existing test structure
2. Use the Page Object Model pattern
3. Add comprehensive error scenarios
4. Update this README if needed
5. Ensure tests are fast and reliable

## Test Results

Test results are saved in:
- `tests/results/html-report/` - HTML test report
- `tests/results/results.json` - JSON results
- `tests/results/results.xml` - JUnit XML results
- `test-results/` - Screenshots and videos on failure
