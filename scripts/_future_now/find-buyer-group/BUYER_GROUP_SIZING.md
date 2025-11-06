# Smart Buyer Group Sizing System

## Overview

The Smart Buyer Group Sizing system determines accurate buyer group sizes based on multiple factors, accepting 1-person buyer groups when appropriate.

## When 1-Person Buyer Groups Are Acceptable

### 1. Solopreneurs (1-person companies)
- **Scenario:** Company has 1 employee
- **Size:** 1 person
- **Reasoning:** Single decision maker is the only option

### 2. Very Small Companies (2-5 employees)
- **Scenario:** Company has 2-5 employees
- **Size:** 1-3 people
- **Reasoning:** Minimal buyer group appropriate for small operations

### 3. Limited Employee Data
- **Scenario:** Found <10% of company employees in Coresignal
- **Size:** 1-3 people (based on available data)
- **Reasoning:** Limited data availability - use what's available

### 4. Single High-Quality Candidate
- **Scenario:** Only 1 high-quality candidate found (score >60, relevance >0.4)
- **Size:** 1 person
- **Reasoning:** Quality over quantity - better to have 1 good person than multiple mediocre ones

### 5. Small Deal Size (<$50K)
- **Scenario:** Deal size under $50,000
- **Size:** 1-3 people (reduced from tier-based)
- **Reasoning:** Smaller deals require smaller buyer groups

## Size Determination Factors

### Factor 1: Company Size
- **1 employee:** Always 1 person
- **2-3 employees:** 1-3 people (ideal: 2)
- **4-5 employees:** 1-4 people (ideal: 3)
- **6+ employees:** Tier-based sizing

### Factor 2: Data Availability
- **<10% found:** Accept 1 person if only 1-3 candidates available
- **<20% found:** Reduce ideal size by 30%
- **<50% found:** Reduce ideal size by 20%

### Factor 3: Deal Size
- **<$50K:** Reduce ideal size by 40%
- **$50K-$150K:** Standard sizing
- **>$150K:** Full tier-based sizing

### Factor 4: Candidate Quality
- **0 high-quality:** Accept 1-2 best available
- **1 high-quality:** Accept 1 person if only 1-3 total candidates
- **2+ high-quality:** Use standard sizing

## Validation System

### Size Validation
- **Within min-max:** ✅ Accept (score: 60-100)
- **1 person + acceptable:** ✅ Accept (score: 80)
- **Below minimum:** ⚠️ Warn (score: 0-60)
- **Above maximum:** ⚠️ Warn (score: 0-90)

### Recommendations
- **Accept:** Size is appropriate
- **Accept with note:** Size is acceptable but note limitations
- **Warn:** Size is suboptimal, consider adjustments

## Examples

### Example 1: Solopreneur
```
Company: 1 employee
Found: 1 employee
Size: 1 person ✅
Reasoning: "Solopreneur/1-person company - single decision maker appropriate"
```

### Example 2: Limited Data
```
Company: 100 employees
Found: 5 employees (5% of company)
Size: 1-3 people ✅
Reasoning: "Limited employee data available (5 found) - using available candidates"
```

### Example 3: Small Deal
```
Company: 50 employees (S5 tier)
Deal: $30,000
Standard size: 5-8 people
Adjusted size: 1-5 people ✅
Reasoning: "Small deal size ($30,000) - smaller buyer group appropriate"
```

### Example 4: Single High-Quality
```
Company: 25 employees
Found: 3 employees
High-quality: 1 employee
Size: 1 person ✅
Reasoning: "Single high-quality candidate found - 1-person buyer group appropriate"
```

## Integration

The sizing system is integrated into the main pipeline at Stage 5:

1. **Determine Optimal Size** - Calculates size constraints based on all factors
2. **Select Buyer Group** - Uses constraints to select optimal group
3. **Validate Size** - Validates selected size against constraints
4. **Provide Recommendation** - Suggests actions if size is suboptimal

## Benefits

1. **Accurate Sizing:** Adapts to real-world data availability
2. **Accepts Reality:** Doesn't force unrealistic buyer group sizes
3. **Quality Focus:** Prioritizes quality candidates over quantity
4. **Flexible:** Handles edge cases gracefully
5. **Transparent:** Provides clear reasoning for size decisions

