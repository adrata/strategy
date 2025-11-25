# AI Right Panel Fix - Trailing Slash Issue Resolution

## Problem
HTTP 405 (Method Not Allowed) errors when making POST requests to `/api/ai-chat` in production.

## Root Cause
Next.js `trailingSlash: true` configuration primarily affects **page routes**, not API routes. However, when API routes are called with trailing slashes, Next.js may not route them correctly, or may cause redirects that convert POST → GET.

## Solution Implemented

### 1. Middleware Rewrite for `/api/ai-chat`

**File**: `src/middleware.ts` (lines 137-143)

Added middleware rewrite to normalize `/api/ai-chat/` → `/api/ai-chat`:
- Handles both `/api/ai-chat` and `/api/ai-chat/`
- Uses `NextResponse.rewrite()` to preserve HTTP method (POST stays POST)
- Prevents Next.js redirects that convert POST → GET

```typescript
// Handle /api/ai-chat (normalize trailing slash to prevent redirects)
if (pathname === '/api/ai-chat' || pathname === '/api/ai-chat/') {
  const url = request.nextUrl.clone();
  url.pathname = '/api/ai-chat';  // Normalize to no trailing slash
  return NextResponse.rewrite(url);  // Rewrite preserves HTTP method
}
```

### 2. Frontend API URL Update

**File**: `src/platform/ui/components/chat/RightPanel.tsx` (line 2185)

Changed from `/api/ai-chat/` to `/api/ai-chat`:
- API routes work better without trailing slashes
- Middleware will normalize if trailing slash is accidentally added
- Prevents Next.js redirect issues with API routes

```typescript
// CRITICAL: API routes work better without trailing slashes
// Middleware will normalize /api/ai-chat/ → /api/ai-chat if needed
let apiUrl = '/api/ai-chat';
```

### 3. Conversation API URL Update

**File**: `src/platform/ui/components/chat/RightPanel.tsx` (line 788)

Changed from `/api/v1/conversations/` to `/api/v1/conversations`:
- Consistent with other API calls
- Matches the pattern used elsewhere in the codebase

## How It Works

1. **Frontend sends**: `POST /api/ai-chat` (no trailing slash)
2. **Middleware intercepts**: If somehow a trailing slash is present, middleware normalizes it
3. **Route handler receives**: `POST /api/ai-chat` (normalized, no redirect)
4. **Result**: ✅ Request succeeds

## Why This Works

- **Middleware rewrite** happens before Next.js routing, preventing redirects
- **Rewrite preserves HTTP method** (unlike redirects which convert POST → GET)
- **Consistent API URL format** (no trailing slashes) matches Next.js API route expectations
- **Defensive normalization** in middleware handles edge cases

## Testing

To verify the fix works:

1. **Local testing**: Send a POST request to `/api/ai-chat` and verify it works
2. **Production testing**: Deploy and test in production environment
3. **Check logs**: Verify route handler receives POST method (not GET)
4. **Network tab**: Verify no redirects occur (no 307/308 status codes)

## Related Files

- `src/middleware.ts` - Middleware rewrite logic
- `src/platform/ui/components/chat/RightPanel.tsx` - Frontend API calls
- `src/app/api/ai-chat/route.ts` - API route handler
- `next.config.mjs` - Next.js configuration (`trailingSlash: true` for page routes)

## Notes

- `trailingSlash: true` in `next.config.mjs` is kept for desktop build compatibility (affects page routes)
- API routes are handled separately via middleware normalization
- This approach is consistent with how `/api/v1/conversations/{id}/messages` is already handled

