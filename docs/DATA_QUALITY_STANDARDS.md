# Data Quality Standards

## Overview

This document defines what constitutes high-quality data in the Adrata system and establishes standards for enrichment.

## Quality Principles

### 1. Real Data Over Fake Data
**Never use placeholder, generic, or fabricated data**

❌ **Bad Examples:**
- "Professional services company" (generic)
- "Unknown Title" (placeholder)
- "Stakeholder" (default role without analysis)
- "(555) 555-5555" (fake phone)
- Inferring revenue without source

✅ **Good Examples:**
- Blank field (no data available)
- Real data from CoreSignal
- AI-generated intelligence based on actual job titles
- Verified contact information from Lusha
- null values for unknown fields

### 2. Source Attribution
All enriched data must be traceable:

**Required Tracking:**
- `dataSources[]` - Array of sources used (CoreSignal, Perplexity, Lusha)
- `enrichmentSource` - String describing sources in customFields
- `lastEnriched` - Timestamp of last enrichment
- `dataLastVerified` - Timestamp of data verification

### 3. Smart Updates Only
Never overwrite good existing data:

**Acceptable Updates:**
- Empty fields (null, '', '-')
- Stale data (>90 days old)
- Shorter descriptions replaced by longer ones
- Lower quality data replaced by verified data

**Never Overwrite:**
- Manual user entries
- Buyer group enrichment data
- Recent enrichment (<90 days)
- Imported data from trusted sources

## Company Data Quality

### Critical Fields (Required for 80% Score)

1. **Industry** - Must be specific, not generic
   - ✅ Good: "Energy Management Software"
   - ❌ Bad: "Technology", "Services", "Other"

2. **Employee Count** - Must be numeric
   - ✅ Good: 45, 1200, 50000
   - ❌ Bad: "Small", "11-50", null

3. **Description** - Must be substantive (>100 characters)
   - ✅ Good: Company-specific description from CoreSignal or AI
   - ❌ Bad: Generic "Professional services company", <50 chars

4. **Revenue** - Real data or leave blank
   - ✅ Good: Actual revenue from CoreSignal/Perplexity
   - ❌ Bad: Estimates without source

5. **Founded Year** - Must be realistic (1800-2025)
   - ✅ Good: 2010, 1995, 2023
   - ❌ Bad: 1900, 2030, 0

6. **Location** - City or HQ City required
   - ✅ Good: "Phoenix", "New York", "San Francisco"
   - ❌ Bad: "USA", "North America", null

7. **Phone** - Verified format
   - ✅ Good: "+1-602-555-0100", "(602) 555-0100"
   - ❌ Bad: "555-5555", "Call for info"

8. **Email** - Valid business email
   - ✅ Good: "contact@company.com", "info@company.com"
   - ❌ Bad: "email@example.com", personal emails

9. **LinkedIn URL** - Must be valid LinkedIn company page
   - ✅ Good: "https://linkedin.com/company/hci-energy"
   - ❌ Bad: Personal profiles, invalid URLs

10. **Website** - Must be valid, accessible URL
    - ✅ Good: "https://company.com", "https://www.company.com"
    - ❌ Bad: "http://localhost", "N/A", "TBD"

### Enhanced Fields (Bonus, for 100% Score)

11. Technologies Used - Array of specific technologies
12. NAICS/SIC Codes - Industry classification codes
13. Social Media URLs - Twitter, Facebook, Instagram, GitHub
14. Active Job Postings - Current open positions
15. Executive Changes - Recent hires/departures
16. Funding Data - Rounds, amounts, dates
17. Market/Segment - Specific market classification
18. Public/Private Status - Boolean flag

## Person Data Quality

### Critical Fields (Required for 80% Score)

1. **Full Name** - Complete, properly formatted
   - ✅ Good: "Aaron Wunderlich", "Jane Smith"
   - ❌ Bad: "Unknown", "User", single names

