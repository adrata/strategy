# Buyer Group Intelligence V2

The next-generation buyer group discovery and analysis system powered by AI, real-time data, and multi-signal validation.

## Overview

Buyer Group V2 is a comprehensive system for discovering, analyzing, and managing buyer groups within target companies. It combines AI-powered role classification, real-time data updates, and sophisticated validation to provide accurate, actionable buyer group intelligence.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Buyer Group V2 System                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Main Engine   │  │   AI Services   │  │   Webhooks   │ │
│  │                 │  │                 │  │              │ │
│  │ • Discovery     │  │ • Classification│  │ • Real-time  │ │
│  │ • Validation    │  │ • Analysis      │  │ • Updates    │ │
│  │ • Optimization  │  │ • Scoring       │  │ • Processing │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Enrichers     │  │   APIs          │  │   Database   │ │
│  │                 │  │                 │  │              │ │
│  │ • Company       │  │ • Discovery     │  │ • PostgreSQL │ │
│  │ • Person        │  │ • Optimal       │  │ • Prisma     │ │
│  │ • Role          │  │ • Webhook       │  │ • Migrations │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Consolidated Buyer Group Engine (`engine.ts`)

The main orchestrator that coordinates all buyer group discovery activities.

**Key Features:**
- Multi-signal role classification (AI + rules + LinkedIn verification)
- Adaptive sizing based on company size
- Product-specific relevance filtering
- Progressive enrichment levels (identify, enrich, deep_research)
- Real-time accuracy validation

**Usage:**
```typescript
import { ConsolidatedBuyerGroupEngine } from '@/platform/intelligence/buyer-group-v2/engine';

const engine = new ConsolidatedBuyerGroupEngine();
const result = await engine.discoverBuyerGroup({
  companyName: 'Nike',
  workspaceId: 'workspace-id',
  enrichmentLevel: 'enrich',
  sellerProfile: {
    solutionCategory: 'revenue_technology',
    targetMarket: 'enterprise'
  }
});
```

### 2. Service Layer

#### Company Enricher (`services/company-enricher.ts`)
Enriches company data using Coresignal API with multiple search strategies.

#### Person Enricher (`services/person-enricher.ts`)
Enriches person data using direct email and LinkedIn matching.

#### Optimal Buyer Finder (`services/optimal-buyer-finder.ts`)
Two-phase analysis for finding the best companies to target:
- Phase 1: Market filtering with firmographic + growth signals
- Phase 2: Buyer group quality sampling with AI analysis

#### Role Finder (`services/role-finder.ts`)
AI-powered role discovery within companies using Claude AI.

### 3. Webhook Integration (`webhooks/`)

Real-time data updates from Coresignal webhooks:
- Employee changes (added, updated, deleted)
- Company updates and merges
- Automatic buyer group refresh

## API Endpoints

### Buyer Group Discovery
```
POST /api/intelligence/buyer-group-v2
```

**Request:**
```json
{
  "companyName": "Nike",
  "companyId": "optional-company-id",
  "companyLinkedInUrl": "optional-linkedin-url",
  "sellerProfile": {
    "solutionCategory": "revenue_technology",
    "targetMarket": "enterprise"
  },
  "enrichmentLevel": "enrich",
  "saveToDatabase": true
}
```

**Response:**
```json
{
  "success": true,
  "company": {
    "name": "Nike",
    "website": "https://nike.com",
    "industry": "Apparel & Fashion"
  },
  "buyerGroup": {
    "totalMembers": 12,
    "composition": {
      "decision_maker": 2,
      "champion": 3,
      "stakeholder": 5,
      "blocker": 1,
      "introducer": 1
    },
    "members": [...]
  },
  "quality": {
    "coverage": "excellent",
    "confidence": 92,
    "dataQuality": 95,
    "overallScore": 93
  }
}
```

