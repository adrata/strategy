# Database Schema Audit Report

**Date:** January 2025  
**Audit Scope:** Database Schema vs External API Data Alignment  
**Status:** Complete

## Executive Summary

This report analyzes the database schema alignment with external API data sources to identify missing fields, data type mismatches, and optimization opportunities for intelligence data storage.

## Current Database Schema Analysis

### People Table Intelligence Fields

**✅ Existing Intelligence Fields**:

```sql
-- Buyer Group Intelligence
buyerGroupOptimized    Boolean?            @default(false)
buyerGroupRole         String?             @db.VarChar(50)
buyerGroupStatus       String?             @db.VarChar(50)

-- CoreSignal Data
coresignalData         Json?

-- Enrichment Data
enrichedData           Json?
enrichmentScore        Float?              @default(0)
enrichmentSources      String[]            @default([])
enrichmentVersion      String?             @db.VarChar(20)
lastEnriched           DateTime?

-- Influence & Decision Making
decisionPower          Int?                @default(0)
decisionPowerScore     Int?                @default(0)
influenceLevel         String?             @db.VarChar(50)
influenceScore         Float?              @default(0)

-- Contact Confidence
emailConfidence        Float?              @default(0)
phoneVerified          Boolean?            @default(false)
emailVerified          Boolean?            @default(false)

-- Career & Professional Data
careerTimeline         Json?
currentCompany         String?             @db.VarChar(200)
currentRole            String?             @db.VarChar(200)
degrees                Json?
institutions           String[]            @default([])
fieldsOfStudy          String[]            @default([])
graduationYears        Int[]               @default([])
certifications         String[]            @default([])
languages              String[]            @default([])
technicalSkills        String[]            @default([])
softSkills             String[]            @default([])
industrySkills         String[]            @default([])

-- Data Quality
dataCompleteness       Float?              @default(0)
```

### Companies Table Intelligence Fields

**✅ Existing Intelligence Fields**:

```sql
-- Basic Company Data
name                   String              @db.VarChar(255)
website                String?             @db.VarChar(500)
description            String?
industry               String?             @db.VarChar(100)
size                   String?             @db.VarChar(100)
employeeCount          Int?
revenue                Decimal?            @db.Decimal(15, 2)
foundedYear            Int?

-- Custom Fields (stores CoreSignal data)
customFields           Json?
```

## External API Data Mapping Analysis

### 1. CoreSignal Company Data

**✅ Covered Fields**:
- `company_name` → `companies.name`
- `industry` → `companies.industry`
- `employees_count` → `companies.employeeCount`
- `revenue_annual_range` → `companies.revenue`
- `founded_year` → `companies.foundedYear`
- `hq_country` → `companies.country`
- `hq_region` → `companies.state`

**❌ Missing Fields**:
```sql
-- CoreSignal specific fields not stored
naics_codes            String[]            -- Industry classification codes
sic_codes              String[]            -- Standard industry codes
size_range             String              -- Size category (e.g., "100-500")
hq_region              String[]            -- Multiple regions
employees_count_change Json                -- Growth metrics
key_executive_departures Json             -- Leadership changes
key_executive_arrivals Json               -- New hires
active_job_postings_count Int             -- Hiring activity
funding_rounds         Json                -- Funding history
acquisition_list       Json                -- M&A activity
employee_reviews_score Json                -- Company reviews
product_reviews_score  Json                -- Product reviews
```

### 2. CoreSignal Person Data

**✅ Covered Fields**:
- `full_name` → `people.fullName`
- `first_name` → `people.firstName`
- `last_name` → `people.lastName`
- `headline` → `people.jobTitle`
- `linkedin_url` → `people.linkedinUrl`
- `location_country` → `people.country`
- `location_full` → `people.address`
- `primary_professional_email` → `people.workEmail`
- `is_decision_maker` → `people.decisionPower`
- `active_experience_title` → `people.currentRole`
- `active_experience_company_id` → `people.companyId`

**❌ Missing Fields**:
```sql
-- CoreSignal specific fields not stored
public_profile_id      String              -- LinkedIn profile ID
linkedin_shorthand_names String[]          -- Alternative names
historical_ids         String[]            -- Previous profile IDs
experience_change_last_identified_at DateTime -- Last change detection
inferred_skills        String[]            -- AI-inferred skills
historical_skills      String[]            -- Skills over time
connections_count      Int                 -- LinkedIn connections
followers_count        Int                 -- LinkedIn followers
services               String[]            -- Services offered
professional_emails_collection Json        -- Multiple emails
total_experience_duration_months Int       -- Total experience
experience             Json                -- Full work history
projected_base_salary_* Json              -- Salary projections
projected_additional_salary_* Json        -- Additional compensation
projected_total_salary_* Json             -- Total compensation
education              Json                -- Full education history
recommendations        Json                -- LinkedIn recommendations
activity               Json                -- LinkedIn activity
```