2. **Job Title** - Current, specific role
   - ✅ Good: "Director of Energy Services", "VP of Operations"
   - ❌ Bad: "Employee", "Manager", "Unknown Title"

3. **Email** - Verified business email
   - ✅ Good: "aaron.wunderlich@srpnet.com"
   - ❌ Bad: "user@example.com", personal Gmail

4. **Phone** - Verified phone number
   - ✅ Good: "+1-602-359-6347", "(602) 359-6347"
   - ❌ Bad: "555-1234", "N/A"

5. **LinkedIn URL** - Valid profile URL
   - ✅ Good: "https://linkedin.com/in/aaron-wunderlich"
   - ❌ Bad: Company pages, invalid URLs

6. **Department** - Specific department/function
   - ✅ Good: "Operations", "Engineering", "Sales"
   - ❌ Bad: "General", "Other", null

7. **Location/State** - At minimum state
   - ✅ Good: "AZ", "Arizona", "Tempe, AZ"
   - ❌ Bad: "USA", "Unknown", null

8. **Company ID** - Must link to valid company
   - ✅ Good: Valid ULID linking to companies table
   - ❌ Bad: null, invalid ID

### Enhanced Fields (Bonus, for 100% Score)

9. Bio - Professional summary
10. Seniority - Level in organization
11. LinkedIn Metrics - Connections, followers
12. Skills - Technical skills array
13. Education - Degrees and certifications
14. Multiple Phones - Direct dial, mobile, work

## Intelligence Quality

### Required Intelligence Fields

1. **Buyer Group Role**
   - Must be one of: Economic Buyer, Technical Buyer, Champion, Influencer, End User, Blocker
   - Based on actual job title analysis
   - ✅ Good: "Economic Buyer" (for VP/C-level)
   - ❌ Bad: "Unknown", "Stakeholder" (generic)

2. **Influence Level**
   - Must be: High, Medium, or Low
   - Based on seniority and role
   - ✅ Good: Analysis-based determination
   - ❌ Bad: Random assignment, always "Medium"

3. **Decision Power**
   - Must be: High, Medium, or Low
   - Based on role hierarchy and budget authority
   - ✅ Good: "High" for VP with budget keywords
   - ❌ Bad: Default values without analysis

4. **Engagement Level**
   - Must be: High, Medium, Low, or None
   - Based on actual action history
   - ✅ Good: "High" for 5+ recent actions
   - ❌ Bad: Assigned without checking actions

### Intelligence Confidence

**Required: 60% minimum confidence**

- AI-generated: Typically 70-95% confidence
- Rule-based: 50-90% based on title keywords
- Below 60%: Mark as "Unknown" instead

**Reasoning Required:**
Every intelligence determination must include reasoning:
- ✅ Good: "VP title with budget authority indicators"
- ❌ Bad: No reasoning provided

## Data Quality Scores

### Company Quality Score
**Calculation:** (Filled Critical Fields / 10) × 100

**Grade Scale:**
- **A+ (95-100%)**: Exceptional - All fields populated
- **A (90-94%)**: Excellent - 9/10 fields
- **B (80-89%)**: Good - 8/10 fields  
- **C (70-79%)**: Fair - 7/10 fields (needs improvement)
- **D (60-69%)**: Poor - 6/10 fields (priority enrichment)
- **F (<60%)**: Critical - <6/10 fields (immediate action)

**Target:** 90%+ average across workspace

### Person Quality Score
**Calculation:** (Filled Critical Fields / 8) × 100

**Grade Scale:**
- **A+ (95-100%)**: Exceptional - All fields populated
- **A (87-94%)**: Excellent - 7/8 fields
- **B (75-86%)**: Good - 6/8 fields
- **C (62-74%)**: Fair - 5/8 fields (needs improvement)
- **D (50-61%)**: Poor - 4/8 fields (priority enrichment)
- **F (<50%)**: Critical - <4/8 fields (immediate action)

**Target:** 85%+ average across workspace

