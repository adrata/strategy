# Future Now - Production Intelligence Pipeline

This directory contains production-ready intelligence discovery modules organized by function with intelligent buyer group justification and company size-based optimization.

## Folder Structure

```
_future_now/
├── find-buyer-group/                      # Main buyer group discovery pipeline
│   ├── index.js                           # Main orchestrator (8-stage pipeline)
│   ├── company-intelligence.js            # Company research & tier-based sizing
│   ├── preview-search.js                  # Targeted employee discovery (company name-based with retry logic)
│   ├── smart-scoring.js                   # Multi-dimensional employee scoring
│   ├── role-assignment.js                 # Company size-based role assignment with detailed reasoning
│   ├── company-size-config.js             # Revenue/employee tier configuration & dynamic sizing
│   ├── cross-functional.js                # Stakeholder coverage validation
│   ├── cohesion-validator.js              # Group cohesion analysis
│   ├── research-report.js                 # Defensible research report with detailed justifications
│   ├── utils.js                           # Shared utility functions
│   ├── consolidated.js                    # Consolidated buyer group engine
│   ├── buyer-group-discovery-worker.ts    # Background job processor
│   └── production-buyer-group.js          # Main production script
├── integrations/                           # Data source integrations
│   └── coresignal/                        # Coresignal API integration
│       └── index.js
├── find-person/                           # Individual person discovery
│   └── index.js
├── find-company/                          # Company discovery & enrichment
│   └── index.js
├── find-role/                             # Role-based person search
│   └── index.js
├── find-optimal-buyer-group/               # Optimal buyer group algorithms
│   └── index.js
└── README.md                              # This documentation
```

## Company Size Tiers

The system uses revenue and employee-based company sizing for optimized role distribution:

### Small Companies (S1-S7): $0 - $10M
- **S1**: $0 - $100K (Micro/Solopreneur)
- **S2**: $100K - $250K (Very Small Business)  
- **S3**: $250K - $500K (Small Business)
- **S4**: $500K - $1M (Growing Small)
- **S5**: $1M - $2.5M (Established Small)
- **S6**: $2.5M - $5M (Large Small)
- **S7**: $5M - $10M (Upper Small)

### Medium Companies (M1-M7): $10M - $100M
- **M1**: $10M - $15M (Lower Mid-Market)
- **M2**: $15M - $25M (Mid-Market Entry)
- **M3**: $25M - $40M (Core Mid-Market)
- **M4**: $40M - $60M (Upper Mid-Market)
- **M5**: $60M - $75M (Advanced Mid-Market)
- **M6**: $75M - $85M (Large Mid-Market)
- **M7**: $85M - $100M (Pre-Enterprise)

### Large Companies (L1-L7): $100M+
- **L1**: $100M - $250M (Lower Enterprise)
- **L2**: $250M - $500M (Enterprise)
- **L3**: $500M - $1B (Large Enterprise)
- **L4**: $1B - $5B (Major Enterprise)
- **L5**: $5B - $10B (Fortune 1000)
- **L6**: $10B - $50B (Fortune 500)
- **L7**: $50B+ (Fortune 100+)

## Dynamic Buyer Group Sizing

Buyer group sizes scale with company complexity:

- **S1-S3** (Micro-Small): 3-5 members (lean decision-making)
- **S4-S7** (Growing Small-Upper Small): 5-8 members (emerging hierarchy)
- **M1-M4** (Mid-Market): 7-10 members (departmental stakeholders)
- **M5-M7** (Upper Mid-Market): 8-12 members (cross-functional)
- **L1-L4** (Enterprise): 10-15 members (complex approval chains)
- **L5-L7** (Fortune 500+): 12-18 members (extensive stakeholder matrix)

## Role Distribution

Each company tier has optimized role distribution targets:

- **Decision Makers**: 15% (C-level, VPs with budget authority based on deal size)
- **Champions**: 25% (Directors, Managers in relevant departments)
- **Stakeholders**: 30% (Adjacent functions, influencers)
- **Blockers**: 10% (Procurement, Legal, Security, Compliance)
- **Introducers**: 20% (Customer-facing, Relationship roles)

## Intelligent Justification

Every buyer group member includes detailed reasoning:

- **Budget Authority**: Why this person controls budget for this deal size
- **Department Relevance**: How their function relates to the purchase decision
- **Seniority Appropriateness**: Why their level matches the deal size
- **Influence Indicators**: Network size, management level, cross-functional reach
- **Deal Context**: Specific reasoning for this product category and deal value

## Usage

### Command Line
```bash
node production-buyer-group.js \
  --linkedin-url "https://www.linkedin.com/company/example" \
  --deal-size 150000 \
  --max-pages 5
```

### Programmatic
```javascript
const { ProductionBuyerGroupPipeline } = require('./production-buyer-group');

const pipeline = new ProductionBuyerGroupPipeline({
  linkedinUrl: 'https://www.linkedin.com/company/example',
  dealSize: 150000,
  maxPages: 5
});

const result = await pipeline.run();
```

## Environment Variables

Required environment variables:
- `CORESIGNAL_API_KEY`: Coresignal API key for employee discovery
- `CLAUDE_API_KEY`: Claude API key for AI analysis
- Database connection variables for Prisma

## Database Schema

Uses `prisma/schema-streamlined.prisma` with:
- `BuyerGroups`: Main buyer group records
- `BuyerGroupMembers`: Individual member records
- `people`: Enhanced with buyer group role fields

## Pipeline Stages

1. **Company Intelligence**: Research company size and context, determine tier
2. **Employee Discovery**: Targeted search by priority titles (VP, Director, Manager)
3. **Smart Scoring**: Multi-dimensional employee scoring
4. **Role Assignment**: Company size-based role distribution with detailed reasoning
5. **Group Selection**: Optimal buyer group selection using tier-based sizing
6. **Cross-Functional Coverage**: Stakeholder validation
7. **Profile Collection**: Full profile enrichment
8. **Cohesion Validation**: Group cohesion analysis
9. **Report Generation**: Defensible research report with detailed justifications

## Background Job Processing

The system integrates with the existing platform queue system:

- **Worker**: `buyer-group-discovery-worker.ts` processes background jobs
- **Queue Integration**: Uses `src/platform/services/job-queue/queue-manager.ts`
- **Retry Logic**: Built-in retry for API timeouts and rate limits
- **Monitoring**: Job status tracking and error handling

## Cost Management

- **Preview API**: $0.10 per 10 employees (first 50 employees free)
- **Collect API**: $1.00 per full profile
- **AI Analysis**: Included in pipeline costs
- **Total Typical Cost**: $5-15 per buyer group discovery