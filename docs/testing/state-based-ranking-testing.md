# State-Based Ranking Testing Guide

This document provides comprehensive testing guidelines for the state-based ranking system in Speedrun.

## Overview

The state-based ranking system allows users to rank prospects by state priority, then by company within each state, then by person within each company. This testing guide covers all aspects of the system from unit tests to end-to-end workflows.

## Test Structure

```
tests/
├── unit/
│   └── ranking/
│       ├── state-ranking.test.ts      # StateRankingService tests
│       └── speedrun-engine.test.ts    # Speedrun engine tests
├── integration/
│   └── api/
│       └── state-ranking-api.test.ts  # API endpoint tests
└── e2e/
    └── state-based-ranking.spec.ts    # End-to-end workflow tests
```

## Running Tests

### Quick Start

```bash
# Run all state-based ranking tests
npm run test:state-ranking

# Run specific test types
npm run test:state-ranking:unit
npm run test:state-ranking:integration
npm run test:state-ranking:e2e
npm run test:state-ranking:coverage
```

### Individual Test Commands

```bash
# Unit tests only
npm test -- tests/unit/ranking/

# Integration tests only
npm test -- tests/integration/api/state-ranking-api.test.ts

# E2E tests only
npx playwright test tests/e2e/state-based-ranking.spec.ts

# With coverage
npm test -- --coverage tests/unit/ranking/
```

## Test Categories

### 1. Unit Tests

#### StateRankingService Tests (`state-ranking.test.ts`)

**Purpose**: Test the core state ranking logic and data validation.

**Key Test Areas**:
- ✅ State data retrieval from workspace
- ✅ State data validation (coverage percentage calculation)
- ✅ User preference management
- ✅ State ordering logic
- ✅ Edge cases (empty data, missing states, invalid data)

**Mock Data**: Uses realistic company data with various states and people counts.

**Example Test**:
```typescript
it('should return states with company and people counts', async () => {
  const mockCompanies = [
    { id: 'company-1', name: 'Acme Corp', hqState: 'CA', _count: { people: 5 } },
    { id: 'company-2', name: 'Beta Inc', hqState: 'NY', _count: { people: 3 } }
  ];
  
  mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
  const result = await stateRankingService.getStatesFromWorkspace();
  
  expect(result.stateRankings).toHaveLength(2);
  expect(result.validation.isValid).toBe(true);
});
```

#### Speedrun Engine Tests (`speedrun-engine.test.ts`)

**Purpose**: Test the ranking algorithms and prospect ordering.

**Key Test Areas**:
- ✅ Global ranking functionality
- ✅ State-based ranking hierarchy
- ✅ Custom state ordering
- ✅ Score calculation algorithms
- ✅ Time zone priority handling
- ✅ Performance with large datasets

**Example Test**:
```typescript
it('should rank contacts by state hierarchy', () => {
  const stateOrder = ['CA', 'NY', 'TX'];
  const rankedContacts = rankContactsByState(mockContacts, settings, stateOrder);
  
  expect(rankedContacts).toHaveLength(4);
  
  // CA contacts should have state rank 1
  const caContacts = rankedContacts.filter(c => c.state === 'CA');
  caContacts.forEach(contact => {
    expect(contact.stateRank).toBe(1);
  });
});
```

### 2. Integration Tests

#### API Endpoint Tests (`state-ranking-api.test.ts`)

**Purpose**: Test the API endpoints that handle state ranking data and user preferences.

**Key Test Areas**:
- ✅ GET /api/v1/speedrun/state-data
- ✅ GET /api/v1/user/settings
- ✅ POST /api/v1/user/settings
- ✅ Authentication and authorization
- ✅ Input validation
- ✅ Error handling
- ✅ Performance with large datasets

**Mock Setup**: Uses Jest mocks for Prisma and secure API helper.

**Example Test**:
```typescript
it('should return state ranking data successfully', async () => {
  const mockCompanies = [
    { id: 'company-1', name: 'Acme Corp', hqState: 'CA', _count: { people: 5 } }
  ];
  
  mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
  const response = await getStateData(request);
  
  expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
    expect.objectContaining({
      stateRankings: expect.arrayContaining([
        expect.objectContaining({ state: 'CA', companyCount: 1 })
      ])
    })
  );
});
```

### 3. End-to-End Tests

#### Workflow Tests (`state-based-ranking.spec.ts`)

**Purpose**: Test the complete user workflow from UI interaction to database updates.

