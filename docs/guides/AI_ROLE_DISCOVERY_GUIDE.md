# 🤖 AI-Powered Role Discovery Guide

**Status:** ✅ **Production Ready**  
**Created:** October 10, 2025  
**Architecture:** Functional Core + AI-Powered Variation Generation

---

## 📋 Overview

The AI-Powered Role Discovery system can discover people with **ANY role** using AI-generated variations. No more hardcoded lists - the system dynamically generates 40-60 variations for any role you request.

### **What Makes It Special**

- ✅ **ANY Role** - Works for VP Marketing, Data Scientist, Product Manager, or any role
- ✅ **AI-Powered** - Uses Perplexity AI to generate comprehensive variations
- ✅ **Intelligent Caching** - 7-day TTL cache for performance
- ✅ **Smart Fallback** - Pre-defined variations for common roles
- ✅ **Tier-Based Ranking** - Automatically prioritizes C-level > VP > Director > Manager

---

## 🚀 Quick Start

### **Example 1: Discover VP Marketing**

```typescript
import { RoleDiscoveryPipeline } from '@/platform/pipelines/orchestrators';

const pipeline = new RoleDiscoveryPipeline(apis);

const result = await pipeline.discover({
  roles: ['VP Marketing'],
  companies: ['Salesforce', 'HubSpot'],
  enrichmentLevel: 'enrich'
});

// Returns people with titles like:
// - VP Marketing
// - Chief Marketing Officer (CMO)
// - SVP Marketing
// - Director of Marketing
// etc. (40-60 variations total)
```

### **Example 2: Discover Data Scientists**

```typescript
const result = await pipeline.discover({
  roles: ['Data Scientist'],
  companies: ['Google', 'Meta'],
  enrichmentLevel: 'research'
});

// Returns people with titles like:
// - Data Scientist
// - Senior Data Scientist
// - Chief Data Officer (CDO)
// - VP Data Science
// - Lead Data Scientist
// etc.
```

### **Example 3: Discover Product Managers**

```typescript
const result = await pipeline.discover({
  roles: ['Product Manager'],
  companies: ['Amazon', 'Microsoft'],
  enrichmentLevel: 'discover'
});

// Returns people with titles like:
// - Product Manager
// - Chief Product Officer (CPO)
// - VP Product
// - Senior Product Manager
// - Director of Product
// etc.
```

---

## 🎯 How It Works

### **Step 1: AI Variation Generation**

When you request a role like "VP Marketing", the system:

1. **Checks cache** - Has this role been generated recently?
2. **Checks fallback** - Is this a common role with pre-defined variations?
3. **Generates with AI** - Uses Perplexity to create 40-60 variations

**AI Prompt Strategy:**
```
Generate comprehensive job title variations for: "VP Marketing"

Include:
1. C-Level variations (CMO, Chief Marketing Officer)
2. VP-Level variations (VP Marketing, SVP Marketing)
3. Director-Level variations (Marketing Director, Head of Marketing)
4. Manager-Level variations (Marketing Manager, Lead Marketing)

Organized by tier with 40-60 total variations.
```

### **Step 2: Comprehensive Search**

The system searches for people using **ALL generated variations**:

```
VP Marketing → Generates 50 variations → Searches using all 50
```

This ensures maximum coverage - you won't miss people just because their title is slightly different.

### **Step 3: Intelligent Ranking**

Results are ranked by:
- **Tier** (C-level first, then VP, Director, Manager)
- **Match Confidence** (exact match = 100%, partial = 85%, fuzzy = 60%)
- **Overall Score** (combination of tier + confidence)

---

## 📊 Supported Roles

### **Any Role!**

The system works for **ANY role** you can think of:

**Common Roles (Pre-Defined):**
- VP Marketing
- Product Manager
- Engineering Manager
- Data Scientist
- Sales Director
- HR Director
- Operations Manager

**AI-Generated Roles:**
- VP Customer Success
- Growth Marketing Manager
- Machine Learning Engineer
- DevOps Lead
- UX Design Director
- Business Intelligence Analyst
- ... literally ANY role!

---

## 🔧 API Usage

### **Endpoint**

```
POST /api/v1/intelligence/role/discover
```

### **Request Body**

```json
{
  "roles": ["VP Marketing", "CMO"],
  "companies": ["Salesforce", "HubSpot"],
  "enrichmentLevel": "enrich",
  "filters": {
    "location": "United States",
    "minTier": 2
  }
}
```

### **Response**

```json
{
  "success": true,
  "people": [
    {
      "name": "Jane Doe",
      "title": "VP Marketing",
      "company": "Salesforce",
      "email": "jane.doe@salesforce.com",
      "phone": "+1-555-1234",
      "linkedIn": "https://linkedin.com/in/janedoe",
      "enrichmentLevel": "enrich"
    }
  ],
  "metadata": {
    "totalFound": 10,
    "totalReturned": 10,
    "enrichmentLevel": "enrich",
    "executionTime": 2500,
    "timestamp": "2025-10-10T12:00:00Z"
  }
}
```

