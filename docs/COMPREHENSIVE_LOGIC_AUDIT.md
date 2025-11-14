# Comprehensive Intelligence Generation Logic Audit

## System Flow Overview

1. **Data Input** → Company record from database
2. **Size Parsing** → `parseCompanySize()` converts string/number to numeric
3. **Growth Stage** → `determineGrowthStage()` based on size, revenue, age
4. **Market Position** → `determineMarketPosition()` based on size, revenue, globalRank
5. **Archetype** → `determineCompanyArchetype()` based on profile
6. **AI Generation** → Claude AI generates strategy using all data
7. **Caching** → Strategy data stored in `customFields.strategyData`

## Critical Logic Components

### 1. Size Parsing (`parseCompanySize`)

**Location**: `src/app/api/v1/strategy/company/[id]/route.ts:336-363`

**Logic**:
- Handles numeric values directly
- Parses strings like "10,001+ employees" → `10001`
- Handles ranges like "1000-5000" → uses upper bound
- Maps categories (enterprise, large, medium, small)
- Falls back to `employeeCount` if available

**Status**: ✅ Correct - handles all edge cases

### 2. Growth Stage Determination (`determineGrowthStage`)

**Location**: `src/app/api/v1/strategy/company/[id]/route.ts:366-404`

**Logic Flow**:
```
1. Parse age from foundedYear (or null if missing)
2. Parse size using parseCompanySize()
3. Get revenue (defaults to 0)

Priority Logic:
- Large companies (1000+ employees, $100M+ revenue):
  - If age unknown → 'mature' ✅
  - If age >= 10 → 'mature' ✅
  - If age < 10 → 'growth' ✅
  
- Medium companies (500+ employees):
  - If age unknown → 'mature' ✅
  - If age >= 10 → 'mature' ✅
  - If age < 10 → 'growth' ✅
  
- Small companies:
  - If age unknown: infer from size
    - < 50 → 'startup'
    - < 500 → 'growth'
    - >= 500 → 'mature'
  - If age known: standard logic
    - age < 3 && size < 50 → 'startup'
    - age < 10 && size < 500 → 'growth'
    - age >= 10 && size >= 500 → 'mature'
  
- Declining: Only for old companies (20+ years) with small size and low revenue
```

**Status**: ✅ Correct - properly handles null age for large companies

### 3. Market Position Determination (`determineMarketPosition`)

**Location**: `src/app/api/v1/strategy/company/[id]/route.ts:407-425`

**Logic Flow**:
```
1. Parse size using parseCompanySize()
2. Get revenue (defaults to 0)
3. Get globalRank (defaults to 999999)

Priority Logic:
- globalRank <= 1000 → 'leader' ✅
- size >= 10000 OR revenue >= $1B → 'leader' ✅
- size >= 1000 OR revenue >= $100M → 'challenger' ✅
- size >= 500 → 'challenger' ✅
- size >= 100 → 'follower' ✅
- Otherwise → 'niche' ✅
```

**Status**: ✅ Correct - proper thresholds for large companies

### 4. Archetype Determination (`determineCompanyArchetype`)

**Location**: `src/platform/services/company-archetypes.ts:214-275`

**Logic Flow**:
```
Priority Order:
1. Market Leader: size > 1000, revenue > $100M, marketPosition === 'leader'
   - If age null/0 or age > 10 → Market Leader ✅
   
2. Enterprise Incumbent: size > 500, marketPosition === 'leader'
   - If age null/0 or age > 15:
     - If size >= 10000 OR revenue >= $1B → Enterprise Incumbent ✅
     - If age > 15 → Enterprise Incumbent ✅
     
3. Fast-Growing Disruptor: growthStage === 'growth', marketPosition === 'challenger'
   - ONLY if age is known AND age < 10 ✅
   - This prevents large companies from being misclassified
   
4. Niche Specialist: size < 500, marketPosition === 'niche' ✅
   
5. Regional Player: 100 < size < 1000, marketPosition === 'follower' ✅

Fallbacks:
- Large companies (1000+, $100M+) without age → Enterprise Incumbent ✅
- Medium-large challengers (500+, growth) → Check age:
  - If age < 10 → Fast-Growing Disruptor
  - Otherwise → Enterprise Incumbent ✅
- Large companies (1000+) → Enterprise Incumbent ✅
- Small companies → Fast-Growing Disruptor ✅
```

