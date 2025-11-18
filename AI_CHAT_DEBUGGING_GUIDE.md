# AI Chat 405 Error - Comprehensive Debugging Guide

## Overview

This document explains the step-by-step debugging that has been added to isolate the 405 error issue. The debugging logs will show exactly what happens at each stage of the request flow.

## Debugging Steps Added

### STEP 1 - Frontend: Preparing Request
**Location**: `RightPanel.tsx` (before fetch)

**What it logs**:
- The exact URL being sent (`/api/ai-chat` or `/api/ai-chat/`)
- Full URL with origin
- Request method (should be POST)
- Whether URL has trailing slash
- Window location details

**What to look for**:
- ✅ URL should be `/api/ai-chat` (no trailing slash)
- ✅ Method should be `POST`
- ❌ If URL has trailing slash here, that's the problem

### STEP 2 - Frontend: About to Call Fetch
**Location**: `RightPanel.tsx` (right before fetch)

**What it logs**:
- Confirmation of URL and method right before network call

**What to look for**:
- ✅ Confirms what's being sent to the network

### STEP 3 - Frontend: Fetch Completed
**Location**: `RightPanel.tsx` (after fetch promise resolves)

**What it logs**:
- How long the fetch took
- Timestamp

**What to look for**:
- Shows when the network request completed

### STEP 4 - Frontend: Response Received
**Location**: `RightPanel.tsx` (after response received)

**What it logs**:
- Response status (405, 200, etc.)
- Response URL (may differ from request URL if redirected)
- Original request URL vs final response URL
- Whether URL changed (indicates redirect)
- Response headers
- Redirect detection (307/308 status or Location header)
- Detailed 405 error information if status is 405

**What to look for**:
- ❌ **If `urlChanged: true`** → Redirect happened
- ❌ **If `response.status === 405`** → Method not allowed
- ❌ **If `response.redirected === true`** → Browser followed redirect
- ❌ **If `hasLocationHeader: true`** → Redirect header present
- Check the 405 error response body for server-side error details

### STEP A - Middleware: Request Intercepted
**Location**: `middleware.ts` (entry point)

**What it logs**:
- Pathname received by middleware
- HTTP method
- Full URL
- Whether pathname has trailing slash
- `isDesktopBuild` value (critical!)
- Request headers

**What to look for**:
- ✅ **If this log appears** → Middleware is running
- ❌ **If this log does NOT appear** → Middleware is not running (check `isDesktopBuild`)
- ❌ **If `isDesktopBuild: true`** → Middleware is skipped, that's the problem!
- Check if pathname has trailing slash when it reaches middleware

### STEP B - Middleware: Normalizing
**Location**: `middleware.ts` (before rewrite)

**What it logs**:
- Original pathname
- What it will rewrite to
- Method being preserved

**What to look for**:
- ✅ Should show normalization happening
- ✅ Should preserve POST method

### STEP C - Middleware: Performing Rewrite
**Location**: `middleware.ts` (during rewrite)

**What it logs**:
- From pathname → To pathname
- Method being preserved

**What to look for**:
- ✅ Confirms rewrite is happening
- ✅ Method should still be POST

### STEP D - Middleware: Rewrite Complete
**Location**: `middleware.ts` (after rewrite)

**What it logs**:
- Confirmation that rewrite completed

**What to look for**:
- ✅ Should appear if rewrite succeeded

### STEP E - Route Handler: POST Handler Called
**Location**: `route.ts` (POST handler entry)

**What it logs**:
- Method received by route handler
- Pathname received
- Full URL
- Whether pathname has trailing slash
- Request headers

**What to look for**:
- ❌ **If method is NOT POST** → Redirect converted POST→GET
- ❌ **If pathname has trailing slash** → Rewrite didn't work or didn't run
- ✅ **If method is POST and no trailing slash** → Everything worked!

### STEP F - Route Handler: Method is POST
**Location**: `route.ts` (after method check)

**What it logs**:
- Confirmation that method is POST

**What to look for**:
- ✅ Should appear if method check passed

## How to Use This Debugging

### 1. Deploy the Code
Deploy the updated code with all debugging enabled.

