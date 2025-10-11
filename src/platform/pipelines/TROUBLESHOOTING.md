# Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the CFO/CRO discovery pipeline.

## Quick Diagnostics

### Check Pipeline Status
```bash
# Test with a known company
node -r dotenv/config src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.js https://microsoft.com

# Check API health
node -r dotenv/config src/platform/pipelines/tests/api-health-check.js
```

### Enable Debug Mode
```bash
# Detailed logging
DEBUG=true node -r dotenv/config src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.js https://company.com
```

## Common Issues

### 1. Low Discovery Rate (< 50%)

**Symptoms**:
- Few or no CFO/CRO found
- "No employees found" messages
- Low success rate in efficacy report

**Causes**:
- CoreSignal API key issues
- Company name resolution failures
- Role definition mismatches

**Solutions**:
1. **Check CoreSignal API Key**
   ```bash
   # Test CoreSignal connection
   node -r dotenv/config src/platform/pipelines/tests/coresignal-test.js
   ```

2. **Verify Company Resolution**
   - Check if company name is correct
   - Try different company name variations
   - Verify domain is accessible

3. **Review Role Definitions**
   - Check if company uses non-standard titles
   - Add custom role variations if needed
   - Review waterfall logic results

**Example Fix**:
```bash
# Test with different company name
node -r dotenv/config src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.js https://salesforce.com
```

### 2. API Rate Limit Exceeded

**Symptoms**:
- "Rate limit exceeded" errors
- 429 HTTP status codes
- API calls failing

**Causes**:
- Daily/monthly limits reached
- Too many concurrent requests
- Account limits exceeded

**Solutions**:
1. **Check Rate Limits**
   ```bash
   # Check Lusha usage (most common)
   # Lusha: 2000 calls/day
   # Check dashboard for current usage
   ```

2. **Implement Delays**
   ```bash
   # Add delays between requests
   # Already implemented in pipeline
   ```

3. **Upgrade API Plans**
   - Increase daily limits
   - Add more credits
   - Contact API providers

**Example Fix**:
```bash
# Wait for rate limit reset (usually 24 hours)
# Or upgrade Lusha plan for higher limits
```

### 3. Email Validation Failures

**Symptoms**:
- All emails marked as invalid
- "API key not configured" errors
- Low email validation success rate

**Causes**:
- ZeroBounce/MyEmailVerifier API issues
- Invalid API keys
- Domain configuration problems

**Solutions**:
1. **Check API Keys**
   ```bash
   # Test email validation APIs
   node -r dotenv/config src/platform/pipelines/tests/email-apis-test.js
   ```

2. **Verify Domain Configuration**
   - Check if domain has proper MX records
   - Verify domain is not blacklisted
   - Test with known good domains

3. **Review Email Patterns**
   - Check if email patterns are correct
   - Verify company email format
   - Test with different patterns

**Example Fix**:
```bash
# Test with known good email
# Check ZeroBounce dashboard for account status
```

### 4. Phone Verification Issues

**Symptoms**:
- No phone numbers found
- "LinkedIn URL required" errors
- Prospeo Mobile 400 errors

**Causes**:
- Missing LinkedIn URLs
- Invalid LinkedIn URL format
- Twilio/Prospeo API issues

**Solutions**:
1. **Check LinkedIn URLs**
   ```bash
   # Verify LinkedIn URLs are being extracted
   # Check if URLs are public profiles
   ```

2. **Test Phone APIs**
   ```bash
   # Test Twilio connection
   node -r dotenv/config src/platform/pipelines/tests/phone-apis-test.js
   ```

3. **Review Prospeo Mobile**
   - Ensure LinkedIn URLs are public
   - Check URL format (no special IDs)
   - Verify API key is valid

**Example Fix**:
```bash
# Test with company that has LinkedIn URLs
node -r dotenv/config src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.js https://microsoft.com
```

### 5. Employment Verification Failures

**Symptoms**:
- "UNKNOWN" employment status
- Perplexity API errors
- Low employment verification rate

**Causes**:
- Perplexity API issues
- Invalid executive names
- Company name mismatches

**Solutions**:
1. **Check Perplexity API**
   ```bash
   # Test Perplexity connection
   node -r dotenv/config src/platform/pipelines/tests/perplexity-test.js
   ```

2. **Verify Executive Names**
   - Check if names are correct
   - Verify company name matches
   - Test with known executives

3. **Review Search Queries**
   - Check if search terms are accurate
   - Verify company information
   - Test with different variations

**Example Fix**:
```bash
# Test with well-known executive
# Check Perplexity dashboard for usage
```

## Performance Issues

### 1. Slow Processing

**Symptoms**:
- Long processing times
- Timeout errors
- High memory usage

**Causes**:
- Large company datasets
- API response delays
- Network issues

**Solutions**:
1. **Optimize Batch Sizes**
   ```bash
   # Process smaller batches
   # Use parallel processing
   ```

