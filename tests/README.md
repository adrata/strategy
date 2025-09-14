# Adrata Test Suite

This directory contains comprehensive tests for the Adrata application.

## Test Structure

### Unit Tests (`tests/unit/`)
- **Components**: Individual component testing
- **API**: API endpoint testing
- **Utils**: Utility function testing

### Integration Tests (`tests/integration/`)
- **Components**: Component integration with APIs
- **API**: Full API workflow testing
- **Utils**: Cross-module integration testing

### End-to-End Tests (`tests/e2e/`)
- **User Workflows**: Complete user journey testing
- **CRUD Operations**: Create, Read, Update, Delete testing
- **Navigation**: Page navigation and routing testing

## Test Categories

### Lead Management Tests
- ✅ Inline editing functionality
- ✅ Edit modal popup functionality
- ✅ Delete functionality
- ✅ Advance to Prospect functionality
- ✅ URL routing changes

### Data Validation Tests
- ✅ Field validation
- ✅ Data persistence
- ✅ Error handling

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run e2e tests only
npm run test:e2e

# Run specific test file
npm test -- tests/unit/components/LeadDetail.test.tsx
```

## Test Data

Test data is managed in `tests/fixtures/` and should be isolated from production data.
