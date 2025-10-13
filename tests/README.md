# Test Suite Documentation

## Overview

This directory contains comprehensive tests for the Adrata platform, including authentication system tests, table functionality tests, and end-to-end tests.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components and utilities
│   ├── auth/
│   │   ├── sign-in-component.test.tsx    # Sign-in page component tests
│   │   └── auth-utilities.test.ts        # Authentication utility tests
│   └── tables/
│       ├── column-mapping.test.ts        # Column mapping and configuration tests
│       ├── filter-builder.test.ts        # Filter construction and validation tests
│       └── sort-mapping.test.ts          # Sort field mapping and validation tests
├── integration/             # Integration tests for API flows
│   ├── auth/
│   │   ├── sign-in-flow.test.ts          # Complete sign-in API flow tests
│   │   └── session-management.test.ts    # Session persistence and security tests
│   └── api/
│       ├── people.test.ts                # People API endpoint tests
│       ├── companies.test.ts             # Companies API endpoint tests
│       └── speedrun.test.ts              # Speedrun API endpoint tests
├── e2e/                     # End-to-end tests for complete user journeys
│   ├── auth/
│   │   └── sign-in.spec.ts               # Full sign-in user journey tests
│   └── tables/
│       ├── speedrun-table.spec.ts        # Speedrun table E2E tests
│       ├── leads-table.spec.ts           # Leads table E2E tests
│       └── all-tables.spec.ts            # Comprehensive table E2E tests
├── setup/                   # Test configuration and setup
│   └── jest.setup.ts                     # Global Jest configuration
└── utils/                   # Test helper utilities
    └── test-helpers.ts                   # Reusable test utilities and factories
```

## Running Tests

### Unit and Integration Tests
```bash
# Run all unit and integration tests
npm run test

# Run only unit tests
npm run test tests/unit/

# Run only integration tests
npm run test tests/integration/

# Run table-specific tests
npm run test tests/unit/tables/
npm run test tests/integration/api/

# Run specific test file
npm run test tests/unit/auth/sign-in-component.test.tsx
npm run test tests/unit/tables/column-mapping.test.ts

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests
```bash
# Run E2E tests (requires dev server running)
npm run test:e2e:auth

# Run E2E tests with browser visible
npm run test:e2e:auth:headed

# Run E2E tests with Playwright UI
npm run test:e2e:auth:ui

# Run table E2E tests
npm run test:e2e tests/e2e/tables/
```

## Test Categories

### Unit Tests
- **Component Tests**: Test individual React components in isolation
- **Utility Tests**: Test helper functions and utilities
- **Table Tests**: Test column mapping, filter building, and sort mapping logic
- **Mocking**: Extensive use of mocks to isolate units under test

### Integration Tests
- **API Tests**: Test complete API endpoints with mocked database
- **Table API Tests**: Test people, companies, and speedrun API endpoints
- **Flow Tests**: Test multi-step authentication flows
- **Session Tests**: Test session management and persistence

### End-to-End Tests
- **User Journey Tests**: Test complete user workflows
- **Table Tests**: Test table rendering, sorting, filtering, and data accuracy
- **Browser Tests**: Test in real browser environment
- **Cross-browser Tests**: Test across different browsers

## Key Features Tested

### Authentication Flow
- ✅ Form rendering and validation
- ✅ User input handling
- ✅ API authentication calls
- ✅ Session creation and management
- ✅ Remember me functionality
- ✅ Error handling and user feedback
- ✅ Loading states and UI updates

### Security
- ✅ Password validation
- ✅ Session security (cookies, tokens)
- ✅ CORS headers
- ✅ Input sanitization
- ✅ Error message security

### Accessibility
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Form labels and associations
- ✅ ARIA attributes
- ✅ Focus management

### Keyboard Shortcuts
- ✅ **Verification that Command+Enter and Ctrl+Enter do NOT trigger form submission**
- ✅ Normal Enter key functionality
- ✅ Tab navigation

### Table Functionality
- ✅ Column rendering and configuration
- ✅ Sorting by all sortable columns
- ✅ Filtering by status, priority, company, industry
- ✅ Search across multiple fields
- ✅ Pagination and data loading
- ✅ Record selection and detail views
- ✅ Data accuracy against API responses
- ✅ Loading and error states

## Mocking Strategy

### Global Mocks (jest.setup.ts)
- **Prisma Client**: Mocked to prevent database connections
- **Next.js Router**: Mocked for navigation testing
- **Environment Variables**: Set for test environment
- **Console Methods**: Suppressed to reduce noise

### Component-Specific Mocks
- **useUnifiedAuth**: Mocked with default return values
- **API Endpoints**: Mocked with realistic responses
- **Browser APIs**: Mocked for consistent testing

## Test Data

### Test Users
```typescript
const testUser = {
  id: 'test-user-id',
  email: 'test@adrata.com',
  username: 'testuser',
  name: 'Test User',
  isActive: true,
  activeWorkspaceId: 'test-workspace-id',
  workspaces: [{
    id: 'test-workspace-id',
    name: 'Test Workspace',
    role: 'admin'
  }]
};
```

### Test Responses
- **Success Response**: Valid authentication with user data
- **Error Response**: Invalid credentials with error message
- **Network Error**: Connection failure simulation

## Common Issues and Solutions

### Module Resolution Errors
**Problem**: `Cannot find module '@/platform/auth'`
**Solution**: Ensure Jest config uses `moduleNameMapper` (not `moduleNameMapping`)

### Database Connection Errors
**Problem**: Tests try to connect to real database
**Solution**: Global Prisma mock in jest.setup.ts prevents this

### Console Warnings
**Problem**: Navigation warnings in test output
**Solution**: Suppressed in jest.setup.ts console.error mock

### Mock Not Working
**Problem**: Mock not being applied correctly
**Solution**: Ensure mock is defined before import, or use global mock

## Coverage Goals

- **Unit Tests**: 80%+ coverage for components and utilities
- **Integration Tests**: 90%+ coverage for API endpoints
- **E2E Tests**: 100% coverage of critical user journeys

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Mocking
- Mock external dependencies
- Use realistic mock data
- Reset mocks between tests

### Assertions
- Test behavior, not implementation
- Use specific assertions
- Test edge cases and error conditions

### Performance
- Keep tests fast (< 100ms per test)
- Use parallel execution
- Avoid unnecessary setup/teardown

## Debugging Tests

### Verbose Output
```bash
npm run test -- --verbose
```

### Debug Mode
```bash
npm run test -- --detectOpenHandles
```

### Single Test
```bash
npm run test -- --testNamePattern="should render sign-in form"
```

## Continuous Integration

Tests are configured to run in CI with:
- Parallel execution
- Coverage reporting
- Failure notifications
- Performance monitoring

## Additional Documentation

- **[Table Testing Guide](../docs/table-testing-guide.md)**: Comprehensive guide for testing table functionality
- **[Field Mapping Reference](../docs/table-field-mapping.md)**: Database field to UI column mapping reference
- **[API Validation Report](../docs/api-validation-report.md)**: V1 API endpoint validation results
- **[Column Configuration Audit](../docs/column-config-audit-report.md)**: Column configuration issues and fixes

## Contributing

When adding new tests:
1. Follow existing patterns and structure
2. Add appropriate mocks
3. Include both positive and negative test cases
4. Update this documentation if needed
5. Ensure tests pass in CI environment
6. For table tests, refer to the Table Testing Guide for detailed patterns
