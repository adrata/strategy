# Multi-Source Email Verification Integration

## Overview

The buyer group pipeline now integrates the sophisticated **multi-source email verification system** from `src/platform/pipelines/modules/core/MultiSourceVerifier.js` to ensure accurate and verified contact emails.

## Features

### 4-Layer Email Verification

1. **Syntax Validation** - Basic email format check
2. **Domain Validation** - Company domain matching and business email detection
3. **SMTP Validation** - Real-time email deliverability check
   - **ZeroBounce** (preferred) - DPA-compliant, enterprise-grade
   - **MyEmailVerifier** (fallback) - 98% accuracy, cost-effective at scale
4. **Prospeo Verification** - Additional verification layer with email discovery

### Waterfall Strategy

**For Existing Emails:**
- ZeroBounce validation (if API key available)
- Falls back to MyEmailVerifier (if ZeroBounce fails or unavailable)
- Returns confidence score (0-100%) and detailed validation steps

**For Missing Emails:**
- Prospeo Email Finder ($0.0198 per verified email)
- Returns discovered email with verification and confidence score

## Pipeline Integration

### New Stage: Email Verification (Stage 7.5)

The email verification stage runs after profile collection (Stage 7) and before cohesion validation (Stage 8):

```javascript
// Stage 7: Collect Full Profiles
const enrichedBuyerGroup = await this.collectFullProfiles(groupToEnrich);

// Stage 7.5: Multi-Source Email Verification & Discovery
const emailVerifiedBuyerGroup = await this.verifyAndEnrichEmails(enrichedBuyerGroup, intelligence);

// Stage 8: Cohesion Validation
const cohesion = await this.cohesionValidator.validate(emailVerifiedBuyerGroup);
```

### Email Data Enrichment

Each buyer group member is enriched with:
- `email` - Verified or discovered email address
- `emailVerified` - Boolean indicating if email passed verification
- `emailConfidence` - Confidence score (0-100%)
- `emailVerificationDetails` - Array of validation steps and results
- `emailVerificationCost` - Cost incurred for verification/discovery
- `emailSource` - Source of email: 'verified', 'discovered', or 'unverified'

## Environment Variables Required

```bash
# Email Verification APIs
ZEROBOUNCE_API_KEY=your_zerobounce_key        # Preferred for enterprise
MYEMAILVERIFIER_API_KEY=your_mev_key          # Fallback, cost-effective
PROSPEO_API_KEY=your_prospeo_key              # Email discovery and verification

# Optional for person/phone verification
PERPLEXITY_API_KEY=your_perplexity_key        # Real-time employment check
PEOPLE_DATA_LABS_API_KEY=your_pdl_key         # Phone enrichment
```

## Cost Structure

| Service | Purpose | Cost per Email |
|---------|---------|----------------|
| ZeroBounce | Email validation | ~$0.001 |
| MyEmailVerifier | Email validation | $0.002-$0.0039 |
| Prospeo | Email discovery + verification | $0.0198 |

Total email verification costs are tracked in `pipelineState.costs.email` and reported in the final output.

## Usage Example

```javascript
const { SmartBuyerGroupPipeline } = require('./index');

const pipeline = new SmartBuyerGroupPipeline({
  workspaceId: 'workspace_123',
  dealSize: 150000,
  productCategory: 'sales',
  targetCompany: 'https://linkedin.com/company/example'
});

const result = await pipeline.run(company);

console.log('Email Verification Stats:');
result.buyerGroup.forEach(member => {
  console.log(`${member.name}:`);
  console.log(`  Email: ${member.email}`);
  console.log(`  Verified: ${member.emailVerified}`);
  console.log(`  Confidence: ${member.emailConfidence}%`);
  console.log(`  Source: ${member.emailSource}`);
});

console.log(`Total email cost: $${result.costs.email.toFixed(4)}`);
```

## Database Persistence

Email verification data is automatically persisted to the database:

```javascript
await prisma.people.create({
  data: {
    // ... other fields
    email: verifiedEmail,
    emailVerified: true,
    emailConfidence: 95,
    emailSource: 'verified'
  }
});
```

## Verification Output

```
📧 Verifying and enriching emails for 5 members...
   ✅ Verifying existing email: john.doe@example.com
   ✅ Email verification: 95% confidence (4/4 steps passed)
   🔍 Discovering email for jane.smith...
   ✅ Discovered email: jane.smith@example.com (85% confidence)
✅ Email verification complete:
   - Verified: 3 emails
   - Discovered: 2 emails
   - Total cost: $0.0694
```

## Integration with Other Systems

The email verification system integrates seamlessly with:

1. **Coresignal Data** - Extracts emails from full profile data
2. **Company Intelligence** - Uses company domain for validation
3. **Database Persistence** - Saves verification results to People table
4. **Cost Tracking** - Tracks costs per member and total pipeline cost

## Benefits

### Before Integration
- Basic email extraction from Coresignal
- No validation (emails could be fake like @coresignal.temp)
- No email discovery for missing contacts
- Lower confidence in email accuracy

### After Integration
- 4-layer verification for existing emails
- Email discovery for missing contacts
- 70-95% confidence scores for verified emails
- Multi-source validation with detailed reasoning
- Cost tracking per email and total pipeline
- Database persistence of verification status

## Troubleshooting

### No Emails Found
If no emails are verified or discovered:
1. Check API keys are configured correctly
2. Verify company domain is accurate
3. Check API rate limits (especially ZeroBounce)
4. Review logs for API errors

### Low Confidence Scores
If emails have low confidence:
1. Email may be personal (@gmail.com) instead of business
2. SMTP validation may have failed
3. Domain may not match company domain
4. Consider using Prospeo for email discovery

### High Costs
If email verification costs are high:
1. Prioritize ZeroBounce/MyEmailVerifier over Prospeo when possible
2. Verify only final buyer group members (not all candidates)
3. Cache verification results to avoid redundant checks
4. Consider batch verification for better pricing

## Future Enhancements

Potential improvements:
1. Email pattern learning and prediction
2. Batch verification API for better pricing
3. Email confidence boosting from multiple sources
4. Historical verification result caching
5. Integration with additional verification providers

