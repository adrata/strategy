# Batch Enrichment Guide

## Overview

This guide explains how to use the batch enrichment scripts to populate existing database records with real enrichment data from CoreSignal, Perplexity, and Lusha.

## Prerequisites

### Required Environment Variables
```bash
CORESIGNAL_API_KEY=your_key_here        # Required
ANTHROPIC_API_KEY=your_key_here         # Required for summaries & intelligence
PERPLEXITY_API_KEY=your_key_here        # Optional but recommended
LUSHA_API_KEY=your_key_here             # Optional but recommended
```

### Server Running
The batch enrichment scripts call internal API endpoints, so your Next.js server must be running:

```bash
npm run dev
# or
npm run build && npm start
```

**Default:** Scripts assume server runs on `localhost:3000`

## Available Scripts

### 1. Data Quality Audit
**Purpose:** Assess current state and identify enrichment opportunities

```bash
# Audit top-temp workspace
node scripts/audit-data-quality.js --workspace=top-temp

# Audit with verbose output
node scripts/audit-data-quality.js --workspace=top-temp --verbose

# Don't export JSON report
node scripts/audit-data-quality.js --workspace=top-temp --no-export
```

**Output:**
- Overall quality score
- Records needing enrichment
- Field coverage statistics
- Top gaps by field
- Actionable recommendations
- JSON report exported to `scripts/reports/`

### 2. Batch Company Enrichment
**Purpose:** Enrich companies with CoreSignal + Perplexity + Lusha data

```bash
# Dry run (preview only)
node scripts/batch-enrich-companies.js --workspace=top-temp --dry-run

# Enrich top 10 companies (testing)
node scripts/batch-enrich-companies.js --workspace=top-temp --limit=10

# Full enrichment for workspace
node scripts/batch-enrich-companies.js --workspace=top-temp

# Force re-enrich even if recently enriched
node scripts/batch-enrich-companies.js --workspace=top-temp --force

# Skip first 100, process next batch
node scripts/batch-enrich-companies.js --workspace=top-temp --skip=100 --limit=50
```

**What it enriches:**
- Industry, sector
- Employee count, size, revenue
- Description
- Location fields (city, state, country, address)
- Contact info (phone, email)
- Social media URLs
- Technologies used
- NAICS/SIC codes
- Public/private status
- And 30+ more fields

### 3. Batch Person Enrichment
**Purpose:** Enrich people with CoreSignal + Perplexity + Lusha data

```bash
# Dry run (preview only)
node scripts/batch-enrich-people.js --workspace=top-temp --dry-run

# Enrich top 10 people (testing)
node scripts/batch-enrich-people.js --workspace=top-temp --limit=10

# Full enrichment for workspace
node scripts/batch-enrich-people.js --workspace=top-temp

# Skip intelligence generation
node scripts/batch-enrich-people.js --workspace=top-temp --skip-intelligence

# Force re-enrich
node scripts/batch-enrich-people.js --workspace=top-temp --force
```

**What it enriches:**
- Job title, department
- Email, phone (multiple numbers)
- State (extracted from location)
- Bio
- LinkedIn metrics
- Skills, education, certifications
- And automatically generates intelligence

### 4. Batch Intelligence Generation
**Purpose:** Generate AI intelligence for enriched people

```bash
# Dry run
node scripts/batch-generate-intelligence.js --workspace=top-temp --dry-run

# Generate for top 10 people
node scripts/batch-generate-intelligence.js --workspace=top-temp --limit=10

# Full intelligence generation
node scripts/batch-generate-intelligence.js --workspace=top-temp

# Force regenerate all
node scripts/batch-generate-intelligence.js --workspace=top-temp --force
```

**What it generates:**
- Buyer Group Role (Economic Buyer, Technical Buyer, Champion, etc.)
- Influence Level (High, Medium, Low)
- Decision Power (High, Medium, Low)
- Engagement Level (High, Medium, Low, None)
- Confidence score and reasoning

### 5. Master Enrichment Script
**Purpose:** Run all enrichment processes in sequence

