# Complete Data Source Mapping Reference

## Overview

This document shows exactly which database fields are populated from which data sources (CoreSignal, Perplexity, Lusha).

## Company Fields Mapping

### From CoreSignal API

| Database Field | CoreSignal Field | Priority | Notes |
|----------------|------------------|----------|-------|
| `industry` | `industry` | 1 | Primary industry classification |
| `sector` | `categories_and_keywords[0]` | 1 | Business sector/category |
| `employeeCount` | `employee_count` or `employees_count` | 1 | Current employee count |
| `size` | `size_range` | 1 | e.g., "11-50 employees" |
| `description` | `description_enriched` or `description` | 1 | Company description (enriched preferred) |
| `foundedYear` | `founded` or `founded_year` | 1 | Year company was founded |
| `city` | `hq_city` | 1 | Headquarters city |
| `state` | `hq_state` | 1 | Headquarters state |
| `hqCity` | `hq_city` | 1 | Synced with city |
| `hqState` | `hq_state` | 1 | Synced with state |
| `country` | `hq_country` | 1 | Headquarters country |
| `address` | `hq_address_line_1` | 1 | Street address |
| `hqStreet` | `hq_address_line_1` | 1 | Synced with address |
| `postalCode` | `hq_postcode` | 1 | Postal/ZIP code |
| `hqZipcode` | `hq_postcode` | 1 | Synced with postalCode |
| `hqFullAddress` | `hq_full_address` | 1 | Complete HQ address |
| `hqLocation` | `hq_location` | 1 | HQ location description |
| `hqRegion` | `hq_region[]` | 1 | Regional classification array |
| `phone` | `phone` or `company_phone_numbers[0]` | 1 | Primary phone number |
| `email` | `company_emails[0]` | 3 | Company email (Lusha preferred) |
| `linkedinUrl` | `url` or `linkedin_url` | 1 | LinkedIn company page |
| `linkedinFollowers` | `follower_count` | 1 | LinkedIn follower count |
| `twitterUrl` | `twitter_url[0]` | 1 | Twitter profile URL |
| `facebookUrl` | `facebook_url[0]` | 1 | Facebook page URL |
| `instagramUrl` | `instagram_url[0]` | 1 | Instagram profile URL |
| `youtubeUrl` | `youtube_url[0]` | 1 | YouTube channel URL |
| `githubUrl` | `github_url[0]` | 1 | GitHub organization URL |
| `naicsCodes` | `naics_codes[]` | 1 | NAICS industry codes array |
| `sicCodes` | `sic_codes[]` | 1 | SIC industry codes array |
| `isPublic` | `is_public` | 1 | Boolean: public/private company |
| `technologiesUsed` | `technologies_used[]` | 1 | Array of technologies |
| `numTechnologiesUsed` | `technologies_used.length` | 1 | Count of technologies |
| `activeJobPostings` | `active_job_postings_count` | 1 | Current open positions |
| `employeeCountChange` | `employees_count_change{}` | 1 | JSON with change metrics |
| `jobPostingsChange` | `active_job_postings_count_change{}` | 1 | JSON with job posting changes |
| `executiveArrivals` | `key_executive_arrivals[]` | 1 | Recent executive hires |
| `executiveDepartures` | `key_executive_departures[]` | 1 | Recent executive departures |
| `fundingRounds` | `funding_rounds[]` | 1 | Array of funding rounds |
| `lastFundingAmount` | `funding_rounds[0].amount_raised` | 1 | Most recent funding amount |
| `lastFundingDate` | `funding_rounds[0].announced_date` | 1 | Most recent funding date |

### From Perplexity AI

| Database Field | Perplexity Field | Priority | Notes |
|----------------|------------------|----------|-------|
| `foundedYear` | `foundedYear` | 2 | Used if CoreSignal doesn't have it |
| `revenue` | `revenue` | 2 | Used if CoreSignal doesn't have it |
| `market` | `market` | 1 | Primary market/category |
| `segment` | `segment` | 1 | Business segment |
| `customFields.perplexityData.recentNews` | `recentNews` | 1 | Recent company news summary |
| `customFields.perplexityData.technologies` | `technologies[]` | 2 | Tech stack if CoreSignal doesn't have |

### From Lusha API

| Database Field | Lusha Field | Priority | Notes |
|----------------|-------------|----------|-------|
| `phone` | `phone` | 2 | Used if CoreSignal doesn't have it |
| `email` | `email` | 1 | Primary email address |
| `employeeCount` | `employees` | 3 | Used if CoreSignal doesn't have it |

