# Snowflake Buyer Group Pipeline Audit

## Executive Summary

The buyer group pipeline failed to find the right contacts at Snowflake. Instead of finding **Commercial segment RVPs** (hunters who do acquisition), it found **Strategic/Enterprise Account Executives** (farmers who do expansion).

**Root Cause:** The pipeline has no awareness of sales org segment structure (Commercial vs Majors vs Enterprise) and doesn't filter out farming roles.

---

## What Went Wrong

### Original Buyer Group (WRONG)
| Name | Title | Why Wrong |
|------|-------|-----------|
| Dinakar Makam | Head Of Salesforce Engineering | Not sales - engineering |
| Thibault Thomas | Enterprise Account Executive | Enterprise = mixed hunter/farmer |
| Daniel Solomon | Enterprise Account Executive | Enterprise = mixed hunter/farmer |
| **Ariel Fleming** | **Strategic Account Executive** | **FARMER** - badged at one client, expansion only |
| Vy Luu | Account Executive | Generic AE - unclear segment |

### Correct Buyer Group (AFTER FIX)
| Name | Title | Why Right |
|------|-------|-----------|
| Michael Gannon | Chief Revenue Officer | Ultimate decision maker |
| Adam Rosenbloom | RVP Commercial Sales - US West & Canada | **HUNTER** - Commercial segment |
| Ben Compton | RVP Commercial East | **HUNTER** - Commercial segment |
| Lisa Yu | RVP Commercial Expansion Sales | **CHAMPION** - Expansion within Commercial |

---

## Root Cause Analysis

### Issue 1: No Sales Segment Awareness

**Current State:** The pipeline's `productCategory: 'sales'` filtering looks for generic sales titles:
```javascript
// From preview-search.js line 304-328
primary: ['sales', 'revenue', 'business development', 'sales enablement', 'revenue operations', 'sales operations']
```

**Problem:** This finds ALL sales roles without distinguishing:
- **Commercial** = Hunters (acquisition, new business)
- **Enterprise** = Mixed (some acquisition, some expansion)
- **Majors/Strategic** = Farmers (single account, expansion only)

**Evidence from Ariel Fleming:**
> "Strategic Account Exec is a 'Majors' account rep - you have one account, are badged, and work to expand them."

---

### Issue 2: Missing Exclusion for "Strategic" Titles

**Current Exclusions:**
```javascript
// From preview-search.js line 318-325
exclude: [
  'customer success',
  'customer service', 
  'account manager',     // Manages existing customers
  'product manager',
  'product owner',
  'engineer',
  'developer'
]
```

**Missing Exclusions:**
- `strategic account` - Majors segment (farmers)
- `global account` - Large account managers (farmers)
- `enterprise account` - Often mixed, can be farmers
- `named account` - Single account focus (farmers)

---

### Issue 3: Not Targeting Sales Leadership

**Problem:** The pipeline finds AEs (individual contributors) instead of RVPs/VPs (leadership).

**Current Title Filtering:**
```javascript
primary: ['vp', 'vice president', 'svp', 'chief', 'cfo', 'cro', 'cto']
secondary: ['director', 'senior director', 'head of', 'manager']
```

**But:** These titles are used for scoring, not for **mandatory filtering**. The pipeline includes AEs even though they're not leadership.

**What We Needed:**
- **Required:** RVP, VP, Director, Head of
- **Commercial segment specific:** "Commercial" in title

---

### Issue 4: Coresignal Query Matched Wrong Company

Looking at the pipeline output:
```
✅ Found workspace-specific company: Verticurl.internal.Linkedin
📊 Using workspace company data as context
```

**Problem:** The pipeline matched "Verticurl.internal.Linkedin" instead of "Snowflake". This is a company matching bug in the `company-intelligence` stage.

---

## Pipeline Stage Analysis

### Stage 1: Company Intelligence ❌
- Matched wrong company ("Verticurl.internal.Linkedin")
- Should have used the provided LinkedIn URL directly

### Stage 2: Preview Search ❌
- No segment-based filtering for sales orgs
- Included Strategic/Enterprise AEs
- Didn't prioritize Commercial segment

### Stage 3: Smart Scoring ⚠️
- Scored by seniority but didn't penalize farming roles
- AEs scored higher than they should for acquisition

### Stage 4: Role Assignment ⚠️
- Assigned "champion" to Thibault Thomas (Enterprise AE)
- Should have recognized Enterprise AE as lower priority

---

## Recommended Fixes

### Fix 1: Add Sales Segment Configuration

