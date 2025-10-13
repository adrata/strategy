# V1 API Validation Report

## Overview
This report validates the V1 API endpoints for people, companies, and speedrun sections against the database schema and UI requirements.

## API Endpoint Analysis

### 1. People API (`/api/v1/people`)

#### ✅ Working Features:
- **Section Filtering**: Correctly filters by status (leads=LEAD, prospects=PROSPECT, opportunities=OPPORTUNITY)
- **Search Fields**: Properly searches across firstName, lastName, fullName, email, workEmail, jobTitle, department
- **Basic Filters**: status, priority, companyId filters work correctly
- **Pagination**: Proper offset/limit implementation
- **Caching**: Redis caching with appropriate TTL
- **Workspace Isolation**: Correctly filters by workspaceId

#### ❌ Issues Found:

**1. Sort Field Mapping Issues:**
```typescript
// Current implementation (line 168):
orderBy: { 
  [sortBy === 'rank' ? 'globalRank' : sortBy]: sortOrder 
}
```

**Problems:**
- `sortBy` parameter accepts any string without validation
- No mapping for UI field names to database field names
- Missing sort field validation

**2. Missing Sort Fields:**
The API doesn't support all the sort fields defined in the UI configurations:
- `lastActionDate` (UI uses this, but API may not handle it properly)
- `fullName` (should be the default for name sorting)
- `company.name` (for company sorting)

**3. Field Selection Issues:**
```typescript
// Current select (lines 172-206):
select: {
  id: true,
  fullName: true,
  firstName: true,
  lastName: true,
  email: true,
  status: true,
  globalRank: true,
  lastAction: true,
  nextAction: true,
  lastActionDate: true,
  nextActionDate: true,
  // ... more fields
}
```

**Problems:**
- Missing `jobTitle` field (used in UI as "Title")
- Missing `phone` field (used in UI)
- Missing `department` field (used in search but not selected)

**4. Missing Filters:**
- No `vertical` filter (defined in section config)
- No `revenue` filter (defined in section config)
- No `timezone` filter (defined in section config)

### 2. Companies API (`/api/v1/companies`)

#### ✅ Working Features:
- **Search Fields**: Properly searches across name, legalName, tradingName, email, website, domain
- **Basic Filters**: status, priority, industry filters work correctly
- **Pagination**: Proper offset/limit implementation
- **Workspace Isolation**: Correctly filters by workspaceId and mainSellerId

#### ❌ Issues Found:

**1. Sort Field Mapping Issues:**
```typescript
// Current implementation (line 128):
orderBy: { 
  [sortBy === 'rank' ? 'globalRank' : sortBy]: sortOrder 
}
```

**Same problems as People API:**
- No validation of sortBy parameter
- No field name mapping
- Missing sort field validation

**2. Missing Sort Fields:**
- `lastActionDate` (for last action sorting)
- `name` (should be default for company name sorting)

**3. Field Selection Issues:**
```typescript
// Current select (lines 132-151):
select: {
  id: true,
  name: true,
  website: true,
  status: true,
  globalRank: true,
  lastAction: true,
  nextAction: true,
  lastActionDate: true,
  nextActionDate: true,
  industry: true,
  size: true,
  revenue: true,
  // ... more fields
}
```

**Problems:**
- Missing `employeeCount` field (UI shows "employees")
- Missing `address`, `city`, `state`, `country` fields (UI shows "location")

**4. Missing Filters:**
- No `companySize` filter (defined in section config)
- No `location` filter (defined in section config)
- No `technology` filter (defined in section config)

### 3. Speedrun API (`/api/v1/speedrun`)

#### ✅ Working Features:
- **Optimized Query**: Properly orders by globalRank ascending
- **Company Relations**: Correctly joins with company data
- **Main Seller Transformations**: Properly transforms mainSeller to "Me" for current user
- **Co-seller Transformations**: Correctly formats co-seller names
- **Caching**: Aggressive Redis caching with 5-minute TTL
- **Demo Mode**: Proper demo mode detection and bypass

#### ❌ Issues Found:

**1. Missing Sort Options:**
The speedrun API doesn't support sorting - it's hardcoded to globalRank ordering:
```typescript
// Current implementation (lines 119-122):
orderBy: [
  { globalRank: 'asc' }, // Ranked people first (nulls will be last)
  { createdAt: 'desc' } // Then by newest
]
```

**Problems:**
- No support for user-requested sorting
- No sortBy/sortOrder parameters
- UI expects sortable columns but API doesn't support it

**2. Field Selection Issues:**
```typescript
// Current select (lines 124-176):
select: {
  id: true,
  firstName: true,
  lastName: true,
  fullName: true,
  email: true,
  jobTitle: true,
  phone: true,
  linkedinUrl: true,
  status: true,
  globalRank: true,
  lastAction: true,
  lastActionDate: true,
  nextAction: true,
  nextActionDate: true,
  // ... more fields
}
```

**Problems:**
- Missing `priority` field (used in UI filters)
- Missing `vertical` field (used in UI filters)

**3. Missing Filters:**
- No support for any filters (search, status, priority, vertical)
- UI defines filters but API doesn't implement them

## Critical Issues Summary

### High Priority (Breaking Issues):

1. **Sort Field Validation Missing**
   - All APIs accept any sortBy parameter without validation
   - No mapping from UI field names to database field names
   - Risk of SQL injection or runtime errors

2. **Speedrun API Missing Sort Support**
   - UI expects sortable columns but API is hardcoded
   - No sortBy/sortOrder parameters accepted

