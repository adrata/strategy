# Buyer Group Intelligence (Priority #1)

World-class buyer group discovery with progressive enrichment levels.

## Quick Start

```typescript
import { BuyerGroupEngine } from '@/platform/intelligence/buyer-group/buyer-group-engine';

const engine = new BuyerGroupEngine();

// Level 1: Just identify (fast, cheap)
const result = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'identify',
  workspaceId: 'your-workspace-id'
});

// Level 2: Identify + enrich contacts
const enriched = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'enrich',
  workspaceId: 'your-workspace-id'
});

// Level 3: Full intelligence
const deepResearch = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'deep_research',
  workspaceId: 'your-workspace-id'
});
```

## Enrichment Levels

### Level 1: IDENTIFY
- **Speed**: <5 seconds
- **Cost**: ~$0.10
- **What You Get**: Names, titles, roles, basic info
- **APIs Used**: CoreSignal only

### Level 2: ENRICH
- **Speed**: <30 seconds
- **Cost**: ~$2-3
- **What You Get**: Level 1 + verified email, phone, LinkedIn
- **APIs Used**: CoreSignal + Lusha + ZeroBounce

### Level 3: DEEP RESEARCH
- **Speed**: <2 minutes
- **Cost**: ~$5-8
- **What You Get**: Level 2 + career analysis, relationships, signals
- **APIs Used**: CoreSignal + Lusha + ZeroBounce + Perplexity

## Buyer Group Roles

Each member is assigned one of these roles:

- **Decision Maker**: Final approval authority (CFO, CEO, VP)
- **Champion**: Internal advocate for your solution
- **Stakeholder**: Influences decision, user of solution
- **Blocker**: May resist or slow down the deal
- **Introducer**: Can introduce you to the buyer group

## API Endpoints

All buyer group APIs are under `/api/v1/intelligence/buyer-group/`:

- `POST /api/v1/intelligence/buyer-group` - Single company
- `POST /api/v1/intelligence/buyer-group/bulk` - Batch processing
- `POST /api/v1/intelligence/buyer-group/refresh` - Refresh stale data
- `GET /api/v1/intelligence/buyer-group?company=X` - Retrieve saved

## Database Schema

Buyer group roles are stored directly on the `people` table:

```sql
people:
  - buyerGroupRole: 'decision' | 'champion' | 'stakeholder' | 'blocker' | 'introducer'
  - buyerGroupConfidence: 0-100
  - influenceScore: 0-100
```

## Cost Optimization

1. **Start with Level 1** - See if the people are right before enriching contacts
2. **Cache aggressively** - Results are cached automatically
3. **Batch processing** - Use bulk endpoints for better rates
4. **Incremental upgrade** - Go from Level 1 → 2 → 3 as needed

## Quality Metrics

- **Cohesion Score** (0-10): How well the buyer group works together
- **Confidence** (0-100): How confident we are in role assignments
- **Influence Score** (0-100): Individual's decision-making power

## Integration Examples

### From AI Chat Panel

```typescript
// User: "Find the buyer group at Salesforce"
import { BuyerGroupEngine } from '@/platform/intelligence/buyer-group/buyer-group-engine';

const engine = new BuyerGroupEngine();
const result = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'enrich', // Default to medium
  workspaceId: context.workspaceId
});
```

### From CSV Upload

```typescript
import { BuyerGroupEngine } from '@/platform/intelligence/buyer-group/buyer-group-engine';

const engine = new BuyerGroupEngine();
const companies = parseCsv(csvFile); // ['Salesforce', 'HubSpot', ...]

const results = await engine.discoverBatch(
  companies.map(company => ({
    companyName: company,
    enrichmentLevel: 'enrich',
    workspaceId: context.workspaceId
  }))
);
```

## Architecture

```
BuyerGroupEngine (orchestrator)
  ├── ProgressiveEnrichmentEngine (routing)
  │   ├── Level 1: Identify Only
  │   ├── Level 2: Identify + Enrich
  │   └── Level 3: Deep Research
  │
  └── Database Layer (streamlined)
      └── Updates people.buyerGroupRole directly
```

## Next Steps

1. Read the main [Intelligence README](../README.md)
2. Check out [Person Intelligence](../person/README.md)
3. Explore [People-Centric ICP](../company/README.md)
4. Review [API Documentation](/api/v1/intelligence/buyer-group)

