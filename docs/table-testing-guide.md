# Table Testing Guide

## Overview
This guide provides comprehensive documentation for testing table functionality across all sections in the Adrata platform. It covers unit tests, integration tests, and end-to-end tests for table rendering, sorting, filtering, and data accuracy.

## Test Structure

### Unit Tests (`tests/unit/tables/`)

#### Column Mapping Tests (`column-mapping.test.ts`)
Tests field name transformations and column configurations:

```typescript
// Test field name transformations
expect(transformDisplayNameToDbField('Last Action')).toBe('lastActionDate');
expect(transformDisplayNameToDbField('Main-Seller')).toBe('mainSeller.name');

// Test section column configurations
expect(getSectionDefaultColumns('speedrun')).toEqual(['rank', 'name', 'company', 'status', 'mainSeller', 'coSellers', 'lastAction', 'nextAction']);
```

**Key Test Areas:**
- Display name to database field mapping
- Section-specific column configurations
- Workspace-specific column overrides
- Column validation against database schema
- Column order consistency

#### Filter Builder Tests (`filter-builder.test.ts`)
Tests filter object construction and validation:

```typescript
// Test filter object construction
const uiState = { search: 'john', status: 'LEAD', priority: 'HIGH' };
const filter = buildFilterObject(uiState);
expect(filter).toEqual({ search: 'john', status: 'LEAD', priority: 'HIGH' });

// Test search query building
const searchQuery = buildSearchQuery('john doe', 'people');
expect(searchQuery.OR).toHaveLength(7); // firstName, lastName, fullName, email, workEmail, jobTitle, department
```

**Key Test Areas:**
- Filter object construction from UI state
- Multi-filter combinations
- Search query building across multiple fields
- Filter validation (status, priority, company size, industry)
- Section-specific filter enforcement
- Filter state persistence and serialization

#### Sort Mapping Tests (`sort-mapping.test.ts`)
Tests sort field mapping and validation:

```typescript
// Test sort field mapping
expect(mapSortField('rank', 'people')).toBe('globalRank');
expect(mapSortField('name', 'people')).toBe('fullName');
expect(mapSortField('title', 'people')).toBe('jobTitle');

// Test sort direction handling
expect(toggleSortDirection('asc')).toBe('desc');
expect(getSortDirectionForNewField('createdAt', 'people')).toBe('desc');
```

**Key Test Areas:**
- UI field names to database field names mapping
- Sort direction handling and toggling
- Column header to sort field conversion
- Default sort configurations per section
- Sort field validation
- Sort state management and persistence

### Integration Tests (`tests/integration/api/`)

#### People API Tests (`people.test.ts`)
Comprehensive tests for the people API endpoint:

```typescript
// Test section filtering
const request = new Request('/api/v1/people?section=leads');
const response = await GET(request);
expect(response.status).toBe(200);
expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    where: expect.objectContaining({ status: 'LEAD' })
  })
);

// Test search across multiple fields
const request = new Request('/api/v1/people?search=john');
const response = await GET(request);
expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    where: expect.objectContaining({
      OR: expect.arrayContaining([
        expect.objectContaining({ firstName: expect.objectContaining({ contains: 'john', mode: 'insensitive' }) })
      ])
    })
  })
);
```

**Key Test Areas:**
- Section-specific filtering (leads, prospects, opportunities)
- Search across all searchable fields
- Sort field validation and mapping
- Pagination with filters and sorting
- Multi-filter combinations
- Edge cases (null values, empty results)
- Cache invalidation

#### Companies API Tests (`companies.test.ts`)
Tests for the companies API endpoint:

```typescript
// Test industry filtering
const request = new Request('/api/v1/companies?industry=Technology');
const response = await GET(request);
expect(mockPrisma.companies.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    where: expect.objectContaining({
      industry: { contains: 'Technology', mode: 'insensitive' }
    })
  })
);

// Test main seller assignment filtering
const request = new Request('/api/v1/companies');
const response = await GET(request);
expect(mockPrisma.companies.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    where: expect.objectContaining({
      OR: [
        { mainSellerId: context.userId },
        { mainSellerId: null }
      ]
    })
  })
);
```

**Key Test Areas:**
- Industry filtering
- Company size filtering
- Location filtering
- Main seller assignment filtering
- Search across company fields
- Sort field validation
- Pagination with filters