### Enrichment Score (People Only)
**Calculation:** min(100, (Fields Enriched / 15) × 100)

Tracks how much new data was added:
- **Excellent:** 80-100% (12+ fields added)
- **Good:** 60-79% (9-11 fields)
- **Fair:** 40-59% (6-8 fields)
- **Poor:** <40% (<6 fields)

## Enrichment Requirements

### When to Enrich

**Companies:**
Enrich if ANY of these are true:
- Data quality score <80%
- Missing industry OR employeeCount
- No description OR descriptionEnriched
- Last enriched >90 days ago
- Has website/LinkedIn but never enriched

**People:**
Enrich if ANY of these are true:
- Data quality score <75%
- Missing jobTitle OR department
- No state OR bio
- No intelligence fields
- Last enriched >90 days ago
- Has email/LinkedIn but never enriched

### When NOT to Enrich

**Skip if:**
- Recently enriched (<30 days)
- All critical fields already populated
- No identifiers (no website/LinkedIn for companies, no email/LinkedIn for people)
- Data quality score already 90%+

**Preserve if:**
- Manually entered data
- Buyer group enrichment data
- User-verified information
- Recently updated (<7 days)

## Data Freshness

### Enrichment Refresh Schedule

| Record Type | Refresh Frequency | Reason |
|-------------|-------------------|--------|
| High-priority accounts | Monthly | Keep current for active deals |
| Active prospects | Quarterly | Track job changes, company updates |
| Leads | Semi-annually | Basic data changes slowly |
| Inactive records | Annually | Minimal changes expected |

### Staleness Indicators
- **Fresh:** <30 days since last enrichment
- **Current:** 30-90 days
- **Stale:** 90-180 days (consider re-enriching)
- **Very Stale:** >180 days (priority for refresh)

## Quality Assurance

### Pre-Enrichment Checks
Before enriching, verify:
1. Record has valid identifier (website, LinkedIn, email)
2. Identifier is not placeholder ("example.com", "N/A")
3. Record belongs to correct workspace
4. No recent enrichment (<30 days) unless forcing

### Post-Enrichment Validation
After enriching, verify:
1. Data quality score improved
2. At least 3 fields populated
3. No placeholder data introduced
4. Sources tracked in customFields
5. Timestamps updated correctly

### Failed Enrichment Handling
If enrichment fails:
1. Log detailed error for debugging
2. Don't modify existing data
3. Mark as failed in customFields
4. Don't retry immediately (avoid API waste)
5. Review manually if repeated failures

## Acceptable Fallbacks

### Rule-Based Intelligence (Acceptable)
When Anthropic API unavailable, rule-based intelligence is acceptable because it uses real data:

✅ **Acceptable Logic:**
```javascript
// Analyzes actual job title
if (title.includes('Chief') || title.includes('VP')) {
  role = 'Economic Buyer';  // Based on real title
  confidence = 85;           // Explicit confidence
}
```

❌ **Not Acceptable:**
```javascript
// Random assignment
role = 'Stakeholder';  // Generic default
confidence = 100;      // False confidence
```

### Extracted Data (Acceptable)
Extracting from existing fields is acceptable:

✅ **Acceptable:**
- State from "Tempe, AZ" → "AZ"
- City from "Phoenix, AZ" → "Phoenix"
- Domain from "https://company.com" → "company.com"

❌ **Not Acceptable:**
- Generating fake addresses
- Creating placeholder emails
- Inventing phone numbers

## Monitoring & Reporting

### Key Metrics to Track

1. **Overall Data Quality** - Average across all records
   - Target: 85%+ across workspace
   - Alert if: <70%

2. **Field Coverage** - Percentage of records with each field
   - Target: 80%+ for critical fields
   - Alert if: <60%

3. **Enrichment Success Rate** - Successful enrichments / attempts
   - Target: 95%+
   - Alert if: <85%

4. **Intelligence Coverage** - People with complete intelligence
   - Target: 90%+
   - Alert if: <75%

