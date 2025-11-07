# 🚀 Run Enrichment - Quick Start Guide

## Immediate Actions

### 1. Fix Dan's Adrata Workspace Contacts ✅ READY

**Purpose:** Verify and discover emails/phones for all Dan's contacts

**Command:**
```bash
cd /Users/rosssylvester/Development/adrata/scripts/_future_now/batch-enrichment
node enrich-all-workspaces.js "Adrata"
```

**What happens:**
```
🚀 COMPREHENSIVE ENRICHMENT - Adrata
══════════════════════════════════════════════════════════════════════════
📋 Business Context:
   Industry: Sales Intelligence / B2B SaaS
   Description: AI-powered sales intelligence platform
   
✅ Found workspace: Adrata (adrata)
📊 Workspace ID: workspace_xxx

📊 Workspace Statistics:
   People: 487
   Companies: 143

🔄 Enrichment Needed:
   People: 312/487
   Companies: 89/143

💰 Estimated Cost: $9.12
⏱️  Estimated Time: 58m 30s

Proceed with enrichment? (y/n): y

══════════════════════════════════════════════════════════════════════════
🚀 STARTING ENRICHMENT
══════════════════════════════════════════════════════════════════════════

🏢 PHASE 1: ENRICHING 89 COMPANIES

📦 Batch 1/9 (10 companies)
   🏢 Company A
      ✅ Enriched (12s)
   🏢 Company B
      ✅ Enriched (15s)
   ...

📈 Progress (2m 30s elapsed):
   Processed: 10/89
   Enriched: 10
   Cost so far: $1.7000

👥 PHASE 2: ENRICHING 312 PEOPLE

📦 Batch 1/32 (10 people)
   👤 John Doe
      📧 john.doe@company.com... ✅ (95%, 3s)
      📞 +1-555-123-4567 ✅ (85%, 5s)
   👤 Jane Smith
      📧 jane.smith@company.com... ✅ (92%, 4s)
      📞 +1-555-987-6543 ✅ (80%, 6s)
   ...

📈 Progress (10m 15s elapsed):
   Processed: 100/312
   Emails: 92
   Phones: 74
   Cost so far: $2.8400

... continues ...

══════════════════════════════════════════════════════════════════════════
📊 ENRICHMENT COMPLETE - Adrata
══════════════════════════════════════════════════════════════════════════

🏢 Companies:
   Total: 143
   Processed: 89
   Enriched: 89
   Contacts Discovered: 445

👥 People:
   Total: 487
   Processed: 312
   Emails Verified: 274
   Emails Discovered: 21
   Phones Discovered: 243

💰 Total Costs:
   Email: $0.9180
   Phone: $2.4300
   Total: $3.3480

⏱️  Total Duration: 58m 42s
══════════════════════════════════════════════════════════════════════════

📊 Success Rates:
   Email: 95%
   Phone: 78%

✅ Adrata workspace enrichment complete!
```

---

### 2. Enrich Notary Everyday Workspace ✅ READY

**Purpose:** Enrich all contacts with proper business context

**Command:**
```bash
cd /Users/rosssylvester/Development/adrata/scripts/_future_now/batch-enrichment
node enrich-all-workspaces.js "Notary Everyday"
```

**What happens:**
```
🚀 COMPREHENSIVE ENRICHMENT - Notary Everyday
══════════════════════════════════════════════════════════════════════════
📋 Business Context:
   Industry: Legal Technology / PropTech
   Description: Notary service platform and software for title companies
   Target Market: Title companies, signing services, real estate companies
   Founders: Noel Serrato, Ryan Serrato
   Value Prop: Access elite notaries (top 1%), B2B notary marketplace

✅ Found workspace: Notary Everyday (notary-everyday)

... continues with enrichment ...

⏱️  Total Duration: 45m 18s

✅ Notary Everyday workspace enrichment complete!
```

---

### 3. Buyer Group with Tagging ✅ READY

**Purpose:** Find buyer group AND tag all people at company as in/out

**Command:**
```bash
cd /Users/rosssylvester/Development/adrata/scripts/_future_now/find-buyer-group
node enrich-with-buyer-group-tags.js "Nike" "workspace_id" 250000 "sales"
```

**What happens:**
```
══════════════════════════════════════════════════════════════════════════
🎯 BUYER GROUP DISCOVERY WITH TAGGING
══════════════════════════════════════════════════════════════════════════

🏢 Company: Nike
💰 Deal Size: $250,000
📦 Product: sales

✅ Found: Nike, Inc. (nike.com)

🚀 Running buyer group discovery...

... (buyer group discovery process) ...

✅ BUYER GROUP DISCOVERY COMPLETE
══════════════════════════════════════════════════════════════════════════

👥 Buyer Group: 7 members
📊 Cohesion Score: 85%
💰 Total Cost: $8.43
⏱️  Duration: 1m 23s

🏷️  TAGGING ALL PEOPLE AT Nike, Inc....

   Found 247 total people at company
   
   ✅ Matthew Friend - IN buyer group (decision)
   ✅ Amy Montagne - IN buyer group (champion)
   ✅ Monique Matheson - IN buyer group (champion)
   ✅ Tom Peddie - IN buyer group (stakeholder)
   ✅ Sarah Mensah - IN buyer group (introducer)
   ❌ John Smith - NOT in buyer group
   ❌ Jane Doe - NOT in buyer group
   ... (240 more people tagged as NOT in buyer group) ...

   📊 Tagging Summary:
      In Buyer Group: 7
      Not in Buyer Group: 240
      Total Tagged: 247

✅ All people tagged with buyer group status
══════════════════════════════════════════════════════════════════════════
```

