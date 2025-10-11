# 🚀 Unified Intelligence - Quick Start

**5-Minute Guide to Using the Intelligence Platform**

---

## ⚡ Core Concepts

### Standardized Actions
- `discover` - Find entities (companies, people, roles)
- `enrich` - Add contact info
- `research` - Deep analysis

### Intelligence Levels
- `identify` - Basic data only
- `enrich` - + Email, phone, LinkedIn
- `research` - + Innovation profile, pain signals, etc.

### Target Company Intelligence
**Not "ICP" - People-centric scoring:**
- Firmographics (30%)
- Innovation Adoption (25%)
- Pain Signals (25%)
- Buyer Group Quality (20%)

---

## 🏢 Find Companies

```javascript
const { CompanyDiscoveryPipeline } = require('./company-discovery-pipeline');

const pipeline = new CompanyDiscoveryPipeline();

await pipeline.discover({
  firmographics: {
    industry: ['SaaS'],
    employeeRange: { min: 100, max: 1000 }
  },
  innovationProfile: { segment: 'innovators' },
  painSignals: ['hiring_spike'],
  minCompanyFitScore: 70
});
```

**API:**
```bash
POST /api/v1/intelligence/company/discover
```

---

## 👤 Research a Person

```javascript
const { PersonIntelligencePipeline } = require('./person-intelligence-pipeline');

const pipeline = new PersonIntelligencePipeline();

await pipeline.research({
  name: 'John Smith',
  company: 'Nike',
  analysisDepth: {
    innovationProfile: true,
    buyingAuthority: true
  }
});
```

**API:**
```bash
POST /api/v1/intelligence/person/research
```

---

## 🎯 Find People by Role

```javascript
const { RoleDiscoveryPipeline } = require('./role-discovery-pipeline');

const pipeline = new RoleDiscoveryPipeline();

await pipeline.discover({
  roles: ['VP Marketing', 'CMO'],
  companies: ['Salesforce', 'HubSpot'],
  enrichmentLevel: 'enrich'
});
```

**API:**
```bash
POST /api/v1/intelligence/role/discover
```

---

## 🎛️ Unified Pipeline (All-in-One)

```javascript
const { UnifiedIntelligencePipeline } = require('./unified-intelligence-pipeline');

const pipeline = new UnifiedIntelligencePipeline();

// Discover companies
await pipeline.discover('company', { ... });

// Research person
await pipeline.research('person', { name: 'John Smith' });

// Discover roles
await pipeline.discover('role', { roles: [...] });
```

---

## 📊 What You Get

### Company Discovery
```json
{
  "companyName": "Nike",
  "companyFitScore": 87,
  "innovationProfile": { "segment": "early_adopter" },
  "painIndicators": [{ "type": "hiring_spike", "severity": "high" }],
  "fitLevel": "ideal"
}
```

### Person Research
```json
{
  "person": { "name": "John Smith", "title": "VP Engineering" },
  "innovationProfile": { "segment": "innovator", "confidence": 0.91 },
  "buyingAuthority": { "role": "decision_maker", "estimatedSigningLimit": 250000 },
  "keyInsights": ["🚀 INNOVATOR", "✅ DECISION MAKER"]
}
```

---

## 🎯 Innovation Segments

- **Innovators (2.5%)** - First to adopt, highest risk tolerance
- **Early Adopters (13.5%)** - Quick to adopt, thought leaders
- **Early Majority (34%)** - Pragmatic, wait for validation
- **Late Majority (34%)** - Skeptical, adopt when necessary
- **Laggards (16%)** - Last to adopt, resistant to change

---

## 💥 Pain Signals

- `hiring_spike` - Growing pains
- `executive_turnover` - Change appetite
- `dept_restructure` - Process pain
- `manual_processes` - Automation opportunity
- `compliance_deadline` - Must-solve urgency
- `tool_sprawl` - Consolidation need

---

## 🎫 Buying Roles

- `decision_maker` - Budget authority, final approval
- `champion` - Internal advocate, promotes solution
- `stakeholder` - Influences but no final authority
- `blocker` - Controls approval gates
- `introducer` - Facilitates access to decision makers

---

## 📁 File Locations

```
src/platform/pipelines/pipelines/core/
├── unified-intelligence-pipeline.js  ← START HERE
├── company-discovery-pipeline.js
├── person-intelligence-pipeline.js
└── role-discovery-pipeline.js

src/app/api/v1/intelligence/
├── company/discover/route.ts
├── person/research/route.ts
└── role/discover/route.ts
```

---

## 🔥 Quick Examples

### Find Innovator SaaS Companies
```bash
curl -X POST http://localhost:3000/api/v1/intelligence/company/discover \
  -d '{"innovationProfile":{"segment":"innovators"},"firmographics":{"industry":["SaaS"]}}'
```

### Research a VP of Engineering
```bash
curl -X POST http://localhost:3000/api/v1/intelligence/person/research \
  -d '{"name":"John Smith","company":"Nike"}'
```

### Find All CMOs at Top SaaS Companies
```bash
curl -X POST http://localhost:3000/api/v1/intelligence/role/discover \
  -d '{"roles":["CMO"],"companies":["Salesforce","HubSpot"],"enrichmentLevel":"enrich"}'
```

---

## 📖 Full Documentation

See `UNIFIED_INTELLIGENCE_SYSTEM.md` for complete guide.

---

**Ready to go!** 🚀

