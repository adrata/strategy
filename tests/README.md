# Record Pages Testing Framework

## Overview

This comprehensive testing framework provides extensive coverage for all record pages in the Adrata application, ensuring reliability and preventing crashes like the one recently experienced. The framework follows a three-tier testing strategy: unit tests, integration tests, and end-to-end tests.

## Test Structure

### Unit Tests (`tests/unit/record-pages/`)

**Core Component Tests:**
- `PipelineDetailPage.test.tsx` - Tests the main wrapper component for all pipeline records
- `UniversalRecordTemplate.test.tsx` - Tests the universal record display template (3600+ lines)
- `SpeedrunRecordTemplate.test.tsx` - Tests the speedrun-specific record template
- `record-page-utils.test.ts` - Tests utility functions and helpers

**Coverage:**
- Component rendering and mounting
- Props validation and handling
- State management and updates
- Event handling and user interactions
- Error boundary behavior
- Context provider integration

### Integration Tests (`tests/integration/record-pages/`)

**API & Data Flow Tests:**
- `record-page-api.test.ts` - Tests API integration for all record types
- `record-navigation.test.ts` - Tests navigation flows and URL routing
- `record-actions.test.ts` - Tests user actions (complete, update, delete)

**Coverage:**
- API endpoint integration
- Data transformation and formatting
- Error responses (404, 500, auth failures)
- Related data loading (company, contacts, etc.)
- Navigation between records
- Action completion and logging

### E2E Tests (`tests/e2e/record-pages/`)

**Full User Journey Tests:**
- `all-record-pages.spec.ts` - Comprehensive tests for all record types
- `record-page-errors.spec.ts` - Error scenarios and edge cases
- `speedrun-workflows.spec.ts` - Speedrun-specific workflows

**Coverage:**
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance
- Performance benchmarks
- Error recovery scenarios

## Record Types Tested

### Pipeline Record Pages
- **People**: `/[workspace]/(pipeline)/people/[id]/page.tsx`
- **Companies**: `/[workspace]/(pipeline)/companies/[id]/page.tsx`
- **Leads**: `/[workspace]/(pipeline)/leads/[id]/page.tsx`
- **Prospects**: `/[workspace]/(pipeline)/prospects/[id]/page.tsx`
- **Opportunities**: `/[workspace]/(pipeline)/opportunities/[id]/page.tsx`
- **Clients**: `/[workspace]/(pipeline)/clients/[id]/page.tsx`

### Speedrun Record Pages
- **Speedrun Detail**: `/[workspace]/(pipeline)/speedrun/[id]/page.tsx`
- **Sprint Page**: `/[workspace]/(pipeline)/speedrun/sprint/page.tsx`

## Test Utilities

### Factories (`tests/utils/record-page-factories.ts`)
- `createTestRecordPageProps()` - Generate test props for PipelineDetailPage
- `createTestUniversalRecordTemplateProps()` - Generate test props for UniversalRecordTemplate
- `createTestSpeedrunRecordTemplateProps()` - Generate test props for SpeedrunRecordTemplate
- `createMockApiResponse()` - Generate mock API responses
- `createTestNavigationData()` - Generate navigation test data
- `createTestTabConfig()` - Generate tab configuration data
- `createTestActionData()` - Generate action test data

### Helpers (`tests/utils/record-page-helpers.ts`)
- `renderWithProviders()` - Custom render function with providers
- `mockFetch()` - Mock fetch responses
- `waitForElement()` - Wait for elements with custom timeout
- `assertRecordPageRenders()` - Assert record page rendering
- `assertNavigationControls()` - Assert navigation functionality
- `assertTabsWork()` - Assert tab switching
- `assertErrorHandling()` - Assert error state handling

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### All Tests
```bash
npm run test
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest configuration
- Includes proper module mapping
- Sets up test environment
- Configures coverage reporting

### Playwright Configuration (`playwright.config.ts`)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Proper timeouts and retry logic
- Video and screenshot capture on failure

## CI/CD Integration

The testing framework is fully integrated with the CI pipeline:

1. **Unit tests** run on every commit
2. **Integration tests** run on pull requests
3. **E2E tests** run on main branch and releases
4. **Coverage reports** are generated and tracked
5. **Test results** are reported to GitHub

## Coverage Goals

- **Unit Tests**: 90%+ coverage for critical components
- **Integration Tests**: 100% coverage for API endpoints
- **E2E Tests**: 100% coverage for critical user journeys

## Error Scenarios Covered

### API Errors
- 404 Not Found
- 401 Unauthorized
- 403 Forbidden
- 500 Internal Server Error
- Network timeouts
- Connection failures

### Data Errors
- Invalid record IDs
- Malformed API responses
- Missing required fields
- Large data handling
- Special character handling

### User Experience Errors
- JavaScript disabled
- Slow network conditions
- Browser compatibility issues
- Mobile responsiveness
- Accessibility violations

## Performance Testing

- Page load times < 5 seconds
- Navigation response times < 1 second
- Memory usage monitoring
- Bundle size optimization
- Core Web Vitals compliance

## Accessibility Testing

- Keyboard navigation
- Screen reader compatibility
- ARIA label validation
- Color contrast compliance
- Focus management

## Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Use existing factories and helpers
3. Follow naming conventions
4. Include proper documentation
5. Update this README

### Updating Tests
1. Update test data factories when data models change
2. Update mock responses when APIs change
3. Update E2E tests when UI changes
4. Maintain test coverage goals

## Success Criteria

✅ All record pages have unit tests for core functionality  
✅ API endpoints have integration test coverage  
✅ E2E tests cover happy path for all record types  
✅ Error scenarios tested and handled gracefully  
✅ Tests catch the type of crash that recently occurred  
✅ CI pipeline runs all tests on every PR  

## Future Enhancements

- Visual regression testing
- Performance benchmarking
- Load testing for concurrent users
- A/B testing framework
- Automated accessibility auditing
- Cross-device testing automation