# Buyer Group Discovery - Findings and Improvements

## Analysis Summary

After analyzing failed companies, we found:

### Success Rate
- **4 out of 5 companies succeeded** in finding buyer groups
- **1 company failed** (Culture Cutz - third-party booking platform website)

### Common Issues Identified

1. **Website Domain Mismatch** (5 occurrences)
   - Companies with third-party booking platforms (e.g., `culturecutz1.booksy.com`)
   - Subdomain issues (e.g., `sketchup.trimble.com` vs `trimble.com`)
   - Domain doesn't match company name

2. **Company Matching Issues**
   - When searching by domain, sometimes matches wrong company
   - Example: GitLab search found "verticurl-internal-linkedin.com" instead
   - Need better validation when domain is used as identifier

3. **LinkedIn URL Format Issues**
   - Some LinkedIn URLs have incorrect format (e.g., `/company/gitlab-com` instead of `/company/gitlab`)
   - System should normalize LinkedIn URLs before searching

4. **Small Companies Not in Coresignal**
   - Very small companies (< 10 employees) may not be in Coresignal database
   - Need alternative data sources or manual research

## Key Findings from Testing

### GitLab Test Results
- **Issue**: Company intelligence matched wrong company when searching by domain
- **Found**: "verticurl-internal-linkedin.com" instead of GitLab
- **Root Cause**: Domain extraction from LinkedIn URL (`linkedin.com`) was used instead of actual website
- **Impact**: Wrong company data used for employee search

### Culture Cutz Test Results
- **Issue**: Website is third-party booking platform (`culturecutz1.booksy.com`)
- **Result**: No employees found (searching wrong domain)
- **Recommendation**: Detect third-party platforms and search by company name instead

## Proposed Improvements

### 1. Fix Company Intelligence Domain Extraction

**Problem**: When identifier is a LinkedIn URL, we extract domain as `linkedin.com` instead of using the actual website.

**Solution**: 
- If identifier is LinkedIn URL, prioritize LinkedIn URL search
- Only use domain extraction if identifier is actually a website URL
- Add validation to reject domain matches that are clearly wrong (e.g., `linkedin.com`, `booksy.com`)

**Code Location**: `company-intelligence.js` → `fetchFromCoresignal()`

### 2. Detect Third-Party Platform Websites

**Problem**: Some companies have third-party booking/platform websites instead of their actual website.

**Solution**:
- Create a list of known third-party platforms (booksy.com, yelp.com, etc.)
- When website matches third-party platform, skip domain search
- Fall back to company name search or LinkedIn URL search

**Code Location**: `company-intelligence.js` → `fetchFromCoresignal()`

### 3. Improve Company Match Validation

**Problem**: Current validation sometimes accepts wrong companies.

**Solution**:
- Reject matches where domain is clearly wrong (e.g., `linkedin.com`, `booksy.com`)
- Add stricter validation when domain doesn't match
- If validation fails, try alternative search methods instead of accepting wrong match

**Code Location**: `company-intelligence.js` → `validateCompanyMatch()`

### 4. Normalize LinkedIn URLs

**Problem**: LinkedIn URLs sometimes have incorrect format (e.g., `/company/gitlab-com`).

**Solution**:
- Normalize LinkedIn URLs before searching
- Remove common suffixes like `-com`, `-inc`, etc.
- Try both normalized and original URL

**Code Location**: `preview-search.js` → `buildCoresignalQuery()`

### 5. Enhanced Fallback Strategy

**Problem**: When primary search fails, fallbacks don't always work.

**Solution**:
- When domain search fails validation, immediately try LinkedIn URL search
- When LinkedIn URL search fails, try company name search with variations
- Add Perplexity research as final fallback for companies not in Coresignal

**Code Location**: `index.js` → Alternative identifier search section

## Implementation Plan

### Phase 1: Critical Fixes (Immediate)
1. Fix domain extraction bug (LinkedIn URL → domain issue)
2. Add third-party platform detection
3. Improve company match validation

### Phase 2: Enhancements (Next)
4. Normalize LinkedIn URLs
5. Enhanced fallback strategies
6. Better error logging for debugging

### Phase 3: Advanced (Future)
7. Perplexity integration for companies not in Coresignal
8. Manual research workflow for small companies
9. Data quality scoring and recommendations

## Testing Recommendations

1. **Test with known problematic companies**:
   - GitLab (domain matching issue)
   - Culture Cutz (third-party platform)
   - SketchUp (subdomain issue)
   - Precisely (LinkedIn/website mismatch)

2. **Monitor success rate**:
   - Track success rate before and after improvements
   - Measure improvement in buyer group discovery

3. **Log detailed failure reasons**:
   - Add structured logging for each failure type
   - Track which improvements help most

## Next Steps

1. Review these findings together
2. Prioritize which improvements to implement first
3. Test improvements on known problematic companies
4. Iterate based on results

