# Lusha API Optimal Enrichment Strategy

## Overview
This guide outlines the optimal approach for enriching contact data using the Lusha API in the Adrata platform.

## 🎯 Success Rate Rankings

### 1. LinkedIn URL Method (95%+ Success)
**Best for:** When you have a LinkedIn profile URL
```typescript
const params = new URLSearchParams({
  linkedinUrl: 'https://www.linkedin.com/in/contact-name/',
  refreshJobInfo: 'true',
  revealEmails: 'true',
  revealPhones: 'true'
});
```

### 2. Email Method (85%+ Success)
**Best for:** When you have an email address
```typescript
const params = new URLSearchParams({
  email: 'contact@company.com',
  refreshJobInfo: 'true',
  revealEmails: 'true',
  revealPhones: 'true'
});
```

### 3. Name + Company Method (70%+ Success)
**Best for:** When you have name and company information
```typescript
const params = new URLSearchParams({
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Company Name',
  companyDomain: 'company.com',
  refreshJobInfo: 'true',
  revealEmails: 'true',
  revealPhones: 'true'
});
```

## 🔄 Optimal Enrichment Workflow

### Step 1: Data Quality Assessment
Before making API calls, assess your data quality:

```typescript
interface ContactData {
  linkedinUrl?: string;    // Highest priority
  email?: string;          // High priority
  firstName?: string;      // Medium priority
  lastName?: string;       // Medium priority
  companyName?: string;    // Medium priority
  companyDomain?: string;  // Medium priority
}

function assessDataQuality(contact: ContactData): 'high' | 'medium' | 'low' {
  if (contact.linkedinUrl) return 'high';
  if (contact.email) return 'high';
  if (contact.firstName && contact.lastName && (contact.companyName || contact.companyDomain)) {
    return 'medium';
  }
  return 'low';
}
```

### Step 2: Prioritized API Calls
Use a waterfall approach based on data availability:

```typescript
async function enrichContact(contact: ContactData): Promise<EnrichmentResult> {
  // 1. Try LinkedIn URL first (highest success rate)
  if (contact.linkedinUrl) {
    const result = await tryLinkedInEnrichment(contact.linkedinUrl);
    if (result.success) return result;
  }
  
  // 2. Try email lookup (high success rate)
  if (contact.email) {
    const result = await tryEmailEnrichment(contact.email);
    if (result.success) return result;
  }
  
  // 3. Try name + company lookup (medium success rate)
  if (contact.firstName && contact.lastName && (contact.companyName || contact.companyDomain)) {
    const result = await tryNameCompanyEnrichment(contact);
    if (result.success) return result;
  }
  
  return { success: false, reason: 'Insufficient data for enrichment' };
}
```

## 📊 Bulk Enrichment Strategy

### For Large Datasets (100+ contacts)
Use the **bulk API endpoint** for efficiency:

```typescript
async function bulkEnrichContacts(contacts: ContactData[]): Promise<BulkEnrichmentResult> {
  const requestBody = {
    contacts: contacts.map((contact, index) => ({
      contactId: index.toString(),
      fullName: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      linkedinUrl: contact.linkedinUrl,
      companies: [{
        name: contact.companyName,
        domain: contact.companyDomain,
        isCurrent: true
      }]
    })),
    metadata: {
      revealEmails: true,
      revealPhones: true,
      signals: ['promotion', 'companyChange'],
      signalsStartDate: '2025-01-01',
      partialProfile: true
    }
  };
  
  const response = await fetch('https://api.lusha.com/v2/person', {
    method: 'POST',
    headers: {
      'api_key': process.env.LUSHA_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  return await response.json();
}
```

## 🚨 Rate Limiting Best Practices

### Current Rate Limits
- **General API**: 25 requests per second
- **Usage API**: 5 requests per minute
- **Daily limits**: Vary by plan

### Implementation Strategy
```typescript
class LushaRateLimiter {
  private lastRequestTime = 0;
  private readonly MIN_DELAY = 40; // 40ms = 25 requests/second
  
  async makeRequest<T>(apiCall: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, this.MIN_DELAY - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    return await apiCall();
  }
}
```

## 🎯 Data Quality Optimization

### Pre-Enrichment Data Cleaning
```typescript
function cleanContactData(contact: RawContactData): ContactData {
  return {
    linkedinUrl: contact.linkedinUrl?.trim(),
    email: contact.email?.toLowerCase().trim(),
    firstName: contact.firstName?.trim(),
    lastName: contact.lastName?.trim(),
    companyName: contact.companyName?.trim(),
    companyDomain: contact.companyDomain?.toLowerCase().trim()
  };
}
```

### Alternative Company Names
For better matching, try multiple company name variations:

```typescript
const companyVariations = [
  'Southern California Edison',
  'SCE',
  'Edison International',
  'Edison',
  'Southern California Edison Company'
];

async function tryMultipleCompanyNames(contact: ContactData): Promise<EnrichmentResult> {
  for (const companyName of companyVariations) {
    const result = await tryNameCompanyEnrichment({
      ...contact,
      companyName
    });
    if (result.success) return result;
  }
  return { success: false };
}
```

## 📈 Success Metrics

### Expected Success Rates by Data Quality
- **LinkedIn URL**: 95%+ success rate
- **Email**: 85%+ success rate  
- **Name + Company**: 70%+ success rate
- **Name only**: 30%+ success rate

### Cost Optimization
- **LinkedIn method**: Most cost-effective (1 credit per successful lookup)
- **Email method**: Good cost-benefit ratio
- **Name + Company**: Higher cost, lower success rate

## 🔧 Implementation in Adrata

### Current Integration Points
1. **ContactIntelligence.ts** - Main enrichment logic
2. **LushaRateLimitService.ts** - Rate limiting management
3. **ContactValidator.js** - Data validation and cleaning

### Recommended Enhancements
1. **Implement waterfall enrichment** based on data availability
2. **Add bulk enrichment** for large datasets
3. **Enhance rate limiting** with exponential backoff
4. **Add success rate tracking** for optimization

## 🚀 Next Steps

1. **Test current implementation** with sample data
2. **Implement waterfall approach** in ContactIntelligence.ts
3. **Add bulk enrichment** for large datasets
4. **Monitor success rates** and optimize accordingly
5. **Consider LinkedIn URL collection** for highest success rates

## 📞 Support

For Lusha API issues:
- **Documentation**: https://docs.lusha.com
- **Support**: support@lusha.com
- **Dashboard**: https://dashboard.lusha.com/enrich/api
