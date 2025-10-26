# Zonar Enrichment Scripts

This directory contains comprehensive scripts for data enrichment, quality scoring, and AI intelligence generation for the Adrata platform.

## Scripts Overview

### Core Enrichment Scripts

#### 1. `enrich-people.js`
Enriches person data using Coresignal API with search and collect operations.
- **Features:** Search by LinkedIn URL, email, or name+company
- **Data Quality:** Automatic quality scoring
- **Rate Limiting:** Built-in delays and retry logic

#### 2. `enrich-companies.js`
Enriches company data using Coresignal API with search and collect operations.
- **Features:** Search by company name, website, LinkedIn URL
- **Data Quality:** Automatic quality scoring
- **Rate Limiting:** Built-in delays and retry logic

### Data Quality & Intelligence Scripts

#### 3. `calculate-data-quality.js`
Calculates and updates data quality scores for all people and companies.
- **Scoring:** Core fields (40%) + Enrichment data (30%) + AI intelligence (20%) + Contact info (10%)
- **Categories:** Excellent (90%+), Good (75-89%), Acceptable (60-74%), Poor (<60%)
- **Updates:** `dataQualityScore`, `dataCompleteness`, `dataQualityBreakdown`

#### 4. `generate-ai-intelligence.js`
Systematically generates AI intelligence for all people with >60% data quality.
- **AI Analysis:** Wants, pains, outreach strategy, overall insight
- **Buyer Group:** Role identification, influence scoring, decision power
- **Engagement:** Communication style, preferred contact, response time
- **Storage:** `aiIntelligence` JSON field with full analysis

#### 5. `map-enrichment-data.js`
Maps Coresignal data from customFields to proper schema fields.
- **People:** Skills, experience, education, languages, LinkedIn data
- **Companies:** Description, website, industry, size, revenue, location
- **Quality:** Ensures data flows to typed fields, not just JSON

### Advanced Enrichment Scripts

#### 6. `waterfall-enrichment.js`
Implements multi-provider enrichment waterfall system.
- **Flow:** Coresignal → People Data Labs → Lusha → Perplexity validation
- **Logic:** Check recent enrichment, try providers in order, validate results
- **Quality:** Calculate final quality score after all enrichment

#### 7. `verify-employment.js`
Verifies current employment status using multiple verification methods.
- **Checks:** LinkedIn employment, email domain, company validity, data age
- **Scoring:** Weighted verification score with confidence levels
- **Actions:** Verify, flag unverified, quarantine invalid data

### Testing & Verification Scripts

#### 8. `test-enrichment.js`
Test script to verify enrichment for a single person and company.
- **Purpose:** Validate API calls and database storage
- **Output:** Detailed logging of enrichment process

#### 9. `verify-data.js`
Verification script to confirm enriched data is stored correctly.
- **Checks:** Database queries for enriched records
- **Validation:** Confirms data structure and completeness

## Setup

1. Install dependencies:
```bash
npm install @prisma/client dotenv
```

2. Set environment variables in `.env`:
```
CORESIGNAL_API_KEY=your_coresignal_api_key
PEOPLE_DATA_LABS_API_KEY=your_pdl_api_key
LUSHA_API_KEY=your_lusha_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
DATABASE_URL=your_database_url
```

## Usage

### Phase 1: Data Quality Calculation
```bash
# Calculate quality scores for all records
node zonar/calculate-data-quality.js
```

### Phase 2: AI Intelligence Generation
```bash
# Generate AI intelligence for high-quality records
node zonar/generate-ai-intelligence.js
```

### Phase 3: Field Mapping
```bash
# Map Coresignal data to schema fields
node zonar/map-enrichment-data.js
```

### Phase 4: Waterfall Enrichment
```bash
# Run multi-provider enrichment waterfall
node zonar/waterfall-enrichment.js
```

### Phase 5: Employment Verification
```bash
# Verify employment status for all people
node zonar/verify-employment.js
```

### Testing
```bash
# Test enrichment for single records
node zonar/test-enrichment.js

# Verify data storage
node zonar/verify-data.js
```

