# External Data Sources Documentation

**Date:** January 2025  
**Audit Scope:** All External API Integrations for Intelligence Data  
**Status:** Complete

## Executive Summary

This document provides comprehensive documentation of all external data sources integrated into the Adrata intelligence system, including their data schemas, costs, and usage patterns.

## 1. CoreSignal API

### Overview
**Type:** B2B Intelligence Platform  
**Cost:** ~$0.10 per company  
**Primary Use:** Company and employee data enrichment  
**API Base URL:** `https://api.coresignal.com`

### Company Data Schema

```typescript
interface CoreSignalCompanyData {
  // Core identifiers
  id?: number;
  company_name: string;
  industry?: string;
  naics_codes?: string[];
  sic_codes?: string[];
  founded_year?: string;
  
  // Size & Revenue (PRIMARY DATA)
  size_range?: string;
  employees_count?: number;
  revenue_annual_range?: {
    annual_revenue_range_from?: number;
    annual_revenue_range_to?: number;
    annual_revenue_range_currency?: string;
  };
  
  // Location
  hq_country?: string;
  hq_region?: string[];
  
  // Growth & Change Metrics
  employees_count_change?: {
    current: number;
    change_monthly: number;
    change_monthly_percentage: number;
    change_quarterly: number;
    change_quarterly_percentage: number;
    change_yearly: number;
    change_yearly_percentage: number;
  };
  
  // Leadership & Hiring
  key_executive_departures?: Array<{
    member_full_name: string;
    member_position_title: string;
    departure_date: string;
  }>;
  
  key_executive_arrivals?: Array<{
    member_full_name: string;
    member_position_title: string;
    arrival_date: string;
  }>;
  
  active_job_postings_count?: number;
  active_job_postings_count_change?: {
    current: number;
    change_monthly: number;
    change_monthly_percentage: number;
  };
  
  // Financial & Funding
  funding_rounds?: Array<{
    name: string;
    announced_date: string;
    amount_raised: number;
    amount_raised_currency: string;
  }>;
  
  acquisition_list_source_1?: Array<{
    acquiree_name: string;
    announced_date: string;
    price: string;
    currency: string;
  }>;
  
  // Reputation & Reviews
  employee_reviews_score_aggregated_change?: {
    current: number;
    change_monthly: number;
    change_quarterly: number;
    change_yearly: number;
  };
  
  product_reviews_score_change?: {
    current: number;
    change_monthly: number;
    change_quarterly: number;
    change_yearly: number;
  };
}
```

### Person Data Schema

```typescript
interface CoreSignalPersonData {
  // Basic profile data
  id: number;
  parent_id?: number;
  created_at: string;
  updated_at: string;
  checked_at: string;
  changed_at: string;
  experience_change_last_identified_at?: string;
  is_deleted: boolean;
  is_parent: boolean;
  public_profile_id?: string;
  linkedin_url?: string;
  linkedin_shorthand_names?: string[];
  historical_ids?: string[];
  
  // Personal information
  full_name: string;
  first_name: string;
  first_name_initial?: string;
  middle_name?: string;
  middle_name_initial?: string;
  last_name: string;
  last_name_initial?: string;
  headline?: string;
  summary?: string;
  picture_url?: string;
  
  // Location data
  location_country?: string;
  location_country_iso2?: string;
  location_country_iso3?: string;
  location_full?: string;
  location_regions?: string[];
  
  // Skills and interests
  interests?: string[];
  inferred_skills?: string[];
  historical_skills?: string[];
  
  // Network data
  connections_count?: number;
  followers_count?: number;
  services?: string[];
  
  // Professional emails
  primary_professional_email?: string;
  primary_professional_email_status?: string;
  professional_emails_collection?: any[];
  
  // Work status
  is_working?: boolean;
  active_experience_company_id?: number;
  active_experience_title?: string;
  active_experience_description?: string;
  active_experience_department?: string;
  active_experience_management_level?: string;
  is_decision_maker?: boolean;
  
  // Experience data
  total_experience_duration_months?: number;
  total_experience_duration_months_breakdown_department?: any;
  total_experience_duration_months_breakdown_management_level?: any;
  experience?: any[];
  
  // Salary data
  projected_base_salary_p25?: number;
  projected_base_salary_median?: number;
  projected_base_salary_p75?: number;
  projected_base_salary_period?: string;
  projected_base_salary_currency?: string;
  projected_base_salary_updated_at?: string;
  projected_additional_salary?: number;
  projected_additional_salary_period?: string;
  projected_additional_salary_currency?: string;
  projected_additional_salary_updated_at?: string;
  projected_total_salary_p25?: number;
  projected_total_salary_median?: number;
  projected_total_salary_p75?: number;
  projected_total_salary_period?: string;
  projected_total_salary_currency?: string;
  projected_total_salary_updated_at?: string;
  
  // Education data
  last_graduation_date?: string;
  education_degrees?: string[];
  education?: any[];
  
  // Social data
  recommendations_count?: number;
  recommendations?: any[];
  activity?: any[];
}
```

