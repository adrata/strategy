# Title Extraction: Company-Matched Work Experience Analysis

## Problem Statement

When enriching leads from LinkedIn/PDL data, Adrata currently extracts the title from the most recent/present role in the work experience. However, LinkedIn users often have multiple concurrent roles, with side roles (e.g., "Team 91 Lacross Coach at Fastly") appearing before their primary professional role.

**Example Case:**
- Lead: Liam Lacon
- LinkedIn has multiple present roles
- Most recent role: "Team 91 Lacross Coach at Fastly" (side role)
- Primary professional role: Different title at Fastly (not at top of list)
- **Current behavior:** Adrata pulled "Team 91 Lacross Coach at Fastly" as the official title
- **Desired behavior:** Extract title from the work experience entry that matches the lead's company

## Current Implementation

### Where Title is Extracted

1. **PDL Service** (`src/platform/pipelines/functions/providers/pdl-service.ts:293`)
   ```typescript
   currentTitle: data.job_title || input.title,
   ```
   - Uses `data.job_title` directly from PDL API
   - This is typically the most recent/present role
   - No company matching logic

2. **Display Logic** (`src/frontend/components/pipeline/tabs/UniversalOverviewTab.tsx:480-523`)
   - Already has company-matching logic for **display purposes only**
   - Finds experience entry matching the lead's company
   - Uses `position_title` from matched experience
   - **This logic is NOT used when saving enrichment data**

### Data Structure

**PDL Experience Format:**
```typescript
interface PDLAPIExperience {
  company?: { name: string; id?: string };
  company_name?: string;
  title?: { name: string };
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  location?: { name: string };
  summary?: string;
}
```

**CoreSignal Experience Format:**
```typescript
{
  company_name: string;
  position_title: string;
  active_experience: 0 | 1;
  // ... other fields
}
```

## Why This Feedback Makes Sense

1. **Data Quality:** Company-matched titles are more accurate for business use
2. **Common Scenario:** Multiple concurrent roles on LinkedIn are not uncommon
3. **Business Logic:** The title should reflect the person's role at the company we're targeting
4. **Existing Pattern:** The UI already implements this logic (proving it's feasible)

## Edge Cases & Considerations

### 1. Missing Company Data
- **Scenario:** Lead has no company name set
- **Impact:** Cannot match against work experience
- **Solution:** Fall back to `data.job_title` or most recent role

### 2. Manual Entry
- **Scenario:** User manually entered title/company
- **Impact:** May not match LinkedIn data structure
- **Solution:** Prefer manually entered data if it exists

### 3. Company Name Variations
- **Scenario:** "Fastly" vs "Fastly Inc" vs "Fastly, Inc."
- **Impact:** Exact string matching will fail
- **Solution:** Use normalization (already implemented in UI logic)

### 4. No Matching Experience Entry
- **Scenario:** Work experience doesn't contain the lead's company
- **Impact:** No company-matched title available
- **Solution:** Fall back to most recent role or `data.job_title`

### 5. Multiple Matches
- **Scenario:** Multiple experience entries match the company
- **Impact:** Need to choose which one
- **Solution:** Prefer current roles (`is_current: true`), then most recent

### 6. Incomplete Work History
- **Scenario:** PDL/CoreSignal doesn't return full work history
- **Impact:** May not have company-matched entry
- **Solution:** Graceful fallback to available data

## Recommended Approach

### Implementation Strategy

1. **Create a reusable utility function** for company-matched title extraction
2. **Apply during enrichment** (not just display)
3. **Maintain fallback chain** for edge cases
4. **Log decisions** for debugging and quality monitoring

### Fallback Priority

1. **Manual entry** (if user explicitly set title)
2. **Company-matched work experience** (if company name available)
3. **Most recent current role** (if no company match)
4. **PDL `job_title` field** (API's best guess)
5. **Input title** (original title from lead creation)

### Company Matching Logic

Use the existing normalization from `UniversalOverviewTab.tsx`:

```typescript
const normalizeCompanyName = (name: string) => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/i, '')
    .trim();
};
```

Matching criteria:
- Exact normalized match
- One name contains the other (for variations)
- Consider company IDs if available (stronger signal)

## Implementation Plan

### Phase 1: Utility Function
- Create `extractCompanyMatchedTitle()` utility
- Handle PDL and CoreSignal data formats
- Include comprehensive fallback logic
- Add unit tests for edge cases

### Phase 2: Integration Points
- Update `pdl-service.ts` to use company-matched title
- Update CoreSignal enrichment scripts
- Ensure backward compatibility

### Phase 3: Data Quality
- Add logging for title extraction decisions
- Track match confidence scores
- Monitor for quality issues

### Phase 4: Manual Override
- Ensure manual entries are preserved
- Add UI indicator when title is company-matched vs manual

## Risk Assessment

### Low Risk
- ✅ UI already implements similar logic (proven approach)
- ✅ Fallback chain ensures we always have a title
- ✅ No breaking changes to existing data

### Medium Risk
- ⚠️ Company name normalization may have edge cases
- ⚠️ Need to handle both PDL and CoreSignal formats
- ⚠️ Performance impact of matching logic (minimal)

### Mitigation
- Comprehensive testing with real LinkedIn profiles
- Gradual rollout with monitoring
- Ability to revert if quality degrades

## Questions to Resolve

1. **Should we update existing leads?** Or only apply to new enrichments?
2. **What's the confidence threshold?** How close must company names match?
3. **Multiple current roles at same company?** Which takes precedence?
4. **Should we store both titles?** Original + company-matched for comparison?

## Conclusion

The feedback is **valid and implementable**. The approach makes sense for data quality, and we already have similar logic in the UI. The main considerations are:

1. **Robust fallback chain** for edge cases
2. **Company name normalization** for matching
3. **Preserving manual entries** when they exist
4. **Comprehensive testing** before rollout

The implementation should be straightforward given the existing UI logic, but requires careful handling of edge cases and data formats.

