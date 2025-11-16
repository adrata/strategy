# OS Variant Pre-fetching Browser MCP Test

This document describes how to test OS variant pre-fetching using Cursor's browser MCP tools.

## Test Scenarios

### 1. Acquisition OS Pre-fetching Test

**Steps:**
1. Navigate to sign-in page
2. Enter credentials
3. Mock authentication response with redirect to `/[workspace]/acquisition-os/leads`
4. Verify pre-fetch requests include `osType=acquisition`
5. Check localStorage for cached data

**Expected Results:**
- Counts API called with background prefetch header
- Section API called with `osType=acquisition` parameter
- Data cached in localStorage with correct keys

### 2. Retention OS Pre-fetching Test

**Steps:**
1. Navigate to sign-in page
2. Enter credentials
3. Mock authentication response with redirect to `/[workspace]/retention-os/clients`
4. Verify pre-fetch requests include `osType=retention`
5. Check localStorage for cached clients data

**Expected Results:**
- Clients API called with `osType=retention`
- Data filtered for CLIENT status only
- Cache contains retention OS data

### 3. Expansion OS Pre-fetching Test

**Steps:**
1. Navigate to sign-in page
2. Enter credentials
3. Mock authentication response with redirect to `/[workspace]/expansion-os/prospects`
4. Verify pre-fetch requests include `osType=expansion`
5. Check localStorage for cached prospects data

**Expected Results:**
- Prospects API called with `osType=expansion`
- Data filtered for CLIENT status (expansion opportunities)
- Cache contains expansion OS data

## Manual Testing Checklist

- [ ] Acquisition OS leads pre-fetch works
- [ ] Acquisition OS prospects pre-fetch works
- [ ] Retention OS clients pre-fetch works
- [ ] Expansion OS prospects pre-fetch works
- [ ] Expansion OS opportunities pre-fetch works
- [ ] localStorage cache keys are correct
- [ ] Cache timestamps are set
- [ ] OS type parameter is passed to all APIs
- [ ] Path detection works for all OS variants
- [ ] Pre-fetch happens before redirect

## Browser Console Checks

After login, check browser console for:
- `🚀 [AUTH PREFETCH] Starting immediate pre-fetch after authentication`
- `🔍 [AUTH PREFETCH] Detected section and OS from path`
- `✅ [AUTH PREFETCH] Cached counts data`
- `✅ [AUTH PREFETCH] Critical data pre-fetched successfully`

## Network Tab Checks

Verify in Network tab:
- `/api/data/counts` called with `X-Background-Prefetch: true` header
- `/api/v1/people?section=...&osType=...` called with correct osType
- Requests happen before page navigation
- Responses are cached

## localStorage Checks

After login, check localStorage:
- `adrata-counts-{workspaceId}` key exists
- `adrata-section-{section}-{workspaceId}` keys exist
- Cache entries have `ts` (timestamp) and `data` properties
- Cache is fresh (timestamp is recent)

