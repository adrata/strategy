# Environment Variables Configuration

This document describes the environment variables required for different deployment environments (development, staging, and production).

## Overview

The Adrata application uses environment-aware URL resolution to support multiple deployment environments. All URLs are determined through the centralized utility in `src/lib/env-urls.ts`, which automatically detects the current environment and returns appropriate URLs.

## Required Environment Variables

### Core Application URLs

#### `NEXTAUTH_URL`
- **Description**: Base URL for NextAuth.js authentication callbacks and session management
- **Required**: Yes (for production and staging)
- **Examples**:
  - Production: `https://action.adrata.com`
  - Staging: `https://staging.adrata.com`
  - Development: `http://localhost:3000`

#### `NEXT_PUBLIC_APP_URL`
- **Description**: Public-facing base URL for the application (used in client-side code)
- **Required**: Yes (for production and staging)
- **Examples**:
  - Production: `https://action.adrata.com`
  - Staging: `https://staging.adrata.com`
  - Development: `http://localhost:3000`

#### `OAUTH_REDIRECT_BASE_URL`
- **Description**: Base URL for OAuth redirect callbacks (Microsoft, Google, etc.)
- **Required**: Yes (for production and staging with OAuth integrations)
- **Examples**:
  - Production: `https://action.adrata.com`
  - Staging: `https://staging.adrata.com`
  - Development: `http://localhost:3000`

### Environment Detection

#### `VERCEL_ENV`
- **Description**: Automatically set by Vercel to indicate deployment environment
- **Values**: `production`, `preview`, `development`
- **Note**: Used by `src/lib/env-urls.ts` to detect environment automatically

#### `VERCEL_URL`
- **Description**: Automatically set by Vercel with the deployment URL
- **Format**: `project-name-xyz123.vercel.app`
- **Note**: Used as fallback when other URL variables are not set

## Environment-Specific Configurations

### Development Environment

```bash
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
OAUTH_REDIRECT_BASE_URL=http://localhost:3000
```

**Notes**:
- Uses `localhost:3000` for all URLs
- OAuth providers must have `http://localhost:3000` redirect URIs configured
- Webhooks may not work in local development (use ngrok or similar for testing)

### Staging Environment

```bash
NEXTAUTH_URL=https://staging.adrata.com
NEXT_PUBLIC_APP_URL=https://staging.adrata.com
OAUTH_REDIRECT_BASE_URL=https://staging.adrata.com
VERCEL_ENV=preview
```

**Notes**:
- Uses `staging.adrata.com` for all URLs
- OAuth providers must have staging redirect URIs configured:
  - Microsoft: `https://staging.adrata.com/outlook/auth_callback/`
  - Google: `https://staging.adrata.com/api/auth/oauth/callback`
- Webhook providers (Zoho, Nango) must have staging webhook URLs configured:
  - Zoho: `https://staging.adrata.com/api/webhooks/zoho`
  - Nango: `https://staging.adrata.com/api/webhooks/nango/email`

### Production Environment

```bash
NEXTAUTH_URL=https://action.adrata.com
NEXT_PUBLIC_APP_URL=https://action.adrata.com
OAUTH_REDIRECT_BASE_URL=https://action.adrata.com
VERCEL_ENV=production
```

**Notes**:
- Uses `action.adrata.com` for all URLs
- OAuth providers must have production redirect URIs configured
- Webhook providers must have production webhook URLs configured

## Mobile/Desktop Configuration

### Mobile (React Native)

```bash
EXPO_PUBLIC_API_URL=https://staging.adrata.com  # For staging
# or
EXPO_PUBLIC_API_URL=https://action.adrata.com   # For production
```

### Desktop (Tauri)

```bash
NEXT_PUBLIC_API_URL=https://staging.adrata.com  # For staging
# or
NEXT_PUBLIC_API_URL=https://action.adrata.com   # For production
```

**Note**: Desktop builds use hardcoded production URLs in Rust code (`src-desktop/src/platform/mod.rs`). For staging, these would need to be updated or made configurable.

## OAuth Provider Configuration

### Microsoft Azure AD

**Required Redirect URIs**:
- Production: `https://action.adrata.com/outlook/auth_callback/`
- Staging: `https://staging.adrata.com/outlook/auth_callback/`
- Development: `http://localhost:3000/outlook/auth_callback/`

### Google Cloud Console

**Required Redirect URIs**:
- Production: `https://action.adrata.com/api/auth/oauth/callback`
- Staging: `https://staging.adrata.com/api/auth/oauth/callback`
- Development: `http://localhost:3000/api/auth/oauth/callback`

**Authorized Domains**:
- `adrata.com`
- `action.adrata.com`
- `staging.adrata.com` (for staging)

## Webhook Configuration

### Zoho CRM

**Webhook URLs**:
- Production: `https://action.adrata.com/api/webhooks/zoho`
- Staging: `https://staging.adrata.com/api/webhooks/zoho`

**Configuration**: Set up in Zoho CRM under Setup > Automation > Actions > Webhooks

### Nango

**Webhook URLs**:
- Production: `https://action.adrata.com/api/webhooks/nango/email`
- Staging: `https://staging.adrata.com/api/webhooks/nango/email`

**Configuration**: Set up in Nango dashboard under Integrations > Webhooks

## URL Resolution Logic

The application uses the following priority order for URL resolution (implemented in `src/lib/env-urls.ts`):

1. **Server-side**:
   - `NEXTAUTH_URL` environment variable
   - `NEXT_PUBLIC_APP_URL` environment variable
   - `VERCEL_URL` (automatically set by Vercel)
   - Fallback to `http://localhost:3000`

2. **Client-side**:
   - Current `window.location` origin (for same-domain deployments)
   - Environment variables (if available)
   - Fallback to relative URLs

## Testing Staging Configuration

To verify staging is configured correctly:

1. **Check Environment Variables**:
   ```bash
   # In Vercel dashboard or deployment logs
   echo $NEXTAUTH_URL
   echo $NEXT_PUBLIC_APP_URL
   echo $OAUTH_REDIRECT_BASE_URL
   ```

2. **Test OAuth Redirects**:
   - Navigate to Grand Central integrations
   - Attempt to connect Outlook or Gmail
   - Verify redirect URL matches staging domain

3. **Test Webhooks**:
   - Check webhook configuration in Zoho/Nango dashboards
   - Verify webhook URLs point to staging domain
   - Test webhook delivery

4. **Test Share Links**:
   - Create a shared document or Chronicle report
   - Verify share URL uses staging domain

## Troubleshooting

### URLs Still Pointing to Production

- Check that environment variables are set in Vercel dashboard
- Verify variables are set for the correct environment (preview vs production)
- Clear browser cache and cookies
- Check deployment logs for environment variable values

### OAuth Redirects Failing

- Verify redirect URIs are added to OAuth provider dashboards
- Check that redirect URI exactly matches (including trailing slashes)
- Verify `OAUTH_REDIRECT_BASE_URL` is set correctly

### Webhooks Not Working

- Verify webhook URLs are configured in provider dashboards
- Check that webhook endpoints are accessible (not blocked by firewall)
- Review webhook delivery logs in provider dashboards

## Additional Resources

- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OAuth 2.0 Best Practices](https://oauth.net/2/)

