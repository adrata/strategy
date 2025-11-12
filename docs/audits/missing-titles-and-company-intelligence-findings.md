# Investigation Findings: Missing Lead Titles and Company Intelligence

## Executive Summary

This investigation analyzed why some leads are missing titles and why company intelligence fields are not showing in the Company tab. The investigation revealed several root causes and provides actionable recommendations.

## Key Findings

### 1. Missing Lead Titles

#### Root Causes

1. **CSV Import Data Quality**: When leads are imported from CSV files, titles are only populated if the source CSV contains a `jobTitle` or `title` column. If the source data lacks titles, the Person records are created without them.

   - **Evidence**: `src/platform/services/ExcelImportService.ts` line 399 sets `jobTitle: rowData.jobTitle` - if `rowData.jobTitle` is undefined/null, the field remains null.

2. **Enrichment Not Always Triggered**: Enrichment services (CoreSignal, PDL, Lusha) are not automatically triggered for all leads when they are created.

   - **Evidence**: In `src/app/api/v1/people/route.ts` POST endpoint (lines 1590-1607), enrichment is triggered asynchronously with `setImmediate`, but this may fail silently or not run for all leads.

3. **Title Extraction Logic**: The title extraction utility (`src/platform/utils/title-extraction.ts`) exists and is sophisticated, but it's only called during enrichment processes, not during initial record creation.

4. **API Response Structure**: The `/api/v1/people` API returns `jobTitle` field (line 459) but the `useLeadsData` hook expects both `jobTitle` and `title` fields (lines 91-92). The API doesn't return a `title` field separately.

#### Impact

- Approximately 100+ leads are missing titles based on user feedback
- Leads with only email (no LinkedIn or phone) are less likely to have titles because enrichment requires more data points
- Some leads correctly pull in titles, indicating enrichment works when triggered

### 2. Missing Company Intelligence

#### Root Causes

1. **Intelligence Fields Not Populated**: Company intelligence fields (`businessChallenges`, `businessPriorities`, `competitiveAdvantages`, `growthOpportunities`, `techStack`) exist in the schema but are rarely populated during company creation or enrichment.

   - **Evidence**: These fields are defined in `prisma/schema.prisma` (lines 414-425, 454) as `String[]` with default empty arrays `@default([])`
   - Companies are created with empty arrays, and enrichment scripts don't always populate these fields

2. **API Returns Fields But They're Empty**: The `/api/v1/companies` API uses `include: { coreCompany: true }` which returns all company fields including intelligence fields, but since they're empty arrays, nothing displays.

   - **Evidence**: `src/app/api/v1/companies/route.ts` line 354 uses `include` which returns all fields
   - `useCompanyData` hook expects these fields (lines 17-21) and `PersonDetailView` checks for them (lines 2147-2150)

3. **Company Enrichment Doesn't Populate Intelligence**: Most company enrichment scripts focus on basic fields (name, website, LinkedIn, address) but don't populate intelligence fields.

   - **Evidence**: Scripts like `scripts/enrich-sketchup-manual.js` and `scripts/enrich-dan-adrata-companies.js` update basic fields but don't set intelligence arrays

4. **Frontend Display Logic**: The Company tab only shows intelligence sections if at least one intelligence field has data (line 2147-2150), so empty arrays result in no intelligence display.

#### Impact

- Company tab shows only basic information (website, LinkedIn, address) for most companies
- Missing valuable intelligence data that could help sales teams understand company needs and priorities
- Intelligence fields exist in the database but are not being utilized

### 3. LinkedIn URL Availability

#### Findings

- About 100 leads have email/phone but no LinkedIn URL
- Some leads (like Mike Fisher) have email and LinkedIn but no phone
- User notes that non-computer engineers rarely use LinkedIn, which explains some missing LinkedIn URLs

#### Root Cause

- LinkedIn URLs are only populated if:
  1. Source data includes LinkedIn URL (CSV import)
  2. Enrichment services find LinkedIn profile (CoreSignal, PDL, Lusha)
  3. Manual entry includes LinkedIn URL

- For professionals who don't use LinkedIn, enrichment services won't find profiles, resulting in missing URLs