5. **Data Freshness** - Recently enriched records (<30 days)
   - Target: 40%+ of records
   - Alert if: <20%

### Regular Audits

**Weekly:** Quick check of recent enrichments
```bash
node scripts/audit-data-quality.js --workspace=top-temp
```

**Monthly:** Full quality assessment and re-enrichment plan

**Quarterly:** Complete data refresh for high-priority workspaces

## Data Standards by Field

### Company Fields

| Field | Standard | Validation | Source Priority |
|-------|----------|------------|-----------------|
| `industry` | Specific, not generic | >3 chars, not "Other" | CoreSignal > Manual |
| `employeeCount` | Numeric, realistic | 1-1,000,000 | CoreSignal > Lusha |
| `description` | Substantive | >100 chars | CoreSignal > AI |
| `revenue` | Real data or null | >0 or null | CoreSignal > Perplexity |
| `foundedYear` | Realistic year | 1800-2025 | CoreSignal > Perplexity |
| `city` | Valid city name | >2 chars | CoreSignal > Extracted |
| `state` | 2-letter or full name | 2-20 chars | CoreSignal > Extracted |
| `phone` | Valid format | E.164 format | CoreSignal > Lusha |
| `email` | Valid business email | email@domain | Lusha > CoreSignal |
| `website` | Valid, accessible URL | https://... | Manual > CoreSignal |

### Person Fields

| Field | Standard | Validation | Source Priority |
|-------|----------|------------|-----------------|
| `fullName` | Complete name | >3 chars, has space | CoreSignal > Manual |
| `jobTitle` | Specific, current role | >5 chars | CoreSignal > Manual |
| `email` | Verified business email | @company domain | CoreSignal > Lusha |
| `phone` | Verified number | Valid format | CoreSignal > Lusha |
| `linkedinUrl` | Valid profile URL | /in/ path | CoreSignal > Manual |
| `department` | Specific function | Not "General" | CoreSignal > Perplexity |
| `state` | Extracted accurately | 2-letter or full | Extracted > CoreSignal |
| `bio` | Professional summary | >50 chars | Perplexity > CoreSignal |

### Intelligence Fields

| Field | Standard | Validation | Method |
|-------|----------|------------|--------|
| `buyerGroupRole` | One of 6 defined roles | Valid enum value | AI > Rule-based |
| `influenceLevel` | High/Medium/Low | Valid enum | AI > Rule-based |
| `decisionPower` | High/Medium/Low | Valid enum | AI > Rule-based |
| `engagementLevel` | High/Medium/Low/None | Based on actions | AI > Rule-based |
| `confidence` | 60-100% | Numeric 0-100 | Required |
| `reasoning` | Explanation required | >20 chars | Required |

## Enrichment Data Sources

### CoreSignal (Primary)
**Reliability: 95%**
- Most comprehensive
- Professional network data
- Updated regularly
- High accuracy

**Use for:** Industry, employee count, job titles, contact info, company structure

### Perplexity AI (Gap Filling)
**Reliability: 80%**
- Real-time search
- Current information
- Good for news and intelligence
- May hallucinate without sources

**Use for:** Founded year, revenue, market/segment, recent news, bio

**⚠️ Warning:** Always verify Perplexity data has sources. Discard if uncertain.

### Lusha (Verification)
**Reliability: 85%**
- Contact verification
- Phone number quality
- Email validation
- Limited to contact info

**Use for:** Phone verification, email verification, contact enrichment

## Quality Gates

### Pre-Production Checklist

Before enriching production data:
- [ ] All API keys configured and tested
- [ ] Dry-run completed successfully
- [ ] Sample records manually verified
- [ ] Rate limiting tested
- [ ] Error handling verified
- [ ] Backup of database available

### Post-Enrichment Validation

After batch enrichment:
- [ ] Data quality score improved by at least 10%
- [ ] No existing data was overwritten
- [ ] At least 80% success rate
- [ ] Critical fields populated for 90%+ of records
- [ ] UI displays enriched data correctly
- [ ] No placeholder/generic data introduced

