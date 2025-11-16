# Orders Field E2E Tests

This directory contains comprehensive E2E tests for the Orders field functionality in the Notary Everyday workspace.

## Test Files

1. **`orders-field-notary-everyday.spec.ts`** - Playwright test suite (recommended)
2. **`orders-field-notary-everyday-puppeteer.spec.ts`** - Puppeteer test suite with Jest

## Running the Tests

### Playwright Tests (Recommended)

```bash
# Run all Orders field tests
npx playwright test tests/e2e/orders-field-notary-everyday.spec.ts

# Run in headed mode (see browser)
npx playwright test tests/e2e/orders-field-notary-everyday.spec.ts --headed

# Run in UI mode
npx playwright test tests/e2e/orders-field-notary-everyday.spec.ts --ui

# Run specific test
npx playwright test tests/e2e/orders-field-notary-everyday.spec.ts -g "should display Orders field"
```

### Puppeteer Tests (Jest)

```bash
# Run Puppeteer tests with Jest
npm test -- tests/e2e/orders-field-notary-everyday-puppeteer.spec.ts

# Or with tsx directly
npx tsx tests/e2e/orders-field-notary-everyday-puppeteer.spec.ts
```

## Environment Variables

Set these environment variables before running tests:

```bash
export TEST_EMAIL=ryan@notaryeveryday.com
export TEST_PASSWORD=your_password
export TEST_WORKSPACE=notary-everyday
export BASE_URL=http://localhost:3000
export HEADLESS=false  # Set to 'false' to see browser (Puppeteer only)
```

## Test Coverage

The tests verify:

1. ✅ Orders field displays in company detail view (Overview tab)
2. ✅ Orders field displays in company tabs for people/leads/prospects/opportunities
3. ✅ Orders column displays in clients table (retention-os)
4. ✅ Orders field is editable and saves correctly
5. ✅ Orders value persists after page refresh
6. ✅ Orders column is sortable in clients table
7. ✅ Orders field is workspace-specific (only shows for Notary Everyday)
8. ✅ API integration saves Orders value correctly in customFields

## Prerequisites

- Notary Everyday workspace must exist
- Test user must have access to Notary Everyday workspace
- At least one company record in Notary Everyday workspace
- Development server running on localhost:3000 (or set BASE_URL)

## Troubleshooting

### Test fails to find Orders field
- Verify you're logged in as a user with Notary Everyday workspace access
- Check that the workspace slug matches (notary-everyday or ne)
- Ensure at least one company exists in the workspace

### Login fails
- Verify TEST_EMAIL and TEST_PASSWORD are correct
- Check that the user has access to Notary Everyday workspace
- Ensure the sign-in page is accessible

### API calls fail
- Verify the development server is running
- Check network tab in browser for API errors
- Ensure database connection is working

