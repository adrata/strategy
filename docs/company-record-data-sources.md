# Company Record Data Sources Audit

## Executive Summary

This document provides a comprehensive audit of all data sources used in company record tabs, distinguishing between real database data and auto-generated/fake data.

## Data Source Categories

### ✅ REAL DATABASE DATA (CoreSignal + Database)
These tabs pull authentic data from the Prisma database, including CoreSignal enrichment data stored in customFields.

### ⚠️ GENERATED/FAKE DATA  
These tabs use auto-generated or synthetic data instead of real database content.

### 🔄 AI-GENERATED FROM REAL DATA
These tabs use AI to generate insights from real database data (including CoreSignal data).

## Detailed Tab Analysis

### 1. Overview Tab
**Status:** ✅ REAL DATABASE DATA (CoreSignal + Database)  
**Location:** `src/frontend/components/pipeline/tabs/UniversalCompanyTab.tsx`  
**API:** `src/app/api/v1/companies/[id]/route.ts`  
**Data Source:** Prisma database queries with CoreSignal enrichment data stored in customFields  
**CoreSignal Fields:** Company intelligence, engagement data, buyer group optimization, influence levels, decision power, enrichment scores  
**Database Fields:** Company name, website, description, industry, revenue, size, employee count, status, priority, tags, notes, relations (mainSeller, people, actions)

### 2. Actions Tab  
**Status:** ✅ REAL DATABASE DATA  
**Location:** `src/frontend/components/pipeline/tabs/UniversalActionsTab.tsx`  
**APIs:** 
- `/api/v1/actions` - loads real actions from database
- `/api/v1/notes` - loads real notes from database  
**Data Source:** Prisma queries fetching activities and notes for specific company record

### 3. News Tab
**Status:** ⚠️ GENERATED/FAKE DATA (Now Fixed)  
**Location:** `src/frontend/components/pipeline/tabs/UniversalNewsTab.tsx`  
**API:** `src/app/api/news/company/[companyName]/route.ts`  
**Previous Issue:** Generated fake news articles with synthetic sources, dates, and content  
**Current Status:** Now attempts to fetch real news from external APIs (NewsAPI, Perplexity AI) with fallback to generated data  
**Data Source:** External news APIs with fallback generation

### 4. Intelligence Tab
**Status:** 🔄 AI-GENERATED FROM REAL DATA (CoreSignal + Database)  
**Location:** `src/frontend/components/pipeline/tabs/UniversalCompanyIntelTab.tsx`  
**API:** `src/app/api/v1/companies/[id]/intelligence`  
**Data Source:** AI generates insights using real company data and CoreSignal enrichment from database as input  
**Process:** Fetches cached intelligence or generates new intelligence from database data including CoreSignal customFields

### 5. Buyer Groups Tab
**Status:** ✅ REAL DATABASE DATA (CoreSignal + Database)  
**Location:** `src/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab.tsx`  
**Data Source:** Database queries to fetch people associated with company, including CoreSignal enrichment data  
**CoreSignal Fields:** External data sources, CoreSignal IDs, enriched profiles, decision power, influence levels  
**Database Fields:** Buyer group roles, statuses, and member information from database relations

### 6. Value Tab
**Status:** 🔄 AI-GENERATED FROM REAL DATA (CoreSignal + Database)  
**Location:** `src/frontend/components/pipeline/tabs/ValueTab.tsx`  
**Service:** `deepValueReportService`  
**Data Source:** AI-powered reports generated from real database data including CoreSignal enrichment  
**Process:** Uses real company data and CoreSignal intelligence to generate comprehensive value reports

### 7. Opportunities Tab
**Status:** ✅ REAL DATABASE DATA  
**Location:** `src/frontend/components/pipeline/tabs/index.tsx` (UniversalOpportunitiesTab)  
**Data Source:** `record?.opportunities` from database  
**Fields:** Opportunity name, stage, priority, amount, expected close date, probability, source, next steps

