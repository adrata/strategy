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
- **People**: `/[workspace]/(revenue-os)/people/[id]/page.tsx`
- **Companies**: `/[workspace]/(revenue-os)/companies/[id]/page.tsx`
- **Leads**: `/[workspace]/(revenue-os)/leads/[id]/page.tsx`
- **Prospects**: `/[workspace]/(revenue-os)/prospects/[id]/page.tsx`
- **Opportunities**: `/[workspace]/(revenue-os)/opportunities/[id]/page.tsx`
- **Clients**: `/[workspace]/(revenue-os)/clients/[id]/page.tsx`

### Speedrun Record Pages
- **Speedrun Detail**: `/[workspace]/(revenue-os)/speedrun/[id]/page.tsx`
- **Sprint Page**: `/[workspace]/(revenue-os)/speedrun/sprint/page.tsx`

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

## Company Creation Testing

### Overview

The company creation testing framework provides comprehensive coverage for all "Add Company" experiences across the application. This includes testing the 5 distinct company creation interfaces and ensuring they work properly in production.

### Company Creation Components Tested

#### 1. AddCompanyModal (`src/platform/ui/components/AddCompanyModal.tsx`)
- **Unit Tests**: `tests/unit/components/AddCompanyModal.test.tsx`
- **Integration Tests**: `tests/integration/components/company-creation.test.tsx`
- **E2E Tests**: `tests/e2e/company-creation/add-company-modal.spec.ts`

**Test Coverage:**
- Modal open/close behavior
- Form validation (name required)
- Website URL normalization
- Error state display and recovery
- Keyboard shortcuts (Cmd+Enter)
- Loading states during submission
- Accessibility compliance

#### 2. CompanySelector (`src/frontend/components/pipeline/CompanySelector.tsx`)
- **Unit Tests**: `tests/unit/components/CompanySelector.test.tsx`
- **Integration Tests**: `tests/integration/components/company-creation.test.tsx`
- **E2E Tests**: `tests/e2e/company-creation/company-selector.spec.ts`

**Test Coverage:**
- Company search functionality
- Company selection from dropdown
- "Add Company" form display
- Inline company creation
- Dropdown behavior and keyboard navigation
- Error handling and loading states

#### 3. InlineCompanySelector (`src/frontend/components/pipeline/InlineCompanySelector.tsx`)
- **Unit Tests**: `tests/unit/components/InlineCompanySelector.test.tsx`
- **Integration Tests**: `tests/integration/components/company-creation.test.tsx`
- **E2E Tests**: `tests/e2e/company-creation/inline-company-selector.spec.ts`

**Test Coverage:**
- Inline editing mode
- Company search and selection
- Company creation inline
- Save behavior and validation
- Null/empty value handling
- Error states and recovery

#### 4. UniversalRecordTemplate Company Field Handling
- **Integration Tests**: `tests/integration/components/company-creation.test.tsx`
- **E2E Tests**: `tests/e2e/company-creation/inline-company-selector.spec.ts`

**Test Coverage:**
- Auto-creation of companies from inline fields
- Company linking to records
- Error handling for company creation failures

#### 5. AddModal Legacy Form (Being Replaced)
- **Integration Tests**: `tests/integration/components/company-creation.test.tsx`

**Test Coverage:**
- Legacy form functionality
- Migration path to AddCompanyModal

### Test Utilities

#### Company Test Helpers (`tests/utils/company-test-helpers.ts`)
- `setupCompanyCreationTest()` - Common setup for company tests
- `mockCompanyAPI()` - Mock company API responses
- `createValidCompanyData()` - Generate valid test company data
- `createInvalidCompanyData()` - Generate invalid test company data
- `verifyCompanyCreated()` - Assert company was created correctly
- `COMPANY_TEST_SCENARIOS` - Predefined test scenarios
- `COMPANY_ERROR_SCENARIOS` - Predefined error scenarios

### API Testing

#### Enhanced Companies API Tests (`tests/integration/api/companies.test.ts`)
**Additional Test Coverage:**
- Website URL normalization
- Company name trimming
- Concurrent creation (race conditions)
- Special characters in company names
- Long company name validation
- Malformed website URL handling

