# Unified Intelligence Pipeline System

**Complete intelligence platform for discovering roles, companies, people, and buyer groups**

---

## Overview

The Unified Intelligence Pipeline System provides a standardized, people-centric approach to intelligence gathering:

- **Role Discovery** - Find people by any role (not just CFO/CRO)
- **Company Discovery** - Find companies using Target Company Intelligence (people-centric scoring)
- **Person Intelligence** - Deep research on specific individuals
- **Buyer Group Discovery** - Identify buying committees

---

## Standardized Actions

### DISCOVER
Find entities matching criteria:
- `discover('role', ...)` - Find people by role
- `discover('company', ...)` - Find companies by fit score
- `discover('buyer_group', ...)` - Find buyer groups

### ENRICH
Add contact information:
- `enrich('person', ..., 'enrich')` - Add email, phone, LinkedIn

### RESEARCH
Deep intelligence analysis:
- `research('person', ...)` - Innovation profile, pain signals, buying authority

---

## Intelligence Levels

1. **Identify** - Basic data (name, title, company)
2. **Enrich** - + Contact info (email, phone, LinkedIn)
3. **Research** - + Deep intelligence (innovation, pain, influence)

---

## Target Company Intelligence

**People-centric company scoring** (replaces traditional "ICP")

### Scoring Formula
```
Company Fit Score = 
  (Firmographics × 30%) +
  (Innovation Adoption × 25%) +
  (Pain Signals × 25%) +
  (Buyer Group Quality × 20%)
```

### Innovation Adoption (Diffusion of Innovation)
- **Innovators (2.5%)** - First to adopt, high risk tolerance
- **Early Adopters (13.5%)** - Quick to adopt, thought leaders
- **Early Majority (34%)** - Pragmatic, wait for validation
- **Late Majority (34%)** - Skeptical, adopt when necessary
- **Laggards (16%)** - Last to adopt, resistant to change

### Pain Signals
- `hiring_spike` - Growing pains
- `executive_turnover` - Change appetite
- `manual_processes` - Automation opportunity
- `tool_sprawl` - Consolidation need
- `compliance_deadline` - Must-solve urgency

---

## Quick Start

### 1. Find Companies (People-Centric)

```javascript
const { CompanyDiscoveryPipeline } = require('./company-discovery-pipeline');

const pipeline = new CompanyDiscoveryPipeline();

const result = await pipeline.discover({
  firmographics: {
    industry: ['SaaS'],
    employeeRange: { min: 100, max: 1000 }
  },
  innovationProfile: {
    segment: 'innovators' // Find innovator companies
  },
  painSignals: ['hiring_spike', 'executive_turnover'],
  minCompanyFitScore: 70, // Only 70+ scores
  limit: 10
});

console.log(result.companies);
// [
//   {
//     companyName: 'Nike',
//     companyFitScore: 87,
//     innovationProfile: { segment: 'early_adopter' },
//     painIndicators: [...]
//   }
// ]
```

### 2. Research a Person

```javascript
const { PersonIntelligencePipeline } = require('./person-intelligence-pipeline');

const pipeline = new PersonIntelligencePipeline();

const result = await pipeline.research({
  name: 'John Smith',
  company: 'Nike',
  analysisDepth: {
    innovationProfile: true,
    painAwareness: true,
    buyingAuthority: true,
    influenceNetwork: true,
    careerTrajectory: true,
    riskProfile: true
  }
});

console.log(result.data);
// {
//   person: { name: 'John Smith', title: 'VP Engineering' },
//   innovationProfile: { segment: 'innovator', confidence: 0.91 },
//   buyingAuthority: { role: 'decision_maker', estimatedSigningLimit: 250000 },
//   keyInsights: ['🚀 INNOVATOR', '✅ DECISION MAKER']
// }
```

### 3. Find People by Role

```javascript
const { RoleDiscoveryPipeline } = require('./role-discovery-pipeline');

const pipeline = new RoleDiscoveryPipeline();

const result = await pipeline.discover({
  roles: ['VP Marketing', 'CMO'],
  companies: ['Salesforce', 'HubSpot'],
  enrichmentLevel: 'enrich' // Get email/phone
});

console.log(result.people);
```

### 4. Unified API

```javascript
const { UnifiedIntelligencePipeline } = require('./unified-intelligence-pipeline');

const pipeline = new UnifiedIntelligencePipeline();

// Discover companies
await pipeline.discover('company', { ... });

// Research person
await pipeline.research('person', { name: 'John Smith', company: 'Nike' });

// Discover roles
await pipeline.discover('role', { roles: ['VP Marketing'], companies: [...] });
```