### Usage in Adrata
- **Primary source** for company firmographics
- **Employee discovery** and basic profile data
- **Growth metrics** and hiring trends
- **Leadership changes** tracking
- **Funding and acquisition** data

## 2. Lusha API

### Overview
**Type:** Contact Enrichment Platform  
**Cost:** ~$1.50 per contact  
**Primary Use:** Email and phone number enrichment  
**API Base URL:** `https://api.lusha.com`

### Data Schema

```typescript
interface LushaEnrichmentData {
  // Basic person information
  personalInfo: {
    firstName: string;
    lastName: string;
    fullName: string;
    middleName?: string;
    prefix?: string;
    suffix?: string;
  };

  // Professional information
  professionalInfo: {
    jobTitle: string;
    seniority?: string;
    department?: string;
    function?: string;
    managementLevel?: string;
    yearsInRole?: number;
    yearsAtCompany?: number;
    previousRoles?: any[];
  };

  // Company information
  companyInfo: {
    companyName: string;
    companyDomain?: string;
    companySize?: string;
    companyIndustry?: string;
    companyType?: string;
    companyRevenue?: string;
    companyLocation?: string;
    companyDescription?: string;
  };

  // Contact information
  contactInfo: {
    emails: Array<{
      email: string;
      type: string;
      confidence: string; // A+, A, B, C, D
      isValid: boolean;
      isPrimary: boolean;
      source: string;
    }>;
    phones: Array<{
      phone: string;
      type: 'mobile' | 'work' | 'unknown';
      confidence: number;
      isValid: boolean;
      isPrimary: boolean;
      source: string;
    }>;
    socialLinks: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
    };
  };

  // Location information
  locationInfo: {
    country?: string;
    state?: string;
    city?: string;
    region?: string;
    timezone?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Skills and technologies
  skillsInfo: {
    skills?: string[];
    technologies?: string[];
    certifications?: string[];
    languages?: string[];
  };

  // Education information
  educationInfo: {
    schools?: string[];
    degrees?: string[];
    fieldOfStudy?: string[];
  };

  // Metadata
  metadata: {
    source: 'lusha_api';
    lookupMethod: string;
    confidence: number;
    cost: number;
    timestamp: string;
    dataCompleteness: number;
    verified: boolean;
  };
}
```

### Usage in Adrata
- **Email enrichment** with confidence scores
- **Phone number discovery** (mobile and work)
- **Social media links** (LinkedIn, Twitter, Facebook)
- **Professional information** validation
- **Contact verification** and validation

## 3. Perplexity AI

### Overview
**Type:** Real-time Web Research AI  
**Cost:** Variable (token-based)  
**Primary Use:** Real-time research and news gathering  
**API Base URL:** `https://api.perplexity.ai`

### Data Schema

```typescript
interface PerplexityResearchData {
  content: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
    published_date?: string;
  }>;
  confidence: number; // 0-1
  processingTime: number;
  model: string; // e.g., 'llama-3.1-sonar-large-128k-online'
  tokensUsed: number;
  cost: number;
  
  // Extracted structured data
  extractedData?: {
    executives?: Array<{
      name: string;
      title: string;
      company: string;
      confidence: number;
      source: string;
    }>;
    news?: Array<{
      headline: string;
      summary: string;
      date: string;
      source: string;
      url: string;
    }>;
    companyUpdates?: Array<{
      type: 'funding' | 'hiring' | 'acquisition' | 'partnership' | 'product';
      description: string;
      date: string;
      source: string;
    }>;
  };
}
```

### Usage in Adrata
- **Real-time executive research** for buyer group discovery
- **Company news and updates** gathering
- **Market intelligence** and competitive analysis
- **Executive changes** detection
- **Funding and acquisition** news

## 4. Prospeo API

### Overview
**Type:** LinkedIn Email Finder  
**Cost:** ~$0.015 per success  
**Primary Use:** Professional email discovery  
**API Base URL:** `https://api.prospeo.io`

### Data Schema

```typescript
interface ProspeoData {
  // Contact information
  emails: Array<{
    email: string;
    type: 'work' | 'personal';
    confidence: number;
    source: string;
  }>;
  
  // Phone numbers
  phones: Array<{
    phone: string;
    type: 'mobile' | 'work';
    confidence: number;
    source: string;
  }>;
  
  // Social profiles
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  
  // Professional data
  professionalData: {
    currentCompany?: string;
    currentTitle?: string;
    industry?: string;
    location?: string;
  };
  
  // Metadata
  metadata: {
    source: 'prospeo_api';
    confidence: number;
    cost: number;
    timestamp: string;
  };
}
```

