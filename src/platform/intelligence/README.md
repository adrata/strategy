# Intelligence Platform

**Single Source of Truth for all intelligence features**

## Overview

This directory contains ALL intelligence-related functionality organized by priority:

1. **Buyer Group Discovery** - World-class buyer group identification
2. **Person Research** - Deep person intelligence and enrichment
3. **Company Discovery** - People-centric ICP matching (our unique advantage!)
4. **Role-Based Search** - Universal role finding (CFO, CRO, CMO, etc.)

## Progressive Enrichment Levels

### Level 1: IDENTIFY (Fast & Cheap)
- **What**: Find people and basic info (name, title, company)
- **Speed**: <5 seconds per company
- **Cost**: ~$0.10 per company
- **Use Case**: "Show me the buyer group members"

### Level 2: ENRICH (Medium)
- **What**: Level 1 + verified contacts (email, phone, LinkedIn)
- **Speed**: <30 seconds per company
- **Cost**: ~$2-3 per company
- **Use Case**: "I need to reach these people"

### Level 3: DEEP RESEARCH (Comprehensive)
- **What**: Level 2 + full intelligence (career, relationships, signals)
- **Speed**: <2 minutes per company
- **Cost**: ~$5-8 per company
- **Use Case**: "Tell me everything about this buyer group"

## Directory Structure

```
intelligence/
├── buyer-group/        # Priority #1: Buyer Group Intelligence
├── person/             # Priority #2: Person Research
├── company/            # Priority #3: Company Discovery (People-Centric ICP)
├── role/               # Priority #4: Role-Based Search
└── shared/             # Shared types and utilities
```

## Quick Start

### Buyer Group Discovery

```typescript
import { BuyerGroupEngine } from '@/platform/intelligence/buyer-group/buyer-group-engine';

const engine = new BuyerGroupEngine();

// Level 1: Just identify
const result = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'identify'
});

// Level 2: Identify + enrich contacts
const enriched = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'enrich'
});

// Level 3: Full intelligence
const deepResearch = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'deep_research'
});
```

### People-Centric ICP (Our Unique Advantage!)

```typescript
import { PeopleCentricICP } from '@/platform/intelligence/company/people-centric-icp';

const icp = new PeopleCentricICP();

// Score companies based on people quality, not just firmographics
const scores = await icp.scoreCompanies({
  companies: ['Salesforce', 'HubSpot', 'Dell'],
  sellerProfile: {
    targetRoles: ['CFO', 'VP Finance'],
    solutionType: 'financial_software',
    dealSize: 'enterprise'
  }
});

// Get ranked recommendations
const recommendations = await icp.recommend({
  count: 10,
  filters: {
    industry: 'Technology',
    minEmployees: 1000
  }
});
```

## API Endpoints (v1)

All intelligence APIs are versioned under `/api/v1/intelligence/`:

- **Buyer Group**: `/api/v1/intelligence/buyer-group`
- **Person**: `/api/v1/intelligence/person`
- **Company ICP**: `/api/v1/intelligence/company/icp`
- **Role Finder**: `/api/v1/intelligence/role`

See individual README files in each subdirectory for detailed documentation.

## Design Principles

### 1. Progressive Enhancement
- Start fast and cheap (Level 1)
- Upgrade on-demand (Level 2, 3)
- Cache aggressively
- Background enrichment where appropriate

### 2. People-First
- Every company score includes people quality
- Buyer groups are the core data primitive
- Relationships drive recommendations
- Focus on WHO not WHAT

### 3. Modern 2025 Standards
- TypeScript for type safety
- Proper error handling
- Comprehensive logging
- Real-time streaming
- Smart caching

### 4. Cost Transparency
- Clear cost per enrichment level
- Smart API usage based on user intent
- Aggressive caching to avoid re-enrichment
- Batch processing for efficiency

## Database Schema

We use a streamlined approach - buyer group roles are stored directly in the `people` table:

```sql
people table:
- buyerGroupRole: 'decision' | 'champion' | 'stakeholder' | 'blocker' | 'introducer'
- buyerGroupConfidence: 0-100
- influenceScore: 0-100
```

**No separate buyer group tables needed!** This keeps things simple and efficient.

## Cost Guidelines

| Level | CoreSignal | Lusha/Contact | AI Analysis | Total |
|-------|-----------|---------------|-------------|-------|
| Level 1 (Identify) | $0.10 | $0 | $0 | ~$0.10 |
| Level 2 (Enrich) | $0.10 | $1.50 | $0 | ~$2.00 |
| Level 3 (Deep) | $0.10 | $1.50 | $3.00 | ~$5.00 |

## Next Steps

1. Read individual README files in each subdirectory
2. Check out the API documentation
3. Review the shared types in `shared/types.ts`
4. Start with Level 1 enrichment, upgrade as needed