---

## API Endpoints

### Role Discovery
```bash
POST /api/v1/intelligence/role/discover
{
  "roles": ["VP Marketing"],
  "companies": ["Salesforce"],
  "enrichmentLevel": "enrich"
}
```

### Company Discovery
```bash
POST /api/v1/intelligence/company/discover
{
  "firmographics": { "industry": ["SaaS"] },
  "innovationProfile": { "segment": "innovators" },
  "minCompanyFitScore": 70
}
```

### Person Research
```bash
POST /api/v1/intelligence/person/research
{
  "name": "John Smith",
  "company": "Nike",
  "analysisDepth": {
    "innovationProfile": true,
    "buyingAuthority": true
  }
}
```

---

## Person Intelligence Dimensions

### 1. Innovation Profile
Classifies using Diffusion of Innovation theory
- **Segment**: innovators, early_adopters, early_majority, late_majority, laggards
- **Signals**: Conference speaking, blog posts, early tech adoption
- **Evidence**: "Adopted React in 2014 (early adopter)"

### 2. Pain Awareness
Detects active pain points
- **Active Pains**: scaling_challenges, manual_processes, technical_debt
- **Urgency Score**: 0-1 (based on recency and severity)
- **Keywords**: automation, efficiency, scale

### 3. Buying Authority
Determines role in buying process
- **Role**: decision_maker, champion, stakeholder, blocker, introducer
- **Budget Control**: very_high, high, moderate, low, none
- **Signing Limit**: Estimated based on title and company size

### 4. Influence Network
Maps organizational relationships
- **Reports To**: Direct manager
- **Direct Reports**: Team size
- **Key Relationships**: Cross-functional connections
- **External Influence**: Conference speaker, thought leader

### 5. Career Trajectory
Analyzes career momentum
- **Trend**: rising_star, stable, declining
- **Promotion Velocity**: very_fast, fast, moderate, slow
- **Job Change Likelihood**: high, moderate, low

### 6. Risk Profile
Classifies risk-taking propensity
- **Type**: aggressive_risk_taker, calculated_risk_taker, moderate_risk, risk_averse
- **Decision Style**: analytical_innovator, intuitive_visionary, pragmatic_innovator

---

## File Structure

```
src/platform/
├── pipelines/
│   ├── pipelines/core/
│   │   ├── unified-intelligence-pipeline.js ⭐ Main orchestrator
│   │   ├── role-discovery-pipeline.js
│   │   ├── company-discovery-pipeline.js
│   │   ├── person-intelligence-pipeline.js
│   │   └── buyer-group-discovery-pipeline.js
│   │
│   └── modules/core/
│       ├── TargetCompanyIntelligence.js
│       ├── InnovationAdoptionAnalyzer.js
│       ├── PainSignalDetector.js
│       ├── BuyerGroupQualityScorer.js
│       ├── PersonIntelligenceEngine.js
│       ├── PersonInnovationProfiler.js
│       ├── PersonPainAnalyzer.js
│       ├── BuyingAuthorityAnalyzer.js
│       ├── InfluenceNetworkMapper.js
│       ├── CareerTrajectoryAnalyzer.js
│       └── PersonRiskProfiler.js
│
└── app/api/v1/intelligence/
    ├── role/discover/route.ts
    ├── company/discover/route.ts
    └── person/research/route.ts
```

---

## Key Innovations

### 1. People-Centric Company Scoring
Traditional ICP uses only firmographics. We add:
- Innovation adoption profile
- Pain signals from buyer groups
- Buyer group quality

### 2. Diffusion of Innovation
Classifies companies AND people by innovation adoption segment

### 3. Standardized Terminology
- `discover` - Find entities
- `enrich` - Add contact info
- `research` - Deep analysis

### 4. Flexible Enrichment Levels
- `identify` - Basic data
- `enrich` - + Contact info
- `research` - + Deep intelligence

### 5. Unified API
Single entry point for all intelligence operations

---

## Next Steps

1. **Install dependencies**: (none for core modules)
2. **Integrate with existing pipelines**: Use `unified-intelligence-pipeline.js`
3. **Add real data sources**: Connect to CoreSignal, Lusha, etc.
4. **Test API endpoints**: Use Postman or curl
5. **Build UI**: Create frontend for intelligence platform

---

## Examples

See `unified-intelligence-pipeline.js` for complete examples.

**Questions?** Check the individual pipeline files for detailed documentation.