```bash
# Dry run preview
node scripts/enrich-all-workspaces.js --workspace=top-temp --dry-run

# Enrich companies and people (recommended)
node scripts/enrich-all-workspaces.js --workspace=top-temp

# Only companies
node scripts/enrich-all-workspaces.js --workspace=top-temp --companies-only

# Only people
node scripts/enrich-all-workspaces.js --workspace=top-temp --people-only

# Limit records per type
node scripts/enrich-all-workspaces.js --workspace=top-temp --limit=50

# All production workspaces
node scripts/enrich-all-workspaces.js --all-production
```

## Recommended Workflow

### Step 1: Audit Current State
```bash
node scripts/audit-data-quality.js --workspace=top-temp
```

Review the output to understand:
- Current data quality scores
- How many records need enrichment
- Which fields are most commonly missing

### Step 2: Test with Small Batch
```bash
# Test with 10 companies
node scripts/batch-enrich-companies.js --workspace=top-temp --limit=10

# Test with 10 people
node scripts/batch-enrich-people.js --workspace=top-temp --limit=10
```

Verify:
- Enrichment succeeds
- Fields populate correctly
- No errors in console
- Data quality scores improve

### Step 3: Run Full Enrichment
```bash
# Option A: Use master script (recommended)
node scripts/enrich-all-workspaces.js --workspace=top-temp

# Option B: Run individually
node scripts/batch-enrich-companies.js --workspace=top-temp
node scripts/batch-enrich-people.js --workspace=top-temp
```

### Step 4: Verify Results
```bash
node scripts/audit-data-quality.js --workspace=top-temp
```

Compare before/after:
- Data quality scores should be 85%+
- Most critical fields should be populated
- Intelligence should be generated for people

### Step 5: Test UI
1. Visit company page: https://action.adrata.com/toptemp/companies/hci-energy-...
   - Verify summary populates
   - Verify key metrics show (Revenue, Employees, LinkedIn Followers)
   - Verify Company Details section is filled

2. Visit lead page: https://action.adrata.com/toptemp/leads/aaron-wunderlich-...
   - Verify Basic Information shows (Title, Department, State)
   - Verify Intelligence Snapshot shows (Role, Influence, Decision Power, Engagement)
   - Verify Company tab populates with company data

## Workspace Configuration

### Production Workspaces (Include)
- **top-temp** (`01K9QAP09FHT6EAP1B4G2KP3D2`) - PRIORITY
- notary-everyday (`01K7DNYR5VZ7JY36KGKKN76XZ1`)
- adrata (`01K7464TNANHQXPCZT1FYX205V`)
- cloudcaddie (`01K7DSWP8ZBA75K5VSWVXPEMAH`)
- pinpoint (`01K90EQWJCCN2JDMRQF12F49GN`)
- ei-cooperative (`01K9WFW99WEGDQY2RARPCVC4JD`)

### Excluded Workspaces
- demo (`01K74N79PCW5W8D9X6EK7KJANM`) - Test workspace
- top-engineering-plus (`01K75ZD7DWHG1XF16HAF2YVKCK`) - TOP workspace

## Rate Limiting

All scripts include automatic rate limiting to prevent API throttling:

- **1 second delay** between enrichment requests
- **1 second delay** between intelligence generation calls
- Progress checkpoints every 10 records

**Estimated time:**
- 100 companies: ~2-3 minutes
- 100 people: ~3-4 minutes (includes intelligence generation)
- 1,000 records: ~30-40 minutes

## Error Handling

Scripts are designed to be resilient:

- **Continue on failure**: Individual failures don't stop the batch
- **Detailed logging**: Every record logs success/failure with reason
- **Resume capability**: Use `--skip=N` to resume from checkpoint
- **Dry-run mode**: Test safely before making changes

## Cost Estimation

### API Credits per Record

**Company Enrichment:**
- CoreSignal: 2-3 credits (search + collect)
- Perplexity: $0.01 per request
- Lusha: $0.08 per lookup (if configured)
- **Total:** ~$0.10 per company

**Person Enrichment:**
- CoreSignal: 2-3 credits (search + collect)
- Perplexity: $0.01 per request
- Lusha: $0.08 per lookup (if configured)
- **Total:** ~$0.10 per person

**Intelligence Generation:**
- Anthropic Claude: $0.003 per request
- **Total:** ~$0.003 per person

