# 🔒 OS Variant Pre-fetching - Complete Test Guide

## Security Notes

✅ **SECURE IMPLEMENTATION VERIFIED:**
- No credentials hardcoded in code
- Uses `credentials: 'include'` for cookie-based authentication
- Pre-fetch requests use authenticated session cookies
- No sensitive data exposed in logs or localStorage
- Rate limiting on username validation endpoint
- Constant-time responses to prevent timing attacks

## Prerequisites

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   Wait for server to be ready at `http://localhost:3000`

2. **Set Test Credentials (Secure):**
   ```bash
   # Use environment variables - never hardcode!
   export TEST_EMAIL=ross@adrata.com
   export TEST_PASSWORD=rosspass
   export TEST_WORKSPACE=adrata
   ```

## Test Procedure

### Step 1: Navigate to Sign-In Page

```bash
# Using browser MCP tools
Navigate to: http://localhost:3000/sign-in
```

### Step 2: Log In

1. Enter email: `ross@adrata.com` (or use `ross`)
2. Enter password: `rosspass`
3. Click "Start" button

### Step 3: Test OS Variant Pre-fetching

After successful login, test each OS variant:

#### Test 1: Acquisition OS - Leads
1. Navigate to: `http://localhost:3000/adrata/acquisition-os/leads`
2. **Check Browser Console:**
   - Look for: `🚀 [AUTH PREFETCH] Starting immediate pre-fetch after authentication`
   - Look for: `🔍 [AUTH PREFETCH] Detected section and OS from path`
   - Verify: `detectedOSType: 'acquisition'`
   - Verify: `currentSection: 'leads'`
   - Look for: `✅ [AUTH PREFETCH] Cached counts data`
   - Look for: `✅ [AUTH PREFETCH] Critical data pre-fetched successfully`

3. **Check Network Tab:**
   - Request: `GET /api/data/counts`
     - Header: `X-Background-Prefetch: true` ✅
   - Request: `GET /api/v1/people?section=leads&osType=acquisition&...`
     - Verify: `osType=acquisition` parameter present ✅
     - Verify: Request happens before page navigation ✅

4. **Check localStorage:**
   ```javascript
   // In browser console
   Object.keys(localStorage).filter(k => k.includes('adrata'))
   // Should see:
   // - adrata-counts-adrata
   // - adrata-section-leads-adrata (or similar)
   ```

#### Test 2: Acquisition OS - Prospects
1. Navigate to: `http://localhost:3000/adrata/acquisition-os/prospects`
2. Verify same checks as above
3. Verify: `osType=acquisition` in API call
4. Verify: Section is `prospects`

#### Test 3: Retention OS - Clients
1. Navigate to: `http://localhost:3000/adrata/retention-os/clients`
2. **Check Browser Console:**
   - Verify: `detectedOSType: 'retention'`
   - Verify: `currentSection: 'clients'`

3. **Check Network Tab:**
   - Request should include: `osType=retention`
   - Request should filter for CLIENT status

4. **Verify Data:**
   - Only clients should be shown (not leads/prospects)
   - Data should be filtered by `osType=retention`

#### Test 4: Expansion OS - Prospects
1. Navigate to: `http://localhost:3000/adrata/expansion-os/prospects`
2. **Check Browser Console:**
   - Verify: `detectedOSType: 'expansion'`
   - Verify: `currentSection: 'prospects'`

3. **Check Network Tab:**
   - Request should include: `osType=expansion`
   - Request should filter for CLIENT status (expansion opportunities)

#### Test 5: Expansion OS - Opportunities
1. Navigate to: `http://localhost:3000/adrata/expansion-os/opportunities`
2. Verify same checks as above
3. Verify: `osType=expansion` in API call
4. Verify: Section is `opportunities`

## Verification Checklist

### ✅ Path Detection
- [ ] OS variant correctly detected from URL path
- [ ] OS type correctly extracted (acquisition/retention/expansion)
- [ ] Section correctly extracted (leads/prospects/clients/opportunities)
- [ ] Works with nested paths: `/[workspace]/[os-variant]/[section]`