---

## 💡 Advanced Features

### **1. Role Variation Caching**

Generated variations are cached for 7 days:

```typescript
import { roleVariationCache } from '@/platform/pipelines/functions';

// Check cache stats
const stats = roleVariationCache.getStats();
console.log(stats);
// {
//   size: 25,
//   maxSize: 1000,
//   ttlDays: 7,
//   totalHits: 150,
//   mostPopular: "VP Marketing"
// }

// Manual cache operations
roleVariationCache.prune(); // Remove expired entries
roleVariationCache.clear(); // Clear all entries
```

### **2. Common Role Definitions**

Pre-defined variations for instant responses:

```typescript
import { getFallbackVariations, getCommonRoles } from '@/platform/pipelines/functions';

// Get all common roles
const commonRoles = getCommonRoles();
// ['VP Marketing', 'Product Manager', 'Data Scientist', ...]

// Get fallback variations
const variations = getFallbackVariations('VP Marketing');
// Returns RoleVariations with 20+ pre-defined variations
```

### **3. Role Intelligence**

Match, score, and analyze roles:

```typescript
import { matchRoleTitle, getRoleTier, scoreRoleCandidates } from '@/platform/pipelines/functions';

// Match a title
const match = matchRoleTitle('VP Marketing', marketingVariations);
// { matched: true, tier: 2, confidence: 100, exactMatch: true }

// Get tier
const tier = getRoleTier('Chief Marketing Officer');
// Returns: 1 (C-Level)

// Score candidates
const scored = scoreRoleCandidates(people, 'VP Marketing', variations);
// Returns ranked list with scores
```

---

## 🎓 Pattern vs AI Generation

### **Pattern-Based (Fallback)**

Fast, deterministic, works offline:

```typescript
const variations = generateWithPatterns('VP Marketing');
// Uses rule-based patterns:
// - "Chief {dept} Officer" → "Chief Marketing Officer"
// - "VP {dept}" → "VP Marketing"
// - etc.
```

### **AI-Powered (Primary)**

Comprehensive, adaptive, industry-aware:

```typescript
const variations = await generateRoleVariations('VP Marketing', apis);
// Uses Perplexity AI to generate:
// - Industry-specific variations
// - Regional terminology differences
// - Modern vs traditional titles
// - 40-60 comprehensive variations
```

---

## 📈 Performance

### **Cache Hit Rates**

- **First request**: ~2-3 seconds (AI generation)
- **Cached requests**: ~100-200ms (instant)
- **Fallback requests**: ~50-100ms (pattern-based)

### **Credit Savings**

AI generation cost:
- **1 AI query** per unique role (then cached for 7 days)
- **0 AI queries** for common roles (fallback)
- **0 AI queries** for repeated roles (cache)

---

## 🔒 Security & Best Practices

### **1. Input Validation**

All role inputs are validated:
- Minimum 2 characters
- Maximum 200 characters
- Sanitized for special characters

### **2. Cache Management**

Automatic cache management:
- 7-day TTL
- Max 1000 entries
- LRU eviction when full
- Automatic pruning every 24 hours

### **3. Error Handling**

Graceful fallbacks:
1. Try cache
2. Try AI
3. Try pattern-based
4. Return error only if all fail

---

## 🎉 Benefits

### **For Users**

- ✅ Discover **any role** - not limited to CFO/CRO
- ✅ Higher discovery rates - 40-60 variations per role
- ✅ Better ranking - tier-based prioritization
- ✅ Faster results - intelligent caching

### **For Developers**

- ✅ No hardcoded lists to maintain
- ✅ Pure, testable functions
- ✅ Type-safe throughout
- ✅ Composable architecture

### **For the Business**

- ✅ Scalable to any role
- ✅ Cost-efficient (caching + fallbacks)
- ✅ Future-proof (AI adapts to new titles)
- ✅ Production-ready quality

---

## 🚀 Migration from Hardcoded Lists

**Old Approach:**
```javascript
const CFO_ROLES = [
  'Chief Financial Officer', 'CFO', 'VP Finance', ...
]; // 56 hardcoded variations
```

**New Approach:**
```typescript
const variations = await generateRoleVariations('CFO', apis);
// AI generates 40-60 variations dynamically
```

**Benefits:**
- No maintenance required
- Works for ANY role
- Always up-to-date with industry trends

---

## 📚 Additional Resources

- **Functions:** `src/platform/pipelines/functions/roles/`
- **Orchestrator:** `src/platform/pipelines/orchestrators/RoleDiscoveryPipeline.ts`
- **API:** `/api/v1/intelligence/role/discover`
- **Tests:** `src/platform/pipelines/functions/roles/__tests__/`

---

**Created with 2025 best practices: Functional Core + AI-Powered Innovation** 🎉

