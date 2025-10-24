# Actions Delete and Validation Tests

This test suite verifies the functionality of the delete feature and company validation fix for the Actions system.

## Test Coverage

### 1. Delete Functionality Tests (`UniversalActionsTab.test.tsx`)

**Purpose**: Verify that the delete button and confirmation modal work correctly.

**Key Test Cases**:
- ✅ Delete button appears after timestamp information
- ✅ Clicking delete opens confirmation modal
- ✅ Modal requires typing "delete" to enable delete button
- ✅ Delete API is called when confirmed
- ✅ Success message is shown after deletion
- ✅ Error message is shown when deletion fails
- ✅ Modal can be cancelled

**Test Commands**:
```bash
# Run all delete functionality tests
npm test -- tests/unit/UniversalActionsTab.test.tsx

# Run specific test patterns
npm test -- --testNamePattern="should show delete button after timestamp"
npm test -- --testNamePattern="should open delete confirmation modal"
npm test -- --testNamePattern="should require typing delete"
```

### 2. API Validation Tests (`actions-api-validation.test.ts`)

**Purpose**: Verify that company validation only occurs when companyId is actually being changed.

**Key Test Cases**:
- ✅ No validation when only updating description
- ✅ Validation occurs when companyId is being changed
- ✅ No validation when companyId is same as existing
- ✅ Error returned when companyId changed to non-existent company
- ✅ Error returned when companyId changed to deleted company
- ✅ Person validation follows same logic
- ✅ Handles authentication failures
- ✅ Handles database errors gracefully

**Test Commands**:
```bash
# Run all API validation tests
npm test -- tests/integration/actions-api-validation.test.ts

# Run specific validation scenarios
npm test -- --testNamePattern="should NOT validate company when only description is being updated"
npm test -- --testNamePattern="should validate company when companyId is being changed"
```

### 3. End-to-End Tests (`actions-delete-and-validation.e2e.ts`)

**Purpose**: Verify complete user workflows from UI to API.

**Key Test Cases**:
- ✅ Complete delete workflow with confirmation
- ✅ Inline editing without company validation errors
- ✅ Error handling for network failures
- ✅ Multiple actions with different statuses
- ✅ Action list maintenance after deletion

**Test Commands**:
```bash
# Run E2E tests
npx playwright test tests/e2e/actions-delete-and-validation.e2e.ts

# Run with specific browser
npx playwright test tests/e2e/actions-delete-and-validation.e2e.ts --project=chromium
```

## Running All Tests

### Windows (PowerShell)
```powershell
# Run the comprehensive test suite
.\tests\run-actions-tests.ps1
```

### Linux/Mac (Bash)
```bash
# Run the comprehensive test suite
./tests/run-actions-tests.sh
```

### Manual Test Execution
```bash
# Unit tests
npm test -- tests/unit/UniversalActionsTab.test.tsx --verbose

# Integration tests
npm test -- tests/integration/actions-api-validation.test.ts --verbose

# E2E tests
npx playwright test tests/e2e/actions-delete-and-validation.e2e.ts --reporter=list
```

## Test Data Setup

The tests use the following mock data:

### Action Data
```typescript
{
  id: 'action-123',
  type: 'activity',
  date: new Date('2025-01-24T10:44:00Z'),
  title: 'LinkedIn Connection',
  description: 'Test action description',
  user: 'Test User',
  metadata: {
    status: 'COMPLETED',
    priority: 'NORMAL'
  }
}
```

### Company Data
```typescript
{
  id: 'company-123',
  name: 'Test Company',
  deletedAt: null
}
```

### Person Data
```typescript
{
  id: 'person-123',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  deletedAt: null
}
```

## Expected Test Results

### ✅ Success Criteria
- All delete functionality tests pass
- All API validation tests pass
- All E2E tests pass
- No console errors or warnings
- Code coverage above 80%

### ❌ Failure Scenarios
- Delete button not visible
- Confirmation modal not working
- API validation occurring when it shouldn't
- Network errors not handled properly
- UI not updating after operations

## Debugging Failed Tests

### Common Issues

1. **Delete Button Not Found**
   - Check if component is rendering correctly
   - Verify mock data is being used
   - Ensure proper test environment setup

2. **API Validation Errors**
   - Check if Prisma mocks are set up correctly
   - Verify request body structure
   - Ensure authentication mocks are working

3. **E2E Test Failures**
   - Check if test data is seeded properly
   - Verify page navigation is working
   - Ensure network requests are mocked correctly

### Debug Commands
```bash
# Run tests with debug output
npm test -- --verbose --no-coverage

# Run specific test with debug
npm test -- --testNamePattern="specific test name" --verbose

# Run E2E tests with debug
npx playwright test --debug tests/e2e/actions-delete-and-validation.e2e.ts
```

## Test Maintenance

### Adding New Tests
1. Follow the existing test structure
2. Use descriptive test names
3. Include both positive and negative test cases
4. Add proper cleanup in `afterEach` hooks

### Updating Tests
1. Update test data when component props change
2. Adjust assertions when UI changes
3. Update API mocks when endpoints change
4. Maintain backward compatibility

### Test Data Management
1. Use consistent mock data across tests
2. Keep test data in separate files for reusability
3. Clean up test data after each test
4. Use factories for complex test data generation

## Performance Considerations

- Tests should run in under 30 seconds total
- Use `beforeAll` for expensive setup operations
- Mock external dependencies to avoid network calls
- Use `waitFor` for async operations
- Clean up resources in `afterAll` hooks

## Coverage Requirements

- **Functions**: 80% coverage
- **Lines**: 80% coverage
- **Branches**: 80% coverage
- **Statements**: 80% coverage

Run coverage report:
```bash
npm test -- --coverage --coverageReporters=text-lcov
```
