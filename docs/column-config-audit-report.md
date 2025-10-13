# Column Configuration Audit Report

## Critical Issues Identified

### 1. Inconsistent Column Configurations Across Files

**Problem:** Multiple files define different column configurations for the same sections, leading to confusion and potential bugs.

#### File Comparison:

**`workspace-table-config.ts` (Display Names):**
```typescript
speedrun: ['Rank', 'Name', 'Company', 'Status', 'MAIN-SELLER', 'CO-SELLERS', 'LAST ACTION', 'NEXT ACTION']
leads: ['Name', 'Company', 'Title', 'Email', 'Last Action', 'Next Action']
prospects: ['Name', 'Company', 'Title', 'Last Action', 'Next Action']
opportunities: ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action']
companies: ['Company', 'Last Action', 'Next Action']
people: ['Name', 'Company', 'Title', 'Last Action', 'Next Action']
```

**`section-config.ts` (Field Names):**
```typescript
speedrun: ['name', 'title', 'company', 'email', 'phone', 'status', 'priority', 'lastContacted', 'timezone']
leads: ['name', 'company', 'title', 'email', 'phone', 'status', 'priority', 'lastContacted', 'timezone']
prospects: ['name', 'company', 'title', 'email', 'phone', 'status', 'priority', 'lastContacted', 'timezone']
opportunities: ['name', 'stage', 'amount', 'company', 'owner', 'closeDate', 'probability', 'status']
companies: ['name', 'industry', 'size', 'location', 'website', 'revenue', 'employees', 'status']
people: ['name', 'company', 'title', 'email', 'phone', 'department', 'location', 'status']
```

**`PipelineView.tsx` (Display Names):**
```typescript
speedrun: ['Rank', 'Person', 'Company', 'Stage', 'Last Action', 'Next Action']
leads: ['Name', 'Company', 'Title', 'Email', 'Last Action', 'Next Action']
prospects: ['Name', 'Company', 'Title', 'Last Action', 'Next Action']
opportunities: ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action']
companies: ['Company', 'Last Action', 'Next Action']
people: ['Name', 'Company', 'Title', 'Last Action', 'Next Action']
```

**`PipelineContent.tsx` (Field Names):**
```typescript
speedrun: ['rank', 'name', 'company', 'status', 'mainSeller', 'coSellers', 'lastAction', 'nextAction']
leads: ['rank', 'company', 'name', 'title', 'nextAction', 'lastAction']
prospects: ['rank', 'company', 'name', 'title', 'nextAction', 'lastAction']
opportunities: ['rank', 'name', 'company', 'status', 'nextAction', 'lastAction']
companies: ['rank', 'company', 'lastAction', 'nextAction']
people: ['rank', 'company', 'name', 'title', 'nextAction', 'lastAction']
```

### 2. Missing Opportunities Section Configuration

**Problem:** The opportunities section is missing from `workspace-table-config.ts` but exists in other files.

**Impact:** This causes the opportunities section to fall back to default configuration, potentially showing incorrect columns.

### 3. Field Name Inconsistencies

**Problem:** Different files use different field names for the same data:

| Concept | Database Field | Some Files Use | Correct Field |
|---------|----------------|----------------|---------------|
| Last Action Date | `lastActionDate` | `lastContactDate` | `lastActionDate` |
| Next Action Date | `nextActionDate` | `nextContactDate` | `nextActionDate` |
| Last Contacted | N/A | `lastContacted` | `lastActionDate` |

### 4. Sort Field Mapping Issues

**Problem:** Sort field mappings don't align with actual database fields:

**Current Issues:**
- `lastContacted` → Should be `lastActionDate`
- `closeDate` → Should be `expectedCloseDate` (for opportunities)
- `owner` → Should be `mainSellerId` or `mainSeller.name`

### 5. Missing Database Field Mappings

**Problem:** Several UI columns reference fields that don't exist in the database or are incorrectly mapped:

#### Speedrun Section Issues:
- `title` → Should be `jobTitle`
- `lastContacted` → Should be `lastActionDate`
- `timezone` → Field exists but not commonly used

#### Opportunities Section Issues:
- `amount` → Should be `company.opportunityAmount`
- `stage` → Should be `company.opportunityStage`
- `probability` → Should be `company.opportunityProbability`
- `closeDate` → Should be `company.expectedCloseDate`
- `owner` → Should be `mainSeller.name`

#### Companies Section Issues:
- `location` → Should be `city` or `address`
- `employees` → Should be `employeeCount`
- `website` → Field exists and is correct

### 6. Inconsistent Column Order

**Problem:** Different files define different column orders for the same sections:

**Example - Leads Section:**
- `workspace-table-config.ts`: `['name', 'company', 'title', 'email', 'lastAction', 'nextAction']`
- `PipelineContent.tsx`: `['rank', 'company', 'name', 'title', 'nextAction', 'lastAction']`

## Recommendations

### 1. Standardize Column Configurations

Create a single source of truth for column configurations:

```typescript
// New unified configuration
export const UNIFIED_SECTION_CONFIG = {
  speedrun: {
    displayColumns: ['Rank', 'Name', 'Company', 'Status', 'Main-Seller', 'Co-Sellers', 'Last Action', 'Next Action'],
    fieldColumns: ['rank', 'name', 'company', 'status', 'mainSeller', 'coSellers', 'lastAction', 'nextAction'],
    sortFields: ['globalRank', 'fullName', 'company.name', 'status', 'lastActionDate'],
    filters: ['status', 'priority', 'vertical']
  },
  leads: {
    displayColumns: ['Name', 'Company', 'Title', 'Email', 'Last Action', 'Next Action'],
    fieldColumns: ['name', 'company', 'title', 'email', 'lastAction', 'nextAction'],
    sortFields: ['fullName', 'company.name', 'jobTitle', 'lastActionDate', 'createdAt'],
    filters: ['search', 'status', 'priority', 'companyId']
  },
  // ... etc for all sections
};
```

### 2. Fix Field Name Mappings

Update all references to use correct database field names:

- `lastContacted` → `lastActionDate`
- `nextContacted` → `nextActionDate`
- `title` → `jobTitle`
- `closeDate` → `expectedCloseDate`
- `owner` → `mainSeller.name`

### 3. Add Missing Section Configurations

Add opportunities section to `workspace-table-config.ts`:

```typescript
opportunities: {
  columns: ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action'],
  columnOrder: ['rank', 'name', 'company', 'amount', 'stage', 'probability', 'closeDate', 'lastAction']
}
```

### 4. Implement Proper Field Validation

Add validation to ensure all referenced fields exist in the database schema:

```typescript
const VALID_DATABASE_FIELDS = {
  people: ['id', 'fullName', 'firstName', 'lastName', 'jobTitle', 'email', 'phone', 'status', 'priority', 'lastAction', 'nextAction', 'lastActionDate', 'nextActionDate', 'globalRank', 'mainSellerId', 'companyId'],
  companies: ['id', 'name', 'industry', 'size', 'revenue', 'employeeCount', 'website', 'status', 'priority', 'lastAction', 'nextAction', 'lastActionDate', 'nextActionDate', 'globalRank', 'opportunityAmount', 'opportunityStage', 'opportunityProbability', 'expectedCloseDate']
};
```

### 5. Create Field Mapping Utilities

Implement utility functions to handle field name transformations:

```typescript
export function getDatabaseField(uiField: string, section: string): string {
  const fieldMappings = {
    speedrun: {
      'title': 'jobTitle',
      'lastContacted': 'lastActionDate',
      'nextContacted': 'nextActionDate'
    },
    opportunities: {
      'amount': 'company.opportunityAmount',
      'stage': 'company.opportunityStage',
      'probability': 'company.opportunityProbability',
      'closeDate': 'company.expectedCloseDate',
      'owner': 'mainSeller.name'
    }
  };
  
  return fieldMappings[section]?.[uiField] || uiField;
}
```

## Priority Fixes

### High Priority (Critical Issues):
1. Fix `lastContacted` → `lastActionDate` mapping
2. Add missing opportunities section configuration
3. Standardize column configurations across all files

### Medium Priority (Important Issues):
1. Fix opportunities section field mappings
2. Implement proper field validation
3. Create unified configuration system

### Low Priority (Nice to Have):
1. Add column visibility controls
2. Implement dynamic column configuration
3. Add field mapping utilities

## Files Requiring Updates

1. `src/platform/config/workspace-table-config.ts` - Add missing sections, standardize configs
2. `src/frontend/components/pipeline/config/section-config.ts` - Fix field mappings
3. `src/frontend/components/pipeline/PipelineView.tsx` - Use unified configuration
4. `src/frontend/components/pipeline/PipelineContent.tsx` - Use unified configuration
5. `src/frontend/components/pipeline/PipelineTable.tsx` - Fix sort field mappings
6. `src/frontend/components/pipeline/table/TableRow.tsx` - Fix field access patterns

## Testing Requirements

After implementing fixes, ensure:
1. All sections render with correct columns
2. Sorting works for all sortable columns
3. Filtering works for all filter options
4. Field transformations work correctly
5. No console errors related to missing fields
