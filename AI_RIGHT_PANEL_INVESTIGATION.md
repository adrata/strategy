# AI Right Panel Production Investigation

## Investigation Date
2025-01-XX

## Objective
Understand why AI Right Panel works locally but fails in production (405 errors).

## Key Finding: Environment Variable Detection Logic

### Desktop Detection Implementation

**Location**: `src/platform/ui/components/chat/RightPanel.tsx` (lines 2132-2141)

```typescript
const isDesktop = typeof window !== 'undefined' && 
  (process.env.NEXT_PUBLIC_IS_DESKTOP === 'true' || 
   (window as any).__TAURI__ !== undefined);

let apiUrl = '/api/ai-chat';

// Only add trailing slash for desktop builds
if (isDesktop) {
  apiUrl = apiUrl + '/';
}
```

### Critical Discovery: Build-Time vs Runtime Variables

**NEXT_PUBLIC_IS_DESKTOP** is a **build-time** environment variable:
- It gets baked into the client-side JavaScript bundle during `next build`
- If set during build, it will be `'true'` in the production bundle forever
- Runtime environment variables in Vercel won't change it after build

**TAURI_BUILD** is a **server-side** build-time variable:
- Used in `next.config.mjs` to determine `trailingSlash` setting
- Not available in client-side code (not prefixed with `NEXT_PUBLIC_`)

### Next.js Configuration

**Location**: `next.config.mjs` (line 10)

```javascript
const isDesktop = process.env.TAURI_BUILD === 'true';
trailingSlash: isDesktop,  // false for web production
```

**Expected Behavior**:
- Web production: `TAURI_BUILD` undefined → `trailingSlash: false`
- Desktop builds: `TAURI_BUILD='true'` → `trailingSlash: true`

## Potential Root Causes

### Root Cause #1: Build-Time Variable Contamination (MOST LIKELY)

**Scenario**: If production was built with `NEXT_PUBLIC_IS_DESKTOP='true'` set:
1. Build process bakes `NEXT_PUBLIC_IS_DESKTOP='true'` into client bundle
2. Client code checks: `process.env.NEXT_PUBLIC_IS_DESKTOP === 'true'` → **TRUE**
3. `isDesktop = true` → adds trailing slash → `/api/ai-chat/`
4. Production has `trailingSlash: false` (web build)
5. Next.js redirects `/api/ai-chat/` → `/api/ai-chat` (POST → GET)
6. Route handler receives GET → returns 405

**Evidence Needed**:
- Check Vercel build logs for `NEXT_PUBLIC_IS_DESKTOP` value
- Check if production bundle contains `NEXT_PUBLIC_IS_DESKTOP: "true"`

### Root Cause #2: Middleware Not Handling Route

**Location**: `src/middleware.ts` (lines 133-152)

Current implementation:
- Does NOT handle `/api/ai-chat` route
- Comment says "let Next.js handle trailing slashes naturally"
- Only handles `/api/v1/conversations/{id}/messages`

**Impact**: If Next.js does a redirect, middleware can't intercept it to preserve POST method.

### Root Cause #3: Next.js Trailing Slash Redirect Behavior

Even with `trailingSlash: false`, Next.js might:
1. See request to `/api/ai-chat/` (with slash)
2. Redirect to `/api/ai-chat` (without slash)
3. Browser follows redirect, converting POST → GET
4. Route handler receives GET → 405 error

**Evidence**: Check browser network tab for redirect status codes (307/308).

### Root Cause #4: Vercel Configuration Interference

**Location**: `vercel.json`

- Has rewrites for `/api/v1/(.*)` but not `/api/ai-chat`
- Headers are set but no specific API route handling
- Could Vercel be doing something unexpected?

## Implementation Details

### API URL Construction Flow

1. **Client-side detection** (RightPanel.tsx:2132-2141):
   - Checks `process.env.NEXT_PUBLIC_IS_DESKTOP` (build-time)
   - Checks `window.__TAURI__` (runtime, only in Tauri desktop app)
   - If either true → adds trailing slash