### 3. Lusha Enrichment Data

**✅ Covered Fields**:
- `firstName` → `people.firstName`
- `lastName` → `people.lastName`
- `jobTitle` → `people.jobTitle`
- `companyName` → `people.currentCompany`
- `emails[].email` → `people.workEmail` / `people.personalEmail`
- `phones[].phone` → `people.phone` / `people.mobilePhone`
- `socialLinks.linkedin` → `people.linkedinUrl`

**❌ Missing Fields**:
```sql
-- Lusha specific fields not stored
seniority              String              -- Seniority level
department             String              -- Department
function               String              -- Job function
managementLevel        String              -- Management level
yearsInRole            Int                 -- Years in current role
yearsAtCompany         Int                 -- Years at company
previousRoles          Json                -- Previous positions
companySize            String              -- Company size category
companyIndustry        String              -- Company industry
companyType            String              -- Company type
companyRevenue         String              -- Company revenue
companyLocation        String              -- Company location
companyDescription     String              -- Company description
emailConfidence        String              -- Email confidence (A+, A, B, etc.)
phoneConfidence        Float               -- Phone confidence score
socialLinks            Json                -- All social media links
timezone               String              -- Person's timezone
coordinates            Json                -- Geographic coordinates
skills                 String[]            -- Skills from Lusha
technologies           String[]            -- Technologies
certifications         String[]            -- Certifications
languages              String[]            -- Languages
schools                String[]            -- Educational institutions
degrees                String[]            -- Degrees
fieldOfStudy           String[]            -- Fields of study
```

### 4. Perplexity AI Research Data

**❌ Missing Fields** (No dedicated storage):
```sql
-- Perplexity AI research data not stored
researchContent        Text                -- Research content
sources                Json                -- Source citations
confidence             Float               -- Research confidence
processingTime         Int                 -- Processing time
model                  String              -- AI model used
tokensUsed             Int                 -- Tokens consumed
cost                   Decimal             -- Research cost
extractedData          Json                -- Structured extracted data
  -- executives         Json                -- Executive information
  -- news               Json                -- News articles
  -- companyUpdates     Json                -- Company updates
```

### 5. AI Intelligence Data

**❌ Missing Fields** (No dedicated storage):
```sql
-- AI-generated intelligence not stored
aiIntelligence         Json                -- AI analysis results
  -- wants              Json                -- Person's wants/needs
  -- pains              Json                -- Pain points
  -- outreach           Json                -- Outreach strategy
  -- overallInsight     String              -- Overall insight
  -- confidence         Float               -- AI confidence
```

## Schema Optimization Recommendations

### 1. Add Missing CoreSignal Fields

```sql
-- Add to companies table
ALTER TABLE companies ADD COLUMN naics_codes TEXT[];
ALTER TABLE companies ADD COLUMN sic_codes TEXT[];
ALTER TABLE companies ADD COLUMN size_range VARCHAR(50);
ALTER TABLE companies ADD COLUMN hq_regions TEXT[];
ALTER TABLE companies ADD COLUMN employees_count_change JSONB;
ALTER TABLE companies ADD COLUMN key_executive_departures JSONB;
ALTER TABLE companies ADD COLUMN key_executive_arrivals JSONB;
ALTER TABLE companies ADD COLUMN active_job_postings_count INTEGER;
ALTER TABLE companies ADD COLUMN funding_rounds JSONB;
ALTER TABLE companies ADD COLUMN acquisition_list JSONB;
ALTER TABLE companies ADD COLUMN employee_reviews_score JSONB;
ALTER TABLE companies ADD COLUMN product_reviews_score JSONB;

-- Add to people table
ALTER TABLE people ADD COLUMN public_profile_id VARCHAR(100);
ALTER TABLE people ADD COLUMN linkedin_shorthand_names TEXT[];
ALTER TABLE people ADD COLUMN historical_ids TEXT[];
ALTER TABLE people ADD COLUMN experience_change_last_identified_at TIMESTAMP;
ALTER TABLE people ADD COLUMN inferred_skills TEXT[];
ALTER TABLE people ADD COLUMN historical_skills TEXT[];
ALTER TABLE people ADD COLUMN connections_count INTEGER;
ALTER TABLE people ADD COLUMN followers_count INTEGER;
ALTER TABLE people ADD COLUMN services TEXT[];
ALTER TABLE people ADD COLUMN professional_emails_collection JSONB;
ALTER TABLE people ADD COLUMN total_experience_duration_months INTEGER;
ALTER TABLE people ADD COLUMN experience JSONB;
ALTER TABLE people ADD COLUMN projected_salary_data JSONB;
ALTER TABLE people ADD COLUMN education_history JSONB;
ALTER TABLE people ADD COLUMN recommendations JSONB;
ALTER TABLE people ADD COLUMN activity JSONB;
```

