# TOP Workspace Enrichment Field Mapping Documentation

## Overview
This document provides comprehensive field mappings from enrichment sources (Coresignal, Lusha, AI) to the streamlined database schema for both companies and people records.

## Enrichment Sources Summary

### Coresignal
- **Company Enrichment**: Requires company name + website/domain
- **Person Enrichment**: Requires email (preferred) OR LinkedIn URL
- **Coverage**: 450 companies (87.5%), 2521 people (99.6%) ready for enrichment

### Lusha
- **Person Enrichment Only**: Requires firstName + lastName + (companyName OR companyDomain OR linkedinUrl)
- **Coverage**: 2392 people (94.5%) ready for enrichment

### AI-Generated Intelligence
- **Company Intelligence**: Uses company data + workspace context
- **Person Intelligence**: Uses role + company + workspace context
- **Coverage**: 100% of companies and people (uses existing data)

---

## Company Enrichment Field Mappings

### Coresignal → Companies Model

| Database Field | Coresignal Field | Type | Description |
|---|---|---|---|
| **Core Information** |
| `description` | `description_enriched` | String | Enhanced company description |
| `website` | `website` | String | Company website URL |
| `size` | `size_range` | String | Employee size range (e.g., "11-50 employees") |
| `employeeCount` | `employees_count` | Int | Exact employee count |
| `foundedYear` | `founded_year` | Int | Year company was founded |
| **Financial Data** |
| `revenue` | `revenue_annual.source_5_annual_revenue.annual_revenue` | Decimal | Annual revenue |
| `currency` | `revenue_annual.source_5_annual_revenue.annual_revenue_currency` | String | Revenue currency (default: USD) |
| `stockSymbol` | `stock_ticker` | String | Stock ticker symbol |
| `isPublic` | `ownership_status` | Boolean | Public vs private company |
| **Location Data** |
| `hqLocation` | `hq_location` | String | Headquarters location |
| `hqFullAddress` | `hq_full_address` | String | Complete headquarters address |
| `hqCity` | `hq_city` | String | Headquarters city |
| `hqState` | `hq_state` | String | Headquarters state |
| `hqStreet` | `hq_street` | String | Headquarters street address |
| `hqZipcode` | `hq_zipcode` | String | Headquarters ZIP code |
| `hqRegion` | `hq_region` | String[] | Headquarters region(s) |
| `hqCountryIso2` | `hq_country_iso2` | String | Country ISO2 code |
| `hqCountryIso3` | `hq_country_iso3` | String | Country ISO3 code |
| **Social Media & Online Presence** |
| `linkedinUrl` | `linkedin_url` | String | LinkedIn company page URL |
| `linkedinFollowers` | `followers_count_linkedin` | Int | LinkedIn follower count |
| `facebookUrl` | `facebook_url[0]` | String | Facebook page URL |
| `twitterUrl` | `twitter_url[0]` | String | Twitter profile URL |
| `instagramUrl` | `instagram_url[0]` | String | Instagram profile URL |
| `youtubeUrl` | `youtube_url[0]` | String | YouTube channel URL |
| `githubUrl` | `github_url` | String | GitHub organization URL |
| **Business Classification** |
| `industry` | `industry` | String | Primary industry |
| `sector` | `categories_and_keywords[0]` | String | Primary sector/category |
| `naicsCodes` | `naics_codes` | String[] | NAICS industry codes |
| `sicCodes` | `sic_codes` | String[] | SIC industry codes |
| `tags` | `categories_and_keywords` | String[] | Business categories and keywords |
| **Technology & Activity** |
| `technologiesUsed` | `technologies_used` | String[] | Technologies used by company |
| `numTechnologiesUsed` | `num_technologies_used` | Int | Count of technologies used |
| `activeJobPostings` | `active_job_postings_count` | Int | Number of active job postings |
| `companyUpdates` | `company_updates` | Json | Recent company updates/activities |
| **Contact Information** |
| `phone` | `company_phone_numbers[0]` | String | Primary company phone |
| `email` | `company_emails[0]` | String | Primary company email |

### AI-Generated → Companies Model

