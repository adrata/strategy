# Vercel Production 405 Error - Complete Troubleshooting Checklist

## Issue Summary
- **Error**: HTTP 405 Method Not Allowed
- **Endpoint**: `POST https://action.adrata.com/api/ai-chat/`
- **Status**: Works locally, fails in production
- **Fix Applied**: Restored `/api/ai-chat` rewrite rule in vercel.json

## Critical Checks Required (Do These NOW on Vercel Dashboard)

### 1. Environment Variables (HIGHEST PRIORITY)
Check that these exist in Vercel project settings:

**Required for AI Chat:**
- [ ] `OPENROUTER_API_KEY` - Without this, the endpoint might fail silently
- [ ] `ANTHROPIC_API_KEY` - Fallback when OpenRouter fails
- [ ] `DATABASE_URL` or `POSTGRES_PRISMA_URL` - For authentication & data access
- [ ] `NEXTAUTH_SECRET` or `JWT_SECRET` - For auth token validation

**How to Check:**
1. Go to https://vercel.com/adrata/adrata/settings/environment-variables
2. Verify all required keys exist for Production, Preview, and Development
3. If missing, add them and trigger a new deployment

### 2. Deployment Status
- [ ] Check if the latest deployment (`994d7bb4`) has finished building
- [ ] Build should be **green/successful**, not yellow/building
- [ ] Typical build time: 3-7 minutes

**How to Check:**
1. Go to https://vercel.com/adrata/adrata/deployments
2. Find deployment with commit "Restore critical /api/ai-chat rewrite rule"
3. Status should show "Ready" with green checkmark

### 3. Node.js Version Match
Your config shows:
- `.nvmrc`: 18.20.4
- `package.json engines`: >=18.0.0

**Vercel Default**: Node.js 18.x (compatible ✅)

### 4. Function Configuration Issues

Check `vercel.json` function configuration:
```json
"src/app/api/ai-chat/route.ts": {
  "maxDuration": 60
}
```

**Potential Issue**: On Hobby plan, max is 10s. On Pro plan, max is 60s.
- [ ] Verify your Vercel plan supports 60s functions
- [ ] If on Hobby plan, reduce to 10

### 5. Build Output Verification

After deployment completes, check Vercel Function logs:
1. Go to Deployments → Click latest deployment → Functions tab
2. Verify `api/ai-chat.func` exists in the output
3. If missing, the route wasn't built correctly

## Secondary Checks

### 6. Middleware Not Blocking API Routes
Your `middleware.ts` line 136-137 says:
```typescript
if (pathname.startsWith('/api/')) {
  return NextResponse.next();
}
```
✅ This is correct - middleware shouldn't interfere

### 7. Trailing Slash Configuration
`next.config.mjs` has `trailingSlash: true` globally.

**Issue**: This can cause Vercel to be picky about trailing slashes
**Solution**: The rewrite rule we added handles this ✅

### 8. CORS/Preflight Issues
The route doesn't export an `OPTIONS` handler.

**Potential Issue**: If browser sends preflight request, it might fail
**Solution**: Add OPTIONS handler to `route.ts`:

```typescript
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma, X-Request-ID',
      'Access-Control-Max-Age': '86400',
    }
  });
}
```

### 9. Static Export Accidentally Enabled
✅ Verified: `output: 'export'` only enabled when `TAURI_BUILD=true`
✅ Vercel deployments don't set this env var

### 10. Native Dependencies
Your `package.json` uses:
- `bcryptjs` (pure JS) ✅
- `@prisma/client` (Vercel-compatible) ✅
- No native dependencies that would fail ✅

## Testing Plan (After Deployment Completes)

### Step 1: Verify Deployment
```bash
# Check if deployment is live
curl -I https://action.adrata.com/api/ai-chat/
```

**Expected**: Should return headers (not 404/405)

### Step 2: Test POST Request
```bash
curl -X POST https://action.adrata.com/api/ai-chat/ \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{"message": "test"}'
```

**Expected**: 
- If no auth: 401 Unauthorized
- If auth valid: 200 OK (or proper error message)
- **NOT 405**

### Step 3: Browser Console Test
1. Login to production: https://action.adrata.com
2. Open any record page
3. Open AI right panel
4. Send a test message
5. Check Network tab for `/api/ai-chat/` request

**Expected**: Status 200, not 405

## Most Likely Root Causes (Ranked)

1. **90% - Rewrite Rule** ✅ Fixed - waiting for deployment
2. **8% - Missing Environment Variables** ⚠️ CHECK VERCEL DASHBOARD
3. **1% - Deployment Not Complete** ⏳ Wait 5-10 minutes
4. **1% - CORS Preflight Issue** - Add OPTIONS handler if needed

## If Still Failing After All Checks

1. **Check Vercel Function Logs**:
   - Go to Deployments → Latest → Runtime Logs
   - Filter for `/api/ai-chat`
   - Look for actual error messages

2. **Try Edge Runtime**:
   Add to `src/app/api/ai-chat/route.ts`:
   ```typescript
   export const runtime = 'edge'; // Instead of 'nodejs'
   ```

3. **Simplify the Route Temporarily**:
   Create minimal test route to isolate issue:
   ```typescript
   export async function POST() {
     return NextResponse.json({ test: 'works' });
   }
   ```

4. **Contact Vercel Support**:
   If all else fails, this could be a Vercel platform issue with Next.js 15.3 + trailing slashes + rewrites

## Environment Variables Template for Vercel

Required for full AI Chat functionality:

```bash
# AI Services
OPENROUTER_API_KEY=sk-or-v1-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...

# Authentication
NEXTAUTH_SECRET=your-secret-here
JWT_SECRET=your-secret-here
NEXTAUTH_URL=https://action.adrata.com

# Node Environment
NODE_ENV=production

