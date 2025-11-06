# Gmail and Google Calendar Integration - Implementation Guide

## Quick Start

Run the setup script to configure environment variables locally:

```bash
./scripts/setup-gmail-calendar-nango.sh
```

This will:
- Check current environment variables
- Prompt for Integration IDs from Nango dashboard
- Update `.env.local` with the values
- Run verification script

## Complete Implementation Steps

### Step 1: Local Setup (Automated)

```bash
# Run setup script
./scripts/setup-gmail-calendar-nango.sh

# Or manually set in .env.local:
NANGO_GMAIL_INTEGRATION_ID=google-mail
NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar
```

### Step 2: Google Cloud Console Configuration (Manual)

#### 2.1 Update OAuth Consent Screen

1. Go to https://console.cloud.google.com
2. Select your project (or create new one)
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. **User Type**: External (or Internal if Google Workspace only)
5. **App name**: Change from "Nango Developers Only - Not For Production" to your production name (e.g., "Adrata")
6. **User support email**: Your support email
7. **Developer contact information**: Your email
8. **App domain**: Your production domain (e.g., `action.adrata.com`)
9. **Authorized domains**: Add `adrata.com` and `action.adrata.com`
10. **Scopes**: Add:
    - `https://mail.google.com/` (Gmail)
    - `https://www.googleapis.com/auth/gmail.readonly` (Gmail)
    - `https://www.googleapis.com/auth/calendar` (Google Calendar)
    - `https://www.googleapis.com/auth/calendar.readonly` (Google Calendar)
11. Click **Save and Continue** through all steps

#### 2.2 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: "Adrata Gmail Integration" (or similar)
5. **Authorized redirect URIs**: Add exactly:
   ```
   https://api.nango.dev/oauth/callback
   ```
6. Click **Create**
7. **Copy Client ID** - Save this for Nango dashboard
8. **Copy Client Secret** - Save this for Nango dashboard

**Important**: Use production OAuth app, NOT test app.

### Step 3: Nango Dashboard Configuration (Manual)

#### 3.1 Verify Environment

1. Go to https://app.nango.dev
2. **IMPORTANT**: Ensure you're in **"prod"** environment (check top right)
3. If not, switch to prod environment

#### 3.2 Configure Gmail Integration

1. Go to **Integrations** tab
2. Find or create "Gmail" integration
3. **Integration ID**: Note the exact value (likely `google-mail` or `gmail`)
   - ⚠️ **CRITICAL**: This must match `NANGO_GMAIL_INTEGRATION_ID` in Vercel
4. **Client ID**: Paste production Client ID from Google Cloud Console
   - ⚠️ **CRITICAL**: Must be production OAuth app, NOT test app
5. **Client Secret**: Paste production Client Secret from Google Cloud Console
6. **Scopes**: Add:
   ```
   https://mail.google.com/
   https://www.googleapis.com/auth/gmail.readonly
   ```
7. **Redirect URI**: Should be `https://api.nango.dev/oauth/callback` (Nango handles this)
8. Click **Save** (important - integration must be saved, not in draft)

#### 3.3 Configure Google Calendar Integration

1. Go to **Integrations** tab
2. Find or create "Google Calendar" integration
3. **Integration ID**: Note the exact value (likely `google-calendar` or `calendar`)
   - ⚠️ **CRITICAL**: This must match `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID` in Vercel
4. **Client ID**: Paste production Client ID from Google Cloud Console
   - Can be same as Gmail or separate OAuth app
   - ⚠️ **CRITICAL**: Must be production OAuth app, NOT test app
5. **Client Secret**: Paste production Client Secret from Google Cloud Console
6. **Scopes**: Add:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.readonly
   ```
7. **Redirect URI**: Should be `https://api.nango.dev/oauth/callback`
8. Click **Save** (important - integration must be saved, not in draft)

### Step 4: Vercel Environment Variables (Semi-Automated)

#### Option A: Using Vercel CLI

```bash
# Generate commands
./scripts/generate-vercel-env-commands.sh

# Or set directly:
vercel env add NANGO_GMAIL_INTEGRATION_ID production
# When prompted, enter: google-mail (or your Integration ID)

vercel env add NANGO_GOOGLE_CALENDAR_INTEGRATION_ID production
# When prompted, enter: google-calendar (or your Integration ID)

# Verify NANGO_SECRET_KEY is set (should already be set for Outlook)
vercel env ls | grep NANGO_SECRET_KEY
```

#### Option B: Using Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify **Production** environment is selected
3. Add/Update:
   - **NANGO_GMAIL_INTEGRATION_ID**: `google-mail` (or your Integration ID)
   - **NANGO_GOOGLE_CALENDAR_INTEGRATION_ID**: `google-calendar` (or your Integration ID)
