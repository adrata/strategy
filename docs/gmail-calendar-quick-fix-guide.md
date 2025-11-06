# Gmail and Google Calendar Quick Fix Guide

## The Problem

OAuth consent screen shows "Nango Developers Only - Not For Production" instead of your app name.

## Quick Fix (5 Steps)

### 1. Google Cloud Console - Update OAuth Consent Screen

1. Go to https://console.cloud.google.com
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Change **App name** from "Nango Developers Only - Not For Production" to your production name (e.g., "Adrata")
4. Click **Save**

### 2. Google Cloud Console - Create Production OAuth App

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: "Adrata Gmail Integration"
5. **Authorized redirect URIs**: Add `https://api.nango.dev/oauth/callback`
6. Click **Create**
7. **Copy Client ID and Client Secret**

### 3. Nango Dashboard - Update Gmail Integration

1. Go to https://app.nango.dev (ensure you're in **prod** environment)
2. Navigate to **Integrations** → Gmail
3. Update **Client ID** to production Client ID from step 2
4. Update **Client Secret** to production Client Secret from step 2
5. Click **Save**

### 4. Nango Dashboard - Update Google Calendar Integration

1. In **Integrations** → Google Calendar
2. Update **Client ID** to production Client ID (can be same as Gmail)
3. Update **Client Secret** to production Client Secret
4. Click **Save**

### 5. Vercel - Verify Environment Variables

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Verify these are set:
   ```bash
   NANGO_GMAIL_INTEGRATION_ID=google-mail
   NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar
   NANGO_SECRET_KEY=your_prod_secret_key
   ```
3. **Redeploy** if you made changes

## Verify It Works

1. Go to Grand Central → Integrations
2. Click "Connect Gmail"
3. OAuth screen should show your app name (not "Developers Only")
4. Complete OAuth flow
5. Connection should appear as "Connected"

## Still Not Working?

Run the diagnostic script:
```bash
node scripts/verify-gmail-calendar-nango-config.js
```

Or see the detailed guide: `docs/fix-gmail-google-calendar-oauth-consent-screen.md`

## Key Points

- ✅ Use **production** OAuth apps, not test apps
- ✅ OAuth consent screen name must be production name
- ✅ Integration IDs in Nango must match environment variables
- ✅ `NANGO_SECRET_KEY` must match prod environment in Nango
- ✅ Always **Save** integrations in Nango dashboard

