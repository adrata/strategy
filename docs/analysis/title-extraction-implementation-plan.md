# Title Extraction Implementation Plan
## Goal: Always have the most accurate, current title where they are working

## Core Logic Flow

### Step 1: Identify Current Roles
Filter work experience to only **current/active** roles:
- PDL: `is_current === true` OR `end_date === null` OR `end_date` is in future
- CoreSignal: `active_experience === 1`
- General: No `end_date` OR `end_date` > today

### Step 2: Company Matching
If lead has a company name, find all current roles at that company:
- Normalize company names (remove Inc, LLC, etc.)
- Match: exact, contains, or company ID match
- Result: Array of matching current roles

### Step 3: Select Best Title (if multiple matches)
When multiple current roles exist at the same company, prioritize:

1. **Company ID Match** (strongest signal)
   - If experience has `company_id` and it matches lead's company ID
   - This is definitive - use this title

2. **Professional Role Detection**
   - Exclude side roles: coach, volunteer, advisor, board member, consultant (part-time)
   - Keywords to exclude: "coach", "volunteer", "advisor", "board", "consultant", "freelance"
   - Prefer roles that look like primary employment

3. **Seniority Ranking**
   - C-level (CEO, CTO, CFO, etc.) = 100
   - VP/VP-level = 80
   - Director = 60
   - Manager/Lead = 40
   - Individual Contributor = 20
   - Other = 10
   - Higher seniority wins

4. **Tenure (Longer = More Established)**
   - Earlier `start_date` = more established role
   - If start dates are close (< 6 months), consider equal

5. **Recency (Most Recent)**
   - If all else equal, prefer the most recently started role

### Step 4: Fallback Chain
If no current role at the company:

1. **Most Recent Current Role** (any company)
   - Use if person has current role elsewhere
   - Still accurate for "where they are working" (just different company)

2. **Most Recent Role Overall**
   - If no current roles exist, use most recent past role
   - Less ideal but better than nothing

3. **PDL/CoreSignal Default**
   - `data.job_title` or `active_experience_title`
   - API's best guess

4. **Original Input**
   - `input.title` from lead creation
   - Preserve user intent

5. **Null**
   - Only if absolutely no data available

## Edge Cases & Handling

### Case 1: No Company Name on Lead
- **Action:** Skip company matching
- **Fallback:** Use most recent current role or PDL default
- **Rationale:** Can't match without company name

### Case 2: Manual Title Entry
- **Action:** Always preserve manual entry
- **Rationale:** User explicitly set this, trust their judgment
- **Implementation:** Check if title was manually entered (has `updatedBy` or `source: 'manual'`)

### Case 3: Person No Longer at Company
- **Scenario:** Lead has company "Fastly", but person's current role is at "Microsoft"
- **Action:** Use current role at Microsoft (most accurate current title)
- **Note:** This is correct - we want "where they are working" not "where they used to work"
- **Consideration:** May want to flag this as a data quality issue (company mismatch)

### Case 4: Multiple Current Roles, All Side Roles
- **Scenario:** Only "Coach" and "Volunteer" roles at company
- **Action:** Use the most senior/established side role
- **Rationale:** Better than nothing, and it's still their current role

### Case 5: Company Name Variations
- **Scenario:** "Fastly" vs "Fastly Inc" vs "Fastly, Inc."
- **Action:** Use normalization function (already exists in UI)
- **Implementation:** Remove common suffixes, lowercase, trim

### Case 6: No Work Experience Data
- **Action:** Fall back to PDL `job_title` or input title
- **Rationale:** Can't extract from experience if it doesn't exist

### Case 7: Experience Data but No Current Roles
- **Action:** Use most recent past role
- **Rationale:** Better than API default, shows what they did

## Implementation Details

### Function Signature
```typescript
function extractBestCurrentTitle(
  enrichmentData: PDLEnrichedPerson | CoreSignalData,
  leadCompany: string | null,
  leadCompanyId: string | null,
  manualTitle: string | null
): {
  title: string | null;
  source: 'company-matched' | 'current-role' | 'recent-role' | 'api-default' | 'manual' | 'input';
  confidence: number; // 0-100
  matchedCompany: string | null;
  isCurrent: boolean;
}
```

### Company Name Normalization
```typescript
function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}
```

### Professional Role Detection
```typescript
function isProfessionalRole(title: string): boolean {
  const titleLower = title.toLowerCase();
  const sideRoleKeywords = [
    'coach', 'volunteer', 'advisor', 'adviser', 'board member', 
    'board of directors', 'consultant', 'freelance', 'contractor',
    'mentor', 'tutor', 'instructor' // Add more as needed
  ];
  
  // Check if title contains side role keywords
  return !sideRoleKeywords.some(keyword => titleLower.includes(keyword));
}
```

