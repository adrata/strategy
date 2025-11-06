# Gmail and Google Calendar Nango Configuration Checklist

Use this checklist to verify and fix Gmail and Google Calendar integrations.

## Prerequisites

- [ ] Access to Nango dashboard (https://app.nango.dev)
- [ ] Access to Google Cloud Console (https://console.cloud.google.com)
- [ ] Access to Vercel project settings
- [ ] Outlook integration is working (use as reference)

## Step 1: Google Cloud Console OAuth Setup

### OAuth Consent Screen

- [ ] Go to Google Cloud Console → APIs & Services → OAuth consent screen
- [ ] **User Type**: Set to "External" (or "Internal" if Google Workspace only)
- [ ] **App name**: Set to production name (e.g., "Adrata" or "Action Platform")
  - ⚠️ **CRITICAL**: Must NOT be "Nango Developers Only - Not For Production"
- [ ] **User support email**: Your support email address
- [ ] **Developer contact information**: Your email address
- [ ] **App domain**: Your production domain (e.g., `action.adrata.com`)
- [ ] **Authorized domains**: Add `adrata.com` and `action.adrata.com`
- [ ] **Scopes**: Add required scopes:
  - [ ] `https://mail.google.com/` (Gmail)
  - [ ] `https://www.googleapis.com/auth/gmail.readonly` (Gmail)
  - [ ] `https://www.googleapis.com/auth/calendar` (Google Calendar)
  - [ ] `https://www.googleapis.com/auth/calendar.readonly` (Google Calendar)
- [ ] **Test users** (if in Testing mode): Add test users
- [ ] **Publishing status**: Set to "In production" or "Testing" as needed
- [ ] Click **Save and Continue** through all steps

### OAuth 2.0 Credentials

- [ ] Go to Google Cloud Console → APIs & Services → Credentials
- [ ] Click **Create Credentials** → **OAuth client ID**
- [ ] **Application type**: Web application
- [ ] **Name**: "Adrata Gmail Integration" (or similar production name)
- [ ] **Authorized redirect URIs**: Add exactly:
  ```
  https://api.nango.dev/oauth/callback
  ```
- [ ] Click **Create**
- [ ] **Copy Client ID** - Save this for Nango dashboard
- [ ] **Copy Client Secret** - Save this for Nango dashboard
- [ ] ⚠️ **IMPORTANT**: Use production OAuth app, NOT test app

### Optional: Separate OAuth App for Calendar

If using separate OAuth app for Google Calendar:
- [ ] Create another OAuth client ID for Google Calendar
- [ ] Use same redirect URI: `https://api.nango.dev/oauth/callback`
- [ ] Copy Client ID and Secret for Nango dashboard

## Step 2: Nango Dashboard Configuration

### Environment Check

- [ ] Go to Nango dashboard: https://app.nango.dev
- [ ] **IMPORTANT**: Verify you're in **"prod"** environment (check top right)
- [ ] If not in prod, switch to prod environment

### Gmail Integration

- [ ] Go to **Integrations** tab
- [ ] Find or create "Gmail" integration
- [ ] **Integration ID**: Note the exact value (likely `google-mail` or `gmail`)
  - ⚠️ **CRITICAL**: This must match `NANGO_GMAIL_INTEGRATION_ID` in Vercel
- [ ] **Client ID**: Paste production Client ID from Google Cloud Console
  - ⚠️ **CRITICAL**: Must be production OAuth app, NOT test app
- [ ] **Client Secret**: Paste production Client Secret from Google Cloud Console
- [ ] **Scopes**: Add:
  ```
  https://mail.google.com/
  https://www.googleapis.com/auth/gmail.readonly
  ```
- [ ] **Redirect URI**: Should be `https://api.nango.dev/oauth/callback` (Nango handles this)
- [ ] Click **Save** (important - integration must be saved, not in draft)
- [ ] Verify integration shows as "Saved" or "Active"

### Google Calendar Integration

- [ ] Go to **Integrations** tab
- [ ] Find or create "Google Calendar" integration
- [ ] **Integration ID**: Note the exact value (likely `google-calendar` or `calendar`)
  - ⚠️ **CRITICAL**: This must match `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID` in Vercel
- [ ] **Client ID**: Paste production Client ID from Google Cloud Console
  - Can be same as Gmail or separate OAuth app
  - ⚠️ **CRITICAL**: Must be production OAuth app, NOT test app
- [ ] **Client Secret**: Paste production Client Secret from Google Cloud Console
- [ ] **Scopes**: Add:
  ```
  https://www.googleapis.com/auth/calendar
  https://www.googleapis.com/auth/calendar.readonly
  ```
- [ ] **Redirect URI**: Should be `https://api.nango.dev/oauth/callback`
- [ ] Click **Save** (important - integration must be saved, not in draft)
- [ ] Verify integration shows as "Saved" or "Active"

### Reference: Outlook Integration (Working)

- [ ] Check Outlook integration in Nango dashboard
- [ ] Note the Integration ID (likely `outlook`)
- [ ] Verify Client ID format (should be from Azure AD)
- [ ] Use this as reference for Gmail/Calendar configuration

## Step 3: Environment Variables in Vercel

- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Verify **Production** environment is selected

### Required Variables

- [ ] **NANGO_SECRET_KEY**: Set to prod environment secret key from Nango
  - Get from: Nango Dashboard → Environment Settings → Secret Key
  - ⚠️ **CRITICAL**: Must match prod environment, not dev
- [ ] **NANGO_GMAIL_INTEGRATION_ID**: Set to exact Integration ID from Nango
  - Common values: `google-mail`, `gmail`
  - ⚠️ **CRITICAL**: Must match exactly (case-sensitive)
- [ ] **NANGO_GOOGLE_CALENDAR_INTEGRATION_ID**: Set to exact Integration ID from Nango
  - Common values: `google-calendar`, `calendar`
  - ⚠️ **CRITICAL**: Must match exactly (case-sensitive)

### Optional Variables

- [ ] **NANGO_HOST**: Set to `https://api.nango.dev` (default if not set)
- [ ] **NANGO_OUTLOOK_INTEGRATION_ID**: Set if using Outlook (reference)

### After Setting Variables

- [ ] **Redeploy** application for changes to take effect
- [ ] Wait for deployment to complete

## Step 4: Verification

### Run Diagnostic Script

- [ ] Run verification script:
  ```bash
  node scripts/verify-gmail-calendar-nango-config.js
  ```
- [ ] Review output for any errors or warnings
- [ ] Fix any issues identified

### Manual Verification

- [ ] Check Nango dashboard → Integrations
- [ ] Verify Gmail integration exists and is saved
- [ ] Verify Google Calendar integration exists and is saved
- [ ] Check Integration IDs match environment variables
- [ ] Verify Client IDs are from production OAuth apps (not test)

## Step 5: Testing

### Test Gmail Connection

- [ ] Go to Grand Central → Integrations
- [ ] Click "Connect Gmail"
- [ ] **Verify OAuth consent screen**:
  - [ ] Shows production app name (not "Nango Developers Only - Not For Production")
  - [ ] Shows correct scopes
  - [ ] Shows your app domain
- [ ] Complete OAuth flow
- [ ] Verify connection appears as "Connected"
- [ ] Check that emails sync

### Test Google Calendar Connection

- [ ] Click "Connect Google Calendar"
- [ ] **Verify OAuth consent screen**:
  - [ ] Shows production app name (not "Nango Developers Only - Not For Production")
  - [ ] Shows correct scopes
  - [ ] Shows your app domain
- [ ] Complete OAuth flow
- [ ] Verify connection appears as "Connected"
- [ ] Check that calendar events sync

## Troubleshooting

### Still Seeing "Developers Only" Message

- [ ] Check Google Cloud Console → OAuth consent screen → App name
- [ ] Verify Nango dashboard uses production Client ID (not test)
- [ ] Check OAuth app type is "Web application" (not Desktop)
- [ ] Verify redirect URI is exactly `https://api.nango.dev/oauth/callback`

### Integration Not Found Error

- [ ] Verify Integration ID in Nango matches environment variable exactly
- [ ] Check `NANGO_SECRET_KEY` matches prod environment
- [ ] Verify integration is saved in Nango (not draft)
- [ ] Redeploy after updating environment variables

### Connection Fails After OAuth

- [ ] Check redirect URI in Google Cloud Console
- [ ] Verify scopes in both Google Cloud Console and Nango
- [ ] Check Nango logs for errors
- [ ] Verify webhook URL is configured: `https://action.adrata.com/api/webhooks/nango/email`

## Success Criteria

All items below should be true:

- [ ] Gmail OAuth consent screen shows production app name
- [ ] Google Calendar OAuth consent screen shows production app name
- [ ] Both integrations connect successfully
- [ ] Gmail emails sync correctly
- [ ] Google Calendar events sync correctly
- [ ] No "Developers Only" or "Not For Production" messages

## Next Steps

After completing this checklist:

1. Monitor Nango logs for any errors
2. Check webhook delivery in Nango dashboard
3. Verify email and calendar sync are working
4. Document any custom Integration IDs for future reference

## Related Documentation

- OAuth Fix Guide: `docs/fix-gmail-google-calendar-oauth-consent-screen.md`
- Environment Variables: `docs/nango-environment-variables.md`
- Outlook Comparison: `docs/outlook-vs-gmail-calendar-nango-comparison.md`
- Gmail Setup: `docs/gmail-integration-setup.md`
- Google Calendar Setup: `docs/google-calendar-integration-setup.md`