### 2. Trigger the Error
Try to send a message in the AI right panel.

### 3. Collect Logs

**Browser Console** (Client-side):
- Look for logs starting with `🔍 [AI CHAT DEBUG] STEP 1-4`
- These show what the frontend is doing

**Server Logs** (Vercel/Production):
- Look for logs starting with `🔍 [MIDDLEWARE DEBUG] STEP A-D`
- Look for logs starting with `🔍 [ROUTE DEBUG] STEP E-F`
- These show what the server is doing

### 4. Analyze the Flow

**Expected Flow (Working)**:
```
STEP 1 → Frontend sends POST /api/ai-chat (no slash)
STEP 2 → Frontend calls fetch
STEP A → Middleware intercepts /api/ai-chat
STEP B → Middleware normalizes (if needed)
STEP C → Middleware performs rewrite
STEP D → Middleware returns rewrite
STEP E → Route handler receives POST /api/ai-chat
STEP F → Route handler confirms POST method
STEP 3 → Frontend fetch completes
STEP 4 → Frontend receives 200 OK
```

**Problem Flow (405 Error)**:
```
STEP 1 → Frontend sends POST /api/ai-chat (no slash)
STEP 2 → Frontend calls fetch
STEP A → ❌ Middleware NOT running? OR
         ✅ Middleware intercepts but...
STEP 4 → Frontend receives 405
         - Check if URL changed (redirect happened)
         - Check if method changed (POST→GET)
         - Check response body for details
```

## Key Questions to Answer

1. **Does middleware run?**
   - Look for `STEP A` logs
   - If missing, check `isDesktopBuild` value

2. **What pathname does middleware see?**
   - Check `STEP A` log for `pathname` and `hasTrailingSlash`
   - If it has trailing slash, where did it come from?

3. **Does middleware rewrite?**
   - Look for `STEP B, C, D` logs
   - If missing, middleware didn't match the route

4. **What does route handler receive?**
   - Check `STEP E` log for `method` and `pathname`
   - If method is GET, redirect happened
   - If pathname has trailing slash, rewrite didn't work

5. **Did a redirect happen?**
   - Check `STEP 4` log for `urlChanged`, `response.redirected`, `hasLocationHeader`
   - If any are true, a redirect occurred

## Common Scenarios

### Scenario 1: Middleware Not Running
**Symptoms**:
- No `STEP A` logs
- `STEP E` shows method is GET
- `STEP 4` shows 405 error

**Cause**: `isDesktopBuild` is `true` in production
**Fix**: Check why `isDesktopBuild` is true (check environment variables)

### Scenario 2: Middleware Runs But Rewrite Doesn't Work
**Symptoms**:
- `STEP A` logs appear
- `STEP B, C, D` logs appear
- `STEP E` shows pathname still has trailing slash OR method is GET

**Cause**: Next.js redirect happens before middleware rewrite takes effect
**Fix**: Need to prevent Next.js redirect (may need different approach)

### Scenario 3: Redirect Happens After Middleware
**Symptoms**:
- `STEP A-D` logs show rewrite happening
- `STEP E` shows POST method
- `STEP 4` shows URL changed and 405 error

**Cause**: Something after middleware is causing redirect
**Fix**: Check Next.js configuration or Vercel settings

### Scenario 4: Frontend Sends Wrong URL
**Symptoms**:
- `STEP 1` shows URL has trailing slash
- All other steps show issues

**Cause**: Frontend code is adding trailing slash
**Fix**: Fix frontend URL construction

## Next Steps

1. Deploy with debugging
2. Trigger error
3. Collect all logs (browser console + server logs)
4. Match logs to scenarios above
5. Identify exact point of failure
6. Apply targeted fix

## Log Format

All debug logs use this format:
```
🔍 [COMPONENT DEBUG] STEP X - Component: Message
```

Where:
- `COMPONENT` = `AI CHAT`, `MIDDLEWARE`, or `ROUTE`
- `STEP X` = Step number (1-4 for frontend, A-F for server)
- `Component` = Specific component name
- `Message` = What's happening

This makes it easy to trace the request flow from start to finish.

