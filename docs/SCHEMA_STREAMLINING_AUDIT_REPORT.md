# Schema Streamlining Audit Report

## Executive Summary

This report documents all references to fields being removed in the schema streamlining effort:
- `linkedinnavigatorurl` (companies table) - DUPLICATE/TYPO
- `title` (people table) - REDUNDANT (use jobTitle instead)

## Audit Results

### 1. linkedinnavigatorurl Field (Companies Table)

**Status**: SAFE TO REMOVE
- **Total References**: 0 (zero references found)
- **Only `linkedinNavigatorUrl` (camelCase) is used**: 179 references
- **Conclusion**: The typo version `linkedinnavigatorurl` is never referenced in codebase
- **Risk Level**: LOW - Safe to remove immediately

### 2. title Field (People Table)

**Status**: REQUIRES SYSTEMATIC MIGRATION
- **Total References**: 949+ references found
- **Risk Level**: MEDIUM-HIGH - Extensive usage throughout codebase

#### Usage Categories

**A. Prisma Select Statements (117 references)**
- Files selecting `title: true` in Prisma queries
- Must be removed from all select statements
- Examples:
  - `src/app/api/v1/people/route.ts` (line 461)
  - `src/app/api/v1/partners/route.ts` (line 272)
  - `src/app/api/v1/clients/route.ts` (line 279)
  - Many more...

**B. Fallback Logic (Hundreds of references)**
- Pattern: `person.title || person.jobTitle`
- Pattern: `record?.title || record?.jobTitle`
- Must be updated to: `person.jobTitle` or `record?.jobTitle`
- Examples:
  - `src/app/api/v1/people/route.ts` (lines 809-814)
  - `src/frontend/components/pipeline/tabs/ProspectOverviewTab.tsx` (line 306)
  - `src/frontend/components/pipeline/tabs/PersonOverviewTab.tsx` (line 240)
  - Many frontend components...

**C. Direct Assignments (40+ references)**
- Pattern: `updateData.title = ...`
- Pattern: `updates.title = ...`
- Must be removed (only set jobTitle)
- Examples:
  - `src/app/api/v1/enrich/route.ts` (line 267)
  - `src/app/api/cron/data-refresh/route.ts` (line 442)

**D. Desktop App (Rust)**
- `src-desktop/src/api/people.rs` (line 252)
- Person struct includes `title: row.get("title")`
- Must be removed from struct and queries

**E. Frontend Display Logic (Many references)**
- Components displaying `record?.title || record?.jobTitle`
- Must be updated to use only `jobTitle`
- Examples:
  - `src/frontend/components/pipeline/UniversalRecordTemplate.tsx`
  - `src/frontend/components/pipeline/tabs/UniversalOverviewTab.tsx`
  - Many more...

**F. Scripts**
- `scripts/audit/backfill-titles-from-enrichment.js` (lines 62-103)
- Uses both `title` and `jobTitle` fields
- Must be updated to only use `jobTitle`

## Critical Files Requiring Updates

### High Priority (API Routes - Core Functionality)
1. `src/app/api/v1/people/route.ts` - Main people API
2. `src/app/api/v1/people/[id]/route.ts` - Individual person API
3. `src/app/api/v1/enrich/route.ts` - Enrichment service
4. `src/app/api/cron/data-refresh/route.ts` - Data refresh cron
5. `src/app/api/data/conversions/route.ts` - Data conversion
6. `src/app/api/v1/strategy/generate/route.ts` - Strategy generation
7. `src/app/api/webhooks/zoho/route.ts` - Zoho webhook
8. `src/app/api/reports/generate/route.ts` - Report generation

### Medium Priority (Desktop App)
9. `src-desktop/src/api/people.rs` - Rust desktop app

### Medium Priority (Scripts)
10. `scripts/audit/backfill-titles-from-enrichment.js` - Title backfill script

### Lower Priority (Frontend - Many files)
- All frontend components using `record?.title || record?.jobTitle`
- Update systematically after API changes

## Data Migration Requirements

### Pre-Migration Check Queries

```sql
-- Check how many records have title but not jobTitle
SELECT COUNT(*) 
FROM people 
WHERE (title IS NOT NULL AND title != '') 
  AND (jobTitle IS NULL OR jobTitle = '');

-- Check if any records have different values
SELECT COUNT(*) 
FROM people 
WHERE title IS NOT NULL 
  AND jobTitle IS NOT NULL 
  AND title != jobTitle;
```

### Migration Strategy

1. **Migrate data first** (before code changes):
   ```sql
   UPDATE people 
   SET jobTitle = title 
   WHERE (jobTitle IS NULL OR jobTitle = '') 
     AND title IS NOT NULL 
     AND title != '';
   ```

2. **Verify migration**:
   ```sql
   SELECT COUNT(*) 
   FROM people 
   WHERE title IS NOT NULL 
     AND title != '' 
     AND (jobTitle IS NULL OR jobTitle = '');
   ```
   - Should return 0 before proceeding

3. **Remove field** (after code updates):
   ```sql
   ALTER TABLE people DROP COLUMN title;
   ```

## Risk Mitigation

1. **Data Backup**: Backup people table before migration
2. **Staged Rollout**: Update code first, then migrate data, then remove field
3. **Testing**: Test all affected endpoints after each phase
4. **Rollback Plan**: Keep migration scripts reversible

## Implementation Order

1. ✅ Audit complete (this document)
2. ⏳ Update API routes (Priority 1)
3. ⏳ Update desktop app (Priority 2)
4. ⏳ Update scripts (Priority 3)
5. ⏳ Update frontend components (Priority 4)
6. ⏳ Create migration scripts
7. ⏳ Update Prisma schema
8. ⏳ Test and verify