2. **Server-side config** (next.config.mjs:10):
   - Checks `process.env.TAURI_BUILD` (build-time, server-side only)
   - Sets `trailingSlash: isDesktop`

3. **Mismatch potential**:
   - Client bundle might have `NEXT_PUBLIC_IS_DESKTOP='true'` (from build)
   - Server config has `trailingSlash: false` (web production)
   - Client sends `/api/ai-chat/` but server expects `/api/ai-chat`

### Error Handling

**Location**: `src/app/api/ai-chat/route.ts` (lines 54-68)

```typescript
if (requestMethod !== 'POST') {
  console.error('❌ [AI CHAT] CRITICAL: Received non-POST method:', {
    receivedMethod: requestMethod,
    possibleCause: 'Next.js trailingSlash redirect may have converted POST→GET'
  });
  return NextResponse.json({...}, { status: 405 });
}
```

The route handler is aware of this issue and logs it.

## Investigation Checklist

### Completed
- [x] Reviewed desktop detection logic in RightPanel
- [x] Reviewed Next.js configuration
- [x] Reviewed middleware implementation
- [x] Reviewed API route handler
- [x] Identified build-time vs runtime variable issue
- [x] Added investigation logging to middleware (logs /api/ai-chat requests)
- [x] Added investigation logging to RightPanel (logs desktop detection details)

### Needs Production Data
- [ ] Check Vercel environment variables (NEXT_PUBLIC_IS_DESKTOP, TAURI_BUILD)
- [ ] Check production build logs for environment variable values
- [ ] Check browser network tab in production for:
  - Actual request URL
  - HTTP method (POST vs GET)
  - Response status codes
  - Redirect chains (307/308)
- [ ] Check production console logs for API route handler logs
- [ ] Check production logs for middleware investigation logs
- [ ] Check production browser console for desktop detection logs

## Recommended Next Steps

1. **Add temporary logging** to middleware to see if it executes for `/api/ai-chat`
2. **Check production bundle** - search for `NEXT_PUBLIC_IS_DESKTOP` in built JavaScript
3. **Review Vercel build logs** - check what env vars were set during last production build
4. **Browser network inspection** - capture actual request/response in production
5. **Compare local vs production** - side-by-side comparison of network requests

## Key Questions to Answer

1. **What is `NEXT_PUBLIC_IS_DESKTOP` value in production bundle?**
   - Search built JS files for this string
   - If it's `'true'`, that's the root cause

2. **What HTTP method does the API route receive in production?**
   - Check route handler logs
   - If it's GET instead of POST, redirect is happening

3. **Are there redirects in the network tab?**
   - Look for 307/308 status codes
   - Check if `response.url !== request.url`

4. **Is middleware executing?**
   - Add logging to middleware for `/api/ai-chat` path
   - Check if logs appear in production

5. **What was the build environment?**
   - Check Vercel build logs
   - Were desktop env vars accidentally set during web build?

## Historical Context

### Previous Analysis (TRAILING_SLASH_ANALYSIS.md)

A previous analysis document exists that identified similar issues:
- **Original Problem**: `trailingSlash: true` was causing POST→GET conversion
- **Previous Solution Attempts**:
  - Middleware rewrites (removed later)
  - Vercel rewrite rules
  - Frontend stripping trailing slashes
- **Key Finding**: Next.js redirects happen BEFORE middleware can intercept

**Current State**: The codebase has evolved:
- `next.config.mjs` now uses `trailingSlash: isDesktop` (conditional)
- Middleware rewrite for `/api/ai-chat` was REMOVED (comment says "let Next.js handle naturally")
- Frontend uses conditional desktop detection to add trailing slashes

**Critical Difference**: The previous analysis assumed `trailingSlash: true` globally. Current code has `trailingSlash: isDesktop` (false for web), but the client-side detection might still be adding slashes if `NEXT_PUBLIC_IS_DESKTOP` is set.

## Code References