### Priority System
- **Priority 1**: Primary source, always used if available
- **Priority 2**: Fallback source, used if primary is missing
- **Priority 3**: Tertiary source, used if both primary and fallback missing

## Person Fields Mapping

### From CoreSignal API

| Database Field | CoreSignal Field | Priority | Notes |
|----------------|------------------|----------|-------|
| `fullName` | `full_name` | 1 | Full name |
| `firstName` | Extracted from `full_name` | 1 | First part of name |
| `lastName` | Extracted from `full_name` | 1 | Remaining parts of name |
| `jobTitle` | `experience[active].position_title` | 1 | Current job title |
| `title` | `experience[active].position_title` | 1 | Title field (same as jobTitle) |
| `department` | `experience[active].department` | 1 | Current department |
| `email` | `primary_professional_email` | 1 | Primary professional email |
| `phone` | `phone` | 1 | Primary phone number |
| `linkedinUrl` | `linkedin_url` | 1 | LinkedIn profile URL |
| `location` | `location` or `location_full` | 1 | Full location string |
| `city` | Extracted from `location` | 1 | First part before comma |
| `state` | Extracted from `location` | 1 | Second part (2-letter code or full name) |
| `linkedinConnections` | `connections_count` | 1 | LinkedIn connection count |
| `linkedinFollowers` | `followers_count` | 1 | LinkedIn follower count |
| `profilePictureUrl` | `profile_picture_url` | 1 | Profile picture URL |
| `seniority` | `seniority` or `experience[active].seniority_level` | 1 | Seniority level |
| `totalExperience` | `experience.length` | 1 | Number of previous roles |
| `technicalSkills` | `skills[]` | 1 | Array of skills |
| `degrees` | `education[]` | 1 | JSON array of education |
| `certifications` | `certifications[]` | 1 | Array of certifications |

**CoreSignal Experience Object (active_experience = 1):**
- `position_title` → jobTitle, title
- `department` → department
- `company_name` → company reference
- `company_industry` → used for intelligence
- `seniority_level` → seniority

### From Perplexity AI

| Database Field | Perplexity Field | Priority | Notes |
|----------------|------------------|----------|-------|
| `bio` | `bio` | 1 | Professional bio/summary |
| `department` | `department` | 2 | Used if CoreSignal doesn't have it |
| `customFields.perplexityData.recentNews` | `recentNews` | 1 | Recent professional news |

### From Lusha API

| Database Field | Lusha Field | Priority | Notes |
|----------------|-------------|----------|-------|
| `phone` | `phoneNumbers[0].number` | 2 | Primary phone if CoreSignal missing |
| `phone1` | `phoneNumbers[0].number` | 1 | First phone with type |
| `phone1Type` | `phoneNumbers[0].type` | 1 | Phone type (direct, mobile, work) |
| `phone1Verified` | `phoneNumbers[0].verified` | 1 | Verification status |
| `phone2` | `phoneNumbers[1].number` | 1 | Second phone with type |
| `phone2Type` | `phoneNumbers[1].type` | 1 | Phone type |
| `phone2Verified` | `phoneNumbers[1].verified` | 1 | Verification status |
| `email` | `emailAddresses[0].email` | 2 | Email if CoreSignal missing |

## Intelligence Fields Mapping

### AI-Generated Intelligence
**Source: Anthropic Claude + Person Data**

| Database Field | Intelligence Type | Storage Location | Analysis Factors |
|----------------|-------------------|------------------|------------------|
| `buyerGroupRole` | Buyer Group Role | Direct field | Job title, department, keywords (Chief, VP, Director, Manager) |
| `customFields.influenceLevel` | Influence Level | customFields | Seniority, title level, company size, decision indicators |
| `customFields.decisionPower` | Decision Power | customFields | Role hierarchy, budget authority keywords, company position |
| `customFields.engagementLevel` | Engagement Level | customFields | Recent actions (30 days), completed actions, response patterns |
| `customFields.intelligenceConfidence` | Confidence Score | customFields | AI confidence in assessment (0-100) |
| `customFields.intelligenceReasoning` | Reasoning | customFields | Explanation of intelligence determination |
| `customFields.intelligenceGeneratedAt` | Timestamp | customFields | When intelligence was generated |
| `customFields.intelligenceModel` | Model Used | customFields | "claude-3-5-sonnet-20241022" or "rule-based" |

### Rule-Based Intelligence Logic (Fallback)

**Buyer Group Role:**
- C-level (CEO, CFO, CTO, CMO) → Economic Buyer (90% confidence)
- VP, Vice President → Economic Buyer (85% confidence)
- Director → Technical Buyer (75% confidence)
- Manager, Head of → Champion (70% confidence)
- Engineer, Developer, Analyst → End User (60% confidence)
- Default → Unknown (50% confidence)