| Database Field | AI Source | Type | Description |
|---|---|---|---|
| **Business Intelligence** |
| `companyIntelligence` | AI Analysis | Json | Comprehensive company intelligence data |
| `businessChallenges` | AI Analysis | String[] | Key business challenges |
| `businessPriorities` | AI Analysis | String[] | Strategic business priorities |
| `competitiveAdvantages` | AI Analysis | String[] | Competitive advantages |
| `growthOpportunities` | AI Analysis | String[] | Growth opportunities |
| `strategicInitiatives` | AI Analysis | String[] | Strategic initiatives |
| `successMetrics` | AI Analysis | String[] | Key success metrics |
| `marketThreats` | AI Analysis | String[] | Market threats and risks |
| `keyInfluencers` | AI Analysis | String | Key influencers and decision makers |
| `decisionTimeline` | AI Analysis | String | Decision-making timeline |
| `marketPosition` | AI Analysis | String | Market position and standing |
| `digitalMaturity` | AI Analysis | Int | Digital maturity score (0-100) |
| `techStack` | AI Analysis | String[] | Technology stack analysis |
| `competitors` | AI Analysis | String[] | Key competitors |

---

## People Enrichment Field Mappings

### Coresignal → People Model

| Database Field | Coresignal Field | Type | Description |
|---|---|---|---|
| **Contact Information** |
| `workEmail` | `work_email` | String | Work email address |
| `phone` | `phone_numbers[0]` | String | Primary phone number |
| `mobilePhone` | `mobile_phone` | String | Mobile phone number |
| `linkedinUrl` | `linkedin_url` | String | LinkedIn profile URL |
| **Career Data** |
| `currentRole` | `current_job_title` | String | Current job title |
| `currentCompany` | `current_company_name` | String | Current company name |
| `yearsInRole` | `years_in_current_role` | Int | Years in current role |
| `yearsAtCompany` | `years_at_current_company` | Int | Years at current company |
| `totalExperience` | `total_years_experience` | Int | Total years of experience |
| `industryExperience` | `industry_experience` | String | Industry-specific experience |
| `leadershipExperience` | `leadership_experience` | String | Leadership experience level |
| `budgetResponsibility` | `budget_responsibility` | String | Budget responsibility level |
| `teamSize` | `team_size` | String | Team size managed |
| **Skills & Expertise** |
| `technicalSkills` | `technical_skills` | String[] | Technical skills |
| `softSkills` | `soft_skills` | String[] | Soft skills |
| `industrySkills` | `industry_skills` | String[] | Industry-specific skills |
| `languages` | `languages` | String[] | Languages spoken |
| **Education** |
| `degrees` | `education` | Json | Education records (array) |
| `institutions` | `education[].institution` | String[] | Educational institutions |
| `fieldsOfStudy` | `education[].field_of_study` | String[] | Fields of study |
| `graduationYears` | `education[].graduation_year` | Int[] | Graduation years |
| **Professional Experience** |
| `previousRoles` | `work_experience` | Json | Previous role records (array) |
| `careerTimeline` | `career_timeline` | Json | Chronological career data |
| `roleHistory` | `role_history` | Json | Detailed role information |
| `certifications` | `certifications` | String[] | Professional certifications |
| `achievements` | `achievements` | String[] | Professional achievements |
| `publications` | `publications` | String[] | Publications and articles |
| `speakingEngagements` | `speaking_engagements` | String[] | Speaking engagements |

### Lusha → People Model

| Database Field | Lusha Field | Type | Description |
|---|---|---|---|
| **Contact Verification** |
| `email` | `email` | String | Primary email address |
| `workEmail` | `work_email` | String | Work email address |
| `personalEmail` | `personal_email` | String | Personal email address |
| `phone` | `phone_numbers[0].number` | String | Primary phone number |
| `mobilePhone` | `mobile_phone` | String | Mobile phone number |
| `workPhone` | `work_phone` | String | Work phone number |
| **Professional Information** |
| `jobTitle` | `job_title` | String | Current job title |
| `department` | `department` | String | Department |
| `seniority` | `seniority_level` | String | Seniority level |
| **Verification Data** |
| `emailConfidence` | `email_confidence` | Float | Email confidence score (0-100) |
| `phoneConfidence` | `phone_confidence` | Float | Phone confidence score (0-100) |
| `mobileVerified` | `mobile_verified` | Boolean | Mobile phone verification status |

### AI-Generated → People Model