### Optimal Buyer Search
```
GET /api/intelligence/buyer-group-v2?industries=Software,SaaS&sizeRange=50-200&maxResults=50
```

### AI Chat Tool
```
POST /api/ai-chat/tools/find-role-at-company
```

**Query Examples:**
- "find CFO at Nike"
- "who is the CTO at Salesforce"
- "get me the CMO of Adobe"

## Configuration

### Environment Variables

```bash
# Required
CORESIGNAL_API_KEY=your_coresignal_key
ANTHROPIC_API_KEY=your_anthropic_key
DATABASE_URL=your_database_url

# Optional
CORESIGNAL_WEBHOOK_SECRET=your_webhook_secret
BUYER_GROUP_SAMPLING=true
REAL_TIME_UPDATES=true
MAX_COMPANIES_PER_REQUEST=50
MAX_EMPLOYEES_PER_COMPANY=200
MAX_BUYER_GROUP_SIZE=18
```

### Feature Flags

```typescript
import { buyerGroupV2Config } from '@/platform/intelligence/buyer-group-v2/config';

const flags = buyerGroupV2Config.getFeatureFlags();
// {
//   enableBuyerGroupSampling: true,
//   enableWebhooks: true,
//   enableAIClassification: true,
//   enableRealTimeUpdates: true
// }
```

## Database Schema

### BuyerGroups Table
```sql
CREATE TABLE "BuyerGroups" (
  "id" TEXT PRIMARY KEY,
  "companyName" TEXT NOT NULL,
  "website" TEXT,
  "industry" TEXT,
  "companySize" TEXT,
  "workspaceId" TEXT,
  "companyId" TEXT,
  "status" TEXT DEFAULT 'active',
  "enrichmentLevel" TEXT DEFAULT 'enrich',
  "cohesionScore" DECIMAL(5,2) DEFAULT 0,
  "overallConfidence" DECIMAL(5,2) DEFAULT 0,
  "totalMembers" INTEGER DEFAULT 0,
  "processingTime" INTEGER DEFAULT 0,
  "composition" JSONB,
  "qualityMetrics" JSONB,
  "creditsUsed" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP
);
```

### BuyerGroupMembers Table
```sql
CREATE TABLE "BuyerGroupMembers" (
  "id" TEXT PRIMARY KEY,
  "buyerGroupId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT,
  "role" "BuyerGroupRole" NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "linkedin" TEXT,
  "confidence" DECIMAL(5,2) DEFAULT 0,
  "influenceScore" DECIMAL(5,2) DEFAULT 0,
  "coresignalId" TEXT,
  "department" TEXT,
  "seniorityLevel" TEXT,
  "location" TEXT,
  "profilePicture" TEXT,
  "summary" TEXT,
  "experience" JSONB,
  "skills" TEXT[] DEFAULT '{}',
  "priority" INTEGER DEFAULT 5,
  "customFields" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP
);
```

## Usage Examples

### 1. Basic Buyer Group Discovery

```typescript
import { ConsolidatedBuyerGroupEngine } from '@/platform/intelligence/buyer-group-v2/engine';

const engine = new ConsolidatedBuyerGroupEngine();

// Discover buyer group for a company
const result = await engine.discoverBuyerGroup({
  companyName: 'Nike',
  workspaceId: 'workspace-123',
  enrichmentLevel: 'enrich'
});

console.log(`Found ${result.buyerGroup.length} buyer group members`);
console.log(`Quality Score: ${result.qualityMetrics.overallScore}%`);
```

### 2. Optimal Buyer Search

```typescript
import { OptimalBuyerFinder } from '@/platform/intelligence/buyer-group-v2/services/optimal-buyer-finder';

const finder = new OptimalBuyerFinder();

// Find optimal buyers in SaaS industry
const result = await finder.findOptimalBuyers({
  industries: ['Software', 'SaaS'],
  sizeRange: '50-200 employees',
  maxResults: 50,
  enableBuyerGroupSampling: true,
  workspaceId: 'workspace-123'
});

console.log(`Found ${result.companies.length} optimal buyer companies`);
```