**Influence Level:**
- C-level, VP → High
- Director, Manager → Medium
- IC, Analyst → Low

**Decision Power:**
- C-level, VP → High
- Director, Manager → Medium
- IC, Analyst → Low

**Engagement Level:**
- 5+ recent actions → High
- 2-4 recent actions → Medium
- 1 action → Low
- No actions → None

## customFields JSON Structure

### Company customFields
```json
{
  "coresignalId": "12345678",
  "coresignalData": {
    "id": 12345678,
    "company_name": "HCI Energy",
    "industry": "Professional Services",
    "employees_count": 45,
    "size_range": "11-50 employees",
    "founded": "2010",
    "hq_city": "Phoenix",
    "hq_state": "AZ",
    "description_enriched": "Full company description...",
    "technologies_used": ["Salesforce", "AWS", "React"],
    "naics_codes": ["541611"],
    "sic_codes": ["8742"],
    "active_job_postings_count": 5,
    "follower_count": 1234,
    "funding_rounds": [...],
    "key_executive_arrivals": [...],
    "key_executive_departures": [...]
  },
  "perplexityData": {
    "foundedYear": 2010,
    "revenue": 5000000,
    "market": "Energy Management",
    "segment": "B2B SaaS",
    "recentNews": "Recently announced expansion...",
    "technologies": ["Salesforce", "AWS"]
  },
  "lushaData": {
    "phone": "+1-555-0123",
    "email": "contact@hcienergy.com",
    "employees": 45
  },
  "enrichmentSource": "CoreSignal + Perplexity + Lusha",
  "lastEnriched": "2025-11-13T10:30:00.000Z",
  "aiSummaryGeneratedAt": "2025-11-13T10:30:05.000Z",
  "aiSummaryModel": "claude-3-5-sonnet-20241022",
  "aiSummaryDataSources": ["CoreSignal", "Perplexity", "Lusha"]
}
```

### Person customFields
```json
{
  "coresignalId": "87654321",
  "coresignalData": {
    "id": 87654321,
    "full_name": "Aaron Wunderlich",
    "primary_professional_email": "aaron.wunderlich@srpnet.com",
    "phone": "+1-602-359-6347",
    "linkedin_url": "https://linkedin.com/in/aaron-wunderlich",
    "location": "Tempe, AZ",
    "connections_count": 500,
    "followers_count": 150,
    "profile_picture_url": "https://...",
    "experience": [
      {
        "active_experience": 1,
        "position_title": "Director of Energy Services",
        "department": "Operations",
        "company_name": "Salt River Project",
        "seniority_level": "Senior"
      }
    ],
    "skills": ["Energy Management", "Project Management", "Leadership"],
    "education": [
      {
        "school": "Arizona State University",
        "degree": "MBA",
        "field": "Business Administration"
      }
    ]
  },
  "perplexityData": {
    "bio": "Experienced energy professional with 15+ years...",
    "department": "Operations",
    "recentNews": "Recently led strategic initiative..."
  },
  "lushaData": {
    "phoneNumbers": [
      {
        "number": "+1-602-359-6347",
        "type": "direct",
        "verified": true
      },
      {
        "number": "+1-602-555-0199",
        "type": "mobile",
        "verified": true
      }
    ],
    "emailAddresses": [
      {
        "email": "aaron.wunderlich@srpnet.com",
        "type": "work"
      }
    ]
  },
  "enrichmentSource": "CoreSignal + Perplexity + Lusha",
  "lastEnriched": "2025-11-13T10:30:00.000Z",
  "influenceLevel": "High",
  "decisionPower": "High",
  "engagementLevel": "Medium",
  "intelligenceConfidence": 85,
  "intelligenceReasoning": "Director-level role with budget authority and strategic responsibilities",
  "intelligenceGeneratedAt": "2025-11-13T10:30:10.000Z",
  "intelligenceModel": "claude-3-5-sonnet-20241022"
}
```

## Data Merge Strategy

### Priority Order (Highest to Lowest)

1. **Existing Database Data** (if not null/empty)
   - Reason: Preserves manual entries and buyer group enrichment
   - Exception: If data is stale (>90 days) AND new data is better

2. **CoreSignal Data**
   - Reason: Most comprehensive and reliable
   - Coverage: 90% of company fields, 95% of person fields

3. **Perplexity AI Data**
   - Reason: Fills gaps, provides intelligence
   - Coverage: Founded year, revenue, market, segment, bio

4. **Lusha Data**
   - Reason: Contact verification
   - Coverage: Phone numbers, email verification