#### Speedrun API Tests (`speedrun.test.ts`)
Tests for the speedrun API endpoint:

```typescript
// Test globalRank ordering
const request = new Request('/api/v1/speedrun');
const response = await GET(request);
expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    orderBy: [
      { globalRank: 'asc' },
      { createdAt: 'desc' }
    ]
  })
);

// Test main seller transformation
const mockPeople = [createTestPerson({ mainSeller: { id: 'current-user-id', name: 'Ross' } })];
const response = await GET(request);
const data = await response.json();
expect(data.data[0].mainSeller).toBe('Me');
```

**Key Test Areas:**
- GlobalRank ordering
- Company relationship joins
- Main seller and co-seller transformations
- "Me" display for current user
- Co-seller comma-separated list formatting
- Workspace filtering
- Demo mode handling
- Cache invalidation

### End-to-End Tests (`tests/e2e/tables/`)

#### Speedrun Table Tests (`speedrun-table.spec.ts`)
E2E tests for the speedrun table:

```typescript
test('should render speedrun table with correct columns', async ({ page }) => {
  const expectedColumns = ['Rank', 'Name', 'Company', 'Status', 'Main-Seller', 'Co-Sellers', 'Last Action', 'Next Action'];
  
  for (const column of expectedColumns) {
    await expect(page.locator(`[data-testid="table-header"]:has-text("${column}")`)).toBeVisible();
  }
});

test('should sort by rank column', async ({ page }) => {
  await page.click('[data-testid="table-header"]:has-text("Rank")');
  await page.waitForTimeout(1000);
  
  await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
  
  const rankCells = page.locator('[data-testid="rank-cell"]');
  const firstRank = await rankCells.first().textContent();
  const secondRank = await rankCells.nth(1).textContent();
  
  expect(parseInt(firstRank || '0')).toBeLessThanOrEqual(parseInt(secondRank || '0'));
});
```

**Key Test Areas:**
- Table rendering with correct columns
- Data display in table rows
- Sorting by all sortable columns
- Sort direction toggling
- Main seller "Me" display
- Co-seller comma-separated list
- Record selection and detail view
- Pagination (if applicable)
- Data accuracy against API response
- Loading and error states

#### Leads Table Tests (`leads-table.spec.ts`)
E2E tests for the leads table:

```typescript
test('should search functionality work correctly', async ({ page }) => {
  const firstRow = page.locator('[data-testid="table-row"]').first();
  const searchTerm = await firstRow.locator('[data-testid="name-cell"]').textContent();
  
  await page.fill('[data-testid="search-input"]', searchTerm);
  await page.waitForTimeout(1000);
  
  const nameCells = page.locator('[data-testid="name-cell"]');
  const nameTexts = await nameCells.allTextContents();
  
  nameTexts.forEach(name => {
    expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
  });
});

test('should filter by status (should show LEAD status only)', async ({ page }) => {
  const statusCells = page.locator('[data-testid="status-cell"]');
  const statusTexts = await statusCells.allTextContents();
  
  statusTexts.forEach(status => {
    expect(status).toBe('LEAD');
  });
});
```

**Key Test Areas:**
- Table rendering with correct columns
- Search functionality
- Status filtering (LEAD only)
- Priority filtering
- Company filtering
- Record creation and table update
- Pagination
- Data accuracy against API response
- Loading and error states
- Filter clearing

#### All Tables Tests (`all-tables.spec.ts`)
Comprehensive E2E tests for all table sections:

```typescript
const TABLE_SECTIONS = [
  { section: 'prospects', expectedColumns: ['Name', 'Company', 'Title', 'Last Action', 'Next Action'] },
  { section: 'opportunities', expectedColumns: ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action'] },
  { section: 'companies', expectedColumns: ['Company', 'Last Action', 'Next Action', 'Industry', 'Size', 'Revenue'] },
  { section: 'people', expectedColumns: ['Name', 'Company', 'Title', 'Last Action', 'Next Action'] }
];

for (const { section, expectedColumns } of TABLE_SECTIONS) {
  test.describe(`${section} table`, () => {
    test(`should render ${section} table with correct columns`, async ({ page }) => {
      for (const column of expectedColumns) {
        await expect(page.locator(`[data-testid="table-header"]:has-text("${column}")`)).toBeVisible();
      }
    });
  });
}
```