- Desktop Detection: `src/platform/ui/components/chat/RightPanel.tsx:2132-2141`
- Next.js Config: `next.config.mjs:3,10`
- Middleware: `src/middleware.ts:133-152` (now includes investigation logging)
- API Route: `src/app/api/ai-chat/route.ts:36-68`
- Conversation Save: `src/platform/ui/components/chat/RightPanel.tsx:765-769`
- Historical Analysis: `TRAILING_SLASH_ANALYSIS.md`

## Investigation Logging Added

### Middleware Logging (src/middleware.ts:149-158)
Added logging to capture:
- Pathname (with/without trailing slash)
- HTTP method
- Full URL
- Timestamp

This will help determine if middleware is executing and what it sees.

### RightPanel Logging (src/platform/ui/components/chat/RightPanel.tsx:2147-2152)
Added desktop detection logging to capture:
- `NEXT_PUBLIC_IS_DESKTOP` value (from build)
- `window.__TAURI__` presence (runtime)
- Final `isDesktop` result
- Window location

This will show what the client-side code is detecting in production.

## Production Debugging Steps

Once deployed with investigation logging:

1. **Check Browser Console** (Client-side):
   - Look for `🤖 [AI CHAT] Making API request:` logs
   - Check `desktopDetection` object values
   - Verify if `isDesktop` is incorrectly `true`

2. **Check Server Logs** (Vercel/Production):
   - Look for `🔍 [MIDDLEWARE INVESTIGATION]` logs
   - Look for `🚀 [AI CHAT] Request received` logs
   - Check if method is POST or GET
   - Check if pathname has trailing slash

3. **Check Network Tab** (Browser):
   - Inspect the actual request
   - Check for redirects (307/308)
   - Verify final URL vs initial URL
   - Check request method (POST vs GET)

## Additional Discovery: Middleware Desktop Check

**Location**: `src/middleware.ts:126` and `src/lib/desktop-config.ts:9-10`

```typescript
// desktop-config.ts
export const isDesktopBuild = process.env.TAURI_BUILD === 'true' || 
                              process.env.NEXT_PUBLIC_IS_DESKTOP === 'true';

// middleware.ts
if (isDesktopBuild) {
  return NextResponse.next();  // Skip middleware for desktop builds
}
```

**Critical Finding**: The middleware checks `isDesktopBuild` which uses BOTH:
- `TAURI_BUILD` (server-side, build-time)
- `NEXT_PUBLIC_IS_DESKTOP` (client-side, build-time)

**Impact**: 
- If `NEXT_PUBLIC_IS_DESKTOP='true'` is in the production build, middleware would skip execution
- However, this is a **server-side check** in middleware, so it uses server env vars, not client bundle
- But the client-side RightPanel uses the same variable name, creating potential confusion

## Most Likely Root Cause

Based on the investigation, the **most likely root cause** is:

### Root Cause #1: Build-Time Variable Contamination (HIGHEST PROBABILITY)

**Scenario**: If `NEXT_PUBLIC_IS_DESKTOP='true'` was set during a production build:
1. Build process bakes `NEXT_PUBLIC_IS_DESKTOP='true'` into client bundle
2. Client code (RightPanel) checks: `process.env.NEXT_PUBLIC_IS_DESKTOP === 'true'` → **TRUE**
3. `isDesktop = true` → adds trailing slash → `/api/ai-chat/`
4. Production server has `trailingSlash: false` (web build, `TAURI_BUILD` is undefined)
5. Next.js sees `/api/ai-chat/` but expects `/api/ai-chat` (no slash)
6. Next.js redirects `/api/ai-chat/` → `/api/ai-chat` (POST → GET)
7. Route handler receives GET → returns 405

**Evidence Needed**:
- Check production bundle JS files for `NEXT_PUBLIC_IS_DESKTOP: "true"`
- Check Vercel build logs for environment variables
- Check browser console logs for `desktopDetection` values

### Root Cause #2: Middleware Skipping (LOWER PROBABILITY)

