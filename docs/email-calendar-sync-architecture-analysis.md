# Email and Calendar Sync Architecture Analysis

## Overview

This document analyzes how email and calendar syncs work together, especially after calendar integration was added. The goal is to understand why email sync might not be working correctly.

## Architecture

### 1. Connection Model

**Outlook Connection:**
- Single connection (`provider: 'outlook'`) provides BOTH email AND calendar access
- `providerConfigKey: 'outlook'` in Nango
- Stored in `grand_central_connections` table with `provider: 'outlook'`

**Gmail Connection:**
- Separate connections for email (`provider: 'gmail'`) and calendar (`provider: 'google-calendar'`)
- Email: `providerConfigKey: 'gmail'` or `'google-mail'`
- Calendar: `providerConfigKey: 'google-calendar'`

### 2. Nango Built-in Syncs

Nango has separate built-in syncs configured:
- **"emails"** - Syncs email messages
- **"calendars"** - Syncs calendar metadata
- **"events"** - Syncs calendar events
- **"folders"** - Syncs email folder structure

**Important:** These syncs save data to Nango's system, NOT our database.

### 3. Our Custom Sync Services

**Email Sync (`UnifiedEmailSyncService`):**
- Queries connections with `provider: { in: ['outlook', 'gmail'] }`
- Uses `nango.proxy()` to fetch emails from Microsoft Graph API / Gmail API
- Saves emails to our `email_messages` table
- Links emails to people, companies, leads, prospects
- Creates action records

**Calendar Sync (`CalendarSyncService`):**
- Uses the same Outlook connection (`provider: 'outlook'`) for calendar
- Uses `nango.proxy()` to fetch calendar events
- Saves events to our `calendar_events` table
- Links events to people, companies, etc.
- Does NOT interfere with email sync

### 4. Webhook Flow

**Webhook Handler (`/api/webhooks/nango/email/route.ts`):**

1. **Connection Creation Webhook** (`type: "auth"`, `operation: "creation"`):
   - Creates/updates connection record
   - Triggers initial email sync via `UnifiedEmailSyncService.syncWorkspaceEmails()`

2. **Sync Webhook** (`type: "sync"`):
   - Only processes syncs with "email" in the name or model
   - Skips calendar syncs ("calendars", "events", "folders")
   - Triggers our custom email sync when email sync completes

3. **External Webhook** (`type: "forward"`):
   - Microsoft Graph change notifications
   - Gmail push notifications
   - Triggers email sync

## Key Findings

### What's Working

1. ✅ **Connection Creation**: Outlook connections are created correctly
2. ✅ **Webhook Routing**: Calendar syncs are correctly skipped (don't trigger email sync)
3. ✅ **Service Separation**: Email and calendar syncs are separate services
4. ✅ **Connection Filtering**: Email sync only queries `outlook` and `gmail` providers

### Issues Found

1. ❌ **OData Filter Format**: Was using `datetime'...'` prefix (FIXED - now uses `'...'`)
2. ❌ **Low Email Count Detection**: Only 4 emails triggers 1-hour window instead of 30 days (FIXED - now uses 50 email threshold)
3. ⚠️ **Nango Built-in Syncs**: Running in parallel, may cause confusion (should disable)

### Potential Issues

1. **Webhook Sync Name Detection**: 
   - Current: Checks if `syncName` includes "email"
   - Improved: Now also checks `model` field for "OutlookEmail" or "GmailEmail"
   - This ensures we catch all email sync webhooks

2. **Workspace ID Mismatch**:
   - Emails are saved with `workspaceId` from connection
   - If connection has wrong `workspaceId`, emails won't appear for user
   - Added logging to verify workspace ID

3. **Date Filter Logic**:
   - With only 4 emails, it was using 1-hour window
   - Now uses 30-day window if email count < 50
   - This ensures we fetch all emails on first sync

## How Email and Calendar Syncs Interact

### They DON'T Interfere

1. **Different Services**:
   - Email: `UnifiedEmailSyncService`
   - Calendar: `CalendarSyncService`

2. **Different Database Tables**:
   - Email: `email_messages`
   - Calendar: `calendar_events`

3. **Different Webhook Processing**:
   - Email syncs: Processed by webhook handler
   - Calendar syncs: Skipped by webhook handler (handled separately)

4. **Same Connection, Different Endpoints**:
   - Email: `/v1.0/me/mailFolders/.../messages`
   - Calendar: `/v1.0/me/events`

### What Changed When Calendar Was Added

1. **Webhook Handler**: Added check to skip calendar syncs (line 344)
2. **Connection Creation**: Handles `google-calendar` provider separately
3. **No Impact on Email Sync**: Email sync logic unchanged

## Root Cause Analysis

### Why Only 4 Emails?

1. **Date Filter Issue**: 
   - Connection had `lastSyncAt` set
   - Only 4 emails in database
   - Logic used 1-hour window instead of 30 days
   - **FIXED**: Now uses 30-day window if email count < 50

2. **OData Filter Format**:
   - Was using `datetime'...'` prefix
   - Microsoft Graph API rejected it (400 Bad Request)
   - All proxy requests failed
   - **FIXED**: Now uses `'...'` format (matches calendar sync)

3. **Nango Built-in Sync**:
   - Nango's sync saves to Nango's system (8 emails shown in dashboard)
   - Our custom sync saves to our database (should have all emails)
   - They're separate systems
   - **RECOMMENDATION**: Disable Nango's built-in sync to avoid confusion

## Recommendations

### Immediate Actions

1. **Disable Nango Built-in Syncs**:
   - Go to Nango Dashboard → Integrations → Outlook
   - Disable or delete "emails", "calendars", "events", "folders" syncs
   - Our custom sync handles everything

2. **Verify Workspace ID**:
   - Check server logs for `workspaceId` used in sync
   - Ensure it matches the user's active workspace
   - Emails are saved with this workspace ID

3. **Trigger Manual Sync**:
   - Use "Sync Now" button or API endpoint
   - Check server logs for detailed sync information
   - Verify emails are being fetched and saved

### Long-term Improvements

1. **Better Error Handling**:
   - Log exact API errors from proxy requests
   - Show user-friendly error messages
   - Retry failed syncs automatically

2. **Sync Status Dashboard**:
   - Show last sync time per connection
   - Display email count per workspace
   - Show sync health status

3. **Calendar Sync Integration**:
   - Add calendar sync to webhook handler (currently on-demand only)
   - Trigger calendar sync when calendar webhooks arrive
   - Link calendar events to email threads

## Testing Checklist

- [ ] Verify OData filter format is correct (no `datetime` prefix)
- [ ] Verify low email count triggers 30-day fetch
- [ ] Verify webhook handler processes email syncs correctly
- [ ] Verify calendar syncs are skipped (don't trigger email sync)
- [ ] Verify workspace ID matches user's active workspace
- [ ] Verify emails are saved to correct workspace
- [ ] Check server logs for detailed sync information
- [ ] Disable Nango built-in syncs to avoid conflicts

## Conclusion

The email and calendar syncs are properly separated and don't interfere with each other. The main issues were:

1. **OData filter format** - Fixed (removed `datetime` prefix)
2. **Date filter logic** - Fixed (30-day window for low email count)
3. **Webhook detection** - Improved (better email sync detection)

The sync should now work correctly. The key is to:
- Use our custom sync (not Nango's built-in sync)
- Ensure correct workspace ID
- Monitor server logs for detailed information

