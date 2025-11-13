# YUBA Water Agency - Code Flow Analysis

## Database Findings Summary

### Key Database Facts
- **Company**: Yuba Water Agency (ID: `01K7DW5DX0WBRYZW0K5VHXHAK1`)
  - Main Seller: Victoria Leland ✅
  - Status: ACTIVE
  - Last Updated: Oct 29, 2025

- **People at YUBA Water Agency**: 19 total
  - 16 people with Victoria as mainSeller ✅
  - 3 people with NULL mainSeller (recently added Nov 12 at 17:50) ⚠️
  
- **Warren Frederickson**: FOUND ✅
  - Main Seller: Victoria Leland ✅
  - Status: LEAD
  - Buyer Group Role: Champion
  - Company ID matches YUBA Water Agency ✅

- **API Filter Simulation**: All 19 people WOULD be returned (Victoria's people + NULL mainSeller people)

## Complete Data Loading Flow

### 1. URL Navigation
```
User navigates to:
https://action.adrata.com/toptemp/companies/yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ/?search=YUBA+Water+Agency&tab=people
```

**URL Structure:**
- Workspace: `toptemp` (resolves to `top-engineering-plus`)
- Section: `companies`
- Slug: `yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ`
- Query params: `search=YUBA+Water+Agency&tab=people`

**Issue Found**: Company ID in URL (`01K9QD502AV44DR2XSE80WHTWQ`) does NOT match database ID (`01K7DW5DX0WBRYZW0K5VHXHAK1`)!

### 2. Route Resolution

**File**: `src/app/[workspace]/(revenue-os)/companies/[id]/page.tsx`

```typescript
export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params['id'] as string; // Gets: yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ
  
  return (
    <PipelineDetailPage
      section="companies"
      slug={slug}
    />
  );
}
```

**Key Point**: Passes full slug to `PipelineDetailPage`, which must extract the actual company ID.

### 3. Pipeline Detail Page Component

**File**: `src/frontend/components/pipeline/PipelineDetailPage.tsx`

```typescript
export function PipelineDetailPage({ section, slug, standalone = false }) {
  // Extract ID from slug (handles format: name-ULID)
  const recordId = extractIdFromSlug(slug);
  
  // Load section data
  const currentSectionHook = useFastSectionData(section, section === 'speedrun' ? 30 : 1000);
  const { data: currentSectionData, loading: currentSectionLoading } = currentSectionHook;
  
  // Find specific record in loaded data
  const record = currentSectionData?.find(r => r.id === recordId);
  
  // Render UniversalRecordTemplate with record data
  return <UniversalRecordTemplate record={record} recordType={section} />;
}
```

**ID Extraction Logic** (`src/platform/utils/url-utils.ts`):
```typescript
export function extractIdFromSlug(slug: string): string {
  // Extracts last segment after final hyphen
  // "yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ" -> "01K9QD502AV44DR2XSE80WHTWQ"
  const parts = slug.split('-');
  return parts[parts.length - 1];
}
```

**Critical Issue**: If the ID in the URL is wrong, `extractIdFromSlug` will extract the wrong ID, and the record won't be found!

### 4. Universal Record Template

**File**: `src/frontend/components/pipeline/UniversalRecordTemplate.tsx`

```typescript
export function UniversalRecordTemplate({ record, recordType }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get tabs configuration for record type
  const tabs = getTabsForRecordType(recordType, record);
  
  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'people':
        return <UniversalPeopleTab record={record} recordType={recordType} />;
      case 'buyer-groups':
        return <UniversalBuyerGroupsTab record={record} recordType={recordType} />;
      // ... other tabs
    }
  };
  
  return (
    <div>
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}
    </div>
  );
}
```

**Tab Registry** (`src/frontend/components/pipeline/config/tab-registry.tsx`):
```typescript
companies: [
  { id: 'overview', label: 'Overview', component: UniversalCompanyTab },
  { id: 'actions', label: 'Actions', component: UniversalActionsTab },
  { id: 'intelligence', label: 'Intelligence', component: UniversalCompanyIntelTab },
  { id: 'people', label: 'People', component: UniversalPeopleTab },
  { id: 'buyer-groups', label: 'Buyer Group', component: UniversalBuyerGroupsTab },
  { id: 'opportunities', label: 'Opportunities', component: UniversalOpportunitiesTab },
  { id: 'notes', label: 'Notes', component: NotesTab }
]
```

### 5. People Tab Component

**File**: `src/frontend/components/pipeline/tabs/UniversalPeopleTab.tsx` (lines 149-350)

```typescript
export function UniversalPeopleTab({ record, recordType, onSave }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUnifiedAuth();
  
  // Extract company info from record
  const companyId = record?.id || record?.companyId;
  const companyName = record?.name || record?.company;
  
  useEffect(() => {
    const fetchPeople = async () => {
      console.log('🔍 [PEOPLE DEBUG] Starting fetchPeople');
      console.log('🔍 [PEOPLE DEBUG] Record:', record);
      console.log('🔍 [PEOPLE DEBUG] Company ID:', companyId);
      console.log('🔍 [PEOPLE DEBUG] Company Name:', companyName);
      
      if (!companyId && !companyName) {
        console.log('⚠️ [PEOPLE] No company ID or name available');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      let peopleData = [];
      
      // Check company-specific cache
      const companyCacheKey = `people-company-${companyId}-v1`;
      const cachedCompanyData = safeGetItem(companyCacheKey, 5 * 60 * 1000); // 5 min TTL
      
      if (cachedCompanyData && Array.isArray(cachedCompanyData)) {
        if (cachedCompanyData.some(p => p.companyId === companyId)) {
          peopleData = cachedCompanyData;
          console.log('📦 [PEOPLE] Using company-specific cached data');
        }
      }
      
      // Check general people cache
      const cacheKey = `people-${companyId}-${user.id}-v1`;
      const cachedData = safeGetItem(cacheKey, 2 * 60 * 1000); // 2 min TTL
      
      if (cachedData) {
        peopleData = cachedData;
        console.log('📦 [PEOPLE] Using cached people data');
      }
      
      // Only fetch if no cache or cache is stale
      if (peopleData.length === 0) {
        console.log('🔍 [PEOPLE] Fetching fresh people data for company:', companyName, 'ID:', companyId);
        
        try {
          // API call with companyId filter
          const response = await authFetch(
            `/api/v1/people?companyId=${companyId}&limit=200&sortBy=updatedAt&sortOrder=desc`
          );
          console.log('🔍 [PEOPLE] API response:', response);
          
          if (response && response.success && response.data) {
            peopleData = response.data;
            console.log('⚡ [PEOPLE] API returned:', peopleData.length, 'people');
            
            // Cache the data immediately
            const essentialData = peopleData.map(person => ({
              id: person.id,
              fullName: person.fullName,
              firstName: person.firstName,
              lastName: person.lastName,
              company: person.company,
              companyId: person.companyId,
              jobTitle: person.jobTitle,
              email: person.email
            }));
            
            safeSetItem(cacheKey, essentialData);
          }
        } catch (error) {
          console.log('⚠️ [PEOPLE] API failed:', error);
        }
      }
      
      // Filter people for this company
      const companyPeople = peopleData.filter((person) => 
        person.companyId === companyId || person.company === companyName
      );
      
      // Remove duplicates
      const uniqueCompanyPeople = companyPeople.filter((person, index, self) => 
        index === self.findIndex((p) => p.id === person.id)
      );
      
      if (uniqueCompanyPeople.length === 0) {
        console.log('🔍 [PEOPLE] No people found in database for this company:', companyName, 'ID:', companyId);
        setPeople([]);
        setLoading(false);
        return;
      }
      
      // Transform people with buyer group roles
      const transformedPeople = uniqueCompanyPeople.map((person) => ({
        ...person,
        role: getPersonRole(person.jobTitle),
        influence: getInfluenceScore(person.jobTitle),
        // ... other transformations
      }));
      
      setPeople(transformedPeople);
      setLoading(false);
    };
    
    fetchPeople();
  }, [companyId, companyName, user.id]);
  
  // Render people list
  return (
    <div>
      {loading ? <Loader /> : <PeopleList people={people} />}
    </div>
  );
}
```

**Critical Dependencies**:
1. **record.id**: Must match actual company ID from database
2. **user context**: Must be loaded before API call
3. **companyId**: Must be correct for API filtering to work

### 6. People API Endpoint

**File**: `src/app/api/v1/people/route.ts` (lines 25-270)

```typescript
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // 1. Authenticate and get user context
  const { context, response } = await getSecureApiContext(request, {
    requireAuth: true,
    requireWorkspaceAccess: true
  });
  
  if (response) return response;
  if (!context) {
    return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
  }
  
  // 2. Extract query parameters
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const limit = parseInt(searchParams.get('limit') || '100');
  const sortBy = searchParams.get('sortBy') || 'updatedAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  
  // 3. Build where clause with CRITICAL FILTER
  const where: any = {
    workspaceId: context.workspaceId, // Filter by workspace
    deletedAt: null, // Only non-deleted records
    OR: [
      { mainSellerId: context.userId },  // ✅ Victoria's people
      { mainSellerId: null }              // ✅ Unassigned people
    ]
  };
  
  // 4. Add companyId filter if provided
  if (companyId) {
    where.companyId = companyId;
  }
  
  // 5. Query database
  const people = await prisma.people.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    take: limit,
    include: {
      company: true,
      mainSeller: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  
  // 6. Return results
  return NextResponse.json({
    success: true,
    data: people,
    meta: {
      count: people.length,
      filters: { companyId, limit, sortBy, sortOrder }
    }
  });
}
```

**Critical Filter Logic**:
```typescript
OR: [
  { mainSellerId: context.userId },  // Returns Victoria's people
  { mainSellerId: null }              // Returns unassigned people
]
```

This means:
- ✅ Warren Frederickson (mainSeller = Victoria) → WILL be returned
- ✅ 3 unassigned people (mainSeller = NULL) → WILL be returned
- ✅ All 19 people at YUBA Water Agency → SHOULD be returned

## Potential Issues Identified

### Issue #1: Wrong Company ID in URL ⚠️

**URL**: `yuba-water-agency-01K9QD502AV44DR2XSE80WHTWQ`
**Database**: `01K7DW5DX0WBRYZW0K5VHXHAK1`

The ID extracted from the URL doesn't match the actual company ID in the database!

**Impact**: 
- `extractIdFromSlug` extracts: `01K9QD502AV44DR2XSE80WHTWQ`
- Database lookup for this ID returns nothing
- `record` is undefined or null
- `companyId` in `UniversalPeopleTab` is undefined
- API call fails or returns no results

**This is likely the PRIMARY ROOT CAUSE**

### Issue #2: Race Condition with User Context

If user context isn't fully loaded when `UniversalPeopleTab` mounts:
- `user.id` is undefined
- API authentication fails
- Cache keys are invalid
- Data doesn't load

### Issue #3: Cache Staleness

Frontend uses multiple cache keys:
1. Company-specific: `people-company-${companyId}-v1` (5 min TTL)
2. General: `people-${companyId}-${user.id}-v1` (2 min TTL)

If stale cache contains empty array:
- Fresh API call is skipped
- No people displayed
- After TTL expires, fresh data loads → "later populated"

### Issue #4: Record Not Found in Section Data

`PipelineDetailPage` loads all companies via `useFastSectionData('companies', 1000)`:
- If YUBA Water Agency isn't in first 1000 companies
- Or if ID mismatch causes record not found
- `record` prop is undefined
- People tab can't determine companyId

## Expected vs Actual Flow

### Expected Flow (When Working)
1. Navigate to company page with correct ID
2. `extractIdFromSlug` extracts correct company ID
3. `useFastSectionData` loads companies, finds match
4. `record` prop has full company data with correct ID
5. `UniversalPeopleTab` mounts with valid companyId
6. API call: `/api/v1/people?companyId=01K7DW5DX0WBRYZW0K5VHXHAK1`
7. API filters by workspace + (Victoria OR NULL) + companyId
8. Returns all 19 people
9. People displayed immediately

### Actual Flow (When Broken)
1. Navigate with WRONG ID in URL: `01K9QD502AV44DR2XSE80WHTWQ`
2. `extractIdFromSlug` extracts wrong ID
3. `useFastSectionData` loads companies, NO MATCH found
4. `record` prop is undefined or has wrong data
5. `UniversalPeopleTab` has no companyId
6. API call fails or returns empty
7. No people displayed
8. User refreshes or navigates again
9. Correct URL/ID used (or cache cleared)
10. Data loads correctly → "later populated"

## Timing Analysis

### Component Mount Sequence
```
1. PipelineDetailPage mounts
   ↓
2. useFastSectionData hook initializes
   ↓ (async data loading)
3. UniversalRecordTemplate renders with record=undefined initially
   ↓
4. UniversalPeopleTab mounts
   ↓
5. useEffect triggers fetchPeople
   ↓ (companyId is undefined)
6. Early return - no data fetched
   ↓ (data loads from useFastSectionData)
7. record prop updates
   ↓
8. UniversalPeopleTab re-renders
   ↓
9. useEffect triggers again with valid companyId
   ↓
10. API call succeeds
   ↓
11. People displayed
```

**Potential Race Conditions**:
- If `record` is undefined during initial mount
- If `user` context loads slowly
- If ID extraction fails silently
- If cache returns stale empty data

## Conclusion

The most likely root cause is **wrong company ID in the URL**, resulting in:
- Record not found in section data
- companyId undefined in People tab
- API call with invalid/missing companyId
- No data returned

When the issue "resolved itself later", it was likely because:
1. User navigated using a different link with correct ID
2. Cache expired and forced fresh data load
3. Browser refresh cleared state and reloaded correctly
4. The page was accessed via a different route that generated correct URL