## Data Quality Scoring

### People Scoring (100 points)
- **Core Fields (40%):** Name, email, phone, LinkedIn
- **Enrichment Data (30%):** Coresignal data, skills, experience
- **AI Intelligence (20%):** AI analysis, buyer group, engagement
- **Contact Info (10%):** Email, phone, social media

### Companies Scoring (100 points)
- **Core Fields (40%):** Name, website, LinkedIn, description
- **Enrichment Data (40%):** Coresignal data, industry, size
- **Business Data (20%):** Revenue, stock symbol, location

### Quality Categories
- **Excellent:** 90%+ data quality
- **Good:** 75-89% data quality
- **Acceptable:** 60-74% data quality
- **Poor:** <60% data quality

## AI Intelligence Features

### Person Analysis
- **Wants Analysis:** Primary and secondary wants based on role/industry
- **Pains Analysis:** Key pain points and challenges
- **Outreach Strategy:** Approach, messaging, channels, timing
- **Overall Insight:** Summary and key insights

### Buyer Group Analysis
- **Role Identification:** Decision maker, influencer, user
- **Influence Scoring:** High, medium, low influence levels
- **Decision Power:** Scoring based on role and seniority
- **Engagement Strategy:** Communication preferences and timing

## Data Storage

### Enrichment Data
- `customFields.coresignalId` - Coresignal employee/company ID
- `customFields.coresignalData` - Full Coresignal profile data
- `customFields.lastEnrichedAt` - Timestamp of enrichment
- `customFields.enrichmentSource` - Source of enrichment

### Quality Metrics
- `dataQualityScore` - Overall quality score (0-100)
- `dataCompleteness` - Percentage of fields populated
- `dataQualityBreakdown` - Detailed scoring breakdown
- `enrichmentSources` - Array of enrichment sources used
- `enrichmentVersion` - Version of enrichment system

### AI Intelligence
- `aiIntelligence` - Complete AI analysis JSON
- `aiConfidence` - Confidence score for AI analysis
- `aiLastUpdated` - Timestamp of last AI update
- `buyerGroupRole` - Identified buyer group role
- `influenceScore` - Calculated influence score
- `engagementStrategy` - Generated engagement strategy

## Error Handling

- **Rate Limiting:** Built-in delays between API calls
- **Retry Logic:** Automatic retry for failed requests
- **Error Logging:** Comprehensive error tracking
- **Graceful Degradation:** Continue processing on individual failures
- **Data Validation:** Verify data before storage

## Performance

- **Batch Processing:** Process records in configurable batches
- **Parallel Processing:** Concurrent API calls where possible
- **Caching:** Avoid re-enriching recently processed records
- **Progress Tracking:** Real-time progress reporting
- **Memory Management:** Efficient data handling for large datasets

## Monitoring

- **Success Rates:** Track enrichment success by provider
- **Quality Metrics:** Monitor data quality improvements
- **Cost Tracking:** Track API usage and costs
- **Error Rates:** Monitor and alert on high error rates
- **Performance:** Track processing times and throughput

## Workspace Configuration

The scripts are configured for the Notary Everyday workspace:
- Workspace ID: `01K7DNYR5VZ7JY36KGKKN76XZ1`

## Troubleshooting

### Common Issues

1. **Missing API Keys**
   - Ensure all required API keys are set in `.env`
   - Verify API keys are valid and have sufficient credits

2. **Database Connection**
   - Ensure `DATABASE_URL` is correct
   - Verify database is accessible

3. **Rate Limiting**
   - Increase delay between batches if hitting rate limits
   - Reduce batch size if needed

4. **No Results Found**
   - Check if identifiers (LinkedIn, email, domain) are valid
   - Verify company/person names match data provider records

### Debug Mode

Add console logging to debug specific issues:
```javascript
console.log('Search query:', JSON.stringify(searchQuery, null, 2));
console.log('Profile data:', JSON.stringify(profileData, null, 2));
```