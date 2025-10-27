# Nike Pipeline Validation Tests

This directory contains comprehensive validation tests for all 5 enrichment pipelines using Nike (nike.com) as the target company to demonstrate Adrata's $250K Buyer Group Intelligence value proposition.

## Test Files

### Complete Validation
- **`test-nike-complete-validation.js`** - Runs all 5 pipelines sequentially with data flow between them
- **`run-nike-validation.js`** - Test runner that executes all individual tests and generates comprehensive report

### Individual Pipeline Tests
- **`test-find-nike-company.js`** - Company enrichment (✅ exists)
- **`test-person-nike.js`** - Person enrichment at Nike
- **`test-role-nike.js`** - Role finding at Nike (CFO, CTO, CMO, VP Sales)
- **`test-buyer-group-nike.js`** - Buyer group mapping (✅ exists)
- **`test-optimal-buyer-groups.js`** - Optimal buyer qualification (✅ exists)

## Quick Start

### Run Demo (No API Keys Required)
```bash
cd _future_now/tests
node test-nike-demo.js
```
*This demonstrates the complete workflow without requiring API calls*

### Run Complete Validation (Requires API Keys)
```bash
cd _future_now/tests
node test-nike-complete-validation.js
```

### Run All Tests with Report (Requires API Keys)
```bash
cd _future_now/tests
node run-nike-validation.js
```

### Run Individual Tests (Requires API Keys)
```bash
cd _future_now/tests
node test-find-nike-company.js
node test-person-nike.js
node test-role-nike.js
node test-buyer-group-nike.js
node test-optimal-buyer-groups.js
```

## Prerequisites

1. **Environment Variables** (in `.env` file):
   ```
   CORESIGNAL_API_KEY=your_coresignal_api_key
   ANTHROPIC_API_KEY=your_claude_api_key
   ```

2. **Node.js** (v14 or higher)

3. **Dependencies**:
   ```bash
   npm install dotenv @prisma/client
   ```

## Test Coverage

### Pipeline 1: Find Company
- ✅ Search Nike by website (nike.com)
- ✅ Multiple search approaches (website.exact, website, website.domain_only)
- ✅ Collect full company profile
- ✅ Validate key data points (name, website, industry, employee count, location)
- ✅ Store Coresignal company ID and LinkedIn URL for subsequent pipelines

### Pipeline 2: Find Person
- ✅ Company-based person search using LinkedIn URL from Pipeline 1
- ✅ Direct email matching (if available)
- ✅ LinkedIn URL matching (if available)
- ✅ Collect full profiles for top people
- ✅ Validate person data quality
- ✅ Test confidence matching (90%+ threshold)

### Pipeline 3: Find Role
- ✅ Test multiple target roles (CFO, CTO, CMO, VP Sales)
- ✅ AI-powered role variation generation (Claude AI)
- ✅ Multi-layered hierarchical search (primary → secondary → tertiary)
- ✅ Fallback when AI is unavailable
- ✅ Confidence-based matching
- ✅ Collect full profiles for role matches

### Pipeline 4: Find Buyer Group
- ✅ Discover employees across 7 key departments using Preview API
- ✅ AI-powered organizational hierarchy analysis
- ✅ Classify 5 buyer group roles:
  - Decision Maker (budget authority, VP+)
  - Champion (internal advocate, Director+)
  - Stakeholder (influences decision, Manager+)
  - Blocker (procurement, legal, compliance)
  - Introducer (sales, account management)
- ✅ Select 8-15 top buyer group members
- ✅ Collect full profiles for buyer group
- ✅ Validate buyer group composition

### Pipeline 5: Find Optimal Buyer Group
- ✅ Phase 1: Market filtering with firmographic + growth signals
- ✅ Phase 2: Real buyer group quality sampling using Preview API
- ✅ AI analyzes employees for:
  - Pain Signal Score (operational challenges, growth pains)
  - Innovation Score (forward-thinking culture, modern titles)
  - Buyer Experience Score (sophisticated buyers, modern roles)
  - Buyer Group Structure Score (ideal composition for enterprise sales)
- ✅ Rank companies by actual buyer group quality (60% weight)
- ✅ Demonstrate value proposition: "Don't go after the wrong people"

## Success Criteria

Each pipeline must demonstrate:
- **Company:** 90%+ data quality score, valid LinkedIn URL
- **Person:** 90%+ match confidence, enriched profile data
- **Role:** Find target role with hierarchical fallback, 75%+ confidence
- **Buyer Group:** 8-15 members, all 5 roles represented, balanced composition
- **Optimal Buyer:** 70%+ readiness score, real employee data analysis

## Expected Results

### Complete Validation Test
- ✅ All 5 pipelines execute successfully
- ✅ Nike company profile enriched with 90%+ quality
- ✅ At least 5 people enriched at Nike
- ✅ At least 1 target role found (e.g., CFO)
- ✅ Complete buyer group mapped (8-15 members, 5 roles)
- ✅ Buyer readiness score calculated with real employee analysis
- ✅ Total execution time < 5 minutes
- ✅ Credit usage documented and reasonable

### Value Demonstration
The test suite demonstrates Adrata's $250K Buyer Group Intelligence value:
- **Problem Solved:** "Going after the wrong people"
- **Solution Shown:** AI-powered buyer group mapping with real organizational data
- **Key Insights:**
  - Who are the decision makers at Nike?
  - Who are the champions and blockers?
  - How do we prioritize outreach?
  - What's the buyer group quality score?
  - Why is Nike a good/bad target?

## Output Files

- **`nike-validation-results.json`** - Detailed test results and metrics
- **Console output** - Real-time progress and validation results

## Troubleshooting

### Common Issues
1. **API Key Missing**: Ensure CORESIGNAL_API_KEY and ANTHROPIC_API_KEY are set in .env
2. **Rate Limiting**: Tests include delays between API calls to respect rate limits
3. **No Results Found**: Some tests may fail if Nike data is not available in Coresignal
4. **Credits Exhausted**: Monitor credit usage in test output

### Debug Mode
Add `DEBUG=true` to environment variables for verbose logging:
```bash
DEBUG=true node test-nike-complete-validation.js
```

## Cost Estimation

Approximate credit usage per test:
- **Complete Validation**: ~50-100 credits
- **Individual Tests**: ~10-20 credits each
- **Total for All Tests**: ~100-200 credits

## Support

For issues or questions about the validation tests, check:
1. Console output for specific error messages
2. `nike-validation-results.json` for detailed results
3. Individual test files for specific pipeline issues