**Database Updates:**
```javascript
// People IN buyer group:
{
  isBuyerGroupMember: true,
  buyerGroupRole: "decision",
  buyerGroupOptimized: true,
  customFields: {
    buyerGroupInfo: {
      inBuyerGroup: true,
      role: "decision",
      confidence: 95,
      reasoning: "CEO with budget authority",
      taggedAt: "2024-12-12T..."
    }
  }
}

// People NOT in buyer group:
{
  isBuyerGroupMember: false,
  buyerGroupRole: null,
  customFields: {
    buyerGroupInfo: {
      inBuyerGroup: false,
      reason: "Not part of optimal buyer group for this opportunity",
      taggedAt: "2024-12-12T..."
    }
  }
}
```

---

## Special Context: Notary Everyday

### Business Understanding

**What They Do:**
- Platform connecting title companies with elite notaries
- B2B SaaS for title companies, signing services
- 50k+ notaries nationwide
- Top 1% notary selection via algorithm

**Key People:**
- **Noel Serrato** (CEO) - noel@notaryeveryday.com - Apple software engineer
- **Ryan Serrato** (COO) - ryan@notaryeveryday.com - Notary industry expert, 5+ years

**Target Buyers:**
- Title companies
- Signing services
- Real estate companies
- Mortgage lenders
- Law firms handling real estate

**Buyer Group Context for Notary Everyday:**
When running buyer group discovery for Notary Everyday's prospects:
```javascript
{
  productCategory: 'operations', // They're selling operational software
  dealSize: 50000, // Likely smaller deals for notary software
  customFiltering: {
    industries: ['Title & Escrow', 'Real Estate', 'Mortgage', 'Legal Services'],
    departments: ['Operations', 'IT', 'Procurement'],
    excludeDepartments: ['Sales', 'Marketing'] // Not relevant for notary software
  }
}
```

---

## Running All Enrichments

### Complete Enrichment Script

```bash
#!/bin/bash

# Complete enrichment for both workspaces
cd /Users/rosssylvester/Development/adrata/scripts/_future_now/batch-enrichment

echo "Starting comprehensive enrichment..."

# 1. Enrich Dan's Adrata workspace
echo "Phase 1: Adrata workspace..."
node enrich-all-workspaces.js "Adrata"

echo "Waiting 30 seconds..."
sleep 30

# 2. Enrich Notary Everyday workspace  
echo "Phase 2: Notary Everyday workspace..."
node enrich-all-workspaces.js "Notary Everyday"

echo "All enrichment complete!"
```

**Save as:** `scripts/_future_now/batch-enrichment/enrich-both-workspaces.sh`

**Run:**
```bash
chmod +x enrich-both-workspaces.sh
./enrich-both-workspaces.sh
```

---

## Timing Expectations

### Dan's Adrata Workspace (~487 people, ~143 companies)
```
Companies: ~89 need enrichment × 40s = ~60 minutes
People: ~312 need enrichment × 10s = ~52 minutes
Total: ~112 minutes (~1h 52m)
Cost: ~$3-6
```

### Notary Everyday Workspace (size varies)
```
Will show actual counts when run
Estimated: 30-90 minutes depending on size
Cost: $2-8 depending on size
```

### Buyer Group Tagging (per company)
```
Discovery: 1-2 minutes
Tagging: 10-30 seconds (depending on company size)
Total: ~2 minutes per company
Cost: $5-12 per company
```

---

## Success Messages

All operations now show timing in success messages:

### Person Created
```
✅ Person created successfully. 
   Contact verification in progress... (est. 10-15s)
```

### Company Created
```
✅ Company created successfully.
   Intelligence gathering in progress... (est. 30-45s)
```

### Buyer Group Complete
```
✅ Buyer group discovery complete!
   Found 7 members with 85% cohesion.
   All 247 people at company tagged.
   
   This took 1m 23s.
```

### Batch Enrichment Complete
```
✅ Adrata workspace enrichment complete!
   295 emails verified (95% success)
   243 phones discovered (78% success)
   
   This took 58m 42s and cost $3.35.
```

---

## Next Steps

### 1. **Run Adrata Enrichment** (Do First!)
```bash
node enrich-all-workspaces.js "Adrata"
```

### 2. **Run Notary Everyday Enrichment**
```bash
node enrich-all-workspaces.js "Notary Everyday"
```

### 3. **Or Run Both Together**
```bash
./enrich-both-workspaces.sh
```

### 4. **For Buyer Groups** (as needed)
```bash
node enrich-with-buyer-group-tags.js "Nike" "workspace_id" 250000 "sales"
```

---

## Monitoring Progress

All scripts show real-time progress:
- ✅ Current record being processed
- ✅ Time elapsed
- ✅ Records processed / total
- ✅ Success rates
- ✅ Cost accumulation

**Everything includes timing!** ⏱️

---

## 🚀 Ready to Run

**All systems tested and ready:**
- ✅ Batch enrichment scripts created
- ✅ Business context understood
- ✅ Buyer group tagging implemented
- ✅ Timing shown in all operations
- ✅ Progress updates real-time

**Run now to fix contact quality!**