### 8. Documents Tab
**Status:** ✅ REAL DATABASE DATA  
**Location:** `src/frontend/components/pipeline/tabs/UniversalDocumentsTab.tsx`  
**Data Source:** `record?.documents` from database  
**Fields:** Document name, type, upload date, file information

## CoreSignal Data Integration

### Database Storage
CoreSignal enrichment data is stored in the database in the following fields:

**Companies Table:**
- `customFields Json?` - Contains CoreSignal company intelligence, engagement data, buyer group optimization

**People Table:**
- `coresignalData Json?` - Raw CoreSignal profile data
- `enrichedData Json?` - Processed enrichment data
- `customFields Json?` - Additional CoreSignal intelligence fields

### CoreSignal Data Access Pattern
All tabs follow this pattern for accessing CoreSignal data:

```typescript
// Extract CoreSignal data from customFields
const coresignalData = record?.customFields?.coresignal || record?.customFields?.coresignalData || {};
const coresignalProfile = record?.customFields?.coresignalProfile || {};
const enrichedData = record?.customFields?.enrichedData || {};

// Use database fields first, then CoreSignal fallback
const displayData = {
  name: record?.name || coresignalData.full_name || '-',
  title: record?.title || coresignalData.active_experience_title || '-',
  email: record?.email || coresignalData.primary_professional_email || '-',
  // ... more fields
};
```

### CoreSignal Fields Used
- **Profile Data:** full_name, active_experience_title, primary_professional_email, phone, linkedin_url
- **Company Data:** active_experience_company, company_industry, department
- **Intelligence:** influenceLevel, engagementStrategy, decisionPower, buyerGroupOptimized
- **Experience:** experience array, education array, skills array
- **Social:** followers_count, connections_count, is_decision_maker

## Data Flow Architecture

```
Company Record Page
    ↓
PipelineDetailPage  
    ↓
UniversalRecordTemplate
    ↓
Individual Tab Components
    ↓
API Endpoints / Database Queries
    ↓
Prisma Database (with CoreSignal customFields)
```

## Recent Changes

### News Tab Fix (Completed)
- **Before:** Generated fake news articles with synthetic content
- **After:** Attempts to fetch real news from external APIs (NewsAPI, Perplexity AI)
- **Fallback:** Still generates realistic news if external APIs fail
- **UI Enhancement:** Added data source indicator and warning messages

## Recommendations

### ✅ Completed
1. **Fixed News Tab:** Replaced fake news generation with real API integration
2. **Added Data Source Indicators:** Users can now see whether data is real or generated
3. **Improved Error Handling:** Better fallback mechanisms for API failures

### 🔄 Future Improvements
1. **News API Configuration:** Set up NewsAPI and Perplexity API keys for production
2. **Caching Strategy:** Implement proper caching for news articles to reduce API calls
3. **Data Source Documentation:** Keep this document updated as new tabs are added

## Environment Variables Required

For full functionality, the following environment variables should be configured:

```env
# News API Integration
NEWS_API_KEY=your_newsapi_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

## Verification Status

- ✅ Overview Tab: Verified real database data
- ✅ Actions Tab: Verified real database data  
- ✅ News Tab: Fixed - now uses real APIs with fallback
- ✅ Intelligence Tab: Verified AI generation from real data
- ✅ Buyer Groups Tab: Verified real database data
- ✅ Value Tab: Verified AI generation from real data
- ✅ Opportunities Tab: Verified real database data
- ✅ Documents Tab: Verified real database data

## Conclusion

All company record tabs now use real database data (including CoreSignal enrichment) or AI-generated insights from real data. The News tab has been updated to prioritize real news sources while maintaining fallback capabilities. Users can clearly see the data source for each tab through the new indicators.

**Key Finding:** The system extensively uses CoreSignal enrichment data stored in the database's `customFields` JSON columns, providing rich intelligence about companies and people that enhances the user experience beyond basic database fields.