**Key Test Areas**:
- ✅ UI component rendering
- ✅ Modal interactions
- ✅ State data loading
- ✅ Ranking mode switching
- ✅ State ordering functionality
- ✅ Settings persistence
- ✅ Error handling
- ✅ Performance

**Test Scenarios**:
1. **Basic Workflow**: Open ranking manager → Switch to state-based → Save settings
2. **State Ordering**: Reorder states using up/down buttons
3. **Data Validation**: Handle insufficient state data gracefully
4. **Persistence**: Verify settings persist across page refreshes
5. **Error Handling**: Handle network failures and API errors

**Example Test**:
```typescript
test('should open state ranking manager modal', async ({ page }) => {
  await page.goto('/speedrun');
  await page.click('button:has-text("Manage Ranking")');
  
  await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
  await expect(page.locator('input[value="global"]')).toBeChecked();
});
```

## Test Data Requirements

### For Unit Tests
- Mock company data with various states (CA, NY, TX, FL, etc.)
- Different company sizes and people counts
- Edge cases: empty states, null values, invalid data

### For Integration Tests
- Mock Prisma responses
- Mock authentication context
- Various API request/response scenarios

### For E2E Tests
- Test workspace with sufficient state data (70%+ coverage)
- Multiple companies across different states
- Realistic prospect data

## Performance Testing

### Benchmarks
- **State data loading**: < 2 seconds for 1000+ companies
- **Ranking algorithm**: < 5 seconds for 1000+ contacts
- **UI responsiveness**: < 1 second for modal interactions

### Load Testing
```typescript
it('should handle large contact lists efficiently', () => {
  const largeContactList = Array.from({ length: 1000 }, (_, index) => ({
    // ... mock contact data
  }));
  
  const startTime = Date.now();
  const rankedContacts = rankContacts(largeContactList, settings, 'global');
  const endTime = Date.now();
  
  expect(endTime - startTime).toBeLessThan(5000);
});
```

## Test Environment Setup

### Prerequisites
1. **Database**: Test database with sample data
2. **Authentication**: Mock user authentication
3. **API**: Mock external API calls
4. **Browser**: Playwright for E2E tests

### Mock Data Setup
```typescript
// Example mock data for testing
const mockWorkspaceData = {
  companies: [
    { id: 'company-1', name: 'Acme Corp', hqState: 'CA', peopleCount: 5 },
    { id: 'company-2', name: 'Beta Inc', hqState: 'NY', peopleCount: 3 },
    { id: 'company-3', name: 'Gamma LLC', hqState: 'TX', peopleCount: 8 }
  ],
  users: [
    { id: 'user-1', speedrunRankingMode: 'global', stateRankingOrder: [] }
  ]
};
```

## Continuous Integration

### GitHub Actions
```yaml
- name: Run State-Based Ranking Tests
  run: |
    npm run test:state-ranking:unit
    npm run test:state-ranking:integration
    npm run test:state-ranking:coverage
```

### Test Coverage Requirements
- **Unit Tests**: 90%+ coverage for ranking logic
- **Integration Tests**: 80%+ coverage for API endpoints
- **E2E Tests**: Critical user workflows covered

## Debugging Tests

### Common Issues
1. **Mock Data**: Ensure mock data matches expected schema
2. **Async Operations**: Use proper async/await patterns
3. **Timeouts**: Set appropriate timeouts for E2E tests
4. **State Management**: Clear state between tests

### Debug Commands
```bash
# Run tests with debug output
npm test -- --verbose tests/unit/ranking/

# Run E2E tests in headed mode
npx playwright test --headed tests/e2e/state-based-ranking.spec.ts

# Run specific test with debug
npm test -- --testNamePattern="should rank contacts by state hierarchy"
```

## Test Maintenance

### Regular Updates
- Update mock data when schema changes
- Add tests for new features
- Update performance benchmarks
- Review and update test coverage

### Best Practices
1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should clearly describe what they test
3. **Coverage**: Test both happy path and edge cases
4. **Performance**: Include performance tests for critical paths
5. **Documentation**: Keep test documentation up to date

## Troubleshooting

### Common Test Failures
1. **TypeScript Errors**: Check type definitions and imports
2. **Mock Issues**: Verify mock setup and return values
3. **Async Problems**: Ensure proper async/await usage
4. **Timeout Issues**: Increase timeouts for slow operations

### Getting Help
- Check test logs for detailed error messages
- Review mock data setup
- Verify test environment configuration
- Consult this documentation for test patterns

## Conclusion

This comprehensive testing suite ensures the state-based ranking system works correctly across all layers of the application. Regular test execution helps maintain code quality and prevents regressions as the system evolves.