**Scenario**: If server-side `NEXT_PUBLIC_IS_DESKTOP='true'` is set in Vercel:
1. Middleware checks `isDesktopBuild` → true
2. Middleware returns early, doesn't execute
3. Next.js handles routing directly
4. If Next.js does redirect, no middleware to intercept

**Evidence Needed**:
- Check if middleware logs appear in production
- Check Vercel server-side environment variables

### Root Cause #3: Next.js Version/Behavior Change

**Scenario**: Next.js behavior with trailing slashes might have changed:
- Different versions handle API routes differently
- Production might be on different Next.js version than local

**Evidence Needed**:
- Compare Next.js versions (local vs production)
- Check Next.js changelog for trailing slash behavior changes

## Local vs Production Comparison

### Local Development (Working)

**Environment**:
- `NODE_ENV=development`
- `NEXT_PUBLIC_IS_DESKTOP` = undefined (not set)
- `TAURI_BUILD` = undefined (not set)
- `trailingSlash: false` (from `next.config.mjs`)

**Client-Side Detection** (RightPanel.tsx:2132-2141):
```typescript
const isDesktop = typeof window !== 'undefined' && 
  (process.env.NEXT_PUBLIC_IS_DESKTOP === 'true' ||  // undefined → false
   (window as any).__TAURI__ !== undefined);         // undefined → false
// Result: isDesktop = false
```

**API URL Construction**:
- `isDesktop = false` → no trailing slash added
- Final URL: `/api/ai-chat` (no slash)

**Server Configuration**:
- `trailingSlash: false` (matches client expectation)
- No redirect occurs
- POST request reaches route handler correctly

**Result**: ✅ Works

### Production Web (Failing - Hypothetical)

**Environment** (if `NEXT_PUBLIC_IS_DESKTOP='true'` was set during build):
- `NODE_ENV=production`
- `NEXT_PUBLIC_IS_DESKTOP` = `'true'` (baked into client bundle)
- `TAURI_BUILD` = undefined (server-side, not set for web)
- `trailingSlash: false` (from `next.config.mjs`, server-side)

**Client-Side Detection** (RightPanel.tsx:2132-2141):
```typescript
const isDesktop = typeof window !== 'undefined' && 
  (process.env.NEXT_PUBLIC_IS_DESKTOP === 'true' ||  // 'true' → TRUE!
   (window as any).__TAURI__ !== undefined);         // undefined → false
// Result: isDesktop = true (MISMATCH!)
```

**API URL Construction**:
- `isDesktop = true` → trailing slash added
- Final URL: `/api/ai-chat/` (with slash)

