# Error Summary - Next.js Application Issues

## Overview
This document summarizes all current errors being reported by Next.js in the application.

## Critical Errors

### 1. Authentication Failures (401 Errors)

#### Affected Endpoints:
- `/api/v1/speedrun` - GET requests returning 401
- `/api/v1/speedrun/check-signals/` - GET requests returning 401  
- `/api/data/counts/` - GET requests returning 401
- `/api/v1/simple-features/` - GET requests returning 400 (auth related)
- `/api/v1/collaboration/chat/chats/` - GET requests returning 400 (auth related)

#### Root Cause:
The v1 API endpoints use `getSecureApiContext()` which calls `getUnifiedAuthUser()` to authenticate via cookies (NextAuth session tokens). Authentication is failing, likely due to:
- Missing or invalid session cookies
- Session tokens not being included in requests
- Cookie domain/path mismatches
- Token expiration

#### Error Messages:
```
❌ V1 Auth: No valid authentication found
```

#### Location:
- `src/platform/services/secure-api-helper.ts` - `getSecureApiContext()`
- `src/platform/api-auth.ts` - `getUnifiedAuthUser()`

---

### 2. Fast Section Data HTTP Errors

#### Error Details:
```
❌ [FAST SECTION DATA] HTTP error for speedrun: {}
```

#### Root Cause:
The `useFastSectionData` hook is making requests to `/api/v1/speedrun` which are failing with HTTP errors. The error object is empty (`{}`), suggesting:
- Response body might be empty
- Error details not being captured properly
- Authentication failure returning empty response

#### Affected Component:
- `src/platform/hooks/useFastSectionData.ts` (line 239)

#### Flow:
1. Hook calls `/api/v1/speedrun?limit=50`
2. Request fails with HTTP error
3. Error details logged as empty object
4. User sees no data in speedrun section

---

### 3. Prisma Schema Field Errors (RESOLVED)

#### Error Details:
```
Unknown field `title` for select statement on model `users`
Unknown field `department` for select statement on model `users`
Unknown field `phoneNumber` for select statement on model `users`
Unknown field `linkedinUrl` for select statement on model `users`
Unknown field `communicationStyle` for select statement on model `users`
Unknown field `preferredDetailLevel` for select statement on model `users`
Unknown field `quota` for select statement on model `users`
Unknown field `territory` for select statement on model `users`
Unknown field `dashboardConfig` for select statement on model `users`
```

#### Root Cause:
The application uses `schema-streamlined.prisma` which doesn't include these user profile fields. The API route was trying to query fields that don't exist in the streamlined schema.

#### Status: FIXED
- Updated `src/app/api/settings/user/route.ts` to only query fields that exist in streamlined schema
- Removed non-existent fields from Prisma select statements
- Return default/empty values for missing fields

---

## Other Issues

### 4. Workspace Context Loading Issues

#### Error Details:
```
🔍 WorkspaceDataRouter: Not server-side or missing modules, returning demo fallback
```

#### Location:
- `src/platform/services/workspace-data-router.ts`

#### Impact:
- Application may be falling back to demo/fallback data
- Workspace-specific data may not be loading correctly

---

### 5. API Response Format Errors

#### Potential Issues:
- Empty response bodies causing JSON parsing errors
- Missing `success` or `data` fields in API responses
- Invalid response formats breaking frontend expectations

#### Locations:
- Multiple API routes may be returning inconsistent response formats
- Frontend hooks expect specific response structure

---

## Recommended Fixes

### Priority 1: Fix Authentication Issues

1. **Verify Session Cookie Configuration**
   - Check NextAuth cookie settings in `next.config.mjs`
   - Verify cookie domain/path settings
   - Ensure cookies are being set correctly

2. **Add Better Error Logging**
   - Log full request headers in `getUnifiedAuthUser()`
   - Log cookie presence and values (sanitized)
   - Add detailed error messages for auth failures

3. **Check Token Expiration**
   - Verify token expiration handling
   - Add automatic token refresh if needed
   - Handle expired tokens gracefully

### Priority 2: Improve Error Handling

1. **Enhance Error Messages**
   - Return detailed error messages in API responses
   - Log full error context in development
   - Provide user-friendly error messages

2. **Fix Empty Error Objects**
   - Ensure error responses include error details
   - Parse error responses properly in frontend
   - Add fallback error messages

### Priority 3: Validate API Responses

1. **Add Response Validation**
   - Validate API response structure
   - Add TypeScript types for API responses
   - Handle malformed responses gracefully

2. **Improve Error Boundaries**
   - Catch and display API errors in UI
   - Add retry mechanisms for failed requests
   - Show loading/error states properly

---

## Testing Checklist

- [ ] Verify authentication works for all v1 API endpoints
- [ ] Test session cookie persistence across page navigations
- [ ] Verify workspace context loads correctly
- [ ] Test error handling for failed API requests
- [ ] Verify Prisma client is using streamlined schema
- [ ] Test speedrun section data loading
- [ ] Verify error messages are informative
- [ ] Test error recovery/retry mechanisms

---

## Related Files

- `src/platform/services/secure-api-helper.ts` - Authentication wrapper
- `src/platform/api-auth.ts` - Core authentication logic
- `src/platform/hooks/useFastSectionData.ts` - Data fetching hook
- `src/app/api/v1/speedrun/route.ts` - Speedrun API endpoint
- `src/app/api/settings/user/route.ts` - User settings API (fixed)
- `prisma/schema-streamlined.prisma` - Database schema