**Top-Temp Workspace Estimate:**
- 342 companies × $0.10 = ~$34
- 1,528 people × $0.10 = ~$153
- 1,528 intelligence × $0.003 = ~$5
- **Total:** ~$192 for complete enrichment

## Troubleshooting

### Script Fails to Start
- Check Node.js is installed: `node --version`
- Ensure server is running on port 3000
- Check database connection

### API Errors (401/403)
- Verify API keys are set in `.env`
- Check API key validity
- Verify API rate limits not exceeded

### No Records Enriched
- Check if records already enriched (run with --force to override)
- Verify records have website/LinkedIn URL (companies) or email/LinkedIn (people)
- Check console logs for skip reasons

### Enrichment Fails for Specific Records
- Check if record has required identifiers
- Verify record exists in CoreSignal
- Check API response in logs
- May need manual data entry for some records

### Intelligence Not Generating
- Ensure Anthropic API key is configured
- Check if people have CoreSignal data (enrich first)
- Verify job titles are populated (needed for role analysis)

## Advanced Usage

### Resume from Checkpoint
If script crashes or you need to pause:

```bash
# Processed 150 records, want to resume from 150
node scripts/batch-enrich-companies.js --workspace=top-temp --skip=150
```

### Process Specific Ranges
```bash
# Process records 100-200
node scripts/batch-enrich-companies.js --workspace=top-temp --skip=100 --limit=100
```

### Parallel Processing (Advanced)
Run multiple batches in parallel (use with caution):

```bash
# Terminal 1: First 500
node scripts/batch-enrich-companies.js --workspace=top-temp --limit=500

# Terminal 2: Next 500
node scripts/batch-enrich-companies.js --workspace=top-temp --skip=500 --limit=500
```

**Warning:** Respect API rate limits!

### Force Re-enrichment
To update stale data (>90 days) or re-process all records:

```bash
node scripts/batch-enrich-companies.js --workspace=top-temp --force
```

## Monitoring Progress

### Real-time Progress
Scripts print progress every 10 records:

```
────────────────────────────────────────────────────────────
📊 Progress: 50 processed
   ✅ Enriched: 42
   ⏭️  Skipped: 6
   ❌ Failed: 2
────────────────────────────────────────────────────────────
```

### Check Database
Use Prisma Studio to view enriched data:

```bash
npm run prisma studio
```

Look for:
- `dataQualityScore` field (should be 80%+)
- `dataSources` array (should include CoreSignal, Perplexity, Lusha)
- `customFields.coresignalData` (should be populated)
- `descriptionEnriched` for companies
- `buyerGroupRole` and intelligence fields for people

### Query Database Directly
```sql
-- Check company enrichment status
SELECT 
  name,
  industry,
  "employeeCount",
  revenue,
  "dataQualityScore",
  "dataSources",
  "lastEnriched"
FROM companies
WHERE "workspaceId" = '01K9QAP09FHT6EAP1B4G2KP3D2'
AND "lastEnriched" IS NOT NULL
ORDER BY "lastEnriched" DESC
LIMIT 10;

-- Check person enrichment status
SELECT 
  "fullName",
  "jobTitle",
  department,
  state,
  "buyerGroupRole",
  "dataQualityScore",
  "lastEnriched"
FROM people
WHERE "workspaceId" = '01K9QAP09FHT6EAP1B4G2KP3D2'
AND "lastEnriched" IS NOT NULL
ORDER BY "lastEnriched" DESC
LIMIT 10;
```

## Best Practices

### 1. Always Test First
Run with `--dry-run` and `--limit=10` before full enrichment:

```bash
node scripts/enrich-all-workspaces.js --workspace=top-temp --dry-run --limit=10
```

### 2. Start with Audit
Understand what needs enrichment before running scripts:

```bash
node scripts/audit-data-quality.js --workspace=top-temp
```

### 3. Enrich in Batches
For large workspaces, process in smaller batches:

```bash
# Batch 1: First 100
node scripts/batch-enrich-companies.js --workspace=top-temp --limit=100

# Review results, then continue
# Batch 2: Next 100
node scripts/batch-enrich-companies.js --workspace=top-temp --skip=100 --limit=100
```

