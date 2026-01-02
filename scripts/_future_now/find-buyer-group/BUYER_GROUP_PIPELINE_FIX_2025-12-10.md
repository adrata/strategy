# Buyer Group Pipeline Audit & Fix - December 10, 2025

## Problem Statement

Dan reported feedback from calling buyer groups:
- **8 answers, 3 hangups, 5 pitches, 1 referral**
- Contacts declined because they were in:
  - **Product roles** - "we have perfect visibility into buyer group" (not the target buyer)
  - **Account Management roles** - managing existing customers for expansion, not new business

## Root Cause Analysis

The pipeline was designed to be broad, but for **sales software acquisition (new new business)**, it was incorrectly including:

### 1. Account Management Roles ❌
- **What they do:** Manage EXISTING customers (expansion/retention)
- **Why wrong for acquisition:** They're not buying new sales tools - they're maintaining current customer relationships
- **They said:** "perfect visibility into buyer group for expansion efforts" - because that's their job, but NOT our target

### 2. Product Roles ❌
- **What they do:** Build the product (Product Managers, Engineers, Developers)
- **Why wrong for sales software:** They don't buy sales tools - they use engineering/product tools
- **They said:** "perfect visibility" - because they build the product, but NOT sales tool buyers

---

## PART 1: Bug Fixes (Exclusions)

### Files Fixed

#### 1. `pipeline-validators.js`
- Added explicit exclusions for `account management`, `product`, `engineering` departments
- Added exclusions for `account manager`, `product manager`, `product owner`, `engineer`, `developer` titles
- Removed `account management` and `customer success` from relevant departments
- Removed generic `account` from relevant titles (was matching Account Managers)

#### 2. `role-assignment.js`
- Fixed introducer assignment to exclude Account Managers and Customer Success
- Removed `product` from relevant departments for champions
- Updated `isIntroducer()` to explicitly exclude account management roles
- Updated reasoning generation to reflect correct roles

#### 3. `smart-scoring.js`
- Added exclusion checks at the START of relevance calculations
- Account Management, Customer Success, Product, Engineering now get LOW scores (0.1-0.2)
- Sales, Revenue, Business Development get HIGH scores (0.9-1.0)
- Fixed champion potential scoring to exclude product roles

#### 4. `run-dan-small-medium-companies.js`
- Updated `SALES_BUYER_PROFILE` with comprehensive exclusions:
  - Departments: `account management`, `product`, `product management`, `engineering`, `research`, `design`
  - Titles: `account manager`, `product manager`, `product owner`, `engineer`, `developer`, `designer`

#### 5. `preview-search.js`
- Updated `getProductSpecificFiltering()` for 'sales' category
- Added exclusions matching other files

---

## PART 2: Enhanced ICP Interview System

### Enhanced Files

#### 1. `interview-config.js` - **Comprehensive ICP Interview**

**NEW SECTIONS ADDED:**
1. **Product & Value Proposition** - What problem you solve
2. **Ideal Buyer Persona** - Champion, Economic Buyer, End Users
3. **Anti-Personas (CRITICAL)** - Who to AVOID (titles + departments)
4. **Deal Dynamics** - Deal size, sales cycle, buying committee size, C-level thresholds
5. **Target Companies** - Industries, company size, growth stage
6. **Success Patterns** - Best closing title, must-have titles, entry point strategy
7. **Logistics** - Geographic focus, blocker engagement

**NEW QUESTIONS (20 total, up from 8):**
- What is the PRIMARY problem you solve?
- Who is your CHAMPION?
- Who is the ECONOMIC BUYER?
- What TITLES should we NEVER include?
- What DEPARTMENTS are NOT relevant?
- What title has closed the MOST deals for you?
- Entry point strategy - Economic buyer vs Champion first?
- Do you need to engage BLOCKERS early?

#### 2. `ai-config-generator.js` - **Smarter Configuration**

**ENHANCEMENTS:**
- Merges user-specified exclusions with AI-generated ones (user input takes priority)
- Handles new anti-persona fields (`excludeTitles`, `excludeDepartments`)
- Uses champion and economic buyer personas for title extraction
- Applies entry point strategy to role priorities
- Adjusts blocker priority based on engagement preferences
- Extracts titles from free-text descriptions

**NEW LOGIC:**
```javascript
// Role priorities based on entry point strategy
if ("Economic buyer first") → decision: 10, champion: 7
if ("Champion first") → champion: 10, decision: 8
if ("End user first") → stakeholder: 9, champion: 8
if ("Multiple entry points") → decision: 9, champion: 9
```

#### 3. `production-buyer-group.js` - **Uses Enhanced Config**

**ENHANCEMENTS:**
- Now passes `excludedTitles` to customFiltering
- Includes `bestClosingTitle` and `alwaysInclude` for smarter filtering
- Logs exclusions for visibility during pipeline runs

---

## Key Distinction Made

| Role | Include? | Reason |
|------|----------|--------|
| **Account Executive** | ✅ YES | Sales role - closes NEW deals |
| **Account Manager** | ❌ NO | Post-sale - manages EXISTING customers |
| **VP Sales/CRO** | ✅ YES | Decision maker for sales tools |
| **Product Manager** | ❌ NO | Builds product, doesn't buy sales tools |
| **SDR/BDR Manager** | ✅ YES | Sales role - manages outbound |

---

## Verification

All modified files pass syntax check:
```
node --check pipeline-validators.js ✅
node --check role-assignment.js ✅
node --check smart-scoring.js ✅
node --check run-dan-small-medium-companies.js ✅
node --check preview-search.js ✅
node --check interview-config.js ✅
node --check ai-config-generator.js ✅
node --check production-buyer-group.js ✅
```

---

## How to Use the Enhanced System

### For New Clients:
```bash
# Run the enhanced interview
node production-buyer-group.js --personalize

# This will ask 20 questions including:
# - Anti-personas (who to avoid)
# - Champion and Economic Buyer personas
# - Best closing title
# - Entry point strategy
```

### For Existing Clients (like Dan):
```bash
# Re-run with updated exclusions
node run-dan-small-medium-companies.js
```

---

## Expected Impact

1. **Higher quality buyer groups** - Only includes people who can actually buy
2. **Fewer wasted calls** - Excludes Account Managers, Product, Engineering
3. **Better ICP fit** - 20 questions vs 8 ensures optimal configuration
4. **Smarter role priorities** - Entry point strategy affects who we prioritize
5. **Explicit exclusions** - User tells us who to avoid, we guarantee they're excluded

---

## Next Steps

1. **Re-run Dan's buyer group discovery** for companies that had Account Manager/Product roles
2. **Test enhanced interview** with a new client
3. **Monitor call outcomes** to verify improvement
4. **Add more exclusions** based on feedback
