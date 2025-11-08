# Gmail Integration Setup Guide

## Overview

Gmail integration has been added to the Nango integration system, following the same pattern as Outlook. The codebase now supports both Outlook and Gmail email providers.

## What Was Changed

### Frontend Updates
- Updated `src/app/[workspace]/grand-central/integrations/page.tsx` to display both Outlook and Gmail integration cards
- Added Gmail connection handling alongside Outlook
- Updated connection filtering to include Gmail connections
- Updated UI messages to be provider-agnostic where appropriate

### Backend Updates
- Updated `src/app/api/webhooks/nango/email/route.ts` to properly map `google-mail` Integration ID to `gmail` provider
- Updated `src/app/api/v1/integrations/nango/connect/route.ts` to handle Gmail connection names
- Email sync service (`UnifiedEmailSyncService.ts`) already supported Gmail

## Required Environment Variable

You need to set the following environment variable in your Vercel project:

```bash
NANGO_GMAIL_INTEGRATION_ID=google-mail
```

**Important:** The value `google-mail` matches your Nango Integration ID as shown in your Nango dashboard.

### How to Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key:** `NANGO_GMAIL_INTEGRATION_ID`
   - **Value:** `google-mail`
   - **Environment:** Production (and Development if needed)
4. Save and redeploy

## How It Works

### Provider Mapping

The system uses a two-level mapping:

1. **Frontend** sends simple provider name: `"gmail"`
2. **Backend** maps it to Nango Integration ID using environment variable:
   - `NANGO_GMAIL_INTEGRATION_ID` → `google-mail` (your actual Integration ID)
3. **Database** stores:
   - `provider`: `"gmail"` (for filtering/querying)
   - `providerConfigKey`: `"google-mail"` (actual Nango Integration ID)

### OAuth Flow

1. User clicks "Connect Gmail" button
2. Frontend calls `/api/v1/integrations/nango/connect` with `provider: "gmail"`
3. Backend maps `gmail` → `google-mail` using `NANGO_GMAIL_INTEGRATION_ID`
4. Backend creates Nango connect session with Integration ID `google-mail`
5. Frontend opens Nango OAuth modal
6. User authorizes Gmail access
7. Nango sends webhook to `/api/webhooks/nango/email`
8. Webhook handler maps `google-mail` back to `gmail` provider
9. Connection is activated and email sync is triggered

## Testing

### Manual Testing Steps

1. **Set Environment Variable**
   - Verify `NANGO_GMAIL_INTEGRATION_ID=google-mail` is set in Vercel
   - Redeploy if needed

2. **Test Connection**
   - Go to Grand Central → Integrations
   - Click "Connect Gmail"
   - Complete OAuth flow
   - Verify connection appears as "Connected"

3. **Test Email Sync**
   - After connection, emails should sync automatically
   - Check that emails appear in the inbox
   - Verify emails are linked to people/companies

4. **Test Disconnect**
   - Click "Disconnect" on Gmail connection
   - Verify connection is removed

## Verification Checklist

- [ ] `NANGO_GMAIL_INTEGRATION_ID=google-mail` is set in Vercel
- [ ] Gmail integration card appears on integrations page
- [ ] "Connect Gmail" button works
- [ ] OAuth flow completes successfully
- [ ] Connection shows as "Connected" after OAuth
- [ ] Emails sync after connection
- [ ] Disconnect works correctly

## Troubleshooting

### Gmail Connection Fails

1. **Check Environment Variable**
   ```bash
   # Verify in Vercel dashboard
   NANGO_GMAIL_INTEGRATION_ID=google-mail
   ```

2. **Verify Nango Integration**
   - Go to Nango dashboard → Integrations
   - Find Gmail integration (Integration ID: `google-mail`)
   - Verify it's saved and has Client ID/Secret configured
   - Check that scopes include `https://mail.google.com/`

3. **Check Nango Environment**
   - Ensure you're using the correct Nango environment (prod)
   - Verify `NANGO_SECRET_KEY` matches the prod environment secret key

### Emails Not Syncing

1. **Check Connection Status**
   - Verify connection status is `active` in database
   - Check `lastSyncAt` timestamp

2. **Check Webhook**
   - Verify webhook URL is set in Nango: `https://api.nango.dev/webhook/.../google-mail`
   - Check Nango dashboard → Logs for webhook delivery

3. **Check Email Sync Service**
   - Review logs for email sync errors
   - Verify Gmail API endpoint is correct: `/gmail/v1/users/me/messages`

## Differences from Outlook

- **Integration ID:** `google-mail` (vs `outlook` for Outlook)
- **API Endpoint:** Gmail API (`/gmail/v1/users/me/messages`) vs Microsoft Graph API
- **Scopes:** `https://mail.google.com/` (vs Microsoft Graph scopes)
- **Calendar:** Gmail integration currently only supports email (no calendar)

## Next Steps

After setting the environment variable and testing:

1. Monitor email sync performance
2. Check email linking to people/companies
3. Verify action records are created for emails
4. Consider adding Gmail calendar support if needed