### 4. Monitor API Usage
- Track API credits used
- Monitor for rate limit errors
- Pause between large batches if needed

### 5. Verify Results
After enrichment, check:
- Audit report shows improved scores
- UI displays populated data
- No errors in application logs

## Example: Top-Temp Full Enrichment

### Complete Workflow
```bash
# Step 1: Audit current state
node scripts/audit-data-quality.js --workspace=top-temp
# Note: Shows 342 companies, 1,528 people need enrichment

# Step 2: Test with small batch
node scripts/enrich-all-workspaces.js --workspace=top-temp --dry-run --limit=5
# Verify: No errors, looks good to proceed

# Step 3: Enrich companies first (342 companies, ~6-7 minutes)
node scripts/batch-enrich-companies.js --workspace=top-temp
# Monitor: Check progress every 50 records

# Step 4: Enrich people (1,528 people, ~30-40 minutes)
node scripts/batch-enrich-people.js --workspace=top-temp
# Includes automatic intelligence generation

# Step 5: Verify results
node scripts/audit-data-quality.js --workspace=top-temp
# Expected: 90%+ quality scores, most fields populated

# Step 6: Test UI
# Visit company and lead pages to verify data displays
```

### Expected Results
- Companies: 90%+ average quality score
- People: 85%+ average quality score
- Intelligence: Generated for all people with job titles
- UI: Company summaries and lead basic info fully populated

## Troubleshooting

### "Server not running" Error
Start the development server:
```bash
npm run dev
```

### "API key not configured" Error
Add required keys to `.env` file and restart server.

### "No records to enrich" Message
All records already enriched! Options:
- Use `--force` to re-enrich
- Check audit report to see current state
- Verify you're targeting correct workspace

### High Failure Rate
Check:
- API keys are valid
- Not hitting rate limits
- Network connection stable
- Server has sufficient resources

### Specific Records Failing
- Check if record has required identifiers (website/LinkedIn for companies, email/LinkedIn for people)
- Some records may not exist in CoreSignal database
- May require manual data entry

## Performance Tips

### Optimal Batch Sizes
- **Small workspaces** (<100 records): Run all at once
- **Medium workspaces** (100-500): Batch of 100-200
- **Large workspaces** (500+): Batches of 100-200 with checkpoints

### Parallel Processing
For very large workspaces, run companies and people in parallel:

```bash
# Terminal 1
node scripts/batch-enrich-companies.js --workspace=top-temp

# Terminal 2 (wait 30 seconds to stagger)
node scripts/batch-enrich-people.js --workspace=top-temp
```

### Off-Peak Processing
Run during off-peak hours to:
- Reduce impact on production
- Better API response times
- Lower chance of rate limiting

## Maintenance

### Regular Re-enrichment
Data becomes stale over time. Recommended schedule:

- **Monthly**: Re-enrich high-priority accounts (--force)
- **Quarterly**: Full workspace refresh
- **Annual**: Complete database refresh

### Monitoring
Track enrichment health:
- Data quality scores trending up
- Recently enriched count increasing
- Failed enrichment rate <5%

### Cleanup
Old enrichment data in customFields can grow large:
- Consider archiving old enrichment snapshots
- Keep only latest enrichment data
- Prune customFields periodically

## Support

### Getting Help
If scripts fail or produce unexpected results:
1. Check console output for detailed errors
2. Review audit report for data quality insights
3. Check API logs for enrichment failures
4. Verify database state with Prisma Studio

### Common Questions

**Q: Can I run scripts on production database?**
A: Yes, scripts use smart update logic that never overwrites good data. Always test with --dry-run first.

**Q: How long does full enrichment take?**
A: Depends on record count. Top-temp (~1,870 records) takes approximately 45-60 minutes.

**Q: What if script crashes mid-run?**
A: Use --skip to resume from last checkpoint. Script logs show progress.

**Q: Can I enrich specific records only?**
A: Yes, use --limit and --skip to target specific ranges, or modify script filters.

**Q: Will this overwrite my manual edits?**
A: No! Smart update logic only fills empty fields. Manual edits are preserved.

**Q: Do I need all three API keys (CoreSignal, Perplexity, Lusha)?**
A: Only CoreSignal is required. Perplexity and Lusha are optional but provide better data coverage.

