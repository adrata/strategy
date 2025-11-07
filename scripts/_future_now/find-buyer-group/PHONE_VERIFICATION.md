# Multi-Source Phone Verification Integration

## Overview

The buyer group pipeline now integrates the sophisticated **multi-source phone verification system** from `src/platform/pipelines/modules/core/MultiSourceVerifier.js` to ensure accurate and verified contact phone numbers.

## Features

### 4-Source Phone Verification

1. **Lusha Phone Lookup** - Professional phone data (with rate limiting 2000 calls/day)
2. **People Data Labs** - Phone enrichment with ownership verification
3. **Twilio Lookup API** - Real-time phone validation and line type detection
4. **Prospeo Mobile Finder** - Mobile number discovery via LinkedIn URL

### Verification Strategy

**For Existing Phones:**
- Multi-source verification (Lusha → PDL → Twilio → Prospeo)
- Cross-reference across 4 sources
- Agreement bonus for multiple source confirmation
- Returns confidence score (0-100%) and phone type (direct/mobile/work)

**For Missing Phones:**
- Lusha LinkedIn enrichment ($0.01 per lookup)
- Returns discovered phone with type and confidence score
- Prioritizes: Direct Dial > Mobile > Work > Main

## Pipeline Integration

### New Stage: Phone Verification (Stage 10)

The phone verification stage runs after email verification (Stage 7.5) and before database persistence (Stage 11):

```javascript
// Stage 7.5: Multi-Source Email Verification & Discovery
const emailVerifiedBuyerGroup = await this.verifyAndEnrichEmails(...);

// Stage 10: Multi-Source Phone Verification & Enrichment
const phoneEnrichedBuyerGroup = await this.verifyAndEnrichPhones(emailVerifiedBuyerGroup, intelligence);

// Stage 11: Database Persistence
await this.saveBuyerGroupToDatabase(phoneEnrichedBuyerGroup, ...);
```

### Phone Data Enrichment

Each buyer group member is enriched with:
- `phone` / `phone1` - Primary verified or discovered phone number
- `phoneVerified` - Boolean indicating if phone passed verification
- `phoneConfidence` - Confidence score (0-100%)
- `phoneVerificationDetails` - Array of verification sources and results
- `phoneVerificationCost` - Cost incurred for verification/discovery
- `phoneSource` - Source of phone: 'verified', 'discovered', or 'unverified'
- `phoneType` - Type: 'direct', 'mobile', 'work', or 'unknown'
- `phoneMetadata` - Additional metadata (carrier, country, line type)
- `mobilePhone` - Mobile phone number (if available)
- `workPhone` - Work phone number (if available)
- `directDialPhone` - Direct dial number (if available)

## Environment Variables Required

```bash
# Phone Verification APIs
LUSHA_API_KEY=your_lusha_key                    # Required for phone enrichment
TWILIO_ACCOUNT_SID=your_twilio_sid             # Required for phone validation
TWILIO_AUTH_TOKEN=your_twilio_token            # Required for phone validation

# Optional for enhanced phone verification
PEOPLE_DATA_LABS_API_KEY=your_pdl_key          # Phone enrichment with ownership
PROSPEO_API_KEY=your_prospeo_key               # Mobile finder via LinkedIn
```

## Cost Structure

| Service | Purpose | Cost per Phone |
|---------|---------|----------------|
| Lusha | Phone lookup/discovery | ~$0.01 |
| Twilio | Phone validation | ~$0.005 |
| People Data Labs | Phone enrichment | ~$0.01 |
| Prospeo Mobile | Mobile discovery | ~$0.02 |

**Multi-source verification**: ~$0.045 per phone (all sources)
**Discovery only**: ~$0.01 per phone (Lusha LinkedIn lookup)

Total phone verification costs are tracked in `pipelineState.costs.phone` and reported in the final output.

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

console.log('Phone Verification Stats:');
result.buyerGroup.forEach(member => {
  console.log(`${member.name}:`);
  console.log(`  Phone: ${member.phone}`);
  console.log(`  Verified: ${member.phoneVerified}`);
  console.log(`  Confidence: ${member.phoneConfidence}%`);
  console.log(`  Type: ${member.phoneType}`);
  console.log(`  Source: ${member.phoneSource}`);
});

