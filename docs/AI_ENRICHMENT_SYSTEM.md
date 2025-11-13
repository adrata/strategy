# AI-Powered Company & Lead Data Population System

## Overview

This system automatically enriches company and person/lead records with comprehensive data from multiple sources using AI. All data is fetched, intelligently merged, and stored in the database for immediate user access.

## Architecture

### Multi-Source Data Integration

The system integrates data from three primary sources:

1. **CoreSignal** (Primary)
   - Company and person profile data
   - Employment history and current roles
   - LinkedIn metrics (followers, connections)
   - Location and contact information
   - Industry classification (NAICS, SIC codes)
   - Technologies used
   - Executive changes and hiring trends
   - Funding data

2. **Perplexity AI** (Gap Filling & Intelligence)
   - Founded year (when CoreSignal doesn't have it)
   - Revenue estimates
   - Market and segment classification
   - Recent news and company updates
   - Person bio and professional summary
   - Department verification

3. **Lusha** (Contact Verification)
   - Phone number verification and additional numbers
   - Email verification
   - Employee count verification
   - Additional contact details

### AI-Powered Intelligence Generation

Uses **Anthropic Claude** to analyze enriched data and generate:
- Buyer Group Role (Economic Buyer, Technical Buyer, Champion, etc.)
- Influence Level (High, Medium, Low)
- Decision Power (High, Medium, Low)
- Engagement Level (High, Medium, Low, None)

## Database Schema

### Companies Table - Fields Populated

**Basic Information:**
- `name`, `legalName`, `tradingName`, `localName`
- `description` (from CoreSignal description or description_enriched)
- `descriptionEnriched` (AI-generated summary using all data sources)
- `website`, `domain`, `email`, `phone`, `fax`

**Industry & Classification:**
- `industry`, `sector`
- `naicsCodes[]` (NAICS industry codes)
- `sicCodes[]` (SIC industry codes)

**Company Size & Metrics:**
- `employeeCount` (CoreSignal > Lusha)
- `size` (e.g., "11-50 employees")
- `revenue` (CoreSignal > Perplexity)
- `currency`
- `isPublic` (Boolean: public/private company)

**Location:**
- `address`, `city`, `state`, `country`, `postalCode`
- `hqCity`, `hqState`, `hqStreet`, `hqZipcode`, `hqFullAddress`, `hqLocation`
- `hqRegion[]`, `hqCountryIso2`, `hqCountryIso3`

**Social Media:**
- `linkedinUrl`, `linkedinFollowers`
- `twitterUrl`, `facebookUrl`, `instagramUrl`
- `youtubeUrl`, `githubUrl`

**Technologies & Digital:**
- `technologiesUsed[]` (array of technologies)
- `techStack[]`
- `numTechnologiesUsed` (count)
- `digitalMaturity` (score)

**Growth & Change Tracking:**
- `activeJobPostings` (current open positions)
- `employeeCountChange` (JSON with monthly/quarterly/yearly changes)
- `jobPostingsChange` (JSON with change metrics)
- `executiveArrivals` (JSON array of recent executive hires)
- `executiveDepartures` (JSON array of recent executive departures)

**Funding & Financial:**
- `fundingRounds` (JSON array of funding rounds)
- `lastFundingAmount` (most recent funding amount)
- `lastFundingDate` (most recent funding date)
- `revenueRange` (JSON with range data)

**Market & Strategy:**
- `market` (primary market/category from Perplexity)
- `segment` (business segment from Perplexity)
- `marketPosition`, `competitiveAdvantages[]`, `competitors[]`
- `businessChallenges[]`, `businessPriorities[]`, `strategicInitiatives[]`

**Data Quality & Tracking:**
- `customFields` (JSON with all enrichment data)
  - `coresignalId`, `coresignalData`
  - `perplexityData`, `lushaData`
  - `enrichmentSource`, `lastEnriched`
  - `aiSummaryGeneratedAt`, `aiSummaryModel`, `aiSummaryDataSources[]`
- `dataQualityScore` (0-100, based on critical fields filled)
- `dataSources[]` (array of sources: CoreSignal, Perplexity, Lusha)
- `lastEnriched`, `dataLastVerified`

### People Table - Fields Populated

**Basic Information:**
- `fullName`, `firstName`, `lastName`
- `jobTitle`, `title` (both populated for compatibility)
- `department`, `seniority`
- `email`, `workEmail`, `personalEmail`
- `phone`, `mobilePhone`, `workPhone`, `directDialPhone`
- `phone1`, `phone1Type`, `phone1Verified`
- `phone2`, `phone2Type`, `phone2Verified`

**Location:**
- `location` (full location string)
- `city`, `state`, `country` (extracted from location)
- `address`, `postalCode`

**Professional Profile:**
- `bio` (from Perplexity or CoreSignal)
- `linkedinUrl`, `linkedinConnections`, `linkedinFollowers`
- `profilePictureUrl`
- `linkedinNavigatorUrl` (Sales Navigator URL)

**Experience & Skills:**
- `totalExperience` (number of roles)
- `technicalSkills[]` (from CoreSignal skills)
- `degrees` (JSON from CoreSignal education)
- `certifications[]` (from CoreSignal)
- `yearsExperience`, `yearsAtCompany`, `yearsInRole`

**Intelligence Fields (AI-Generated):**
- `buyerGroupRole` (Economic Buyer, Technical Buyer, Champion, etc.)
- `influenceLevel` (High, Medium, Low)
- `decisionPower` (0-100 score)
- `engagementLevel` (High, Medium, Low, None)
- `customFields.influenceLevel`, `customFields.decisionPower`, `customFields.engagementLevel`
- `customFields.intelligenceConfidence` (0-100)
- `customFields.intelligenceReasoning` (explanation)
- `customFields.intelligenceGeneratedAt`, `customFields.intelligenceModel`

**Data Quality & Tracking:**
- `customFields` (JSON with all enrichment data)
  - `coresignalId`, `coresignalData`
  - `perplexityData`, `lushaData`
  - `enrichmentSource`, `lastEnriched`
- `dataQualityScore` (0-100, based on critical fields filled)
- `enrichmentScore` (0-100, amount of data enriched)
- `dataSources[]`, `enrichmentSources[]`
- `lastEnriched`, `dataLastVerified`

## API Endpoints

### Company Enrichment
**POST** `/api/v1/enrich`
```json
{
  "type": "company",
  "entityId": "company-id",
  "options": {}
}
```

Returns:
```json
{
  "type": "company",
  "entityId": "company-id",
  "status": "completed",
  "fieldsPopulated": ["industry", "employeeCount", "revenue", ...],
  "dataSources": ["CoreSignal", "Perplexity", "Lusha"],
  "dataQualityScore": 85.5,
  "enrichments": {
    "industry": true,
    "employeeCount": true,
    "revenue": true,
    "naicsCodes": true,
    "technologiesUsed": true,
    ...
  },
  "message": "Successfully enriched 25 fields from CoreSignal + Perplexity + Lusha (Quality: 86%)"
}
```

### Person Enrichment
**POST** `/api/v1/enrich`
```json
{
  "type": "person",
  "entityId": "person-id",
  "options": {
    "verifyEmail": true,
    "verifyPhone": true
  }
}
```

Returns:
```json
{
  "type": "person",
  "entityId": "person-id",
  "status": "completed",
  "fieldsPopulated": ["jobTitle", "department", "state", "bio", ...],
  "dataSources": ["CoreSignal", "Perplexity", "Lusha"],
  "dataQualityScore": 92.3,
  "enrichmentScore": 75.0,
  "enrichments": {
    "jobTitle": true,
    "department": true,
    "state": true,
    "bio": true,
    "seniority": true,
    "linkedinConnections": true,
    ...
  },
  "message": "Successfully enriched 18 fields from CoreSignal + Perplexity + Lusha (Quality: 92%)"
}
```

### Company Summary Generation
**POST** `/api/v1/companies/[id]/generate-summary`

Generates AI-powered summary using all available data sources.

Returns:
```json
{
  "success": true,
  "data": {
    "summary": "HCI Energy is a private professional services company...",
    "method": "ai",
    "model": "claude-3-5-sonnet-20241022",
    "dataSources": ["CoreSignal", "Perplexity", "Lusha"]
  }
}
```

### Person Intelligence Generation
**POST** `/api/v1/people/[id]/generate-intelligence`

Generates and stores intelligence fields for a person.

Returns:
```json
{
  "success": true,
  "data": {
    "intelligence": {
      "buyerGroupRole": "Economic Buyer",
      "influenceLevel": "High",
      "decisionPower": "High",
      "engagementLevel": "Medium",
      "confidence": 85,
      "reasoning": "Based on VP title and budget authority indicators"
    },
    "cached": false
  },
  "message": "Intelligence generated and stored successfully"
}
```

## Auto-Enrichment Triggers

### Company Pages
**Components:** `UniversalCompanyTab.tsx`, `CompanyOverviewTab.tsx`

**Triggers when:**
- Viewing company page (direct or via lead's Company tab)
- Company has website or LinkedIn URL
- Missing critical fields: description, industry, employeeCount, revenue, foundedYear

**Actions:**
1. Auto-trigger enrichment → fetch from CoreSignal + Perplexity + Lusha
2. Merge and save data to database
3. Generate AI summary using all data sources
4. Refresh page to display new data

**Silent Operation:** No UI spinners or loading states, happens in background

### Lead/Person Pages
**Components:** `PersonOverviewTab.tsx`, `UniversalOverviewTab.tsx`

**Triggers when:**
- Viewing lead/person page
- Person has LinkedIn URL or email
- Missing Basic Information: Title, Department, State, Bio
- Missing Intelligence: Role, Influence Level, Decision Power, Engagement Level

**Actions:**
1. Auto-trigger enrichment → fetch from CoreSignal + Perplexity + Lusha
2. Auto-trigger intelligence generation → AI analyzes data
3. Save all data to database
4. Refresh page to display new data

**Silent Operation:** No UI spinners, happens automatically in background

## Data Flow

### Company Enrichment Flow
```
User Views Company Page
    ↓
Check for Missing Data (description, industry, employeeCount, revenue)
    ↓
Auto-Trigger Enrichment (/api/v1/enrich)
    ↓
Parallel Fetch:
    ├─→ CoreSignal API (company data)
    ├─→ Perplexity API (intelligence, news, missing fields)
    └─→ Lusha API (contact verification)
    ↓
Intelligent Data Merging (CoreSignal prioritized)
    ↓
Populate Database Fields + customFields
    ↓
Calculate Data Quality Score
    ↓
Auto-Generate AI Summary (/api/v1/companies/[id]/generate-summary)
    ↓
Summary Uses: CoreSignal + Perplexity + Lusha data
    ↓
Save Summary to descriptionEnriched
    ↓
Refresh Page → Display All Data
```

### Person Enrichment Flow
```
User Views Lead/Person Page
    ↓
Check for Missing Data (Title, Department, State, Bio, Intelligence)
    ↓
Auto-Trigger Enrichment (/api/v1/enrich)
    ↓
Parallel Fetch:
    ├─→ CoreSignal API (person profile, experience, skills)
    ├─→ Perplexity API (bio, professional news, department)
    └─→ Lusha API (phone numbers, email verification)
    ↓
Intelligent Data Merging
    ↓
Extract State from Location String
    ↓
Populate Database Fields + customFields
    ↓
Calculate Data Quality & Enrichment Scores
    ↓
Auto-Generate Intelligence (/api/v1/people/[id]/generate-intelligence)
    ↓
AI Analyzes: Job title, department, seniority, experience, actions
    ↓
Generate: Buyer Role, Influence Level, Decision Power, Engagement Level
    ↓
Store Intelligence in Database (customFields + direct fields)
    ↓
Refresh Page → Display All Data
```

## Smart Update Logic

The system uses smart update logic to preserve existing data:

```typescript
const shouldUpdate = (existingValue: any, newValue: any) => {
  // Only update if existing value is null/undefined/empty/"-"
  if (!existingValue || existingValue === '' || existingValue === '-') {
    return !!newValue;
  }
  // Don't overwrite existing non-empty data
  return false;
};
```

**This ensures:**
- Manual user entries are never overwritten
- Buyer group enrichment data is preserved
- Existing good data from imports is kept
- Only missing or empty fields are populated

**Exceptions:**
- Description: Upgrades if new description is significantly longer (>50 chars longer)
- Stale data: Re-enriches if data is >90 days old

## Data Quality Scoring

### Company Data Quality Score
Based on 10 critical fields:
1. Industry
2. Employee count
3. Description
4. Revenue
5. Founded year
6. Location (city/state)
7. Phone
8. Email
9. LinkedIn URL
10. Website

**Score = (Filled Fields / 10) × 100**

### Person Data Quality Score
Based on 8 critical fields:
1. Full name
2. Job title
3. Email
4. Phone
5. LinkedIn URL
6. Department
7. Location
8. Company

**Score = (Filled Fields / 8) × 100**

### Person Enrichment Score
**Score = min(100, (Fields Enriched / 15) × 100)**

Tracks how much new data was added during enrichment.

## Intelligence Caching

**Person Intelligence:**
- Generated once and cached for **30 days**
- Stored in database (not real-time)
- Re-generated if:
  - Cached intelligence is >30 days old
  - `forceRegenerate` flag is set
  - Intelligence fields are missing

**Company Summary:**
- Generated once and stored in `descriptionEnriched`
- Re-generated if:
  - Missing or null
  - New enrichment data is added
  - User explicitly requests regeneration

## API Configuration

### Required Environment Variables
```bash
CORESIGNAL_API_KEY=your_key_here        # Required for enrichment
ANTHROPIC_API_KEY=your_key_here         # Required for AI summaries & intelligence
```

### Optional Environment Variables
```bash
PERPLEXITY_API_KEY=your_key_here        # Optional: Gap filling & intelligence
LUSHA_API_KEY=your_key_here             # Optional: Contact verification
```

**Graceful Degradation:**
- If Perplexity is not configured: Uses only CoreSignal data
- If Lusha is not configured: Uses only CoreSignal + Perplexity
- If Anthropic is not configured: Uses rule-based intelligence generation

## Usage Examples

### Manually Trigger Company Enrichment
```typescript
const result = await authFetch('/api/v1/enrich', {
  method: 'POST',
  body: JSON.stringify({
    type: 'company',
    entityId: companyId,
    options: {}
  })
});
```

### Manually Trigger Person Enrichment
```typescript
const result = await authFetch('/api/v1/enrich', {
  method: 'POST',
  body: JSON.stringify({
    type: 'person',
    entityId: personId,
    options: {
      verifyEmail: true,
      verifyPhone: true
    }
  })
});
```

### Manually Generate Person Intelligence
```typescript
const result = await authFetch(`/api/v1/people/${personId}/generate-intelligence`, {
  method: 'POST'
});
```

### Manually Generate Company Summary
```typescript
const result = await authFetch(`/api/v1/companies/${companyId}/generate-summary`, {
  method: 'POST'
});
```

## Performance Considerations

### Rate Limiting
- **1 second delay** between Perplexity requests
- **Parallel fetching** for CoreSignal, Perplexity, and Lusha
- **Background processing** for summary generation (doesn't block enrichment)

### Caching Strategy
- Intelligence cached for 30 days
- Enrichment metadata stored in customFields
- Data staleness check: 90 days

### Error Handling
- Graceful degradation if API keys missing
- Fallback to rule-based intelligence if AI fails
- Continue enrichment even if one source fails
- Detailed error logging for debugging

## Monitoring & Logging

All enrichment operations log:
- Source being used (CoreSignal, Perplexity, Lusha)
- Fields populated
- Data quality scores
- Success/failure status
- Error details

**Log format:**
```
🔍 [ENRICHMENT] Starting multi-source enrichment for company: HCI Energy
📊 [ENRICHMENT] Retrieved CoreSignal data for HCI Energy
✅ [ENRICHMENT] Retrieved Perplexity data for HCI Energy
✅ [ENRICHMENT] Retrieved Lusha data for HCI Energy
✅ [ENRICHMENT] Successfully enriched HCI Energy with 25 fields from CoreSignal + Perplexity + Lusha
💾 [COMPANY SUMMARY] Saved AI summary to database using data from CoreSignal + Perplexity + Lusha
```

## Testing

### Test Scenarios

1. **Company with no data**: Should auto-enrich when viewing page
2. **Company with partial data**: Should fill gaps only
3. **Lead's Company tab**: Should auto-enrich associated company
4. **Person with missing title**: Should populate from CoreSignal
5. **Person with no intelligence**: Should generate and store
6. **Stale data (>90 days)**: Should re-enrich
7. **Recent enrichment**: Should skip (use existing data)

### Manual Testing Commands
```bash
# Check enrichment status
npm run prisma studio

# View customFields data
SELECT id, name, "customFields"->>'enrichmentSource', 
       "customFields"->>'lastEnriched'
FROM companies 
WHERE "workspaceId" = 'your-workspace-id';

# View intelligence data
SELECT id, "fullName", "buyerGroupRole",
       "customFields"->>'influenceLevel',
       "customFields"->>'intelligenceGeneratedAt'
FROM people 
WHERE "workspaceId" = 'your-workspace-id';
```

## Troubleshooting

### Company Summary Not Populating
- Check if `ANTHROPIC_API_KEY` is set
- Check if company has basic data (name, industry, website)
- Check console logs for enrichment errors
- Verify company has `website` or `linkedinUrl`

### Lead Basic Information Blank
- Check if person has `email` or `linkedinUrl`
- Check console logs for CoreSignal search errors
- Verify `CORESIGNAL_API_KEY` is configured
- Check if person record has `companyId` set

### Intelligence Fields Not Showing
- Check if intelligence was generated (view customFields)
- Check if `ANTHROPIC_API_KEY` is set (falls back to rule-based)
- Check console logs for intelligence generation errors
- Verify person has `jobTitle` for role analysis

### Data Not Refreshing
- Check if enrichment completed successfully (console logs)
- Clear browser cache and localStorage
- Check if page refresh was triggered (should auto-refresh)
- Verify database was updated (check Prisma Studio)

## Future Enhancements

### Potential Additions
1. Additional data sources (ZoomInfo, Apollo, etc.)
2. Real-time data validation and verification
3. Competitive intelligence analysis
4. Company news and alerts system
5. Person career trajectory prediction
6. Buyer group relationship mapping
7. Account health scoring
8. Churn risk prediction
9. Technology stack change detection
10. Executive change alerts

### Performance Optimizations
1. Batch enrichment for multiple records
2. Webhook-based real-time updates
3. Background job queue for large enrichments
4. Redis caching layer
5. GraphQL-based data fetching