### Usage in Adrata
- **LinkedIn email discovery** for professional contacts
- **Social media profile** linking
- **Professional email** validation
- **Contact enrichment** for buyer group members

## 5. ContactOut API

### Overview
**Type:** Phone Number Specialist  
**Cost:** Variable  
**Primary Use:** Mobile phone number discovery  
**API Base URL:** `https://api.contactout.com`

### Data Schema

```typescript
interface ContactOutData {
  // Phone information
  phones: Array<{
    phone: string;
    type: 'mobile' | 'work' | 'home';
    confidence: number;
    isValid: boolean;
    source: string;
  }>;
  
  // Contact validation
  validation: {
    emailValid?: boolean;
    phoneValid?: boolean;
    deliverabilityScore?: number;
  };
  
  // Metadata
  metadata: {
    source: 'contactout_api';
    confidence: number;
    cost: number;
    timestamp: string;
  };
}
```

### Usage in Adrata
- **Mobile phone number** discovery
- **Contact verification** and validation
- **Phone number quality** scoring
- **Outreach channel** optimization

## 6. ZeroBounce API

### Overview
**Type:** Email Verification Service  
**Cost:** Variable  
**Primary Use:** Email validation and deliverability  
**API Base URL:** `https://api.zerobounce.net`

### Data Schema

```typescript
interface ZeroBounceData {
  // Email validation
  email: string;
  status: 'valid' | 'invalid' | 'catch_all' | 'unknown' | 'spamtrap' | 'abuse' | 'do_not_mail';
  sub_status?: string;
  account?: string;
  domain?: string;
  did_you_mean?: string;
  domain_age_days?: number;
  smtp_provider?: string;
  mx_found?: string;
  mx_record?: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
  country?: string;
  region?: string;
  city?: string;
  zipcode?: string;
  processed_at: string;
  
  // Metadata
  metadata: {
    source: 'zerobounce_api';
    confidence: number;
    cost: number;
    timestamp: string;
  };
}
```

### Usage in Adrata
- **Email validation** before outreach
- **Deliverability scoring** for email campaigns
- **Bounce prevention** and list cleaning
- **Email quality** assessment

## 7. People Data Labs (PDL)

### Overview
**Type:** Professional Data Platform  
**Cost:** Variable  
**Primary Use:** Professional profile enrichment  
**API Base URL:** `https://api.peopledatalabs.com`

### Data Schema

```typescript
interface PDLData {
  // Basic profile
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  middle_initial?: string;
  
  // Professional information
  job_title?: string;
  job_title_role?: string;
  job_title_sub_role?: string;
  job_title_levels?: string[];
  job_company_name?: string;
  job_company_id?: string;
  job_company_website?: string;
  job_company_industry?: string;
  job_company_size?: string;
  job_company_founded?: number;
  job_company_location?: {
    name: string;
    locality: string;
    region: string;
    country: string;
    continent: string;
  };
  
  // Contact information
  phone_numbers?: string[];
  emails?: string[];
  profiles?: {
    network: string;
    url: string;
    username?: string;
  }[];
  
  // Experience
  experience?: Array<{
    company: {
      name: string;
      size?: string;
      industry?: string;
      id?: string;
    };
    title_names?: string[];
    start_date?: string;
    end_date?: string;
    current_job?: boolean;
    summary?: string;
  }>;
  
  // Education
  education?: Array<{
    school: {
      name: string;
      type?: string;
    };
    degrees?: string[];
    start_date?: string;
    end_date?: string;
    gpa?: string;
    summary?: string;
  }>;
  
  // Skills
  skills?: string[];
  interests?: string[];
  
  // Location
  location_name?: string;
  location_metro?: string;
  location_region?: string;
  location_country?: string;
  location_continent?: string;
  
  // Metadata
  summary?: string;
  headline?: string;
  industry?: string;
  birth_year?: number;
  birth_date?: string;
  gender?: string;
  linkedin_id?: string;
  facebook_id?: string;
  twitter_id?: string;
  github_id?: string;
  gravatar_id?: string;
}
```

### Usage in Adrata
- **Professional profile** enrichment
- **Work history** and experience data
- **Education background** information
- **Skills and interests** data
- **Social media profile** linking

## 8. OpenAI/Claude AI

### Overview
**Type:** AI Analysis and Insights  
**Cost:** Variable (token-based)  
**Primary Use:** AI-powered intelligence analysis  
**API Base URLs:** 
- OpenAI: `https://api.openai.com`
- Claude: `https://api.anthropic.com`