### E2E Test Scenarios

#### Add Company Modal E2E Tests
- Opening modal from different contexts
- Creating company with minimal data (name only)
- Creating company with full data
- Creating company and using it immediately
- Keyboard shortcuts functionality
- Modal closes on success
- Error display and recovery
- Form validation
- Website URL normalization
- Special character handling
- Click outside and Escape key behavior
- Focus management
- Rapid form submissions
- Form reset on modal reopen

#### Inline Company Selector E2E Tests
- Inline company creation from person record
- Search and select existing company
- Create new company inline
- Company appears in search after creation
- Error handling and recovery
- Cancel functionality
- Keyboard navigation
- Click outside behavior
- Empty company name handling
- Special character handling
- Rapid typing and searching
- Loading states during creation

#### Company Selector E2E Tests
- Company selector in Add Person modal
- Company selector in Add Lead modal
- Dropdown search behavior
- "Add Company" option appearance
- Creating and selecting in one flow
- Error handling
- Click outside and keyboard navigation
- Disabled state handling
- Loading state during search
- Empty search results
- Special character handling
- Rapid typing and searching

### Integration Test Scenarios

#### Cross-Component Integration
- Consistency between different company creation methods
- Error propagation across components
- Data validation integration
- Performance integration
- Rapid company creation requests

#### API Integration
- AddCompanyModal integration with API
- CompanySelector integration with API
- InlineCompanySelector integration with API
- Duplicate company detection
- Workspace isolation
- User assignment (mainSellerId)
- Action creation on company create

### Test Data Scenarios

#### Valid Company Data
- Minimal: Name only
- Full: Name, website, industry, status
- With Website: Name and website
- Special Characters: Company & Associates, LLC
- Long Name: Very long company names

#### Invalid Company Data
- Empty name
- Whitespace-only name
- Invalid website format
- Malformed URLs

#### Error Scenarios
- Network errors
- Validation errors
- Duplicate errors
- Server errors
- Unauthorized errors

### Running Company Creation Tests

#### Unit Tests
```bash
npm run test:unit -- --testPathPattern="company"
```

#### Integration Tests
```bash
npm run test:integration -- --testPathPattern="company"
```

#### E2E Tests
```bash
npm run test:e2e -- --grep="company"
```

#### All Company Tests
```bash
npm run test -- --testPathPattern="company"
```

### Coverage Goals

- **Unit Tests**: 100% coverage for all company creation components
- **Integration Tests**: 100% coverage for company creation flows
- **E2E Tests**: 100% coverage for all company creation user flows
- **API Tests**: 100% coverage for company creation endpoints

### Success Criteria

✅ All 5 company creation experiences tested and working  
✅ Null safety verified across all company components  
✅ InlineCompanySelector tracked in git and working  
✅ 100% test coverage for company creation components  
✅ E2E tests cover all user flows  
✅ Integration tests cover all API scenarios  
✅ Unit tests cover all component logic  
✅ Test documentation complete  

### Issues Found and Fixed

#### 1. Null Reference Issues (FIXED)
- Similar to the LinkedIn URL issue, company URLs had potential null reference problems
- Fixed by adding proper null checks before calling `.startsWith()` and `.replace()`

#### 2. InlineCompanySelector Not Tracked (FIXED)
- `src/frontend/components/pipeline/InlineCompanySelector.tsx` was untracked
- Added to git after verifying it works properly

#### 3. Duplicate Company Creation Logic (IDENTIFIED)
- Multiple components implement similar company creation logic
- Should be refactored to use a shared service/hook in the future

#### 4. Inconsistent Error Handling (IDENTIFIED)
- Different components handle errors differently
- Should be standardized in the future

## Future Enhancements

- Visual regression testing
- Performance benchmarking
- Load testing for concurrent users
- A/B testing framework
- Automated accessibility auditing
- Cross-device testing automation
- Company creation service refactoring
- Standardized error handling patterns