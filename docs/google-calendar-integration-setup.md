# Google Calendar Integration Setup Guide

## Overview

Google Calendar has been added as a separate integration from Gmail, following the same pattern as the email integrations. Users can now connect Google Calendar independently to sync calendar events.

## What Was Changed

### Frontend Updates
- Added Google Calendar card to `src/app/[workspace]/grand-central/integrations/page.tsx`
- Updated connection filtering to include Google Calendar connections
- Added Calendar icon import and usage

### Backend Updates
- Updated `src/app/api/v1/integrations/nango/connect/route.ts` to support `google-calendar` provider
- Updated `src/platform/services/calendar-sync-service.ts` to look for `google-calendar` connection (separate from Gmail)
- Updated `src/app/api/webhooks/nango/email/route.ts` to properly map `google-calendar` provider

## Required Environment Variable

You need to set the following environment variable in your Vercel project:

```bash
NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar
```

**Important:** The value `google-calendar` matches your Nango Integration ID as shown in your Nango dashboard.

### How to Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key:** `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID`
   - **Value:** `google-calendar`
   - **Environment:** Production (and Development if needed)
4. Save and redeploy

## How It Works

### Provider Mapping

The system uses a two-level mapping:

1. **Frontend** sends simple provider name: `"google-calendar"`
2. **Backend** maps it to Nango Integration ID using environment variable:
   - `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID` → `google-calendar` (your actual Integration ID)
3. **Database** stores:
   - `provider`: `"google-calendar"` (for filtering/querying)
   - `providerConfigKey`: `"google-calendar"` (actual Nango Integration ID)

### OAuth Flow

1. User clicks "Connect Google Calendar" button
2. Frontend calls `/api/v1/integrations/nango/connect` with `provider: "google-calendar"`
3. Backend maps `google-calendar` → `google-calendar` using `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID`
4. Backend creates Nango connect session with Integration ID `google-calendar`
5. Frontend opens Nango OAuth modal
6. User authorizes Google Calendar access
7. Nango sends webhook to `/api/webhooks/nango/email`
8. Webhook handler maps `google-calendar` to `google-calendar` provider
9. Connection is activated and calendar sync can be triggered

### Calendar Sync

The calendar sync service (`CalendarSyncService`) now:
- Looks for `google-calendar` connection when platform is `'google'`
- Falls back to `gmail` connection for backward compatibility (if `google-calendar` not found)
- Uses Google Calendar API endpoint: `/calendar/v3/calendars/primary/events`

## Integration Structure

You now have three separate integrations:

1. **Outlook** (`outlook`)
   - Email + Calendar (Microsoft provides both in one integration)

2. **Gmail** (`google-mail`)
   - Email only
   - Integration ID: `google-mail`

3. **Google Calendar** (`google-calendar`)
   - Calendar only
   - Integration ID: `google-calendar`

## Testing

### Manual Testing Steps

1. **Set Environment Variable**
   - Verify `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar` is set in Vercel
   - Redeploy if needed

2. **Test Connection**
   - Go to Grand Central → Integrations
   - Click "Connect Google Calendar"
   - Complete OAuth flow
   - Verify connection appears as "Connected"

3. **Test Calendar Sync**
   - After connection, calendar events should sync
   - Check that calendar events appear in the calendar view
   - Verify events are linked to people/companies

4. **Test Disconnect**
   - Click "Disconnect" on Google Calendar connection
   - Verify connection is removed

## Verification Checklist

- [ ] `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar` is set in Vercel
- [ ] Google Calendar integration card appears on integrations page
- [ ] "Connect Google Calendar" button works
- [ ] OAuth flow completes successfully
- [ ] Connection shows as "Connected" after OAuth
- [ ] Calendar events sync after connection
- [ ] Disconnect works correctly

## Troubleshooting

### Google Calendar Connection Fails

1. **Check Environment Variable**
   ```bash
   # Verify in Vercel dashboard
   NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar
   ```

2. **Verify Nango Integration**
   - Go to Nango dashboard → Integrations
   - Find Google Calendar integration (Integration ID: `google-calendar`)
   - Verify it's saved and has Client ID/Secret configured
   - Check that scopes include `https://www.googleapis.com/auth/calendar`

3. **Check Nango Environment**
   - Ensure you're using the correct Nango environment (prod)
   - Verify `NANGO_SECRET_KEY` matches the prod environment secret key

### Calendar Events Not Syncing

1. **Check Connection Status**
   - Verify connection status is `active` in database
   - Check `lastSyncAt` timestamp

2. **Check Calendar Sync Service**
   - Review logs for calendar sync errors
   - Verify Google Calendar API endpoint is correct: `/calendar/v3/calendars/primary/events`
   - Ensure the service is looking for `google-calendar` connection

3. **Manual Sync Trigger**
   - Calendar sync may need to be triggered manually or via scheduled job
   - Check if there's a calendar sync endpoint or cron job

## Differences from Email Integrations

- **Separate Integration:** Google Calendar is completely separate from Gmail
- **API Endpoint:** Google Calendar API (`/calendar/v3/calendars/primary/events`) vs Gmail API
- **Scopes:** `https://www.googleapis.com/auth/calendar` (vs Gmail scopes)
- **Sync Trigger:** Calendar sync may need manual trigger or scheduled job (not automatic like email webhooks)

## Next Steps

After setting the environment variable and testing:

1. Monitor calendar sync performance
2. Check calendar event linking to people/companies
3. Verify calendar events appear in timeline/calendar views
4. Consider adding automatic calendar sync scheduling if needed