## Data Quality Analysis

### Enrichment Coverage

Based on code analysis:

1. **Enrichment Sources**: The system supports multiple enrichment sources:
   - CoreSignal (via `customFields.coresignalData` or `customFields.coresignal`)
   - Lusha (via `customFields.lusha` or `customFields.enrichedData`)
   - PDL (via `customFields.pdlData`)

2. **Enrichment Triggers**: Enrichment is triggered:
   - Asynchronously after Person creation (POST `/api/v1/people`)
   - Manually via enrichment scripts
   - Not automatically for all leads

3. **Title Population Priority**:
   - Manual entry (highest priority)
   - Company-matched current role from work experience
   - Most recent current role
   - API default (`active_experience_title` or `job_title`)
   - Input title (lowest priority)

## Recommendations

### Immediate Actions

1. **Run Diagnostic Script**: Execute `scripts/audit/investigate-missing-titles-and-intelligence.js` to get exact counts and identify specific records missing data.

2. **Bulk Enrichment**: Run enrichment services for leads missing titles:
   - Prioritize leads with email addresses (easier to enrich)
   - Use CoreSignal, PDL, or Lusha APIs to fetch missing titles
   - Update Person records with extracted titles

3. **Company Intelligence Population**: 
   - Review existing company enrichment scripts to add intelligence field population
   - Consider using AI/LLM services to generate intelligence from company descriptions, websites, and other available data
   - Populate intelligence fields during company enrichment processes

### Long-Term Improvements

1. **Automatic Enrichment**: 
   - Ensure enrichment is triggered for all new Person records, not just some
   - Add retry logic for failed enrichment attempts
   - Log enrichment failures for monitoring

2. **Title Extraction on Import**:
   - Enhance CSV import to attempt title extraction from available data
   - Use email domains to infer company and attempt title lookup
   - Call enrichment services during import if email is available

3. **Company Intelligence Generation**:
   - Create a service to generate company intelligence from available data
   - Use AI/LLM to analyze company websites, descriptions, and public data
   - Populate intelligence fields during company creation/enrichment

4. **Data Quality Monitoring**:
   - Add data quality metrics to track:
     - Percentage of leads with titles
     - Percentage of companies with intelligence
     - Enrichment success rates
   - Create alerts for low data quality

5. **API Improvements**:
   - Ensure `/api/v1/people` returns both `jobTitle` and `title` fields consistently
   - Add fallback logic to populate `title` from `jobTitle` if `title` is missing
   - Verify company intelligence fields are properly returned by API

6. **Frontend Enhancements**:
   - Show indicators when data is missing (e.g., "Title not available - enrichment pending")
   - Add "Enrich Now" button for leads/companies missing data
   - Display enrichment status and last enrichment date

## Diagnostic Script Usage

Run the diagnostic script to get detailed analysis:

```bash
node scripts/audit/investigate-missing-titles-and-intelligence.js <workspaceId>
```

The script will:
- Identify Person records missing titles
- Identify Company records missing intelligence
- Analyze enrichment coverage
- Report on data sources
- Generate a detailed JSON report in `logs/` directory

## Next Steps

1. Execute diagnostic script to get baseline metrics
2. Prioritize enrichment for high-value leads (those with email addresses)
3. Implement company intelligence generation service
4. Add monitoring and alerting for data quality
5. Update enrichment processes to ensure intelligence fields are populated

## Files Modified/Created

- `scripts/audit/investigate-missing-titles-and-intelligence.js` - Diagnostic script
- `docs/audits/missing-titles-and-company-intelligence-findings.md` - This findings document

## Related Files

- `src/platform/utils/title-extraction.ts` - Title extraction logic
- `src/app/api/v1/people/route.ts` - People API endpoint
- `src/app/api/v1/companies/route.ts` - Companies API endpoint
- `src/platform/hooks/useLeadsData.ts` - Leads data hook
- `src/platform/hooks/useCompanyData.ts` - Company data hook
- `src/products/monaco/components/PersonDetailView.tsx` - Company tab display
- `prisma/schema.prisma` - Database schema