console.log(`Total phone cost: $${result.costs.phone.toFixed(4)}`);
```

## Database Persistence

Phone verification data is automatically persisted to the database:

```javascript
await prisma.people.create({
  data: {
    // ... other fields
    phone: verifiedPhone,
    phoneVerified: true,
    phoneConfidence: 85,
    phoneSource: 'verified',
    phoneType: 'mobile',
    mobilePhone: verifiedPhone,
    directDialPhone: null,
    workPhone: null
  }
});
```

## Verification Output

```
📞 Verifying and enriching phone numbers for 5 members...
   ✅ Verifying existing phone: +1-555-123-4567
   📱 Multi-Source: Verifying phone +1-555-123-4567...
   🔍 Lusha: Verifying phone +1-555-123-4567 for John Doe...
   ✅ Lusha: Phone verification result for +1-555-123-4567
   🔍 Twilio: Validating phone +1-555-123-4567...
   ✅ Twilio: Phone validation successful for +15551234567
   ✅ Phone verification: 85% confidence (2 sources)
   
   🔍 Discovering phone for Jane Smith...
   ✅ Discovered phone: +1-555-987-6543 (75% confidence)
   
✅ Phone verification complete:
   - Verified: 3 phones
   - Discovered: 2 phones
   - Total cost: $0.1350
```

## Phone Type Priority

The system prioritizes phone types based on business value:

1. **Direct Dial** - Best for B2B outreach (bypasses switchboard)
2. **Mobile** - High reach rate, personal contact
3. **Work** - Office line, may go to voicemail
4. **Main** - Company switchboard, lowest priority

## Integration with Other Systems

The phone verification system integrates seamlessly with:

1. **Coresignal Data** - Extracts phones from full profile data
2. **Lusha LinkedIn** - Discovers phones via LinkedIn URL
3. **Twilio Lookup** - Validates phone numbers and detects line type
4. **Database Persistence** - Saves verification results to People table
5. **Cost Tracking** - Tracks costs per member and total pipeline cost

## Benefits

### Before Integration
- Basic Lusha-only phone enrichment
- Single source (Lusha LinkedIn API)
- No phone validation or verification
- No phone type detection
- Lower confidence in phone accuracy

### After Integration
- **4-source phone verification** (vs. single source)
- **Multi-source validation** with cross-referencing
- **70-90% confidence scores** for verified phones
- **Phone type detection** (direct/mobile/work)
- **Graceful degradation** if APIs unavailable
- **Cost tracking** per phone and total pipeline

## Troubleshooting

### No Phones Found
If no phones are verified or discovered:
1. Check API keys are configured correctly (LUSHA_API_KEY, TWILIO_*)
2. Verify LinkedIn URLs are present (required for Lusha discovery)
3. Check API rate limits (Lusha: 2000 calls/day)
4. Review logs for API errors

### Low Confidence Scores
If phones have low confidence:
1. Phone may not be validated by multiple sources
2. Twilio may show phone as landline (lower confidence for mobile)
3. Number may be disconnected or invalid
4. Consider using Prospeo Mobile Finder for mobile numbers

### High Costs
If phone verification costs are high:
1. Multi-source verification uses 4 APIs (~$0.045 per phone)
2. Consider using discovery-only mode (~$0.01 per phone)
3. Verify only final buyer group members (not all candidates)
4. Cache verification results to avoid redundant checks

## Rate Limiting

### Lusha Rate Limiting
- **Daily limit**: 2000 calls per day
- **Automatic tracking**: System tracks Lusha usage
- **Graceful handling**: Skips Lusha when limit reached
- **Reset**: Daily counter resets at midnight

### Twilio Rate Limiting
- **Concurrent requests**: Limit to 10 concurrent requests
- **Rate limiting**: 500ms delay between calls
- **No daily limit**: Pay-per-use pricing

## Phone Validation Levels

### High Confidence (85-100%)
- Verified by 3+ sources
- Active line confirmed by Twilio
- Type detected (direct/mobile/work)
- No DNC (Do Not Call) flags

### Medium Confidence (70-84%)
- Verified by 2 sources
- Line type detected
- May have some verification warnings

### Low Confidence (50-69%)
- Verified by 1 source only
- Limited line type information
- May be old or disconnected

### Unverified (<50%)
- No verification sources available
- Phone format may be invalid
- Not recommended for outreach

## Future Enhancements

Potential improvements:
1. Phone number formatting and normalization
2. International phone validation
3. DNC (Do Not Call) list checking
4. Phone reputation scoring
5. Call connection rate tracking
6. Integration with additional verification providers