### Data Schema

```typescript
interface AIIntelligenceData {
  // Person analysis
  personAnalysis?: {
    wants: {
      careerAspirations: string[];
      professionalGoals: string[];
      motivations: string[];
      opportunitiesOfInterest: string[];
      confidence: number;
    };
    pains: {
      currentChallenges: string[];
      frustrations: string[];
      pressurePoints: string[];
      obstacles: string[];
      urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
      confidence: number;
    };
    outreach: {
      bestApproach: string;
      valuePropositions: string[];
      conversationStarters: string[];
      personalizedMessage: string;
    };
    overallInsight: string;
    confidence: number;
  };
  
  // Company analysis
  companyAnalysis?: {
    marketPosition: string;
    growthTrajectory: string;
    competitiveThreats: string[];
    opportunities: string[];
    buyingSignals: string[];
    painPoints: string[];
    confidence: number;
  };
  
  // Buyer group analysis
  buyerGroupAnalysis?: {
    cohesionScore: number;
    decisionProcess: string;
    influenceMap: any[];
    championStrategy: string;
    engagementPlan: string;
    confidence: number;
  };
  
  // Metadata
  metadata: {
    model: string;
    tokensUsed: number;
    cost: number;
    processingTime: number;
    confidence: number;
    timestamp: string;
  };
}
```

### Usage in Adrata
- **Person intelligence** analysis (wants, pains, outreach strategy)
- **Company intelligence** insights
- **Buyer group** analysis and strategy
- **Role variation** generation
- **Content generation** for outreach

## Cost Analysis

### Per-Enrichment Costs (Estimated)

| Data Source | Cost per Call | Primary Use |
|-------------|---------------|-------------|
| CoreSignal | $0.10 | Company & employee data |
| Lusha | $1.50 | Contact enrichment |
| Perplexity AI | $0.01-0.05 | Real-time research |
| Prospeo | $0.015 | Email discovery |
| ContactOut | $0.10 | Phone numbers |
| ZeroBounce | $0.005 | Email validation |
| PDL | $0.05 | Professional profiles |
| OpenAI/Claude | $0.01-0.10 | AI analysis |

### Progressive Enrichment Cost Breakdown

| Level | CoreSignal | Lusha | AI Analysis | Total |
|-------|------------|-------|-------------|-------|
| Level 1 (Identify) | $0.10 | $0 | $0 | ~$0.10 |
| Level 2 (Enrich) | $0.10 | $1.50 | $0 | ~$2.00 |
| Level 3 (Deep Research) | $0.10 | $1.50 | $3.00 | ~$5.00 |

## Data Quality Metrics

### Confidence Scoring

| Data Source | Typical Confidence | Quality Factors |
|-------------|-------------------|-----------------|
| CoreSignal | 85-95% | Data freshness, source reliability |
| Lusha | 80-90% | Email deliverability, phone validation |
| Perplexity AI | 70-85% | Source citations, recency |
| Prospeo | 75-85% | LinkedIn verification, email validation |
| ContactOut | 70-80% | Phone validation, carrier lookup |
| ZeroBounce | 95-99% | Email deliverability testing |
| PDL | 80-90% | Professional verification |
| AI Analysis | 60-80% | Data completeness, model confidence |

## Integration Status

### ✅ Fully Integrated
- CoreSignal (company and person data)
- Lusha (contact enrichment)
- Perplexity AI (real-time research)
- OpenAI/Claude (AI analysis)

### ⚠️ Partially Integrated
- Prospeo (email discovery)
- ContactOut (phone numbers)
- ZeroBounce (email validation)
- PDL (professional profiles)

### 🔧 Needs Integration
- Additional validation services
- Enhanced caching mechanisms
- Cost optimization strategies

## Recommendations

### 1. Cost Optimization
- Implement intelligent caching to reduce duplicate API calls
- Use progressive enrichment to minimize costs
- Batch API calls where possible
- Monitor usage and implement rate limiting

### 2. Data Quality
- Implement confidence scoring across all sources
- Cross-validate data between sources
- Regular data freshness checks
- Quality metrics tracking

### 3. Integration Improvements
- Standardize data schemas across sources
- Implement unified error handling
- Add comprehensive logging and monitoring
- Create fallback mechanisms for API failures

### 4. Schema Enhancements
- Document all data fields returned by each source
- Create unified data models
- Implement data transformation pipelines
- Add data lineage tracking

## Conclusion

The external data sources provide comprehensive intelligence capabilities, but require careful cost management and quality control. The progressive enrichment approach in v1 APIs provides a good foundation for cost-effective scaling while maintaining data quality.
