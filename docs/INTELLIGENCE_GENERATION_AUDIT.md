# Intelligence Generation Logic Audit

## Issues Found and Fixed

### Problem: Incorrect Classifications for Large Companies

For companies like **Eversource Energy** (10,001+ employees, $12.9B revenue), the system was generating incorrect classifications:

**Before Fix:**
- Growth Stage: `declining` ❌ (should be `mature`)
- Market Position: `challenger` ✅ (correct)
- Archetype: `Fast-Growing Disruptor` ❌ (should be `Enterprise Incumbent`)

### Root Causes

#### 1. Company Size Parsing Issue
**Problem:** `company.size` is stored as a string like `"10,001+ employees"` but the code was treating it as a number.

**Impact:** Size comparisons failed, causing incorrect growth stage and archetype determinations.

**Fix:** Created `parseCompanySize()` helper function that:
- Extracts numeric values from strings like "10,001+ employees"
- Handles ranges like "1000-5000"
- Maps size categories to numeric values
- Falls back to `employeeCount` if available

#### 2. Missing Age Data Handling
**Problem:** When `foundedAt` is null, `companyAge` was set to `0`, causing:
- Growth stage to default to `declining` (wrong for large companies)
- Archetype logic to fail matching conditions

**Impact:** Large established companies were classified as "declining" or defaulted to "Fast-Growing Disruptor"

**Fix:**
- Changed `companyAge` type to `number | null` (instead of defaulting to 0)
- Updated growth stage logic to handle `null` age:
  - Large companies (1000+ employees, $100M+ revenue) → `mature` when age is unknown
  - Medium companies (500+ employees) → `mature` when age is unknown
  - Only returns `declining` for old companies (20+ years) with small size and low revenue

#### 3. Growth Stage Logic Flaws
**Problem:** The original logic was:
```typescript
if (age < 3 && size < 50) return 'startup';
if (age < 10 && size < 500) return 'growth';
if (age >= 10 && size >= 500) return 'mature';
return 'declining'; // ❌ Default for everything else!
```

**Impact:** Large companies with missing age data defaulted to `declining`

**Fix:** New logic prioritizes size and revenue:
- Large companies (1000+ employees, $100M+ revenue) → `mature` (unless very young)
- Medium companies (500+ employees) → `mature` (unless very young)
- Only returns `declining` for old companies (20+ years) with small size and low revenue
- Defaults to `mature` for established companies instead of `declining`

#### 4. Market Position Logic Improvements
**Problem:** Original logic didn't properly handle very large companies.

**Fix:** Enhanced logic:
- Companies with $1B+ revenue or 10k+ employees → `leader`
- Companies with $100M+ revenue or 1k+ employees → `challenger`
- Better thresholds for medium and small companies

#### 5. Archetype Logic Flaws
**Problem:** The archetype determination didn't handle missing age data for large companies, causing defaults to "Fast-Growing Disruptor"

**Fix:** Updated `determineCompanyArchetype()` to:
- Handle `null` age for large companies (assume established/incumbent)
- For very large companies (10k+ employees or $1B+ revenue) without age → `Enterprise Incumbent`
- For large companies (1000+ employees, $100M+ revenue) without age → `Enterprise Incumbent`
- Only assign "Fast-Growing Disruptor" when age is known and < 10 years
- Default large companies to `Enterprise Incumbent` instead of `Fast-Growing Disruptor`

## Expected Results for Eversource Energy

**After Fix:**
- Company Size: `10001` (parsed from "10,001+ employees")
- Revenue: `$12,991,135,000` ($12.9B)
- Age: `null` (foundedAt missing)
- **Growth Stage:** `mature` ✅ (large company with high revenue)
- **Market Position:** `leader` ✅ ($12.9B revenue > $1B threshold)
- **Archetype:** `Enterprise Incumbent` ✅ (10k+ employees, leader position, large revenue)

## Files Modified

1. **src/app/api/v1/strategy/company/[id]/route.ts**
   - Added `parseCompanySize()` function
   - Fixed `determineGrowthStage()` to handle null age and large companies
   - Fixed `determineMarketPosition()` to use parsed size
   - Updated `companyAge` to be `null` instead of `0` when missing

2. **src/platform/services/company-archetypes.ts**
   - Updated `CompanyProfile` interface: `age: number | null`
   - Fixed `determineCompanyArchetype()` to handle null age and large companies
   - Better defaults for large companies without age data

3. **src/platform/services/company-strategy-service.ts**
   - Updated `CompanyStrategyRequest` interface: `companyAge: number | null`

4. **src/platform/services/auto-strategy-population-service.ts**
   - Added `parseCompanySize()` method
   - Fixed growth stage and market position logic
   - Updated to use parsed size values

5. **scripts/fix-incorrect-intelligence-classifications.ts**
   - Added size parsing and improved logic

6. **scripts/pre-generate-intelligence-for-fixed-companies.ts**
   - Added size parsing and improved logic

## Testing

The fixes ensure that:
- Large companies (like Eversource Energy) are correctly classified as `mature` and `Enterprise Incumbent`
- Companies with missing `foundedAt` data are handled gracefully
- Size strings like "10,001+ employees" are properly parsed
- Market position correctly identifies leaders based on revenue thresholds
- Archetype logic doesn't default to "Fast-Growing Disruptor" for large established companies

## Validation

To verify the fixes work correctly:

1. Check that large utilities companies show:
   - Growth Stage: `mature` (not `declining`)
   - Market Position: `leader` or `challenger` (based on revenue)
   - Archetype: `Enterprise Incumbent` or `Market Leader` (not `Fast-Growing Disruptor`)

2. Test with companies that have:
   - Missing `foundedAt` data
   - Size stored as string (e.g., "10,001+ employees")
   - High revenue ($100M+ or $1B+)