### 2. Add Missing Lusha Fields

```sql
-- Add to people table
ALTER TABLE people ADD COLUMN seniority_level VARCHAR(50);
ALTER TABLE people ADD COLUMN job_function VARCHAR(100);
ALTER TABLE people ADD COLUMN management_level VARCHAR(50);
ALTER TABLE people ADD COLUMN years_in_role INTEGER;
ALTER TABLE people ADD COLUMN years_at_company INTEGER;
ALTER TABLE people ADD COLUMN previous_roles JSONB;
ALTER TABLE people ADD COLUMN email_confidence_grade VARCHAR(10);
ALTER TABLE people ADD COLUMN phone_confidence_score FLOAT;
ALTER TABLE people ADD COLUMN social_links JSONB;
ALTER TABLE people ADD COLUMN coordinates JSONB;
ALTER TABLE people ADD COLUMN lusha_skills TEXT[];
ALTER TABLE people ADD COLUMN lusha_technologies TEXT[];
ALTER TABLE people ADD COLUMN lusha_certifications TEXT[];
ALTER TABLE people ADD COLUMN lusha_languages TEXT[];
ALTER TABLE people ADD COLUMN lusha_schools TEXT[];
ALTER TABLE people ADD COLUMN lusha_degrees TEXT[];
ALTER TABLE people ADD COLUMN lusha_field_of_study TEXT[];
```

### 3. Add AI Intelligence Storage

```sql
-- Add to people table
ALTER TABLE people ADD COLUMN ai_intelligence JSONB;
ALTER TABLE people ADD COLUMN ai_confidence FLOAT;
ALTER TABLE people ADD COLUMN ai_last_updated TIMESTAMP;

-- Add to companies table
ALTER TABLE companies ADD COLUMN ai_intelligence JSONB;
ALTER TABLE companies ADD COLUMN ai_confidence FLOAT;
ALTER TABLE companies ADD COLUMN ai_last_updated TIMESTAMP;
```

### 4. Add Perplexity Research Storage

```sql
-- Create new table for research data
CREATE TABLE research_data (
  id VARCHAR(30) PRIMARY KEY DEFAULT gen_ulid(),
  entity_type VARCHAR(20) NOT NULL, -- 'person' or 'company'
  entity_id VARCHAR(30) NOT NULL,
  research_type VARCHAR(50) NOT NULL, -- 'executive', 'company', 'news', etc.
  content TEXT,
  sources JSONB,
  confidence FLOAT,
  processing_time INTEGER,
  model VARCHAR(100),
  tokens_used INTEGER,
  cost DECIMAL(10, 4),
  extracted_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_research_data_entity ON research_data(entity_type, entity_id);
CREATE INDEX idx_research_data_type ON research_data(research_type);
CREATE INDEX idx_research_data_created ON research_data(created_at);
```

### 5. Add Cost Tracking

```sql
-- Create cost tracking table
CREATE TABLE api_cost_tracking (
  id VARCHAR(30) PRIMARY KEY DEFAULT gen_ulid(),
  workspace_id VARCHAR(30) NOT NULL,
  user_id VARCHAR(30),
  api_provider VARCHAR(50) NOT NULL, -- 'coresignal', 'lusha', 'perplexity', etc.
  endpoint VARCHAR(100),
  cost DECIMAL(10, 4) NOT NULL,
  tokens_used INTEGER,
  request_data JSONB,
  response_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_tracking_workspace ON api_cost_tracking(workspace_id);
CREATE INDEX idx_cost_tracking_provider ON api_cost_tracking(api_provider);
CREATE INDEX idx_cost_tracking_created ON api_cost_tracking(created_at);
```

### 6. Add Data Quality Tracking

```sql
-- Add to people table
ALTER TABLE people ADD COLUMN data_quality_score FLOAT DEFAULT 0;
ALTER TABLE people ADD COLUMN data_quality_breakdown JSONB;
ALTER TABLE people ADD COLUMN data_sources TEXT[];
ALTER TABLE people ADD COLUMN data_last_verified TIMESTAMP;

-- Add to companies table
ALTER TABLE companies ADD COLUMN data_quality_score FLOAT DEFAULT 0;
ALTER TABLE companies ADD COLUMN data_quality_breakdown JSONB;
ALTER TABLE companies ADD COLUMN data_sources TEXT[];
ALTER TABLE companies ADD COLUMN data_last_verified TIMESTAMP;
```