**Key Test Areas:**
- Common functionality across all sections
- Section-specific column rendering
- Sorting by all sortable columns
- Search functionality
- Record selection
- Pagination
- Data accuracy against API responses
- Loading and error states
- Section-specific tests (opportunities amount/stage sorting, companies industry/size filtering)

## Test Data Requirements

### Mock Data Factories
All tests use consistent mock data factories:

```typescript
// People factory
const createTestPerson = (overrides = {}) => ({
  id: 'test-person-id',
  fullName: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  jobTitle: 'CEO',
  phone: '+1234567890',
  status: 'LEAD',
  priority: 'HIGH',
  globalRank: 1,
  lastAction: 'Email sent',
  nextAction: 'Follow up call',
  lastActionDate: new Date('2024-01-01'),
  nextActionDate: new Date('2024-01-02'),
  companyId: 'company-123',
  mainSellerId: 'seller-123',
  vertical: 'Technology',
  workspaceId: 'workspace-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Companies factory
const createTestCompany = (overrides = {}) => ({
  id: 'test-company-id',
  name: 'Test Company',
  industry: 'Technology',
  size: 'medium',
  revenue: '1000000',
  employeeCount: 50,
  website: 'https://test.com',
  status: 'ACTIVE',
  priority: 'HIGH',
  globalRank: 1,
  lastAction: 'Demo scheduled',
  nextAction: 'Follow up call',
  lastActionDate: new Date('2024-01-01'),
  nextActionDate: new Date('2024-01-02'),
  mainSellerId: 'seller-123',
  workspaceId: 'workspace-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});
```

### Test Authentication
All tests use consistent authentication mocking:

```typescript
const TEST_USER = {
  id: '01K1VBYZG41K9QA0D9CF06KNRG',
  email: 'ross@adrata.com',
  name: 'Ross',
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
};

const getTestAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer test-token`,
  'X-User-ID': TEST_USER.id,
  'X-Workspace-ID': TEST_USER.workspaceId,
});
```

## Running Tests

### Unit Tests
```bash
npm run test:unit
# or specifically for table tests
npm run test:unit -- tests/unit/tables/
```

### Integration Tests
```bash
npm run test:integration
# or specifically for API tests
npm run test:integration -- tests/integration/api/
```

### End-to-End Tests
```bash
npm run test:e2e
# or specifically for table tests
npm run test:e2e -- tests/e2e/tables/
```

### All Tests
```bash
npm run test
```

## Test Coverage Requirements

### Unit Tests
- **Column Mapping**: 100% coverage of field transformation functions
- **Filter Builder**: 100% coverage of filter construction and validation
- **Sort Mapping**: 100% coverage of sort field mapping and validation

### Integration Tests
- **API Endpoints**: 90%+ coverage of all API endpoints
- **Filtering**: 100% coverage of all filter combinations
- **Sorting**: 100% coverage of all sort fields
- **Pagination**: 100% coverage of pagination logic
- **Error Handling**: 100% coverage of error scenarios

### End-to-End Tests
- **Critical User Workflows**: 100% coverage of all table interactions
- **Cross-Browser Testing**: Chrome, Firefox, Safari
- **Responsive Testing**: Desktop, tablet, mobile
- **Performance Testing**: Load times, sort performance, filter performance

## Debugging Tests

### Common Issues
1. **Mock Data Mismatches**: Ensure mock data matches actual API responses
2. **Timing Issues**: Use proper wait conditions instead of fixed timeouts
3. **Selector Issues**: Use data-testid attributes for reliable element selection
4. **State Management**: Ensure proper cleanup between tests

### Debug Commands
```bash
# Run tests with verbose output
npm run test:unit -- --verbose

# Run specific test file
npm run test:unit -- tests/unit/tables/column-mapping.test.ts

# Run tests in watch mode
npm run test:unit -- --watch

# Run tests with coverage
npm run test:unit -- --coverage
```

## Continuous Integration

### GitHub Actions
Tests run automatically on:
- Pull request creation
- Push to main branch
- Scheduled nightly runs

### Test Reports
- Unit test coverage: Generated in `coverage/` directory
- Integration test results: Available in GitHub Actions logs
- E2E test results: Available in GitHub Actions artifacts

### Quality Gates
- All tests must pass before merging
- Unit test coverage must be > 80%
- Integration test coverage must be > 90%
- E2E tests must pass on all supported browsers
