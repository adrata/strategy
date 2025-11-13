# Database Schema Streamlining Analysis

## Executive Summary

The schema is well-structured with a solid core entity architecture, but there are opportunities for streamlining through field consolidation, duplicate removal, and better organization of enrichment data.

## Current Architecture Strengths

### 1. Core Entity Pattern ✅
- **`core_companies`** and **`core_people`** tables provide global canonical data
- Workspace-specific tables (`companies`, `people`) reference core entities
- Override fields allow workspace customization without polluting core data
- **Assessment**: Excellent pattern for data deduplication and consistency

### 2. Multi-Tenancy ✅
- Consistent `workspaceId` pattern across all tables
- Proper soft deletes with `deletedAt`
- User assignment via `mainSellerId`
- **Assessment**: Well-implemented multi-tenant architecture

### 3. Indexing Strategy ✅
- Comprehensive indexing for common query patterns
- Composite indexes for performance-critical queries
- GIN indexes for JSON fields
- **Assessment**: Good performance optimization

## Areas for Streamlining

### 1. Duplicate/Redundant Fields

#### Companies Table
**Critical Issues:**
- `linkedinnavigatorurl` (line 481) vs `linkedinNavigatorUrl` (line 482) - **DUPLICATE/TYPO**
  - **Usage Analysis**: Only `linkedinNavigatorUrl` is used in codebase (179 references)
  - **Recommendation**: Remove `linkedinnavigatorurl`, keep `linkedinNavigatorUrl`

**Location Fields - Potential Consolidation:**
- `address`, `city`, `state`, `country`, `postalCode` (basic location)
- `hqCity`, `hqState`, `hqCountryIso2`, `hqCountryIso3`, `hqFullAddress`, `hqLocation`, `hqRegion`, `hqStreet`, `hqZipcode` (HQ location)
- **Recommendation**: Consider consolidating into a JSON `location` field or separate `addresses` table

**Social Media URLs:**
- `linkedinUrl`, `facebookUrl`, `githubUrl`, `instagramUrl`, `twitterUrl`, `youtubeUrl`
- **Recommendation**: Consider consolidating into JSON `socialMediaUrls` field

#### People Table
**Title/Job Fields:**
- `jobTitle` (line 583) vs `title` (line 584) - **PARTIALLY REDUNDANT**
  - **Usage Analysis**: 
    - `jobTitle` is used extensively (165+ references)
    - `title` is used as fallback in some places: `person.title || person.jobTitle`
    - Some code sets both: `updateData.jobTitle = ...; updateData.title = ...`
  - **Recommendation**: Standardize on `jobTitle`, remove `title` after updating code to use `jobTitle` only

**Experience Fields:**
- `totalExperience` (line 678) vs `yearsExperience` (line 688) vs `totalExperienceMonths` (line 701) - **REDUNDANT BUT USED**
  - **Usage Analysis**:
    - `totalExperienceMonths` is the source of truth (used in enrichment, 48 references)
    - `yearsExperience` is calculated from months: `Math.floor(totalExperienceMonths / 12)` (used in UI)
    - `totalExperience` is sometimes used as display value
  - **Recommendation**: 
    - Keep `totalExperienceMonths` as primary field
    - Consider removing `totalExperience` and `yearsExperience` if they can be computed on-the-fly
    - Or keep `yearsExperience` as computed/cached value for performance

**Company Fields:**
- `currentCompany` (line 639) vs `companyId` (line 573) - **POTENTIAL REDUNDANCY**
  - `currentCompany` is String, `companyId` is FK
  - **Recommendation**: If `currentCompany` is just a name cache, consider removing it

**Email Fields:**
- `email`, `workEmail`, `personalEmail` - **GOOD** (different purposes)
- `emailOverride` - **GOOD** (workspace override)

**Phone Fields:**
- `phone`, `mobilePhone`, `workPhone` - **GOOD** (different purposes)

### 2. JSON Field Consolidation

#### Companies Table
**Intelligence/Enrichment JSON Fields:**
- `companyIntelligence` (line 418)
- `aiIntelligence` (line 467)
- `enrichedData` (in people, similar pattern)
- `coresignalData` (in people)

**Recommendation**: Consider consolidating into a single `intelligence` JSON field with nested structure:
```json
{
  "ai": { ... },
  "company": { ... },
  "coresignal": { ... },
  "lastUpdated": "..."
}
```

**Change Tracking JSON Fields:**
- `employeeCountChange` (line 473)
- `jobPostingsChange` (line 478)
- `revenueRange` (line 480)
- `acquisitionHistory` (line 465)

**Recommendation**: Consider a unified `changeHistory` JSON field or separate `entity_changes` table

#### People Table
**Similar Pattern:**
- `aiIntelligence` (line 690)
- `enrichedData` (line 648)
- `coresignalData` (line 638)
- `careerTimeline` (line 635)
- `roleHistory` (line 670)
- `previousRoles` (line 667)
- `rolePromoted` (line 671)
- `degrees` (line 644)
- `salaryProjections` (line 700)

**Recommendation**: Consolidate enrichment data into structured JSON with clear nesting

### 3. Redundant Tables

**Lists Tables:**
- `company_lists` (line 857) - Legacy table
- `lists` (line 884) - Generic replacement
- **Recommendation**: Migrate data from `company_lists` to `lists`, deprecate `company_lists`