### ✅ API Calls
- [ ] Counts API called with `X-Background-Prefetch: true` header
- [ ] Section API called with correct `osType` parameter
- [ ] `osType=acquisition` for acquisition-os paths
- [ ] `osType=retention` for retention-os paths
- [ ] `osType=expansion` for expansion-os paths
- [ ] Requests happen before redirect (pre-fetch timing)

### ✅ Caching
- [ ] Counts cached in localStorage with key: `adrata-counts-{workspaceId}`
- [ ] Section data cached in localStorage
- [ ] Cache includes timestamp (`ts` property)
- [ ] Cache includes data (`data` property)
- [ ] Cache is fresh (timestamp is recent)

### ✅ Data Filtering
- [ ] Acquisition OS: Shows non-clients (LEAD, PROSPECT, OPPORTUNITY)
- [ ] Retention OS: Shows clients only (CLIENT status)
- [ ] Expansion OS: Shows clients (for expansion opportunities)
- [ ] Data matches OS-specific filtering rules

### ✅ Performance
- [ ] Pre-fetch happens immediately after authentication
- [ ] Data loads instantly when navigating to pre-fetched sections
- [ ] No loading spinners on pre-fetched data
- [ ] Page feels instant (< 100ms load time)

## Security Verification

### ✅ Authentication
- [ ] Credentials never exposed in code
- [ ] Uses cookie-based authentication (`credentials: 'include'`)
- [ ] Pre-fetch requests include authentication cookies
- [ ] No credentials in localStorage or sessionStorage

### ✅ API Security
- [ ] All API calls require authentication
- [ ] Rate limiting on username validation endpoint
- [ ] Constant-time responses prevent timing attacks
- [ ] No sensitive data in API responses

### ✅ Data Security
- [ ] Workspace-scoped data (no cross-workspace leakage)
- [ ] User-scoped data (no cross-user leakage)
- [ ] Cache keys include workspace ID
- [ ] No sensitive data in console logs

## Troubleshooting

### Pre-fetch Not Happening
1. Check browser console for errors
2. Verify `prefetchAfterAuth` is called in sign-in page
3. Check that redirect path includes OS variant
4. Verify authentication was successful

### Wrong OS Type Detected
1. Check path format: `/[workspace]/[os-variant]/[section]`
2. Verify OS variant names match exactly (case-sensitive)
3. Check `prefetchAfterAuth` path parsing logic
4. Verify path parts are split correctly

### Data Not Cached
1. Check localStorage is accessible
2. Verify API responses are successful (200 status)
3. Check cache key format matches expected pattern
4. Verify workspace ID is correct

### Wrong Data Filtered
1. Verify `osType` parameter is passed to APIs
2. Check API filtering logic for OS variants
3. Verify section name matches expected values
4. Check database queries include OS-specific filters

## Expected Console Logs

```
🚀 [AUTH PREFETCH] Starting immediate pre-fetch after authentication: {
  workspaceId: 'adrata',
  userId: '...',
  redirectPath: '/adrata/acquisition-os/leads'
}
🔍 [AUTH PREFETCH] Detected section and OS from path: {
  redirectPath: '/adrata/acquisition-os/leads',
  pathParts: ['adrata', 'acquisition-os', 'leads'],
  osIndex: 1,
  detectedOSType: 'acquisition',
  sectionFromPath: 'leads',
  currentSection: 'leads'
}
✅ [AUTH PREFETCH] Cached counts data
✅ [AUTH PREFETCH] Critical data pre-fetched successfully
```

## Expected Network Requests

1. **POST /api/auth/sign-in** - Authentication
2. **GET /api/data/counts** - Pre-fetch counts
   - Header: `X-Background-Prefetch: true`
3. **GET /api/v1/people?section=leads&osType=acquisition&limit=10000`** - Pre-fetch section
   - Parameter: `osType=acquisition` (or retention/expansion)
   - Parameter: `section=leads` (or prospects/clients/opportunities)

## Success Criteria

✅ All OS variants work correctly
✅ Pre-fetching happens before redirect
✅ Data is cached in localStorage
✅ OS type parameter is passed to APIs
✅ Data filtering works correctly
✅ No security vulnerabilities
✅ Performance is optimal (< 100ms load time)

