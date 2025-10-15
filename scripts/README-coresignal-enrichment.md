# CoreSignal Website Enrichment API

## Overview
This script allows you to enrich company data by providing just a website URL. It uses the CoreSignal API to automatically find and enrich company information.

## Usage

### Command Line
```bash
# Enrich a company by website
node scripts/coresignal-enrich-by-website.js https://www.southerncompany.com

# Or with any website
node scripts/coresignal-enrich-by-website.js https://www.microsoft.com
node scripts/coresignal-enrich-by-website.js https://www.apple.com
```

### Programmatic Usage
```javascript
const { enrichCompanyByWebsite } = require('./scripts/coresignal-enrich-by-website');

// Enrich a company
const result = await enrichCompanyByWebsite('https://www.southerncompany.com');
console.log('Enriched company:', result);
```

## What It Does

1. **Website Normalization**: Cleans and normalizes the website URL
2. **CoreSignal API Call**: Uses the `/enrich` endpoint to get comprehensive company data
3. **Database Integration**: 
   - Checks if company already exists in database
   - Updates existing company with enriched data
   - Creates new company record if not found
4. **Data Mapping**: Maps all CoreSignal fields to your database schema

## Enriched Data Fields

The script enriches companies with:

### Basic Information
- Company name, legal name, trading name
- Website, email, phone, fax
- Address, city, state, country, postal code

### Business Intelligence
- Industry, sector, size, total employees
- Founded year, currency, description
- LinkedIn URL and followers
- Active job postings

### Technology Stack
- 463+ technologies used (for Southern Company example)
- Technology categories and classifications

### Social Media & Online Presence
- Facebook, Twitter, Instagram, YouTube, GitHub URLs
- Social media follower counts
- Company updates and activity

### Financial Information
- Public/private status
- Stock symbol (if public)
- Company logo URL

### Location Data
- HQ Location details
- Regional information
- Country ISO codes

### Business Classification
- NAICS codes
- SIC codes
- Business tags and categories
- Competitor information

## Example Output

```
🎯 ENRICHING COMPANY BY WEBSITE: https://www.southerncompany.com
===============================================

📊 Normalized website: southerncompany.com
🔍 Calling CoreSignal enrichment API...
✅ Found company: Southern Company
📊 Industry: Utilities
📊 Size: 10,001+ employees
📊 Employees: 11751
🆕 Creating new company record...
✅ Company successfully created with enriched data!

📊 ENRICHED DATA SUMMARY:
==========================
📊 Company Name: Southern Company
📊 Industry: Utilities
📊 Total Employees: 11751
📊 LinkedIn Followers: 200689
📊 Technologies Used: 463 technologies
📊 Is Public: true
📊 Stock Symbol: SO
📊 HQ Location: Atlanta, GA, United States
```

## API Endpoint Used

The script uses the CoreSignal enrichment endpoint:
```
GET https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website={website}
```

This is much more direct than the search endpoint and returns comprehensive company data in a single API call.

## Database Schema

The script automatically maps CoreSignal data to your existing database schema, including all the new CoreSignal enrichment fields we added:

- `isPublic`, `stockSymbol`, `logoUrl`
- `domain`, `hqLocation`, `hqFullAddress`
- `twitterFollowers`, `owlerFollowers`
- `companyUpdates`, `numTechnologiesUsed`
- `descriptionEnriched`, `descriptionMetadataRaw`
- `hqRegion`, `hqCountryIso2`, `hqCountryIso3`

## Error Handling

The script includes comprehensive error handling for:
- Invalid website URLs
- API connection issues
- Database constraint violations
- Data type mismatches
- Missing required fields

## Requirements

- Node.js environment
- CoreSignal API key in environment variables
- Prisma database connection
- Updated database schema with CoreSignal fields
