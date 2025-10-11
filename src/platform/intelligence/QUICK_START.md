# Intelligence Platform - Quick Start Guide

**Version:** 1.0  
**Last Updated:** October 10, 2025

## 🚀 Get Started in 60 Seconds

### 1. Find a Buyer Group (API)

```bash
curl -X POST http://localhost:3000/api/v1/intelligence/buyer-group \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Salesforce",
    "enrichmentLevel": "enrich"
  }'
```

### 2. Find a Buyer Group (TypeScript)

```typescript
import { BuyerGroupEngine } from '@/platform/intelligence/buyer-group/buyer-group-engine';

const engine = new BuyerGroupEngine();
const result = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'enrich',
  workspaceId: 'your-workspace-id'
});

console.log(`Found ${result.buyerGroup.totalMembers} members`);
console.log(`Cost: $${result.costEstimate}`);
```

### 3. Batch Process Companies

```typescript
const results = await engine.discoverBatch([
  { companyName: 'Salesforce', enrichmentLevel: 'identify' },
  { companyName: 'HubSpot', enrichmentLevel: 'identify' },
  { companyName: 'Dell', enrichmentLevel: 'identify' }
]);
```

## 🎯 Choose Your Enrichment Level

| Need | Level | Cost | Speed | Use This When |
|------|-------|------|-------|---------------|
| Just want names | `identify` | $0.10 | 5s | Exploring, qualifying |
| Need contacts | `enrich` | $2-3 | 30s | Ready to reach out |
| Want everything | `deep_research` | $5-8 | 2min | High-value accounts |

## 📍 Where Everything Lives

```
src/platform/intelligence/          ← ALL intelligence code here
├── buyer-group/                    ← Buyer group discovery
├── person/                         ← Person intelligence (coming soon)
├── company/                        ← People-centric ICP (coming soon)
└── role/                          ← Universal role finder (coming soon)

src/app/api/v1/intelligence/        ← ALL intelligence APIs here
├── buyer-group/                    ← Buyer group endpoints
├── person/                         ← Person endpoints (stubs)
├── company/                        ← Company ICP endpoints (stubs)
└── role/                          ← Role finder endpoints (stubs)
```

## 🔥 Common Use Cases

### Use Case 1: "Show me the buyer group"

```typescript
// Fast and cheap - just names and roles
const result = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'identify', // ← Use this
  workspaceId: workspaceId
});
```

### Use Case 2: "I need to reach them"

```typescript
// Get verified emails and phones
const result = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'enrich', // ← Use this
  workspaceId: workspaceId
});
```

### Use Case 3: "Tell me everything"

```typescript
// Full intelligence: career, relationships, signals
const result = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'deep_research', // ← Use this
  workspaceId: workspaceId
});
```

### Use Case 4: "Process 100 companies"

```typescript
// Use bulk endpoint
const response = await fetch('/api/v1/intelligence/buyer-group/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companies: ['Salesforce', 'HubSpot', /* ... 98 more */],
    enrichmentLevel: 'identify' // Start cheap!
  })
});
```

### Use Case 5: "Data is old, refresh it"

```typescript
const response = await fetch('/api/v1/intelligence/buyer-group/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: 'Salesforce',
    enrichmentLevel: 'enrich'
  })
});
```

## 💡 Pro Tips

### Tip 1: Start Cheap, Upgrade Later

```typescript
// Step 1: Identify (cheap)
const identified = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'identify' // $0.10
});

// Step 2: If good, enrich contacts
if (identified.buyerGroup.totalMembers >= 8) {
  const enriched = await engine.discover({
    companyName: 'Salesforce',
    enrichmentLevel: 'enrich' // $2-3
  });
}
```

### Tip 2: Use Caching

```typescript
// First call: Processes and costs money
const result1 = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'enrich'
});
// result1.cacheUtilized = false
// result1.costEstimate = 2.15

// Second call: FREE from cache
const result2 = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'enrich'
});
// result2.cacheUtilized = true
// result2.costEstimate = 2.15 (same, but not charged again)
```

### Tip 3: Batch for Better Performance