### 3. Company Enrichment

```typescript
import { CompanyEnricher } from '@/platform/intelligence/buyer-group-v2/services/company-enricher';

const enricher = new CompanyEnricher();

// Enrich a single company
const result = await enricher.enrichCompany({
  companyName: 'Nike',
  website: 'https://nike.com',
  workspaceId: 'workspace-123'
});

if (result.success) {
  console.log('Company enriched:', result.enrichedData);
}
```

### 4. AI Chat Integration

```typescript
// The AI chat tool is automatically integrated
// Users can ask questions like:
// - "find CFO at Nike"
// - "who is the CTO at Salesforce"
// - "get me the CMO of Adobe"

// The system will automatically:
// 1. Parse the query to extract role and company
// 2. Search for the person using PersonEnricher
// 3. Return formatted results with contact information
```

## Performance Optimization

### Adaptive Sizing
Buyer group sizes are automatically adjusted based on company size:
- Enterprise (10,000+): 12-18 people
- Large (1,000-9,999): 8-15 people
- Mid-market (500-999): 6-12 people
- SMB (100-499): 4-8 people
- Small (<100): 3-6 people

### Caching Strategy
- Company data cached for 24 hours
- Person data cached for 7 days
- Buyer group analysis cached for 30 days
- Real-time updates via webhooks

### Rate Limiting
- 1 second delay between API requests
- 3 second delay between batches
- Automatic retry with exponential backoff

## Monitoring and Analytics

### Quality Metrics
- **Core Member Accuracy**: Percentage of correctly identified decision makers
- **Role Assignment Accuracy**: Accuracy of role classifications
- **Data Quality**: Completeness and freshness of contact information
- **Overall Score**: Weighted combination of all metrics

### Performance Metrics
- Processing time per company
- API credits used per request
- Cache hit rates
- Error rates and retry counts

### Real-time Monitoring
- Webhook delivery status
- Data freshness timestamps
- Subscription health checks
- Error alerting

## Troubleshooting

### Common Issues

1. **API Key Errors**
   ```bash
   Error: CORESIGNAL_API_KEY environment variable is required
   ```
   Solution: Ensure all required environment variables are set.

2. **Database Connection Issues**
   ```bash
   Error: Database connection failed
   ```
   Solution: Check DATABASE_URL and ensure database is accessible.

3. **Webhook Verification Failed**
   ```bash
   Error: Invalid webhook signature
   ```
   Solution: Verify CORESIGNAL_WEBHOOK_SECRET matches Coresignal configuration.

4. **No Results Found**
   ```bash
   No people found for role at company
   ```
   Solution: Try different role variations or check company name spelling.

### Debug Mode

Enable debug logging:
```bash
DEBUG=buyer-group-v2:* npm run dev
```

### Health Checks

Check system health:
```typescript
import { buyerGroupV2Config } from '@/platform/intelligence/buyer-group-v2/config';

const health = await buyerGroupV2Config.validateApiKeys();
console.log('API Health:', health);
```

## Migration from V1

The V2 system is designed to be backward compatible with V1 data. Existing buyer groups will continue to work while new features are gradually enabled.

### Migration Steps

1. **Database Migration**: Apply the V2 schema changes
2. **API Updates**: Update API calls to use V2 endpoints
3. **Feature Flags**: Enable V2 features gradually
4. **Data Migration**: Migrate existing buyer group data
5. **Testing**: Validate all functionality works correctly

### Breaking Changes

- New required fields in API requests
- Updated response format
- New database schema fields
- Changed webhook payload format

## Support

For issues, questions, or feature requests:
- Check the troubleshooting section above
- Review the API documentation
- Check system logs for detailed error information
- Contact the development team

## License

This system is part of the Adrata platform and is subject to the same licensing terms.