### 4. Field Organization

**Companies Table - 130+ Fields:**
- Core fields (id, workspaceId, name, etc.)
- Override fields (nameOverride, industryOverride, etc.)
- Location fields (address, city, state, hqCity, etc.)
- Business fields (industry, revenue, employeeCount, etc.)
- Intelligence fields (companyIntelligence, aiIntelligence, etc.)
- Action fields (lastAction, nextAction, etc.)
- Social media fields (linkedinUrl, facebookUrl, etc.)
- Enrichment fields (competitiveAdvantages, techStack, etc.)

**Recommendation**: Group related fields with comments for better maintainability

**People Table - 130+ Fields:**
- Similar organization issues
- Many enrichment fields that could be in JSON

### 5. Unused or Rarely Used Fields

Based on codebase analysis, these fields may be underutilized:

**Companies:**
- `fax` (line 372) - Rarely used in modern systems
- `entityId` (line 406) - Purpose unclear
- `directionalIntelligence` (line 401) - May be redundant with `companyIntelligence`
- `actionStatus` (line 402) - May be redundant with `status`

**People:**
- `displayName` (line 580) - May be redundant with `fullName`
- `salutation` (line 581), `suffix` (line 582) - Rarely used
- `dateOfBirth` (line 599), `gender` (line 600) - Privacy/seldom used
- `entityId` (line 626) - Purpose unclear

### 6. Data Type Inconsistencies

**Experience Fields:**
- `totalExperience`: `Int?` (months? years?)
- `yearsExperience`: `Int?` (years)
- `totalExperienceMonths`: `Int?` (months)
- **Recommendation**: Standardize on `totalExperienceMonths` as `Int?`

**LinkedIn Fields:**
- `linkedinConnections`: `Int?` (in core_people)
- `linkedinConnections`: `Int?` (in people) - **DUPLICATE**
- **Recommendation**: Use core entity data, remove from people table

## Recommended Streamlining Actions

### Phase 1: Critical Fixes (High Impact, Low Risk)

1. **Remove duplicate `linkedinnavigatorurl` field**
   ```sql
   ALTER TABLE companies DROP COLUMN IF EXISTS linkedinnavigatorurl;
   ```

2. **Remove redundant `title` field from people**
   ```sql
   ALTER TABLE people DROP COLUMN IF EXISTS title;
   ```

3. **Consolidate experience fields in people**
   ```sql
   -- Migrate data if needed, then remove redundant fields
   ALTER TABLE people DROP COLUMN IF EXISTS totalExperience;
   ALTER TABLE people DROP COLUMN IF EXISTS yearsExperience;
   ```

### Phase 2: Field Consolidation (Medium Impact, Medium Risk)

4. **Consolidate social media URLs into JSON**
   ```sql
   -- Add new JSON field
   ALTER TABLE companies ADD COLUMN social_media_urls JSONB;
   
   -- Migrate data
   UPDATE companies SET social_media_urls = jsonb_build_object(
     'linkedin', linkedinUrl,
     'facebook', facebookUrl,
     'github', githubUrl,
     'instagram', instagramUrl,
     'twitter', twitterUrl,
     'youtube', youtubeUrl
   ) WHERE linkedinUrl IS NOT NULL OR facebookUrl IS NOT NULL;
   
   -- Remove old columns after migration verified
   ```

5. **Consolidate intelligence JSON fields**
   ```sql
   -- Create unified intelligence field structure
   ALTER TABLE companies ADD COLUMN intelligence JSONB;
   -- Migrate and consolidate existing JSON fields
   ```

### Phase 3: Schema Refactoring (High Impact, High Risk)

6. **Migrate from `company_lists` to `lists`**
   - Create migration script
   - Migrate all data
   - Update application code
   - Deprecate `company_lists` table

7. **Consider address normalization**
   - Create `addresses` table for reusable addresses
   - Reference from companies and people
   - Reduces duplication

## Field Count Analysis

### Current State
- **Companies**: ~130 fields
- **People**: ~130 fields
- **Core Companies**: ~30 fields
- **Core People**: ~25 fields

### Potential After Streamlining
- **Companies**: ~100 fields (23% reduction)
- **People**: ~100 fields (23% reduction)
- **Core Companies**: ~30 fields (unchanged)
- **Core People**: ~25 fields (unchanged)

## Benefits of Streamlining

1. **Reduced Storage**: Fewer columns = smaller row size = better cache performance
2. **Improved Maintainability**: Less code to maintain, clearer data model
3. **Better Performance**: Smaller tables = faster queries, better index efficiency
4. **Reduced Complexity**: Fewer fields = easier to understand and document
5. **Consistency**: Eliminated duplicates and inconsistencies

## Migration Strategy

1. **Analysis Phase**: Audit actual field usage in codebase
2. **Planning Phase**: Create detailed migration plan with rollback strategy
3. **Implementation Phase**: 
   - Add new consolidated fields
   - Migrate data
   - Update application code
   - Remove old fields
4. **Verification Phase**: Test thoroughly before production deployment

## Notes

- The core entity architecture is excellent and should be preserved
- JSON fields provide flexibility but should be used judiciously
- Some "redundant" fields may serve important purposes (e.g., caching)
- Always verify field usage before removing
- Consider backward compatibility during migration