## Data Type Optimizations

### 1. JSON Field Optimization

**Current**: Using `Json` type for all complex data
**Recommended**: Use `JSONB` for better performance and indexing

```sql
-- Convert existing JSON fields to JSONB
ALTER TABLE people ALTER COLUMN coresignalData TYPE JSONB USING coresignalData::JSONB;
ALTER TABLE people ALTER COLUMN enrichedData TYPE JSONB USING enrichedData::JSONB;
ALTER TABLE people ALTER COLUMN careerTimeline TYPE JSONB USING careerTimeline::JSONB;
ALTER TABLE people ALTER COLUMN degrees TYPE JSONB USING degrees::JSONB;
ALTER TABLE people ALTER COLUMN customFields TYPE JSONB USING customFields::JSONB;

ALTER TABLE companies ALTER COLUMN customFields TYPE JSONB USING customFields::JSONB;
```

### 2. Index Optimization

```sql
-- Add GIN indexes for JSONB fields
CREATE INDEX idx_people_coresignal_data ON people USING GIN (coresignalData);
CREATE INDEX idx_people_enriched_data ON people USING GIN (enrichedData);
CREATE INDEX idx_people_ai_intelligence ON people USING GIN (ai_intelligence);
CREATE INDEX idx_companies_custom_fields ON companies USING GIN (customFields);
CREATE INDEX idx_companies_ai_intelligence ON companies USING GIN (ai_intelligence);

-- Add composite indexes for common queries
CREATE INDEX idx_people_workspace_buyer_group ON people(workspaceId, buyerGroupRole);
CREATE INDEX idx_people_workspace_influence ON people(workspaceId, influenceScore);
CREATE INDEX idx_people_workspace_enrichment ON people(workspaceId, enrichmentScore);
CREATE INDEX idx_companies_workspace_industry ON companies(workspaceId, industry);
CREATE INDEX idx_companies_workspace_size ON companies(workspaceId, employeeCount);
```

## Data Loss Analysis

### High Risk Data Loss

1. **CoreSignal Growth Metrics** (Not stored)
   - Employee count changes
   - Hiring trends
   - Leadership changes
   - **Impact**: Cannot track company growth signals

2. **Lusha Contact Confidence** (Partially stored)
   - Email confidence grades (A+, A, B, C, D)
   - Phone confidence scores
   - **Impact**: Cannot assess contact quality

3. **AI Intelligence** (Not stored)
   - Person wants/needs analysis
   - Pain point identification
   - Outreach strategy recommendations
   - **Impact**: Cannot leverage AI insights

4. **Research Data** (Not stored)
   - Perplexity AI research content
   - Source citations
   - Real-time intelligence
   - **Impact**: Cannot access research history

### Medium Risk Data Loss

1. **CoreSignal Salary Data** (Not stored)
   - Projected salary ranges
   - Compensation insights
   - **Impact**: Cannot assess person's financial situation

2. **Lusha Professional Details** (Partially stored)
   - Years in role/company
   - Management level
   - Previous roles
   - **Impact**: Limited career progression insights

3. **Social Media Data** (Not stored)
   - LinkedIn connections/followers
   - Social media links
   - **Impact**: Cannot assess social influence

## Recommendations Priority

### Critical (Immediate)
1. **Add AI Intelligence Storage** - Essential for leveraging AI insights
2. **Add Research Data Storage** - Critical for research history
3. **Add Cost Tracking** - Essential for budget management
4. **Convert JSON to JSONB** - Performance optimization

### High Priority (1-2 weeks)
1. **Add CoreSignal Growth Metrics** - Important for company intelligence
2. **Add Lusha Confidence Data** - Important for contact quality
3. **Add Missing CoreSignal Fields** - Complete data coverage
4. **Add Data Quality Tracking** - Monitor data quality

### Medium Priority (1 month)
1. **Add Missing Lusha Fields** - Complete enrichment data
2. **Add Index Optimization** - Performance improvement
3. **Add Social Media Data** - Enhanced person profiles

### Low Priority (Future)
1. **Add Salary Data** - Nice to have
2. **Add Advanced Analytics** - Future enhancement

## Conclusion

The current database schema provides good coverage for basic intelligence data but is missing critical fields for comprehensive intelligence storage. The most significant gaps are:

1. **AI Intelligence Storage** - No dedicated storage for AI-generated insights
2. **Research Data Storage** - No storage for Perplexity AI research
3. **Cost Tracking** - No tracking of API usage and costs
4. **Data Quality Metrics** - Limited quality assessment capabilities

**Recommendation**: Implement the critical and high-priority schema changes to ensure comprehensive intelligence data storage and prevent data loss from external APIs.