4. Verify **NANGO_SECRET_KEY** is set (should already be set for Outlook)
5. **Redeploy** application

### Step 5: Verification

#### Run Diagnostic Script

```bash
node scripts/verify-gmail-calendar-nango-config.js
```

This will verify:
- ✅ Environment variables are set
- ✅ Nango connection works
- ✅ All integrations exist (Outlook, Gmail, Calendar)
- ✅ Provides recommendations

#### Manual Testing

1. **Test Gmail Connection**:
   - Go to Grand Central → Integrations
   - Click "Connect Gmail"
   - **Verify**: OAuth consent screen shows production app name (not "Developers Only")
   - Complete OAuth flow
   - Verify connection appears as "Connected"
   - Check that emails sync

2. **Test Google Calendar Connection**:
   - Click "Connect Google Calendar"
   - **Verify**: OAuth consent screen shows production app name (not "Developers Only")
   - Complete OAuth flow
   - Verify connection appears as "Connected"
   - Check that calendar events sync

3. **Regression Test Outlook** (Important):
   - Verify Outlook connection still works
   - Test connecting new Outlook account
   - Verify emails sync correctly
   - **Outlook should NOT be affected**

### Step 6: Troubleshooting

#### Still Seeing "Developers Only" Message

1. **Check Google Cloud Console**:
   - OAuth consent screen → App name
   - Verify it's set to production name

2. **Check Nango Dashboard**:
   - Verify Client ID is from production OAuth app (not test)
   - Test apps usually have "test" or "dev" in the name

3. **Check OAuth App Type**:
   - In Google Cloud Console → Credentials
   - Verify OAuth client is "Web application" type

#### Integration Not Found Error

1. **Verify Integration ID**:
   - Check Nango dashboard for exact Integration ID
   - Update environment variable in Vercel to match exactly
   - Must match exactly (case-sensitive)

2. **Verify Secret Key**:
   - Check Nango dashboard → Environment Settings
   - Ensure `NANGO_SECRET_KEY` in Vercel matches prod environment
   - Redeploy after updating

#### Connection Fails After OAuth

1. **Check Redirect URI**:
   - Must be exactly: `https://api.nango.dev/oauth/callback`
   - No trailing slashes or extra paths

2. **Check Scopes**:
   - Verify required scopes are in both:
     - Google Cloud Console OAuth consent screen
     - Nango integration configuration

3. **Check Webhook**:
   - Verify webhook URL is set in Nango: `https://action.adrata.com/api/webhooks/nango/email`
   - Check Nango logs for webhook delivery errors

## Success Criteria

- ✅ Gmail OAuth consent screen shows production app name
- ✅ Google Calendar OAuth consent screen shows production app name
- ✅ Both integrations connect successfully
- ✅ Gmail emails sync correctly
- ✅ Google Calendar events sync correctly
- ✅ **Outlook continues working without any issues**
- ✅ No "Developers Only" or "Not For Production" messages

## Important Notes

### Outlook Protection

- ✅ Outlook uses separate OAuth provider (Azure AD vs Google)
- ✅ Outlook has separate code paths with explicit protection
- ✅ Outlook has independent environment variables
- ✅ Outlook is checked first in all verification
- ✅ **Gmail/Calendar fixes will NOT affect Outlook**

### Environment Variables

**Required for Gmail/Calendar**:
- `NANGO_GMAIL_INTEGRATION_ID` - Must match Nango dashboard
- `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID` - Must match Nango dashboard
- `NANGO_SECRET_KEY` - Shared with Outlook (should already be set)

**Optional for Outlook**:
- `NANGO_OUTLOOK_INTEGRATION_ID` - Optional (defaults to 'outlook' if not set)

## Related Documentation

- **Quick Fix Guide**: `docs/gmail-calendar-quick-fix-guide.md`
- **Detailed Fix Guide**: `docs/fix-gmail-google-calendar-oauth-consent-screen.md`
- **Checklist**: `docs/gmail-calendar-nango-configuration-checklist.md`
- **Comparison**: `docs/outlook-vs-gmail-calendar-nango-comparison.md`
- **Outlook Protection**: `docs/outlook-integration-safeguards.md`
- **Environment Variables**: `docs/nango-environment-variables.md`

## Support

If you encounter issues:

1. Run diagnostic script: `node scripts/verify-gmail-calendar-nango-config.js`
2. Check Nango dashboard logs
3. Check Vercel deployment logs
4. Review troubleshooting sections in documentation

