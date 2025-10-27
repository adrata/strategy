# Dynamic Routes Configuration Audit

## Overview
This document catalogs all API routes with dynamic configurations that need to be handled for Tauri desktop builds.

## Summary Statistics
- **Total API routes with dynamic configs**: 51 files
- **force-dynamic**: 47 files
- **force-static**: 3 files  
- **revalidate**: 1 file

## Detailed Breakdown by Category

### 1. Webhooks (3 files)
**Purpose**: External service integrations
- `src/app/api/webhooks/zoho/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/webhooks/outlook/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/webhooks/microsoft-graph/route.ts` - `export const dynamic = "force-dynamic"`

### 2. Intelligence APIs (17 files)
**Purpose**: AI-powered data analysis and insights
- `src/app/api/v1/intelligence/buyer-group/refresh/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/buyer-group/bulk/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/role/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/role/discover/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/role/bulk/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/person/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/person/research/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/person/enrich/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/company/score/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/company/recommend/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/company/icp/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/company/discover/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/buyer-group/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/intelligence/buyer-group/discover/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/intelligence/buyer-group/route.ts` - `export const dynamic = 'force-dynamic'`

### 3. Communications APIs (8 files)
**Purpose**: Email, phone, and messaging integrations
- `src/app/api/v1/communications/phone/voice/route.ts` - `export const dynamic = "force-static"`
- `src/app/api/v1/communications/phone/twiml-app/route.ts` - `export const dynamic = "force-static"`
- `src/app/api/v1/communications/phone/test-call-system/route.ts` - `export const dynamic = "force-static"`
- `src/app/api/v1/communications/phone/make-call/route.ts` - `export const dynamic = "force-static"`
- `src/app/api/v1/communications/phone/access-token/route.ts` - `export const dynamic = "force-static"`
- `src/app/api/v1/communications/email/sync/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/v1/communications/email/sync-scheduler/start/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/v1/communications/email/send/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/v1/communications/email/link/route.ts` - `export const dynamic = "force-dynamic"`

### 4. Authentication APIs (5 files)
**Purpose**: User authentication and session management
- `src/app/api/auth/sign-in/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/auth/sign-out/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/auth/oauth/callback/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/auth/token-refresh/start/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/auth/zoho/route.ts` - `export const dynamic = 'force-dynamic'`

### 5. Data APIs (3 files)
**Purpose**: Core data operations and queries
- `src/app/api/data/section/route.ts` - `export const dynamic = 'force-dynamic'` + `export const revalidate = 0`
- `src/app/api/data/buyer-groups/fast/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/data/buyer-groups/route.ts` - `export const dynamic = "force-static"`
- `src/app/api/data/conversions/route.ts` - `export const dynamic = "force-static"`

### 6. Other APIs (15 files)
**Purpose**: Various utility and service endpoints
- `src/app/api/v1/diagnostics/companies-schema/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/v1/companies/[id]/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/webhooks/person-change/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/webhooks/minimal-graph/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/webhooks/test-outlook/route.ts` - `export const dynamic = "force-dynamic"`
- `src/app/api/webhooks/zoho/debug/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/webhooks/zoho/test/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/zoho/notifications/[notificationId]/read/route.ts` - `export const dynamic = 'force-dynamic'`
- `src/app/api/zoho/notifications/route.ts` - `export const dynamic = 'force-dynamic'`

## Configuration Patterns

### Pattern 1: Force Dynamic (Most Common)
```typescript
export const dynamic = 'force-dynamic';
```
**Used for**: Real-time data, user-specific content, external API calls

### Pattern 2: Force Static
```typescript
export const dynamic = "force-static";
```
**Used for**: Phone system endpoints (already Tauri-compatible)

### Pattern 3: Revalidate
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```
**Used for**: Data section endpoint (prevents caching)

## Tauri Desktop Compatibility

### Compatible Routes (4 files)
- Phone communication endpoints (already using `force-static`)
- Data conversion endpoints (already using `force-static`)

### Incompatible Routes (47 files)
- All `force-dynamic` routes
- Routes with `revalidate` configurations
- Routes requiring server-side processing

## Recommended Solution

**Option A: Dual Mode Configuration** (Recommended)
1. Keep existing API routes for web development
2. Use Tauri invoke commands for desktop mode
3. Frontend detects environment and routes appropriately
4. No file modifications needed

**Implementation Status**:
- ✅ Tauri invoke commands implemented in Rust (`src-tauri/src/api/desktop.rs`)
- ✅ Desktop API client created (`src/lib/desktop-api.ts`)
- ✅ Environment detection configured (`src/lib/desktop-config.ts`)
- ⏳ Build configuration needs refinement

## Next Steps

1. Test Tauri invoke commands work correctly
2. Verify desktop API client routes requests properly
3. Create clean build configuration that doesn't move files
4. Ensure web app continues working with existing API routes
5. Test desktop app can authenticate and access data