| Database Field | AI Source | Type | Description |
|---|---|---|---|
| **Buyer Group Intelligence** |
| `buyerGroupRole` | AI Analysis | String | Role in buyer group (decision, champion, stakeholder, etc.) |
| `decisionPower` | AI Analysis | Int | Decision-making power score (0-100) |
| `influenceLevel` | AI Analysis | String | Influence level (high, medium, low) |
| `influenceScore` | AI Analysis | Float | Influence score (0-100) |
| `engagementLevel` | AI Analysis | String | Engagement level |
| `buyerGroupStatus` | AI Analysis | String | Status in buyer group |
| `isBuyerGroupMember` | AI Analysis | Boolean | Is member of buyer group |
| `buyerGroupOptimized` | AI Analysis | Boolean | Buyer group optimization status |
| `decisionMaking` | AI Analysis | String | Decision-making style |
| `communicationStyle` | AI Analysis | String | Communication style |
| `engagementStrategy` | AI Analysis | String | Recommended engagement strategy |
| **Enrichment Tracking** |
| `enrichmentScore` | Calculated | Float | Overall enrichment completeness score |
| `enrichmentSources` | Calculated | String[] | Sources used for enrichment |
| `lastEnriched` | Calculated | DateTime | Last enrichment timestamp |
| `enrichmentVersion` | Calculated | String | Enrichment version/process |
| `coresignalData` | Coresignal | Json | Raw Coresignal data |
| `enrichedData` | Combined | Json | Combined enrichment data |

---

## Field Coverage Analysis

### Companies Model (47 enrichment fields)

#### ✅ Enrichable via Coresignal API (32 fields)
- Core: description, website, size, employeeCount, foundedYear
- Financial: revenue, currency, stockSymbol, isPublic
- Location: hqLocation, hqFullAddress, hqCity, hqState, hqStreet, hqZipcode, hqRegion, hqCountryIso2, hqCountryIso3
- Social: linkedinUrl, linkedinFollowers, facebookUrl, twitterUrl, instagramUrl, youtubeUrl, githubUrl
- Business: industry, sector, naicsCodes, sicCodes, tags
- Technology: technologiesUsed, numTechnologiesUsed, activeJobPostings, companyUpdates
- Contact: phone, email

#### ✅ Enrichable via AI (15 fields)
- Intelligence: companyIntelligence, businessChallenges, businessPriorities, competitiveAdvantages
- Strategy: growthOpportunities, strategicInitiatives, successMetrics, marketThreats
- Analysis: keyInfluencers, decisionTimeline, marketPosition, digitalMaturity, techStack, competitors

#### ❌ Not Enrichable (0 fields)
- All company fields can be enriched via Coresignal or AI

### People Model (45 enrichment fields)

#### ✅ Enrichable via Coresignal API (25 fields)
- Contact: workEmail, phone, mobilePhone, linkedinUrl
- Career: currentRole, currentCompany, yearsInRole, yearsAtCompany, totalExperience, industryExperience, leadershipExperience, budgetResponsibility, teamSize
- Skills: technicalSkills, softSkills, industrySkills, languages
- Education: degrees, institutions, fieldsOfStudy, graduationYears
- Experience: previousRoles, careerTimeline, roleHistory
- Professional: certifications, achievements, publications, speakingEngagements

#### ✅ Enrichable via Lusha API (9 fields)
- Contact: email, workEmail, personalEmail, phone, mobilePhone, workPhone
- Professional: jobTitle, department, seniority
- Verification: emailConfidence, phoneConfidence, mobileVerified

#### ✅ Enrichable via AI (11 fields)
- Buyer Group: buyerGroupRole, decisionPower, influenceLevel, influenceScore, engagementLevel, buyerGroupStatus, isBuyerGroupMember, buyerGroupOptimized, decisionMaking, communicationStyle, engagementStrategy

#### ❌ Not Enrichable (0 fields)
- All people fields can be enriched via Coresignal, Lusha, or AI

---

## Enrichment Success Criteria

### Companies (450 enrichable)
- **Target**: 100% of companies with website/domain enriched
- **Coresignal Coverage**: 32 fields per company
- **AI Coverage**: 15 fields per company
- **Total Fields**: 47 fields per company

### People (2524 enrichable)
- **Target**: 90%+ Coresignal enrichment, 80%+ Lusha enrichment
- **Coresignal Coverage**: 25 fields per person
- **Lusha Coverage**: 9 fields per person
- **AI Coverage**: 11 fields per person
- **Total Fields**: 45 fields per person

### Overall Enrichment Potential
- **Companies**: 450 × 47 = 21,150 field enrichments
- **People**: 2524 × 45 = 113,580 field enrichments
- **Total**: 134,730 field enrichments possible

---

## Implementation Notes

1. **Rate Limiting**: Coresignal and Lusha have API rate limits that must be respected
2. **Data Quality**: Validate match quality before updating records
3. **Error Handling**: Implement retry logic for failed enrichments
4. **Progress Tracking**: Log enrichment progress and results
5. **Data Validation**: Verify enriched data accuracy and completeness
6. **Workspace Context**: Use TOP Engineering Plus business context for AI-generated intelligence

This mapping ensures comprehensive enrichment coverage for all available data in the TOP workspace.
