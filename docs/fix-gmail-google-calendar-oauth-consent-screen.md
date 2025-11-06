# Fix Gmail and Google Calendar OAuth Consent Screen

## Problem

Users see "Nango Developers Only - Not For Production" in the OAuth consent screen when connecting Gmail or Google Calendar. This indicates the integrations are using test/development OAuth apps instead of production OAuth apps.

## Root Cause

The OAuth consent screen name comes from Google Cloud Console, not from our code. The "Developers Only - Not For Production" text means:
- Nango is configured with a test/development OAuth app
- OR the OAuth consent screen in Google Cloud Console has this name set
- OR the Client ID/Secret in Nango dashboard points to a test app

## Solution: Configure Production OAuth Apps

### Step 1: Verify Google Cloud Console OAuth Setup

1. **Go to Google Cloud Console**
   - Navigate to https://console.cloud.google.com
   - Select your project (or create a new one for production)

2. **Configure OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**
   - **User Type**: Choose "External" (unless you have Google Workspace)
   - **App name**: Set to your production app name (e.g., "Adrata" or "Action Platform")
   - **User support email**: Your support email
   - **Developer contact information**: Your email
   - **App domain**: Your production domain (e.g., `action.adrata.com`)
   - **Authorized domains**: Add `adrata.com` and `action.adrata.com`
   - **Scopes**: Add required scopes:
     - Gmail: `https://mail.google.com/`, `https://www.googleapis.com/auth/gmail.readonly`
     - Google Calendar: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/calendar.readonly`
   - **Test users** (if in Testing mode): Add test users who can use the app
   - **Publishing status**: For production, you may need to submit for verification if using sensitive scopes

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - **Application type**: Web application
   - **Name**: "Adrata Gmail Integration" (or similar)
   - **Authorized redirect URIs**: Add:
     ```
     https://api.nango.dev/oauth/callback
     ```
   - Click **Create**
   - **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these for Nango

4. **Repeat for Google Calendar** (if using separate OAuth app)
   - Create another OAuth client ID for Google Calendar
   - Use same redirect URI: `https://api.nango.dev/oauth/callback`
   - Or reuse the same OAuth app for both Gmail and Calendar

### Step 2: Configure Nango Dashboard

1. **Go to Nango Dashboard**
   - Navigate to https://app.nango.dev
   - **IMPORTANT**: Make sure you're in the **"prod"** environment (check top right)

2. **Configure Gmail Integration**
   - Go to **Integrations** tab
   - Find or create "Gmail" integration
   - **Integration ID**: Should be `google-mail` (or match `NANGO_GMAIL_INTEGRATION_ID` env var)
   - **Client ID**: Paste the **production** Client ID from Google Cloud Console (not test app)
   - **Client Secret**: Paste the **production** Client Secret from Google Cloud Console
   - **Scopes**: Add:
     ```
     https://mail.google.com/
     https://www.googleapis.com/auth/gmail.readonly
     ```
   - **Redirect URI**: Should be `https://api.nango.dev/oauth/callback` (Nango handles this)
   - Click **Save** (important - integrations must be saved)

3. **Configure Google Calendar Integration**
   - Go to **Integrations** tab
   - Find or create "Google Calendar" integration
   - **Integration ID**: Should be `google-calendar` (or match `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID` env var)
   - **Client ID**: Paste the **production** Client ID from Google Cloud Console
     - Can be same as Gmail or separate OAuth app
   - **Client Secret**: Paste the **production** Client Secret from Google Cloud Console
   - **Scopes**: Add:
     ```
     https://www.googleapis.com/auth/calendar
     https://www.googleapis.com/auth/calendar.readonly
     ```
   - **Redirect URI**: Should be `https://api.nango.dev/oauth/callback`
   - Click **Save**

4. **Verify Integration IDs**
   - Note the exact Integration IDs shown in Nango dashboard
   - Common values:
     - Gmail: `google-mail`, `gmail`, or custom ID
     - Google Calendar: `google-calendar`, `calendar`, or custom ID

### Step 3: Update Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project → **Settings** → **Environment Variables**

2. **Set Required Variables**
   ```bash
   # Gmail Integration ID (must match Nango dashboard)
   NANGO_GMAIL_INTEGRATION_ID=google-mail
   
   # Google Calendar Integration ID (must match Nango dashboard)
   NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar
   
   # Nango Secret Key (must match prod environment)
   NANGO_SECRET_KEY=your_production_secret_key_here
   
   # Nango Host (usually https://api.nango.dev)
   NANGO_HOST=https://api.nango.dev
   ```

