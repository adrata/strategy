# API Configuration Guide for CFO/CRO Discovery

## Overview

This guide documents the configuration and role of each API in the multi-source verification pipeline for finding and verifying CFO/CRO contacts.

## 1. CoreSignal API

**Purpose**: Find actual CFOs/CROs using Elasticsearch queries and company data

**Endpoints**:
- **Elasticsearch Search**: `POST /cdapi/v2/employee_multi_source/search/es_dsl` (1 credit per search)
- **Employee Collect**: `POST /cdapi/v2/employee_multi_source/collect` (1 credit per profile)
- **Company Collect**: `GET /cdapi/v2/company_multi_source/collect/{company}` (2 credits, fallback)

**Authentication**: `apikey` header

**Configuration**:
```javascript
CORESIGNAL_API_KEY="your_api_key_here"
CORESIGNAL_BASE_URL="https://api.coresignal.com"
```

**Role in Pipeline**: 
- Primary source for finding executives by exact job titles
- Uses Elasticsearch queries to find "Chief Financial Officer", "CFO", "Chief Revenue Officer", "CRO"
- Falls back to key_executives if Elasticsearch doesn't find exact matches
- Provides full employee profiles with contact information

**Data Flow**:
1. Search for exact titles using Elasticsearch
2. Collect full profiles for matches
3. Fallback to key_executives if needed

## 2. Lusha API (FIXED ✓)

**Purpose**: Person verification and contact enrichment

**Endpoints**:
- **Person Lookup**: `POST https://api.lusha.com/person`
- **Prospecting**: `POST https://api.lusha.com/v1/prospecting/contact/search`

**Authentication**: `X-API-Key` header (FIXED from `apikey`)

**Configuration**:
```javascript
LUSHA_API_KEY="your_api_key_here"
```

**Role in Pipeline**: 
- Verify person identity and find contact info (email/phone)
- Cross-reference executive data from CoreSignal
- Provide additional contact details and verification

**Data Flow**:
1. Receive person data from CoreSignal
2. Verify person exists and matches company
3. Enrich with additional contact information

## 3. Perplexity API (Pending Funds)

**Purpose**: Real-time employment verification using AI

**Endpoint**: `POST https://api.perplexity.ai/chat/completions`

**Authentication**: `Authorization: Bearer {API_KEY}`

**Configuration**:
```javascript
PERPLEXITY_API_KEY="pplx-your_api_key_here"
```

**Role in Pipeline**: 
- Verify current employment status of executives
- Cross-check if person is still in role
- Provide real-time verification using web search

**Data Flow**:
1. Receive executive name and title from CoreSignal
2. Query Perplexity: "Is [Name] currently the [Title] at [Company]?"
3. Get YES/NO response with confidence score

## 4. Prospeo API (Needs Research)

**Purpose**: Email verification and validation

**Endpoints**: Multiple options being tested:
- `https://api.prospeo.io/email-verifier/v1/verify`
- `https://api.prospeo.io/v1/email/verify`
- `https://prospeo.io/api/v1/email/verify`
- `https://api.prospeo.io/email-verifier`

**Authentication**: `X-API-Key` header (testing multiple formats)

**Configuration**:
```javascript
PROSPEO_API_KEY="your_api_key_here"
```

**Role in Pipeline**: 
- Multi-layer email validation
- Verify email addresses are valid and deliverable
- Check email reputation and domain validity

**Data Flow**:
1. Receive email from CoreSignal or Lusha
2. Test multiple Prospeo endpoints
3. Validate email deliverability and reputation

## 5. People Data Labs API

**Purpose**: Phone verification and person enrichment

**Endpoint**: `POST https://api.peopledatalabs.com/v5/person/enrich`

**Authentication**: `X-API-Key` header

**Configuration**:
```javascript
PEOPLE_DATA_LABS_API_KEY="your_api_key_here"
```

**Role in Pipeline**: 
- Verify and enrich phone numbers
- Cross-reference person data
- Provide additional contact verification

**Data Flow**:
1. Receive phone number from CoreSignal or Lusha
2. Enrich with People Data Labs
3. Verify phone number validity and ownership

## 6. Twilio Lookup API

**Purpose**: Phone number validation and carrier lookup

**Endpoint**: `GET https://lookups.twilio.com/v1/PhoneNumbers/{phone}`

**Authentication**: Basic Auth with Account SID and Auth Token

**Configuration**:
```javascript
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
```

**Role in Pipeline**: 
- Validate phone number format
- Check carrier information
- Verify number is active

## Complete Data Flow

```
1. CoreSignal Elasticsearch → Find actual CFO/CRO by exact title
2. CoreSignal Collect → Get full profile data
3. Lusha → Verify person identity and find contacts
4. Perplexity → Verify current employment (when funds added)
5. Prospeo → Verify email addresses (testing endpoints)
6. People Data Labs → Verify phone numbers
7. Twilio → Validate phone format and carrier
```

## API Credit Management

**CoreSignal**:
- Elasticsearch search: 1 credit per search
- Employee collect: 1 credit per profile
- Company collect: 2 credits per company

**Lusha**: 
- Person lookup: 1 credit per lookup
- Prospecting: 1 credit per search

**Perplexity**: 
- Chat completion: ~$0.001 per request

**Prospeo**: 
- Email verification: 1 credit per verification

**People Data Labs**: 
- Person enrich: 1 credit per enrichment

**Twilio**: 
- Phone lookup: $0.005 per lookup

## Error Handling

Each API includes:
- Timeout handling (30 seconds default)
- Retry logic (2 retries default)
- Graceful fallback when APIs fail
- Detailed error logging
- Credit usage tracking

## Testing Checklist

- [ ] CoreSignal Elasticsearch finds actual CFOs (not Senior Directors)
- [ ] Lusha API authenticates with X-API-Key header
- [ ] Perplexity API works after funds added
- [ ] Prospeo API finds working endpoint
- [ ] People Data Labs returns valid confidence scores
- [ ] Twilio Lookup validates phone numbers
- [ ] All APIs handle errors gracefully
- [ ] Credit usage is tracked accurately

## Success Criteria

- CoreSignal finds actual CFOs (e.g., "Amy Weaver" at Salesforce, not "Senior Director")
- All APIs authenticate successfully
- Multi-source verification provides confidence scores
- CSV output contains actual C-level executives
- Verification trails show which APIs worked/failed
- Credit usage is monitored and logged
