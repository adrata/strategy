<!-- c63f3cad-bfed-4b12-ae93-7413afdd164d a783ae0f-afe1-4f5b-b225-f26e3d4407d9 -->
# Remove Swordfish and Adjust Multi-Source Verification

## Changes Required

### 1. Delete SwordfishIntelligence.js Module
**File**: `src/platform/pipelines/modules/core/SwordfishIntelligence.js`
- Delete the entire file (no longer needed)

### 2. Update MultiSourceVerifier.js
**File**: `src/platform/pipelines/modules/core/MultiSourceVerifier.js`

Remove Swordfish imports and references:
- Remove `const { SwordfishIntelligence } = require('./SwordfishIntelligence');`
- Remove `this.swordfish = new SwordfishIntelligence(config);`
- Update `verifyPersonIdentity()` to use 2-3x sources instead of 3-4x (CoreSignal, Lusha, Perplexity)
- Update `verifyEmailMultiLayer()` to use 2-3x layers (Syntax, Domain, SMTP/ZeroBounce/MyEmailVerifier)
- Update `verifyPhone()` to use Lusha only (1x source)
- Remove all Swordfish verification calls

### 3. Update core-pipeline.js
**File**: `src/platform/pipelines/pipelines/core/core-pipeline.js`

Remove Swordfish integration:
- Remove `const { SwordfishIntelligence } = require('../../modules/SwordfishIntelligence');`
- Remove `this.swordfish = new SwordfishIntelligence(config);`
- Remove `SWORDFISH_API_KEY` from config

### 4. Update EXECUTION_GUIDE.md
**File**: `src/platform/pipelines/pipelines/core/EXECUTION_GUIDE.md`

Update documentation:
- Remove Swordfish API key from environment setup
- Remove Swordfish from rate limits section
- Update verification counts: "2-3x Person Verification" and "2-3x Email Verification", "1x Phone Verification"
- Remove Swordfish credit estimates
- Update total cost estimates

### 5. Update test-multisource-pipeline.js
**File**: `src/platform/pipelines/pipelines/core/test-multisource-pipeline.js`

Update test messaging:
- Remove Swordfish from test description
- Update verification count descriptions

## Updated Verification Strategy

After changes:
- **Person Verification**: CoreSignal + Lusha + Perplexity (2-3x sources)
- **Email Verification**: Syntax + Domain + SMTP (ZeroBounce/MyEmailVerifier) + Prospeo (2-3x layers)
- **Phone Verification**: Lusha (1x source)

Note: Prospeo is already integrated for email discovery and will remain part of the email verification flow.

### To-dos

- [ ] Create SwordfishIntelligence.js module with person search, email verification, and phone verification methods
- [ ] Create MultiSourceVerifier.js orchestrator for 3x person, 3-4x email, 2x phone verification with confidence consolidation
- [ ] Enhance core-pipeline.js to integrate multi-source verification after executive discovery
- [ ] Add detailed confidence fields to CSV export (person/email/phone confidence + reasoning for CFO/CRO)
- [ ] Implement intelligent batching with rate limit handling for all API providers
- [ ] Test pipeline on sample companies, then execute full 1000-company run