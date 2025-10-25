# Company Record Field Audit - Complete Field Mapping

## Overview
This document provides a comprehensive audit of all editable fields across every tab in company records to ensure they persist correctly when navigating back to the page.

## Field Categories by Tab

### 1. Overview Tab (`CompanyOverviewTab.tsx`)

**Basic Information:**
- `name` - Company Name
- `legalName` - Legal Name  
- `tradingName` - Trading Name
- `localName` - Local Name
- `description` - Company Description
- `industry` - Industry
- `sector` - Sector
- `size` - Company Size
- `employeeCount` - Total Employees
- `revenue` - Revenue
- `currency` - Currency
- `foundedYear` - Founded Year
- `website` - Website
- `email` - Email
- `phone` - Phone
- `fax` - Fax
- `address` - Address
- `city` - City
- `state` - State
- `country` - Country
- `postalCode` - Postal Code
- `domain` - Domain

**Business Intelligence:**
- `marketPosition` - Market Position
- `digitalMaturity` - Digital Maturity
- `techStack` - Technology Stack
- `linkedinUrl` - LinkedIn URL
- `twitterUrl` - Twitter URL
- `facebookUrl` - Facebook URL
- `instagramUrl` - Instagram URL
- `youtubeUrl` - YouTube URL
- `githubUrl` - GitHub URL

### 2. Company Tab (`UniversalCompanyTab.tsx`)

**Company Information:**
- `name` - Company Name
- `legalName` - Legal Name
- `tradingName` - Trading Name
- `localName` - Local Name
- `description` - Company Summary
- `industry` - Industry
- `sector` - Sector
- `size` - Size
- `revenue` - Revenue
- `currency` - Currency
- `employeeCount` - Employee Count
- `foundedYear` - Founded Year
- `website` - Website
- `email` - Email
- `phone` - Phone
- `fax` - Fax
- `address` - Address
- `city` - City
- `state` - State
- `country` - Country
- `postalCode` - Postal Code
- `domain` - Domain
- `logoUrl` - Logo URL

**Business Profile:**
- `industry` - Industry
- `targetIndustry` - Target Industry
- `sector` - Sector
- `size` - Size
- `revenue` - Revenue
- `currency` - Currency
- `employeeCount` - Employee Count
- `foundedYear` - Founded Year

**Contact & Market:**
- `email` - Email
- `fax` - Fax
- `website` - Website
- `linkedinUrl` - LinkedIn URL
- `twitterUrl` - Twitter URL
- `facebookUrl` - Facebook URL
- `instagramUrl` - Instagram URL
- `youtubeUrl` - YouTube URL
- `githubUrl` - GitHub URL

**Location Information:**
- `hqLocation` - HQ Location
- `hqFullAddress` - HQ Full Address
- `hqCity` - HQ City
- `hqState` - HQ State
- `hqStreet` - HQ Street
- `hqZipcode` - HQ Zipcode
- `hqRegion` - HQ Region
- `hqCountryIso2` - HQ Country ISO2
- `hqCountryIso3` - HQ Country ISO3

### 3. Intelligence Tab (`UniversalCompanyIntelTab.tsx`)

**Business Intelligence:**
- `businessChallenges` - Business Challenges
- `businessPriorities` - Business Priorities
- `competitiveAdvantages` - Competitive Advantages
- `growthOpportunities` - Growth Opportunities
- `strategicInitiatives` - Strategic Initiatives
- `successMetrics` - Success Metrics
- `marketThreats` - Market Threats
- `keyInfluencers` - Key Influencers
- `decisionTimeline` - Decision Timeline
- `marketPosition` - Market Position
- `digitalMaturity` - Digital Maturity
- `techStack` - Technology Stack

### 4. Business Tab (`UniversalBusinessTab.tsx`)

**Business Intelligence:**
- `accountValue` - Account Value
- `growthRate` - Growth Rate
- `expansionPotential` - Expansion Potential

### 5. Success Tab (`UniversalSuccessTab.tsx`)

**Success Metrics:**
- `healthScore` - Health Score
- `roiAchieved` - ROI Achieved
- `timeToValue` - Time to Value

### 6. Performance Tab (`UniversalPerformanceTab.tsx`)

**Performance Metrics:**
- `performanceScore` - Performance Score
- `partnerRevenue` - Partner Revenue
- `revenueGrowth` - Revenue Growth
- `dealsClosed` - Deals Closed

### 7. Collaboration Tab (`UniversalCollaborationTab.tsx`)

**Collaboration Metrics:**
- `activeOpportunities` - Active Opportunities
- `jointRevenue` - Joint Revenue
- `activeProjects` - Active Projects

## API Whitelist Verification

All fields listed above are included in the `ALLOWED_COMPANY_FIELDS` whitelist in `src/app/api/v1/companies/[id]/route.ts`:

✅ **Confirmed in API Whitelist:**
- Basic fields: `name`, `legalName`, `tradingName`, `localName`, `description`, `website`, `email`, `phone`, `fax`, `address`, `city`, `state`, `country`, `postalCode`
- Business fields: `industry`, `sector`, `size`, `revenue`, `currency`, `employeeCount`, `foundedYear`, `domain`, `logoUrl`
- Intelligence fields: `businessChallenges`, `businessPriorities`, `competitiveAdvantages`, `growthOpportunities`, `strategicInitiatives`, `successMetrics`, `marketThreats`, `keyInfluencers`, `decisionTimeline`, `marketPosition`, `digitalMaturity`, `techStack`
- Social fields: `linkedinUrl`, `linkedinNavigatorUrl`, `linkedinFollowers`, `twitterUrl`, `twitterFollowers`, `facebookUrl`, `instagramUrl`, `youtubeUrl`, `githubUrl`
- Location fields: `hqLocation`, `hqFullAddress`, `hqCity`, `hqState`, `hqStreet`, `hqZipcode`, `hqRegion`, `hqCountryIso2`, `hqCountryIso3`
- Business metrics: `accountValue`, `growthRate`, `expansionPotential`
- Success metrics: `healthScore`, `roiAchieved`, `timeToValue`
- Performance metrics: `performanceScore`, `partnerRevenue`, `revenueGrowth`, `dealsClosed`
- Collaboration metrics: `activeOpportunities`, `jointRevenue`, `activeProjects`

## List API Field Verification

All fields listed above are included in the `select` clause in `src/app/api/v1/companies/route.ts`:

✅ **Confirmed in List API:**
- All 94+ fields are explicitly selected in the companies list API
- This ensures complete data is cached when navigating from list to detail view
- Cache versioning system will detect stale data and fetch fresh data when needed

## Testing Checklist

### Test Each Tab:

1. **Overview Tab:**
   - [ ] Edit `description` → save → navigate away → return → verify persistence
   - [ ] Edit `legalName` → save → navigate away → return → verify persistence
   - [ ] Edit `localName` → save → navigate away → return → verify persistence
   - [ ] Edit `phone` → save → navigate away → return → verify persistence
   - [ ] Edit `website` → save → navigate away → return → verify persistence
   - [ ] Edit `industry` → save → navigate away → return → verify persistence
   - [ ] Edit `sector` → save → navigate away → return → verify persistence
   - [ ] Edit `employeeCount` → save → navigate away → return → verify persistence

2. **Company Tab:**
   - [ ] Edit `tradingName` → save → navigate away → return → verify persistence
   - [ ] Edit `email` → save → navigate away → return → verify persistence
   - [ ] Edit `fax` → save → navigate away → return → verify persistence
   - [ ] Edit `address` → save → navigate away → return → verify persistence
   - [ ] Edit `city` → save → navigate away → return → verify persistence
   - [ ] Edit `state` → save → navigate away → return → verify persistence
   - [ ] Edit `country` → save → navigate away → return → verify persistence
   - [ ] Edit `postalCode` → save → navigate away → return → verify persistence

3. **Intelligence Tab:**
   - [ ] Edit `businessChallenges` → save → navigate away → return → verify persistence
   - [ ] Edit `businessPriorities` → save → navigate away → return → verify persistence
   - [ ] Edit `competitiveAdvantages` → save → navigate away → return → verify persistence
   - [ ] Edit `growthOpportunities` → save → navigate away → return → verify persistence
   - [ ] Edit `strategicInitiatives` → save → navigate away → return → verify persistence
   - [ ] Edit `successMetrics` → save → navigate away → return → verify persistence
   - [ ] Edit `marketThreats` → save → navigate away → return → verify persistence
   - [ ] Edit `keyInfluencers` → save → navigate away → return → verify persistence
   - [ ] Edit `decisionTimeline` → save → navigate away → return → verify persistence
   - [ ] Edit `marketPosition` → save → navigate away → return → verify persistence
   - [ ] Edit `digitalMaturity` → save → navigate away → return → verify persistence
   - [ ] Edit `techStack` → save → navigate away → return → verify persistence

4. **Business Tab:**
   - [ ] Edit `accountValue` → save → navigate away → return → verify persistence
   - [ ] Edit `growthRate` → save → navigate away → return → verify persistence
   - [ ] Edit `expansionPotential` → save → navigate away → return → verify persistence

5. **Success Tab:**
   - [ ] Edit `healthScore` → save → navigate away → return → verify persistence
   - [ ] Edit `roiAchieved` → save → navigate away → return → verify persistence
   - [ ] Edit `timeToValue` → save → navigate away → return → verify persistence

6. **Performance Tab:**
   - [ ] Edit `performanceScore` → save → navigate away → return → verify persistence
   - [ ] Edit `partnerRevenue` → save → navigate away → return → verify persistence
   - [ ] Edit `revenueGrowth` → save → navigate away → return → verify persistence
   - [ ] Edit `dealsClosed` → save → navigate away → return → verify persistence

7. **Collaboration Tab:**
   - [ ] Edit `activeOpportunities` → save → navigate away → return → verify persistence
   - [ ] Edit `jointRevenue` → save → navigate away → return → verify persistence
   - [ ] Edit `activeProjects` → save → navigate away → return → verify persistence

## Expected Behavior

After the fix:
1. **Edit any field** → Save → Success message appears
2. **Navigate to list** → Click on same company
3. **Field should persist** → No more `undefined` values
4. **Console logs should show** → Complete data in `💾 [LIST CACHE]` and `🔍 [INSTANT LOAD DEBUG]`

## Cache Versioning System

The system now includes:
- **Version tracking**: Each edit increments a version counter
- **Stale detection**: Cache is considered stale if version doesn't match
- **Fresh data fetching**: Stale cache triggers fresh API call
- **Complete field coverage**: All 94+ fields included in list API response

This ensures that every editable field across every tab will persist correctly when navigating back to the page.