```typescript
// ❌ Don't do this (slow)
for (const company of companies) {
  await engine.discover({ companyName: company, ... });
}

// ✅ Do this (fast, with concurrency control)
const results = await engine.discoverBatch(
  companies.map(company => ({
    companyName: company,
    enrichmentLevel: 'identify',
    workspaceId: workspaceId
  }))
);
```

## 📊 Understanding Results

### Buyer Group Structure

```typescript
{
  success: true,
  buyerGroup: {
    companyName: "Salesforce",
    totalMembers: 12,
    cohesionScore: 8.5,        // 0-10 (how well they work together)
    overallConfidence: 87,      // 0-100 (confidence in role assignments)
    roles: {
      decision: [               // Final decision makers
        { name: "Amy Weaver", title: "CFO", confidence: 95, ... }
      ],
      champion: [               // Internal advocates
        { name: "...", title: "...", ... }
      ],
      stakeholder: [ ... ],     // Users/influencers
      blocker: [ ... ],         // May resist/slow down
      introducer: [ ... ]       // Can introduce you
    },
    members: [ ... ]            // All members in one array
  },
  metadata: {
    enrichmentLevel: "enrich",
    processingTime: 24500,      // milliseconds
    costEstimate: 2.15,         // dollars
    cacheUtilized: false,
    timestamp: "2025-10-10T..."
  }
}
```

### Quality Indicators

- **Confidence ≥ 80%** → High quality, ready to use
- **Confidence 60-79%** → Moderate, verify key contacts
- **Confidence < 60%** → Low quality, manual verification needed

- **Cohesion ≥ 7** → Great buyer group, well-connected
- **Cohesion 4-6** → Good, normal buyer group
- **Cohesion < 4** → Fragmented, may be challenging

## 🆘 Troubleshooting

### "No buyer group found"

**Possible reasons:**

1. Company not in CoreSignal database
2. Company name misspelled
3. Company too small/private

**Solutions:**

- Try with website: `{ companyName: "X", website: "https://..." }`
- Try different company name format
- Check if company is public/has LinkedIn presence

### "Low confidence results"

**Possible reasons:**

1. Company is very small
2. Limited public data
3. Recent restructuring

**Solutions:**

- Use `deep_research` level for better intelligence
- Manually verify key contacts
- Check company LinkedIn page

### "Processing too slow"

**Solutions:**

- Use `identify` level first (5s vs 30s)
- Use bulk endpoint for multiple companies
- Check cache utilization (subsequent calls are instant)

### "Costs too high"

**Solutions:**

- Start with `identify` level ($0.10 vs $2-3)
- Use caching (subsequent calls are free)
- Batch process for efficiency
- Only upgrade to higher levels for qualified targets

## 📚 Full Documentation

- **Main README:** `src/platform/intelligence/README.md`
- **Buyer Group:** `src/platform/intelligence/buyer-group/README.md`
- **Implementation:** `src/platform/intelligence/IMPLEMENTATION_SUMMARY.md`
- **API Docs:** `GET /api/v1/intelligence`

## 🎯 What's Working Now

- ✅ Buyer Group Discovery (all 3 enrichment levels)
- ✅ Batch Processing
- ✅ Refresh Stale Data
- ✅ Database Persistence
- ✅ Smart Caching
- ✅ AI Chat Integration
- ✅ CSV Upload Support

## 🚧 Coming Soon

- 🔜 Person Intelligence APIs
- 🔜 People-Centric ICP Scoring
- 🔜 Universal Role Finder
- 🔜 Live Monitoring & Alerts

## 💪 You're Ready!

You now know enough to:

1. ✅ Find buyer groups for any company
2. ✅ Choose the right enrichment level
3. ✅ Manage costs effectively
4. ✅ Process companies in batch
5. ✅ Integrate with your app

**Start with a single company at `identify` level and go from there!**

```typescript
// Your first buyer group discovery
const result = await engine.discover({
  companyName: 'Salesforce',
  enrichmentLevel: 'identify',
  workspaceId: 'your-workspace-id'
});

console.log(`🎉 Found ${result.buyerGroup.totalMembers} members!`);
```

---

**Need help? Check the full documentation in `src/platform/intelligence/README.md`**