2. **Check Network**
   - Verify internet connection
   - Check API response times
   - Monitor system resources

3. **Implement Caching**
   - Cache company data
   - Cache API responses
   - Use local storage

### 2. Memory Issues

**Symptoms**:
- Out of memory errors
- Slow performance
- System crashes

**Causes**:
- Large datasets
- Memory leaks
- Insufficient RAM

**Solutions**:
1. **Increase Memory**
   ```bash
   # Increase Node.js memory
   node --max-old-space-size=4096 -r dotenv/config src/platform/pipelines/pipelines/core/cfo-cro-function-pipeline.js
   ```

2. **Optimize Data Processing**
   - Process data in chunks
   - Clear unused variables
   - Use streaming for large files

## Data Quality Issues

### 1. Inaccurate Results

**Symptoms**:
- Wrong executives found
- Incorrect contact information
- Low confidence scores

**Causes**:
- Outdated data
- Incorrect company information
- API data quality issues

**Solutions**:
1. **Verify Input Data**
   - Check company names
   - Verify domains
   - Test with known data

2. **Review Confidence Scores**
   - Check source reliability
   - Verify data freshness
   - Cross-reference results

3. **Improve Data Sources**
   - Use multiple APIs
   - Implement validation
   - Add quality checks

### 2. Missing Data

**Symptoms**:
- No executives found
- Missing contact information
- Incomplete results

**Causes**:
- API limitations
- Data availability issues
- Search strategy failures

**Solutions**:
1. **Use Multiple Strategies**
   - Try different search methods
   - Use fallback strategies
   - Implement comprehensive search

2. **Enhance Data Sources**
   - Add more APIs
   - Improve search logic
   - Use AI-powered discovery

## API-Specific Issues

### CoreSignal Issues

**Common Problems**:
- Company ID not found
- Empty search results
- API key errors

**Solutions**:
1. **Check API Key**
   ```bash
   # Verify key is valid
   curl -H "apikey: YOUR_KEY" https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl
   ```

2. **Verify Company Names**
   - Use exact company names
   - Try different variations
   - Check domain resolution

### Perplexity Issues

**Common Problems**:
- API key errors
- Rate limiting
- Response format issues

**Solutions**:
1. **Check API Key**
   ```bash
   # Test Perplexity API
   curl -H "Authorization: Bearer YOUR_KEY" https://api.perplexity.ai/chat/completions
   ```

2. **Review Rate Limits**
   - Check usage in dashboard
   - Implement delays
   - Upgrade plan if needed

### Email API Issues

**Common Problems**:
- Invalid API keys
- Rate limiting
- Domain issues

**Solutions**:
1. **Test APIs**
   ```bash
   # Test ZeroBounce
   curl "https://api.zerobounce.net/v2/validate?api_key=YOUR_KEY&email=test@example.com"
   ```

2. **Check Domain Status**
   - Verify MX records
   - Check domain reputation
   - Test with known good domains

## Recovery Procedures

### 1. API Failures

**Steps**:
1. Check API status pages
2. Verify API keys
3. Review rate limits
4. Implement fallback strategies
5. Contact API support

### 2. Data Corruption

**Steps**:
1. Stop pipeline
2. Check input data
3. Verify API responses
4. Clear cache
5. Restart with clean data

### 3. System Crashes

**Steps**:
1. Check system logs
2. Verify system resources
3. Review error messages
4. Implement fixes
5. Restart pipeline

## Prevention

### 1. Regular Monitoring

**Daily Checks**:
- API usage and limits
- Error rates
- Performance metrics
- Cost tracking

### 2. Proactive Maintenance

**Weekly Tasks**:
- Review error logs
- Check API status
- Update configurations
- Test with sample data

### 3. Backup Strategies

**Always Have**:
- Multiple API providers
- Fallback methods
- Data backups
- Recovery procedures

## Getting Help

### 1. Self-Service

**Resources**:
- This troubleshooting guide
- API documentation
- Error logs
- Debug mode

### 2. Community Support

**Channels**:
- GitHub issues
- Stack Overflow
- API provider forums
- Developer communities

### 3. Professional Support

**When to Contact**:
- Critical production issues
- API provider problems
- Complex technical issues
- Urgent business needs

## Emergency Contacts

### API Providers
- **CoreSignal**: [support@coresignal.com](mailto:support@coresignal.com)
- **Perplexity**: [support@perplexity.ai](mailto:support@perplexity.ai)
- **ZeroBounce**: [support@zerobounce.net](mailto:support@zerobounce.net)
- **Twilio**: [support@twilio.com](mailto:support@twilio.com)

### Development Team
- **Technical Issues**: [dev-team@company.com](mailto:dev-team@company.com)
- **Urgent Issues**: [emergency@company.com](mailto:emergency@company.com)
- **Business Issues**: [business@company.com](mailto:business@company.com)