3. **Important Notes**
   - Use the **exact** Integration IDs from Nango dashboard
   - `NANGO_SECRET_KEY` must match the **prod** environment secret key
   - Set these for **Production** environment in Vercel
   - **Redeploy** after updating environment variables

### Step 4: Compare with Working Outlook Configuration

Since Outlook is working, use it as a reference:

1. **Check Outlook Integration in Nango**
   - Go to Nango dashboard → Integrations
   - Find Outlook integration
   - Note the Integration ID (likely `outlook`)
   - Check the Client ID format (should be from Azure AD)

2. **Verify Environment Variable**
   - In Vercel, check `NANGO_OUTLOOK_INTEGRATION_ID`
   - It should match the Integration ID in Nango dashboard

3. **Apply Same Pattern to Gmail/Calendar**
   - Ensure Gmail and Calendar follow the same configuration pattern
   - Use production OAuth apps (not test apps)
   - Integration IDs must match between Nango and Vercel env vars

## Verification Checklist

After configuration, verify:

- [ ] Google Cloud Console OAuth consent screen shows proper app name (not "Developers Only")
- [ ] OAuth client IDs are created in Google Cloud Console (production, not test)
- [ ] Redirect URI `https://api.nango.dev/oauth/callback` is configured
- [ ] Required scopes are added to OAuth consent screen
- [ ] Nango dashboard shows Gmail integration with production Client ID
- [ ] Nango dashboard shows Google Calendar integration with production Client ID
- [ ] Integration IDs in Nango match environment variables in Vercel
- [ ] `NANGO_SECRET_KEY` in Vercel matches prod environment in Nango
- [ ] Both integrations are **saved** in Nango dashboard (not in draft state)

## Testing

1. **Test Gmail Connection**
   - Go to Grand Central → Integrations
   - Click "Connect Gmail"
   - OAuth consent screen should show your production app name
   - Complete OAuth flow
   - Verify connection appears as "Connected"

2. **Test Google Calendar Connection**
   - Click "Connect Google Calendar"
   - OAuth consent screen should show your production app name
   - Complete OAuth flow
   - Verify connection appears as "Connected"

## Troubleshooting

### Still Seeing "Developers Only" Message

1. **Check OAuth Consent Screen**
   - Go to Google Cloud Console → OAuth consent screen
   - Verify "App name" is set to production name
   - Check "Publishing status" - may need to publish app

2. **Verify Client ID in Nango**
   - Check Nango dashboard → Gmail integration
   - Verify Client ID matches the production OAuth app (not test app)
   - Test apps usually have "test" or "dev" in the name

3. **Check OAuth App Type**
   - In Google Cloud Console → Credentials
   - Verify OAuth client is "Web application" type
   - Not "Desktop app" or other types

### Integration Not Found Error

1. **Verify Integration ID**
   - Check Nango dashboard for exact Integration ID
   - Update `NANGO_GMAIL_INTEGRATION_ID` or `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID` in Vercel
   - Must match exactly (case-sensitive)

2. **Verify Secret Key**
   - Check Nango dashboard → Environment Settings
   - Ensure `NANGO_SECRET_KEY` in Vercel matches prod environment
   - Redeploy after updating

### Connection Fails After OAuth

1. **Check Redirect URI**
   - Must be exactly: `https://api.nango.dev/oauth/callback`
   - No trailing slashes or extra paths

2. **Check Scopes**
   - Verify required scopes are in both:
     - Google Cloud Console OAuth consent screen
     - Nango integration configuration

3. **Check Webhook**
   - Verify webhook URL is set in Nango: `https://action.adrata.com/api/webhooks/nango/email`
   - Check Nango logs for webhook delivery errors

## Key Differences from Outlook

- **OAuth Provider**: Google Cloud Console (vs Azure AD for Outlook)
- **Consent Screen**: Configured in Google Cloud Console (vs Azure AD for Outlook)
- **Separate Integrations**: Gmail and Calendar are separate (vs Outlook which combines both)
- **Integration IDs**: `google-mail` and `google-calendar` (vs `outlook`)

## Next Steps

After fixing the configuration:

1. Test both integrations end-to-end
2. Verify email sync works for Gmail
3. Verify calendar sync works for Google Calendar
4. Monitor Nango logs for any errors
5. Check webhook delivery in Nango dashboard