### Smart Update Algorithm

```typescript
const shouldUpdate = (existingValue, newValue) => {
  // Update if existing is missing
  if (!existingValue || existingValue === '' || existingValue === '-') {
    return !!newValue;
  }
  // Preserve existing data
  return false;
};
```

**Special Cases:**
- **Description**: Updates if new description is >50 chars longer
- **Stale Data**: Re-enriches if lastEnriched >90 days old
- **Arrays**: Updates if existing array is empty
- **Boolean**: Updates if existing is null/undefined

## API Response Examples

### CoreSignal Company Response (Key Fields)
```json
{
  "id": 12345678,
  "company_name": "HCI Energy",
  "website": "https://hcienergy.com",
  "industry": "Professional Services",
  "employees_count": 45,
  "size_range": "11-50 employees",
  "founded": "2010",
  "description_enriched": "HCI Energy provides professional services...",
  "hq_city": "Phoenix",
  "hq_state": "AZ",
  "hq_country": "United States",
  "hq_full_address": "1234 Main St, Phoenix, AZ 85001",
  "hq_postcode": "85001",
  "phone": "+1-602-555-0100",
  "url": "https://linkedin.com/company/hci-energy",
  "follower_count": 1234,
  "twitter_url": ["https://twitter.com/hcienergy"],
  "facebook_url": ["https://facebook.com/hcienergy"],
  "naics_codes": ["541611", "541612"],
  "sic_codes": ["8742"],
  "is_public": false,
  "technologies_used": ["Salesforce", "AWS", "React", "PostgreSQL"],
  "active_job_postings_count": 5,
  "employees_count_change": {
    "current": 45,
    "change_monthly": 3,
    "change_monthly_percentage": 7.1,
    "change_quarterly": 8,
    "change_quarterly_percentage": 21.6,
    "change_yearly": 12,
    "change_yearly_percentage": 36.4
  },
  "key_executive_arrivals": [
    {
      "member_full_name": "Jane Smith",
      "member_position_title": "VP of Operations",
      "arrival_date": "2025-01-15"
    }
  ],
  "funding_rounds": [
    {
      "name": "Series A",
      "announced_date": "2023-06-15",
      "amount_raised": 5000000,
      "amount_raised_currency": "USD"
    }
  ]
}
```

### CoreSignal Person Response (Key Fields)
```json
{
  "id": 87654321,
  "full_name": "Aaron Wunderlich",
  "primary_professional_email": "aaron.wunderlich@srpnet.com",
  "phone": "+1-602-359-6347",
  "linkedin_url": "https://linkedin.com/in/aaron-wunderlich",
  "location": "Tempe, AZ",
  "location_full": "Tempe, Arizona, United States",
  "profile_picture_url": "https://media.licdn.com/...",
  "connections_count": 500,
  "followers_count": 150,
  "seniority": "Senior",
  "experience": [
    {
      "active_experience": 1,
      "position_title": "Director of Energy Services",
      "department": "Operations",
      "company_name": "Salt River Project",
      "company_industry": "Utilities",
      "seniority_level": "Senior",
      "start_date": "2020-03-01"
    },
    {
      "active_experience": 0,
      "position_title": "Senior Manager",
      "company_name": "Arizona Public Service",
      "start_date": "2015-01-01",
      "end_date": "2020-02-28"
    }
  ],
  "skills": ["Energy Management", "Project Management", "Leadership", "Strategic Planning"],
  "education": [
    {
      "school": "Arizona State University",
      "degree": "MBA",
      "field": "Business Administration",
      "graduation_year": 2014
    }
  ],
  "certifications": ["PMP", "Energy Manager Certification"]
}
```

### Perplexity Company Response
```json
{
  "foundedYear": 2010,
  "revenue": 5000000,
  "market": "Energy Management Software",
  "segment": "B2B SaaS",
  "recentNews": "HCI Energy recently announced expansion into renewable energy consulting...",
  "technologies": ["Salesforce", "AWS", "React"]
}
```

### Perplexity Person Response
```json
{
  "bio": "Aaron Wunderlich is an experienced energy professional with over 15 years in the utilities sector...",
  "recentNews": "Recently led strategic initiative for smart grid implementation...",
  "department": "Operations"
}
```

### Lusha Company Response
```json
{
  "company": "HCI Energy",
  "phone": "+1-602-555-0100",
  "email": "contact@hcienergy.com",
  "employees": 45
}
```