**Server Configuration**:
- `trailingSlash: false` (doesn't match client request)
- Next.js sees `/api/ai-chat/` but expects `/api/ai-chat`
- Redirect occurs: `/api/ai-chat/` → `/api/ai-chat` (POST → GET)
- Route handler receives GET → 405 error

**Result**: ❌ Fails

### Key Differences

| Aspect | Local (Working) | Production (Failing) |
|--------|----------------|---------------------|
| `NEXT_PUBLIC_IS_DESKTOP` | undefined | `'true'` (if set during build) |
| Client `isDesktop` | false | true |
| API URL | `/api/ai-chat` | `/api/ai-chat/` |
| Server `trailingSlash` | false | false |
| Match? | ✅ Yes | ❌ No |
| Redirect? | No | Yes (POST→GET) |
| Result | ✅ Works | ❌ 405 Error |

## Existing Error Handling

The codebase already has extensive error handling and logging:

### RightPanel Error Logging (lines 2234-2249)
- Detects 405 errors specifically
- Logs redirect information
- Checks if URL changed (indicating redirect)
- Logs full request/response details

### API Route Handler Logging (lines 44-51, 54-68)
- Logs request method and pathname
- Detects non-POST methods
- Logs trailing slash presence
- Provides detailed error messages

### Redirect Detection (lines 2222-2229)
- Checks for 307/308 status codes
- Checks for Location header
- Logs redirect details

These logs will be crucial for diagnosing the production issue once deployed.

## Next.js Version

**Current Version**: `next@^15.3.2` (from `package.json`)

Next.js 15 has specific behavior with trailing slashes:
- API routes should handle both `/api/route` and `/api/route/` automatically
- However, redirects can still occur if there's a mismatch
- The `trailingSlash` config affects API routes in Next.js 15

## Summary of Investigation

### What We Know

1. **Local works**: No desktop env vars → no trailing slash → matches server config
2. **Production fails**: Likely has desktop env var set → adds trailing slash → mismatch with server
3. **Code is aware**: Extensive logging exists to detect the issue
4. **Middleware removed**: Previous rewrite was removed, relying on Next.js to handle naturally
5. **Conditional logic exists**: Code tries to match desktop detection with server config

### What We Need to Verify

1. **Production bundle**: Does it contain `NEXT_PUBLIC_IS_DESKTOP: "true"`?
2. **Vercel env vars**: Are desktop env vars set in Vercel?
3. **Build logs**: What env vars were present during last production build?
4. **Browser console**: What does `desktopDetection` show in production?
5. **Server logs**: Do middleware and route handler logs appear?
6. **Network tab**: Are redirects happening? What's the final URL?

### Most Likely Root Cause

**Build-Time Variable Contamination**: `NEXT_PUBLIC_IS_DESKTOP='true'` was set during a production build, causing:
- Client to add trailing slash (`/api/ai-chat/`)
- Server to expect no trailing slash (`trailingSlash: false`)
- Next.js to redirect (POST → GET)
- Route handler to return 405

### Recommended Verification Steps

1. ✅ Deploy investigation logging (already added)
2. Check production browser console for `desktopDetection` values
3. Check production server logs for middleware and route handler logs
4. Check Vercel environment variables
5. Check production build logs
6. Inspect production bundle JS files for `NEXT_PUBLIC_IS_DESKTOP`

## Investigation Logging Added

### Client-Side Logging (RightPanel.tsx)

**Location**: Lines 2147-2164

**What it logs**:
- Desktop detection details (`NEXT_PUBLIC_IS_DESKTOP`, `window.__TAURI__`, `isDesktop` result)
- API URL being called (with/without trailing slash)
- Full URL with origin
- Request method
- Environment information

**How to use**:
- Open browser console in production
- Look for `🤖 [AI CHAT] Making API request:` logs
- Check `desktopDetection` object to see what client detected

### Server-Side Logging (Middleware)

**Location**: Lines 149-158

**What it logs**:
- Pathname (with/without trailing slash)
- HTTP method
- Full request URL
- Timestamp

**How to use**:
- Check Vercel server logs
- Look for `🔍 [MIDDLEWARE INVESTIGATION]` logs
- Verify if middleware is executing and what it sees

### API Route Handler Logging

**Location**: `src/app/api/ai-chat/route.ts` lines 44-51, 54-68

**What it logs**:
- Request method (POST vs GET)
- Pathname with trailing slash detection
- Full request URL
- Error details if method mismatch

**How to use**:
- Check Vercel server logs
- Look for `🚀 [AI CHAT] Request received` logs
- Check for `❌ [AI CHAT] CRITICAL` errors

## Conclusion

This investigation has identified the **most likely root cause** of the production 405 errors:

**Build-Time Environment Variable Contamination**: If `NEXT_PUBLIC_IS_DESKTOP='true'` was set during a production build, it would be baked into the client bundle, causing the client to add trailing slashes while the server expects none, leading to Next.js redirects that convert POST to GET.

**Key Findings**:
1. Local works because no desktop env vars are set
2. Production likely fails because desktop env var is set (or was set during build)
3. The mismatch between client-side detection and server-side config causes redirects
4. Extensive logging already exists and has been enhanced for investigation

**Next Steps**:
1. Deploy the investigation logging to production
2. Monitor browser console and server logs
3. Verify the root cause using the logged data
4. Apply appropriate fix based on findings

**Note**: This investigation focused on understanding the implementation without applying fixes, as requested. The investigation logging will help diagnose the exact issue in production.