## Unacceptable Data

### Never Store These

❌ **Placeholder Data:**
- "TBD", "N/A", "Unknown", "Pending"
- "To be determined"
- "Contact for information"

❌ **Generic Data:**
- "Technology Company"
- "Professional Services"
- "Business Professional"
- "Stakeholder"

❌ **Fake Data:**
- (555) 555-5555
- test@example.com
- 123 Main Street
- Made-up company names

❌ **Unrealistic Data:**
- Founded year: 1900 (unless verified)
- Employee count: 0 or negative
- Revenue: 0 (use null instead)
- Future dates for founded year

### When Data is Unavailable

**Correct approach:**
- Leave field as `null`
- Don't populate with placeholder
- Don't invent data
- Mark as needs manual review if critical

## Data Quality Score Interpretation

### Company Scores

**95-100% (Exceptional)**
- All 10 critical fields populated
- Enhanced fields included (technologies, social media, funding)
- Recent enrichment (<30 days)
- Multiple data sources
- **Action:** Maintain, refresh quarterly

**90-94% (Excellent)**
- 9/10 critical fields
- Good coverage of enhanced fields
- **Action:** Fill remaining gaps, refresh quarterly

**80-89% (Good)**
- 8/10 critical fields
- Acceptable for most purposes
- **Action:** Enrich missing fields, monitor

**70-79% (Fair)**
- 7/10 critical fields
- Insufficient for high-value activities
- **Action:** Priority enrichment needed

**<70% (Poor/Critical)**
- <7/10 critical fields
- Inadequate for sales engagement
- **Action:** Immediate enrichment required

### Person Scores

**95-100% (Exceptional)**
- All 8 critical fields populated
- Full intelligence generated
- Enhanced fields included
- **Action:** Maintain, refresh quarterly

**87-94% (Excellent)**
- 7/8 critical fields
- Intelligence present
- **Action:** Fill remaining gaps

**75-86% (Good)**
- 6/8 critical fields
- Acceptable for outreach
- **Action:** Enrich missing fields

**62-74% (Fair)**
- 5/8 critical fields
- Insufficient for targeted outreach
- **Action:** Priority enrichment

**<62% (Poor/Critical)**
- <5/8 critical fields
- Cannot effectively engage
- **Action:** Immediate enrichment required

## Best Practices

### 1. Enrich Progressively
Start with highest-priority records:
1. Active deals and opportunities
2. High-value prospects
3. Recent leads
4. Older records

### 2. Verify Before Scaling
- Test with 10 records
- Manually verify 5 results
- Check data quality scores
- Then scale to full workspace

### 3. Monitor Quality Trends
Track metrics over time:
- Quality scores trending up
- Enrichment success rate staying high
- Field coverage improving
- Failed enrichments decreasing

### 4. Regular Maintenance
- Weekly: Check recent enrichments
- Monthly: Re-enrich high-priority records
- Quarterly: Full workspace refresh
- Annually: Complete data audit

### 5. Human Review for Edge Cases
Some records may need manual review:
- Enrichment consistently fails
- Data quality remains <50%
- Conflicting data from sources
- High-value accounts

## Compliance & Privacy

### Data Retention
- Retain enrichment data for business purposes
- Track data sources for compliance
- Allow data deletion on request
- Follow GDPR/privacy regulations

### Data Usage
- Only use for intended business purposes
- Don't sell or share enrichment data
- Respect data subject rights
- Maintain audit trails

## Summary

**Golden Rule:** 
> Prefer blank fields over inaccurate data. Real, verified data only.

**Quality Target:**
> 90% average quality score with 95%+ enrichment success rate.

**Source Priority:**
> CoreSignal (verified) > Perplexity (intelligence) > Lusha (verification) > Rule-based (logic)

**Never:**
> Generic placeholders, fake data, unverified claims, hallucinated information.