### Lusha Person Response
```json
{
  "fullName": "Aaron Wunderlich",
  "phoneNumbers": [
    {
      "number": "+1-602-359-6347",
      "type": "direct",
      "verified": true,
      "country": "US"
    },
    {
      "number": "+1-602-555-0199",
      "type": "mobile",
      "verified": true
    }
  ],
  "emailAddresses": [
    {
      "email": "aaron.wunderlich@srpnet.com",
      "type": "work"
    }
  ],
  "jobTitle": {
    "title": "Director of Energy Services"
  },
  "companyName": "Salt River Project"
}
```

## State Extraction Logic

The system extracts state from location strings using this logic:

```typescript
function extractStateFromLocation(location: string): string | null {
  if (!location) return null;
  
  // Parse: "City, State", "City, State, Country", "State"
  const parts = location.split(',').map(p => p.trim());
  
  // If multiple parts, second part is typically state
  if (parts.length >= 2) {
    const statePart = parts[1];
    // Check if it's a 2-letter code or full state name
    if (statePart.length === 2 || statePart.length > 2) {
      return statePart; // e.g., "AZ" or "Arizona"
    }
  }
  
  // Single part might be just a state
  if (parts.length === 1 && parts[0].length <= 20) {
    return parts[0];
  }
  
  return null;
}
```

**Examples:**
- "Tempe, AZ" → "AZ"
- "Phoenix, Arizona, United States" → "Arizona"
- "New York, NY" → "NY"
- "California" → "California"

## Data Quality Scoring

### Company Quality Score Calculation
```typescript
const totalCriticalFields = 10;
const filledFields = [
  industry, employeeCount, description, revenue, 
  foundedYear, city, phone, email, linkedinUrl, website
].filter(Boolean).length;

dataQualityScore = (filledFields / totalCriticalFields) * 100;
```

**Example:**
- 10/10 fields filled → 100% quality
- 8/10 fields filled → 80% quality
- 5/10 fields filled → 50% quality

### Person Quality Score Calculation
```typescript
const totalCriticalFields = 8;
const filledFields = [
  fullName, jobTitle, email, phone, 
  linkedinUrl, department, location, companyId
].filter(Boolean).length;

dataQualityScore = (filledFields / totalCriticalFields) * 100;
```

### Person Enrichment Score Calculation
```typescript
enrichmentScore = Math.min(100, (fieldsPopulated.length / 15) * 100);
```

**Tracks how much new data was added:**
- 15+ fields added → 100%
- 10 fields added → 67%
- 5 fields added → 33%

## Testing & Verification

### Check Enrichment Status
```sql
-- Check company enrichment
SELECT 
  id, 
  name, 
  "dataQualityScore",
  "dataSources",
  "lastEnriched",
  "customFields"->>'enrichmentSource' as enrichment_source,
  "customFields"->>'coresignalId' as coresignal_id
FROM companies 
WHERE id = 'company-id';

-- Check person enrichment
SELECT 
  id, 
  "fullName",
  "jobTitle",
  "department",
  "state",
  "buyerGroupRole",
  "dataQualityScore",
  "enrichmentScore",
  "customFields"->>'influenceLevel' as influence_level,
  "customFields"->>'intelligenceGeneratedAt' as intelligence_date
FROM people 
WHERE id = 'person-id';
```

### Verify Intelligence Generation
```sql
SELECT 
  id,
  "fullName",
  "buyerGroupRole",
  "customFields"->>'influenceLevel' as influence,
  "customFields"->>'decisionPower' as decision_power,
  "customFields"->>'engagementLevel' as engagement,
  "customFields"->>'intelligenceConfidence' as confidence,
  "customFields"->>'intelligenceReasoning' as reasoning
FROM people 
WHERE "workspaceId" = 'your-workspace-id'
AND "buyerGroupRole" IS NOT NULL;
```

## Benefits

### For Companies:
1. **40+ fields populated** automatically
2. **AI-generated summaries** using all available data
3. **Industry classification** (NAICS, SIC codes)
4. **Technology stack** identification
5. **Executive change tracking**
6. **Funding data** and growth metrics
7. **Social media presence** tracking
8. **Quality score** for data completeness

### For People/Leads:
1. **30+ fields populated** automatically
2. **AI-generated intelligence** (role, influence, decision power)
3. **State extracted** from location data
4. **Professional bio** from Perplexity
5. **Multiple phone numbers** with types
6. **Skills and education** from CoreSignal
7. **LinkedIn metrics** (connections, followers)
8. **Quality and enrichment scores**

### For Sales Teams:
1. **Instant context** when viewing any record
2. **Buyer group roles** identified automatically
3. **Decision makers** highlighted
4. **Engagement levels** calculated
5. **Complete contact information**
6. **Company intelligence** for conversations
7. **Technology stack** for solution alignment
8. **Recent news** for timely outreach

