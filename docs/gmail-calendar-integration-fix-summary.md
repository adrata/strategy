# Gmail and Google Calendar Integration Fix Summary

## Problem

Users see "Nango Developers Only - Not For Production" in the OAuth consent screen when connecting Gmail or Google Calendar, while Outlook integration works correctly.

## Root Cause

The OAuth consent screen name comes from Google Cloud Console OAuth consent screen configuration. The "Developers Only - Not For Production" text indicates:
- Nango is configured with a test/development OAuth app
- OR the OAuth consent screen in Google Cloud Console has this name set
- OR the Client ID/Secret in Nango dashboard points to a test app

## Solution

### 1. Update Google Cloud Console OAuth Consent Screen

**Location**: Google Cloud Console → APIs & Services → OAuth consent screen

**Action**: Update "App name" to production name (e.g., "Adrata" or "Action Platform")

**Required Scopes**:
- Gmail: `https://mail.google.com/`, `https://www.googleapis.com/auth/gmail.readonly`
- Google Calendar: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/calendar.readonly`

### 2. Create Production OAuth 2.0 Credentials

**Location**: Google Cloud Console → APIs & Services → Credentials

**Action**: Create OAuth client ID (Web application type)

**Redirect URI**: `https://api.nango.dev/oauth/callback`

**Important**: Use production OAuth app, NOT test app

### 3. Update Nango Dashboard Configuration

**Location**: Nango Dashboard → Integrations

**For Gmail**:
- Integration ID: `google-mail` (or match `NANGO_GMAIL_INTEGRATION_ID`)
- Client ID: Production OAuth Client ID from Google Cloud Console
- Client Secret: Production OAuth Client Secret
- Scopes: Gmail API scopes
- Save the integration

**For Google Calendar**:
- Integration ID: `google-calendar` (or match `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID`)
- Client ID: Production OAuth Client ID (can be same as Gmail)
- Client Secret: Production OAuth Client Secret
- Scopes: Google Calendar API scopes
- Save the integration

### 4. Update Environment Variables in Vercel

**Location**: Vercel Dashboard → Settings → Environment Variables

**Required Variables**:
```bash
NANGO_GMAIL_INTEGRATION_ID=google-mail
NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar
NANGO_SECRET_KEY=your_production_secret_key
```

**Important**: Integration IDs must match exactly what's in Nango dashboard

### 5. Redeploy Application

After updating environment variables, redeploy the application for changes to take effect.

## Verification

### Run Diagnostic Script

```bash
node scripts/verify-gmail-calendar-nango-config.js
```

This script will:
- Verify environment variables are set
- Check Nango connection
- Verify integrations exist
- Provide recommendations

### Manual Testing

1. **Test Gmail Connection**:
   - Go to Grand Central → Integrations
   - Click "Connect Gmail"
   - Verify OAuth consent screen shows production app name
   - Complete OAuth flow
   - Verify connection appears as "Connected"

2. **Test Google Calendar Connection**:
   - Click "Connect Google Calendar"
   - Verify OAuth consent screen shows production app name
   - Complete OAuth flow
   - Verify connection appears as "Connected"

## Documentation Created

1. **`docs/fix-gmail-google-calendar-oauth-consent-screen.md`**
   - Detailed step-by-step guide for fixing OAuth consent screen
   - Google Cloud Console configuration
   - Nango dashboard configuration
   - Troubleshooting guide

2. **`docs/outlook-vs-gmail-calendar-nango-comparison.md`**
   - Comparison between working Outlook and Gmail/Calendar
   - Identifies key differences
   - Verification checklist

3. **`docs/gmail-calendar-nango-configuration-checklist.md`**
   - Comprehensive checklist for configuration
   - Step-by-step verification
   - Success criteria

4. **`scripts/verify-gmail-calendar-nango-config.js`**
   - Diagnostic script to verify configuration
   - Checks environment variables
   - Verifies Nango connection
   - Validates integrations

5. **Updated `docs/nango-environment-variables.md`**
   - Added Gmail and Google Calendar environment variables
   - Examples for all integrations

## Code Verification

The code is already correctly configured:

- ✅ `src/app/api/v1/integrations/nango/connect/route.ts` - Provider mapping handles Gmail and Google Calendar
- ✅ `src/app/api/webhooks/nango/email/route.ts` - Webhook handler supports both providers
- ✅ `src/app/[workspace]/grand-central/integrations/page.tsx` - UI displays both integration cards

## Key Differences from Outlook

- **OAuth Provider**: Google Cloud Console (vs Azure AD for Outlook)
- **Consent Screen**: Configured in Google Cloud Console (vs Azure AD)
- **Separate Integrations**: Gmail and Calendar are separate (vs Outlook which combines both)
- **Integration IDs**: `google-mail` and `google-calendar` (vs `outlook`)

## Next Steps

1. Follow the checklist in `docs/gmail-calendar-nango-configuration-checklist.md`
2. Update Google Cloud Console OAuth consent screen name
3. Update Nango dashboard with production OAuth Client IDs
4. Set environment variables in Vercel
5. Redeploy application
6. Test both integrations
7. Verify OAuth consent screen shows production app name

## Success Criteria

- ✅ Gmail OAuth consent screen shows production app name
- ✅ Google Calendar OAuth consent screen shows production app name
- ✅ Both integrations connect successfully
- ✅ Email and calendar sync work correctly
- ✅ No "Developers Only" or "Not For Production" messages

## Related Files

- Configuration Guide: `docs/fix-gmail-google-calendar-oauth-consent-screen.md`
- Checklist: `docs/gmail-calendar-nango-configuration-checklist.md`
- Comparison: `docs/outlook-vs-gmail-calendar-nango-comparison.md`
- Environment Variables: `docs/nango-environment-variables.md`
- Diagnostic Script: `scripts/verify-gmail-calendar-nango-config.js`

