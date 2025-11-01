# Tauri Desktop App - Online-Only Implementation Summary

## Overview

This document summarizes the changes made to convert the Tauri desktop app from an offline-capable app with local database to an **online-only** desktop app that connects directly to the backend API server.

## Implementation Strategy

We chose **Option A: Frontend-Only API Calls** as recommended in the audit. The desktop app now:
- Makes all API calls directly from the Next.js frontend using `fetch()` to the backend server
- Only uses Tauri commands for native features (notifications, file system access, browser windows)
- Does not use local database or offline capabilities

## Key Changes Made

### 1. Static Export Configuration (`next.config.mjs`)

**Changed:**
- Enabled conditional static export: `output: isDesktop ? 'export' : undefined`
- This allows Next.js to generate static files for Tauri while keeping dynamic behavior for web builds

### 2. Desktop API Client (`src/lib/desktop-api.ts`)

**Changed:**
- Removed `callTauriCommand()` method that routed API calls to Rust backend
- Modified `call()` method to always use `callHTTP()` for API calls
- Updated `callHTTP()` to:
  - Get API base URL from `desktop-config.ts`
  - Construct full URLs pointing to backend server
  - Include credentials for authentication cookies
  - Provide better error handling

**Result:** All API calls now go directly to `https://adrata.com/api` (or configured backend)

### 3. Desktop Authentication (`src/platform/auth/service.ts`)

**Changed:**
- Completely rewrote `desktopSignIn()` method
- Removed dependency on `authenticate_user_direct` Tauri command
- Now uses `fetch()` to call backend API at `/api/auth/sign-in`
- Uses `getAPIBaseURL()` from `desktop-config.ts` for API base URL
- Includes proper error handling for network issues
- Provides user-friendly error messages

**Result:** Desktop authentication works exactly like web authentication, against the backend server

### 4. Desktop Configuration (`src/lib/desktop-config.ts`)

**Changed:**
- Updated `getAPIBaseURL()`:
  - For desktop builds: uses `NEXT_PUBLIC_API_BASE_URL` env var if set
  - Defaults to `https://adrata.com/api` for production
  - For web: continues using relative URLs
- Updated `desktopFeatures`:
  - `offlineMode: false` (online-only)
  - `localDatabase: false` (no local SQLite)
  - Kept native features enabled (notifications, file system)

**Result:** Desktop app is configured for online-only operation

### 5. Build Script (`scripts/deployment/tauri-build.js`)

**Changed:**
- Simplified build process (removed dual-build approach)
- Removed unnecessary API conflict fixing (no longer needed)
- Added note about API base URL configuration
- Static export is now handled by `next.config.mjs` conditionally

**Result:** Cleaner, simpler build process

### 6. Removed Unused Code

- Removed `invoke` import from `src/platform/auth/service.ts`
- Removed unused `callTauriCommand` method references

## Configuration

### Backend API URL

The desktop app uses the following priority for API base URL:

1. `NEXT_PUBLIC_API_BASE_URL` environment variable (if set)
2. Default: `https://adrata.com/api`

To use a different backend, set the environment variable during build:
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.com npm run desktop:build
```

### CSP Configuration (`src-tauri/tauri.conf.json`)

The Content Security Policy already allows:
- `https://adrata.com` - Production backend
- `https://adrata.vercel.app` - Vercel deployment
- `https:` and `ws:` wildcards - Any HTTPS/WebSocket connections

No changes needed - backend API calls are already allowed.

## Database Considerations

**Important:** The codebase uses the **streamlined database** schema (`prisma/schema-streamlined.prisma`). The desktop app:
- Does NOT use local database (SQLite was removed)
- All data comes from backend API calls
- Backend uses the streamlined Prisma schema

## What Still Uses Tauri Commands

The following features still use Tauri commands (native features):
- Browser windows (`create_browser_window`, `navigate_browser_window`, etc.)
- Desktop notifications
- File system access (if needed)
- Platform info

All data operations now go through backend API.

## Testing Checklist

After these changes, verify:

- [ ] `npm run desktop:dev` - Dev mode works
- [ ] `npm run desktop:build` - Build succeeds
- [ ] App opens and loads UI
- [ ] Authentication works (connects to backend)
- [ ] API calls reach backend server (check network tab)
- [ ] Real-time features (Pusher) work
- [ ] Native features (notifications) work
- [ ] Network errors show user-friendly messages

## Migration Notes

### For Development

When developing locally, you may want to point the desktop app to your local backend:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 npm run desktop:dev
```

### For Production

Production builds will default to `https://adrata.com/api`. No configuration needed.

## Files Modified

1. `next.config.mjs` - Enabled conditional static export
2. `src/lib/desktop-api.ts` - Switched to backend HTTP calls
3. `src/platform/auth/service.ts` - Updated to use backend API
4. `src/lib/desktop-config.ts` - Configured for online-only mode
5. `scripts/deployment/tauri-build.js` - Simplified build process

## Next Steps

1. Test the build process end-to-end
2. Verify authentication works against production backend
3. Test all major features that make API calls
4. Consider removing unused Rust database code in future cleanup

## Key Insight

The infrastructure was already solid - we just redirected API calls from local Tauri commands to the backend server. The desktop app is now essentially a webview that connects to the same backend as the web app, with native desktop features on top.