3. **Missing Required Fields**
   - People API missing `jobTitle`, `phone`, `department`
   - Companies API missing `employeeCount`, location fields
   - Speedrun API missing `priority`, `vertical`

### Medium Priority (Functional Issues):

1. **Missing Filter Support**
   - People API missing `vertical`, `revenue`, `timezone` filters
   - Companies API missing `companySize`, `location`, `technology` filters
   - Speedrun API missing all filters

2. **Inconsistent Field Naming**
   - Some APIs use `lastActionDate`, others might use `lastContactDate`
   - Need standardization across all APIs

### Low Priority (Enhancement Issues):

1. **Performance Optimizations**
   - Some APIs could benefit from better indexing
   - Consider adding more specific field selection

2. **Error Handling**
   - Better error messages for invalid sort fields
   - Validation of filter parameters

## Recommended Fixes

### 1. Add Sort Field Validation

```typescript
// Add to all APIs
const VALID_SORT_FIELDS = {
  people: ['globalRank', 'fullName', 'firstName', 'lastName', 'email', 'jobTitle', 'lastActionDate', 'createdAt', 'status', 'priority'],
  companies: ['globalRank', 'name', 'industry', 'size', 'revenue', 'lastActionDate', 'createdAt', 'status', 'priority'],
  speedrun: ['globalRank', 'fullName', 'company.name', 'status', 'lastActionDate', 'createdAt']
};

const SORT_FIELD_MAPPING = {
  people: {
    'rank': 'globalRank',
    'name': 'fullName',
    'title': 'jobTitle',
    'lastAction': 'lastActionDate',
    'company': 'company.name'
  },
  companies: {
    'rank': 'globalRank',
    'name': 'name',
    'lastAction': 'lastActionDate'
  },
  speedrun: {
    'rank': 'globalRank',
    'name': 'fullName',
    'company': 'company.name',
    'lastAction': 'lastActionDate'
  }
};

// Validate and map sort field
const mappedSortField = SORT_FIELD_MAPPING[apiType]?.[sortBy] || sortBy;
if (!VALID_SORT_FIELDS[apiType].includes(mappedSortField)) {
  return createErrorResponse(`Invalid sort field: ${sortBy}`, 'INVALID_SORT_FIELD', 400);
}
```

### 2. Add Missing Fields to Select

```typescript
// People API - add missing fields
select: {
  // ... existing fields
  jobTitle: true,    // For "Title" column
  phone: true,       // For phone display
  department: true,  // For department display
  priority: true,    // For priority filtering
  vertical: true     // For vertical filtering
}

// Companies API - add missing fields
select: {
  // ... existing fields
  employeeCount: true,  // For "employees" column
  address: true,        // For location display
  city: true,
  state: true,
  country: true
}

// Speedrun API - add missing fields
select: {
  // ... existing fields
  priority: true,    // For priority filtering
  vertical: true     // For vertical filtering
}
```

### 3. Add Missing Filters

```typescript
// People API - add missing filters
const vertical = searchParams.get('vertical') || '';
const revenue = searchParams.get('revenue') || '';
const timezone = searchParams.get('timezone') || '';

// Add to where clause
if (vertical) {
  where.vertical = { contains: vertical, mode: 'insensitive' };
}

// Companies API - add missing filters
const companySize = searchParams.get('companySize') || '';
const location = searchParams.get('location') || '';
const technology = searchParams.get('technology') || '';

// Add to where clause
if (companySize) {
  where.size = { contains: companySize, mode: 'insensitive' };
}
if (location) {
  where.OR = [
    { city: { contains: location, mode: 'insensitive' } },
    { state: { contains: location, mode: 'insensitive' } },
    { country: { contains: location, mode: 'insensitive' } }
  ];
}
```

### 4. Add Sort Support to Speedrun API

```typescript
// Add sort parameters
const sortBy = searchParams.get('sortBy') || 'globalRank';
const sortOrder = searchParams.get('sortOrder') || 'asc';

// Validate sort field
const VALID_SPEEDRUN_SORT_FIELDS = ['globalRank', 'fullName', 'company.name', 'status', 'lastActionDate', 'createdAt'];
const mappedSortField = SORT_FIELD_MAPPING.speedrun[sortBy] || sortBy;

if (!VALID_SPEEDRUN_SORT_FIELDS.includes(mappedSortField)) {
  return createErrorResponse(`Invalid sort field: ${sortBy}`, 'INVALID_SORT_FIELD', 400);
}

// Update orderBy
orderBy: [
  { [mappedSortField]: sortOrder },
  { globalRank: 'asc' } // Secondary sort for consistency
]
```

## Testing Requirements

After implementing fixes, test:

1. **Sort Field Validation:**
   - Valid sort fields work correctly
   - Invalid sort fields return 400 error
   - Field name mapping works correctly

2. **Missing Fields:**
   - All UI columns display data correctly
   - No undefined field errors in console

3. **Missing Filters:**
   - All defined filters work correctly
   - Filter combinations work properly
   - Filter state persists across navigation

4. **Speedrun Sort Support:**
   - All sortable columns work correctly
   - Sort direction toggle works
   - Sort state persists during pagination

## Files Requiring Updates

1. `src/app/api/v1/people/route.ts` - Add sort validation, missing fields, missing filters
2. `src/app/api/v1/companies/route.ts` - Add sort validation, missing fields, missing filters  
3. `src/app/api/v1/speedrun/route.ts` - Add sort support, missing fields, missing filters
4. `src/platform/services/secure-api-helper.ts` - Add sort field validation utilities