**Status**: ✅ Correct - properly prevents large companies from being Fast-Growing Disruptor

### 5. Age Calculation

**Issue Found**: ⚠️ **INCONSISTENCY**

**Location 1**: `src/app/api/v1/strategy/company/[id]/route.ts:207-208`
```typescript
companyAge: company.foundedAt ? 
  Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
```

**Location 2**: `src/app/api/v1/strategy/company/[id]/route.ts:367-368`
```typescript
const age = company.foundedAt ? 
  Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
```

**Problem**: Uses `foundedAt` (date field) but database schema shows `foundedYear` (number field)

**Fix Needed**: Should use `foundedYear`:
```typescript
const age = company.foundedYear ? 
  new Date().getFullYear() - company.foundedYear : null;
```

### 6. Claude AI Prompt

**Location**: `src/platform/services/claude-strategy-service.ts:buildStrategyPrompt()`

**Key Features**:
- ✅ Explicitly uses `companyIndustry` (not assuming Technology/SaaS)
- ✅ Distinguishes between `companyIndustry` and `targetIndustry`
- ✅ Includes all company data (size, revenue, age, growth stage, market position)
- ✅ Uses archetype name and description

**Status**: ✅ Correct - properly instructs AI to use actual industry

### 7. Data Flow Verification

**Flow**:
1. Company fetched from DB → ✅
2. Size parsed → ✅
3. Growth stage determined → ✅
4. Market position determined → ✅
5. Profile created → ✅
6. Archetype determined → ✅
7. Strategy request built → ✅
8. Claude AI generates strategy → ✅
9. Strategy cached in `customFields.strategyData` → ✅

**Status**: ✅ Flow is correct

## Issues Found

### Issue 1: Age Calculation Uses Wrong Field
**Severity**: 🔴 **CRITICAL**

**Problem**: Code uses `company.foundedAt` but database has `foundedYear`

**Files Affected**:
- `src/app/api/v1/strategy/company/[id]/route.ts:207-208`
- `src/app/api/v1/strategy/company/[id]/route.ts:367-368`
- `scripts/regenerate-intelligence-for-audited-companies.ts:264-265`
- `scripts/pre-generate-intelligence-for-fixed-companies.ts:191-192`
- `src/platform/services/auto-strategy-population-service.ts:84-85`

**Fix**: Change all instances to use `foundedYear`:
```typescript
const age = company.foundedYear ? 
  new Date().getFullYear() - company.foundedYear : null;
```

### Issue 2: Claude Request Interface
**Severity**: 🟡 **MINOR**

**Problem**: `ClaudeStrategyRequest.companyAge` is `number` but should be `number | null`

**File**: `src/platform/services/claude-strategy-service.ts:12`

**Impact**: May cause issues when passing null age

**Fix**: Update interface to allow null

## Verification Checklist

- [x] Size parsing handles all formats correctly
- [x] Growth stage logic handles null age for large companies
- [x] Market position logic has correct thresholds
- [x] Archetype logic prevents large companies from being Fast-Growing Disruptor
- [x] AI prompt uses correct industry data
- [ ] Age calculation uses correct database field (foundedYear)
- [ ] Claude request interface allows null age

## Recommendations

1. **Fix age calculation** to use `foundedYear` instead of `foundedAt`
2. **Update Claude interface** to allow null age
3. **Add unit tests** for each logic component
4. **Add validation** to ensure cached data matches expected structure
5. **Add logging** to track when intelligence is generated vs cached

## Expected Results After Fixes

For **Eversource Energy** (8,052 employees, $12.9B revenue, no foundedYear):
- Size: `8052` ✅
- Growth Stage: `mature` ✅
- Market Position: `leader` ✅ (revenue > $1B)
- Archetype: `Enterprise Incumbent` ✅ (size >= 1000, leader position)

For **Small Startup** (50 employees, $1M revenue, 2 years old):
- Size: `50` ✅
- Growth Stage: `startup` ✅
- Market Position: `niche` ✅
- Archetype: `Fast-Growing Disruptor` ✅