```javascript
// New: customFiltering for sales segment targeting
const COMMERCIAL_SEGMENT_FILTER = {
  // Target Commercial segment specifically
  targetTitles: [
    'regional vice president',
    'rvp',
    'vice president commercial',
    'commercial sales',
    'commercial director',
    'commercial account'
  ],
  
  // Exclude farmer roles
  excludeTitles: [
    'strategic account',      // Majors segment
    'global account',         // Large account farmers
    'enterprise account',     // Often mixed/farmers
    'account manager',        // Expansion focused
    'customer success',
    'named account'
  ]
};
```

### Fix 2: Update Default Sales Filtering

```javascript
// In preview-search.js getProductSpecificFiltering()
if (productCategory === 'sales') {
  return {
    primary: ['commercial', 'acquisition', 'sales'],  // Prioritize Commercial
    secondary: ['revenue', 'business development'],
    exclude: [
      'customer success',
      'strategic account',    // ADD: Majors farmers
      'global account',       // ADD: Large account farmers
      'account management',
      'enterprise account',   // ADD: Often farmers
      'product',
      'engineering'
    ],
    titles: {
      primary: ['rvp', 'regional vice president', 'vp', 'chief', 'cro'],
      secondary: ['director', 'head of', 'senior manager'],
      exclude: [
        'strategic',          // ADD
        'global account',     // ADD
        'enterprise account', // ADD
        'account manager',
        'customer success'
      ]
    }
  };
}
```

### Fix 3: Add Segment Detection Logic

```javascript
// New function in role-assignment.js
function detectSalesSegment(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('strategic') || titleLower.includes('majors')) {
    return { segment: 'majors', type: 'farmer', priority: 'low' };
  }
  
  if (titleLower.includes('enterprise')) {
    return { segment: 'enterprise', type: 'mixed', priority: 'medium' };
  }
  
  if (titleLower.includes('commercial') || titleLower.includes('smb')) {
    return { segment: 'commercial', type: 'hunter', priority: 'high' };
  }
  
  return { segment: 'unknown', type: 'unknown', priority: 'medium' };
}
```

### Fix 4: Prioritize Sales Leadership

```javascript
// In smart-scoring.js - add segment-based scoring
function calculateSalesSegmentScore(employee) {
  const segment = detectSalesSegment(employee.title);
  
  // Boost hunters, penalize farmers
  switch (segment.type) {
    case 'hunter': return 20;  // Commercial AEs
    case 'mixed': return 0;    // Enterprise AEs
    case 'farmer': return -30; // Strategic AEs
    default: return 0;
  }
}
```

### Fix 5: Fix Company Matching

The `company-intelligence` stage should:
1. Use the provided LinkedIn URL directly
2. Not fall back to workspace data if explicit URL provided
3. Verify company name matches expected target

---

## Updated BGI Guide Section

Add to `BGI_REPORT_GUIDE.md`:

```markdown
## Sales Org Segment Targeting

When selling TO a sales organization, understand their segment structure:

| Segment | Role Type | Focus | Include in BGI? |
|---------|-----------|-------|-----------------|
| Commercial | HUNTERS | Acquisition | ✅ YES |
| SMB | HUNTERS | High-volume new biz | ✅ YES |
| Enterprise | MIXED | Some acquisition | ⚠️ MAYBE |
| Majors/Strategic | FARMERS | Expansion | ❌ NO |
| Global | FARMERS | Named accounts | ❌ NO |

### Exclusion Keywords for Farmer Roles
- "Strategic Account"
- "Global Account"  
- "Named Account"
- "Account Manager"
- "Expansion"
- "Renewal"
```

---

## Lessons Learned

1. **Sales orgs have segments** - Not all salespeople are equal. Hunters vs farmers.

2. **Title keywords matter** - "Strategic" in a sales title often = farmer role.

3. **AEs are not decision makers** - Target RVPs/VPs, not individual contributors.

4. **Insider intel is gold** - Ariel Fleming's feedback was more valuable than automated discovery.

5. **Verify company matching** - Pipeline matched wrong company, garbage in = garbage out.

---

## Action Items

- [ ] Update `preview-search.js` to exclude farmer titles
- [ ] Add segment detection to `role-assignment.js`
- [ ] Add segment scoring to `smart-scoring.js`
- [ ] Fix company matching in `company-intelligence.js`
- [ ] Add sales segment section to BGI Guide
- [ ] Create test case for Snowflake scenario

---

## Appendix: Snowflake Sales Org Structure

| Segment | Description | Role Type |
|---------|-------------|-----------|
| **Commercial** | Startups, digital-native, high-volume | HUNTERS |
| **Enterprise** | Mid-market customers | MIXED |
| **Majors** | Largest companies, dedicated teams | FARMERS |

**Key Insight:** When Ariel Fleming said he's a "Strategic Account Exec", he meant:
- He's in the **Majors** segment
- He's **badged at one client** (sits in their office daily)
- He does **expansion**, not acquisition
- He's a **farmer**, not a hunter

This is why he recommended targeting **Commercial segment RVPs** instead.
