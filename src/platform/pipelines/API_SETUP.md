# API Setup Guide

## Overview

This guide provides step-by-step instructions for setting up all required API keys for the CFO/CRO discovery pipeline.

## Required APIs

### 1. CoreSignal (Required)
**Purpose**: Company resolution and executive discovery
**Cost**: ~2-3 credits per company
**Setup**:
1. Sign up at [CoreSignal](https://coresignal.com)
2. Get API key from dashboard
3. Add to `.env`: `CORESIGNAL_API_KEY=your_key_here`

### 2. Perplexity (Required)
**Purpose**: Employment status verification
**Cost**: ~$0.01 per company
**Setup**:
1. Sign up at [Perplexity](https://perplexity.ai)
2. Get API key from account settings
3. Add to `.env`: `PERPLEXITY_API_KEY=your_key_here`

### 3. ZeroBounce (Required)
**Purpose**: Email validation (primary)
**Cost**: ~$0.005 per validation
**Setup**:
1. Sign up at [ZeroBounce](https://zerobounce.net)
2. Get API key from dashboard
3. Add to `.env`: `ZEROBOUNCE_API_KEY=your_key_here`

### 4. MyEmailVerifier (Required)
**Purpose**: Email validation (fallback)
**Cost**: ~$0.001 per validation
**Setup**:
1. Sign up at [MyEmailVerifier](https://myemailverifier.com)
2. Get API key from dashboard
3. Add to `.env`: `MYEMAILVERIFIER_API_KEY=your_key_here`

### 5. Twilio (Required)
**Purpose**: Phone number validation
**Cost**: ~$0.008 per lookup
**Setup**:
1. Sign up at [Twilio](https://twilio.com)
2. Get Account SID and Auth Token
3. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_sid_here
   TWILIO_AUTH_TOKEN=your_token_here
   ```

## Optional APIs (Recommended)

### 6. Lusha (Optional)
**Purpose**: Person lookup and phone discovery
**Cost**: ~$0.08 per lookup
**Rate Limit**: 2000 calls/day
**Setup**:
1. Sign up at [Lusha](https://lusha.com)
2. Get API key from dashboard
3. Add to `.env`: `LUSHA_API_KEY=your_key_here`

### 7. Prospeo (Optional)
**Purpose**: Email and phone verification
**Cost**: ~$0.05 per verification
**Setup**:
1. Sign up at [Prospeo](https://prospeo.io)
2. Get API key from dashboard
3. Add to `.env`: `PROSPEO_API_KEY=your_key_here`

### 8. People Data Labs (Optional)
**Purpose**: Person lookup and phone discovery
**Cost**: ~$0.10 per lookup
**Setup**:
1. Sign up at [People Data Labs](https://peopledatalabs.com)
2. Get API key from dashboard
3. Add to `.env`: `PEOPLE_DATA_LABS_API_KEY=your_key_here`

## Environment Configuration

### Complete .env File
```bash
# Core APIs (Required)
CORESIGNAL_API_KEY=your_coresignal_key
PERPLEXITY_API_KEY=your_perplexity_key

# Email Validation (Required)
ZEROBOUNCE_API_KEY=your_zerobounce_key
MYEMAILVERIFIER_API_KEY=your_myemailverifier_key

# Phone Verification (Required)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Enhanced Discovery (Optional but Recommended)
LUSHA_API_KEY=your_lusha_key
PROSPEO_API_KEY=your_prospeo_key
PEOPLE_DATA_LABS_API_KEY=your_pdl_key
```

## API Testing

### Health Check Script
```bash
# Test all API connections
node -r dotenv/config src/platform/pipelines/tests/api-health-check.js
```

### Individual API Tests
```bash
# Test CoreSignal
node -r dotenv/config src/platform/pipelines/tests/coresignal-test.js

# Test Perplexity
node -r dotenv/config src/platform/pipelines/tests/perplexity-test.js

# Test Email APIs
node -r dotenv/config src/platform/pipelines/tests/email-apis-test.js

# Test Phone APIs
node -r dotenv/config src/platform/pipelines/tests/phone-apis-test.js
```

## Cost Management

### Budget Recommendations
- **Small Scale** (100 companies): $50-100
- **Medium Scale** (1000 companies): $500-1000
- **Large Scale** (10000 companies): $5000-10000

### Cost Optimization
1. **Start with required APIs only**
2. **Add optional APIs for better results**
3. **Monitor usage daily**
4. **Set up billing alerts**

### Rate Limiting
- **Lusha**: 2000 calls/day (enforced)
- **ZeroBounce**: No documented limits
- **Other APIs**: Retry logic implemented

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Check key format (no spaces, quotes)
   - Verify key is active
   - Check account status

2. **Rate Limit Exceeded**
   - Wait for reset (usually 24 hours)
   - Check usage in dashboard
   - Consider upgrading plan

3. **Invalid Credentials**
   - Verify username/password
   - Check account status
   - Contact support if needed

4. **API Not Responding**
   - Check API status page
   - Verify network connection
   - Try again later

### Debug Mode
```bash
# Enable detailed API logging
DEBUG=true node -r dotenv/config src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.js https://company.com
```

## Security Best Practices

1. **Never commit API keys to git**
2. **Use environment variables**
3. **Rotate keys regularly**
4. **Monitor usage for anomalies**
5. **Use different keys for different environments**

## Support

### API Provider Support
- **CoreSignal**: [support@coresignal.com](mailto:support@coresignal.com)
- **Perplexity**: [support@perplexity.ai](mailto:support@perplexity.ai)
- **ZeroBounce**: [support@zerobounce.net](mailto:support@zerobounce.net)
- **MyEmailVerifier**: [support@myemailverifier.com](mailto:support@myemailverifier.com)
- **Twilio**: [support@twilio.com](mailto:support@twilio.com)
- **Lusha**: [support@lusha.com](mailto:support@lusha.com)
- **Prospeo**: [support@prospeo.io](mailto:support@prospeo.io)
- **People Data Labs**: [support@peopledatalabs.com](mailto:support@peopledatalabs.com)

### Pipeline Support
- Check troubleshooting guide
- Review error logs
- Test with debug mode
- Contact development team