### Seniority Scoring
```typescript
function calculateSeniorityScore(title: string): number {
  const titleLower = title.toLowerCase();
  
  // C-level
  if (titleLower.match(/\b(c|chief)\s+(executive|technology|financial|marketing|operating|product|revenue|information|security|data|people|human|legal)\s+(officer|president)\b/i)) {
    return 100;
  }
  
  // VP level
  if (titleLower.includes('vp') || titleLower.includes('vice president')) {
    return 80;
  }
  
  // Director
  if (titleLower.includes('director') || titleLower.includes('head of')) {
    return 60;
  }
  
  // Manager/Lead
  if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('principal')) {
    return 40;
  }
  
  // Individual Contributor
  if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('analyst') || titleLower.includes('specialist')) {
    return 20;
  }
  
  return 10; // Other
}
```

### Role Selection Algorithm
```typescript
function selectBestRole(
  roles: WorkExperience[],
  leadCompany: string | null,
  leadCompanyId: string | null
): WorkExperience | null {
  if (!leadCompany) {
    // No company to match, return most recent current role
    return roles
      .filter(r => r.isCurrent)
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
  }
  
  const normalizedLeadCompany = normalizeCompanyName(leadCompany);
  
  // Find all current roles at matching company
  const matchingRoles = roles.filter(role => {
    if (!role.isCurrent) return false;
    
    // Company ID match (strongest)
    if (leadCompanyId && role.companyId === leadCompanyId) return true;
    
    // Company name match
    const normalizedRoleCompany = normalizeCompanyName(role.company);
    return normalizedRoleCompany === normalizedLeadCompany ||
           normalizedRoleCompany.includes(normalizedLeadCompany) ||
           normalizedLeadCompany.includes(normalizedRoleCompany);
  });
  
  if (matchingRoles.length === 0) {
    // No match, return most recent current role (any company)
    return roles
      .filter(r => r.isCurrent)
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
  }
  
  if (matchingRoles.length === 1) {
    return matchingRoles[0];
  }
  
  // Multiple matches - apply selection criteria
  return matchingRoles
    .map(role => ({
      role,
      score: calculateRoleScore(role, leadCompanyId)
    }))
    .sort((a, b) => b.score - a.score)[0].role;
}

function calculateRoleScore(role: WorkExperience, leadCompanyId: string | null): number {
  let score = 0;
  
  // Company ID match = 1000 points
  if (leadCompanyId && role.companyId === leadCompanyId) {
    score += 1000;
  }
  
  // Professional role = 100 points
  if (isProfessionalRole(role.title)) {
    score += 100;
  }
  
  // Seniority score (0-100)
  score += calculateSeniorityScore(role.title);
  
  // Tenure bonus (earlier start = more established)
  if (role.startDate) {
    const yearsAgo = (Date.now() - new Date(role.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    score += Math.min(yearsAgo * 10, 50); // Max 50 points for 5+ years
  }
  
  return score;
}
```

## Integration Points

### 1. PDL Service (`pdl-service.ts`)
Update `enrichPersonWithPDL()` to use new logic:
```typescript
const bestTitle = extractBestCurrentTitle(
  enriched,
  input.company, // lead company
  null, // company ID if available
  input.title // manual title
);

enriched.currentTitle = bestTitle.title || enriched.currentTitle;
```

### 2. CoreSignal Enrichment
Similar update for CoreSignal data processing

### 3. Display Logic
Update `UniversalOverviewTab.tsx` to use same utility (already has similar logic, can consolidate)

## Testing Strategy

### Unit Tests
1. Single current role at company → returns that role
2. Multiple current roles at company → returns best one (professional, senior)
3. No current role at company → returns most recent current role
4. No current roles → returns most recent role
5. No work experience → returns API default
6. Manual title → preserves manual title
7. Company name variations → matches correctly
8. Side roles → prefers professional roles

### Integration Tests
1. Real LinkedIn profile with multiple current roles
2. Profile with side role listed first
3. Profile with company name variation
4. Profile with no current roles

### Quality Monitoring
- Log title extraction decisions
- Track confidence scores
- Flag low-confidence extractions for review
- Monitor for regressions

## Rollout Plan

### Phase 1: Utility Function
- Create `extractBestCurrentTitle()` utility
- Comprehensive unit tests
- Handle both PDL and CoreSignal formats

### Phase 2: Integration
- Update PDL service
- Update CoreSignal enrichment
- Update display logic (consolidate)

### Phase 3: Validation
- Test with real profiles
- Compare before/after results
- Monitor for quality issues

### Phase 4: Gradual Rollout
- Enable for new enrichments first
- Monitor metrics
- Roll out to existing data if quality is good

## Success Metrics

1. **Accuracy:** % of titles that match company on record
2. **Quality:** % of professional roles vs side roles selected
3. **Coverage:** % of leads with successfully extracted titles
4. **Confidence:** Average confidence score of extractions

## Open Questions

1. **Should we update existing leads?** Or only new enrichments?
2. **What if person left the company?** Use current role elsewhere or flag as mismatch?
3. **How to handle consultant/contractor roles?** Are these "professional"?
4. **Should we store both titles?** Original + extracted for comparison?

