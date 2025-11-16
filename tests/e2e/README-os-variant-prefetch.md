# OS Variant Pre-fetching Tests

## Overview

This test suite verifies that pre-fetching works correctly for all OS variants (acquisition-os, retention-os, expansion-os) when users log in directly to these paths.

## Test Files

1. **`os-variant-prefetch.spec.ts`** - Playwright E2E tests for automated testing
2. **`os-variant-prefetch-browser-mcp.md`** - Manual testing guide using browser MCP tools

## Running the Tests

### Automated Tests (Playwright)

```bash
# Run all OS variant pre-fetch tests
npx playwright test tests/e2e/os-variant-prefetch.spec.ts

# Run specific test
npx playwright test tests/e2e/os-variant-prefetch.spec.ts -g "Acquisition OS Pre-fetching"

# Run with UI
npx playwright test tests/e2e/os-variant-prefetch.spec.ts --ui

# Run in headed mode (see browser)
npx playwright test tests/e2e/os-variant-prefetch.spec.ts --headed
```

### Environment Variables

Set these before running tests:

```bash
export TEST_EMAIL=your-test-email@adrata.com
export TEST_PASSWORD=your-test-password
export TEST_WORKSPACE=your-workspace-slug
```

### Manual Testing with Browser MCP

1. Start the dev server: `npm run dev`
2. Use Cursor's browser MCP tools to:
   - Navigate to sign-in page
   - Fill in credentials
   - Monitor network requests
   - Check localStorage
   - Verify console logs

## What Gets Tested

### 1. Path Detection
- ✅ Detects OS variant from redirect path
- ✅ Extracts OS type (acquisition/retention/expansion)
- ✅ Extracts section name (leads/prospects/clients/etc.)

### 2. API Calls
- ✅ Counts API called with background prefetch header
- ✅ Section APIs called with correct `osType` parameter
- ✅ Requests happen before redirect

### 3. Caching
- ✅ Counts cached in localStorage
- ✅ Section data cached in localStorage
- ✅ Cache keys include workspace ID
- ✅ Cache includes timestamp

### 4. OS-Specific Filtering
- ✅ Acquisition OS: filters for non-clients (LEAD, PROSPECT, OPPORTUNITY)
- ✅ Retention OS: filters for clients only
- ✅ Expansion OS: filters for clients (expansion opportunities)

## Test Scenarios

### Acquisition OS
- `/adrata/acquisition-os/leads` → pre-fetches leads with `osType=acquisition`
- `/adrata/acquisition-os/prospects` → pre-fetches prospects with `osType=acquisition`
- `/adrata/acquisition-os/opportunities` → pre-fetches opportunities with `osType=acquisition`

### Retention OS
- `/adrata/retention-os/clients` → pre-fetches clients with `osType=retention`
- `/adrata/retention-os/people` → pre-fetches people with `osType=retention`
- `/adrata/retention-os/companies` → pre-fetches companies with `osType=retention`

### Expansion OS
- `/adrata/expansion-os/prospects` → pre-fetches prospects with `osType=expansion`
- `/adrata/expansion-os/opportunities` → pre-fetches opportunities with `osType=expansion`
- `/adrata/expansion-os/people` → pre-fetches people with `osType=expansion`

## Expected Console Logs

When pre-fetching works correctly, you should see:

```
🚀 [AUTH PREFETCH] Starting immediate pre-fetch after authentication: { workspaceId, userId, redirectPath }
🔍 [AUTH PREFETCH] Detected section and OS from path: { redirectPath, pathParts, osIndex, detectedOSType, sectionFromPath, currentSection }
✅ [AUTH PREFETCH] Cached counts data
✅ [AUTH PREFETCH] Critical data pre-fetched successfully
```

## Expected Network Requests

1. **POST /api/auth/sign-in** - Authentication
2. **GET /api/data/counts** - Pre-fetch counts (with `X-Background-Prefetch: true` header)
3. **GET /api/v1/people?section=...&osType=...** - Pre-fetch section data (with `osType` parameter)

## Expected localStorage Keys

After successful pre-fetch:

- `adrata-counts-{workspaceId}` - Cached counts data
- `adrata-section-{section}-{workspaceId}` - Cached section data
- `adrata-record-{section}-{recordId}` - Cached record details (first 10 records)

## Troubleshooting

### Pre-fetch not happening
- Check that `prefetchAfterAuth` is called in sign-in page
- Verify redirect path includes OS variant
- Check browser console for errors

### Wrong OS type detected
- Verify path format: `/[workspace]/[os-variant]/[section]`
- Check `prefetchAfterAuth` path parsing logic
- Verify OS variant names match exactly

### Data not cached
- Check localStorage is accessible
- Verify API responses are successful
- Check cache key format matches expected pattern

### Wrong data filtered
- Verify `osType` parameter is passed to APIs
- Check API filtering logic for OS variants
- Verify section name matches expected values

## Related Files

- `src/platform/services/section-prefetch.ts` - Pre-fetching implementation
- `src/app/(auth)/sign-in/page.tsx` - Sign-in page that triggers pre-fetch
- `src/app/api/v1/people/route.ts` - People API with OS filtering
- `src/app/api/v1/companies/route.ts` - Companies API with OS filtering

