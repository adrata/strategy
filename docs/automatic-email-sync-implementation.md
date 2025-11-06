# Automatic Email Sync Implementation

## Overview

This document explains how automatic email synchronization works in the Adrata platform using Nango webhooks. Emails sync automatically without manual intervention through multiple mechanisms.

## Architecture

### Current Implementation: Custom Sync with Webhook Triggers

We use a **custom email sync** approach (not Nango's built-in sync) because it provides:
- Full control over sync logic and date filtering
- Automatic entity linking (people, companies, leads, opportunities)
- Action record creation for timeline visibility
- No dependency on Nango plan limitations

### Automatic Sync Mechanisms

Emails sync automatically through three mechanisms:

1. **Connection Creation Webhook** - Initial sync when Outlook/Gmail is connected
2. **Nango Sync Webhooks** - When Nango syncs complete (if using Nango syncs)
3. **External Webhook Forwarding** - Microsoft Graph/Gmail push notifications
4. **Auto-Refresh Fallback** - UI polls every 30 seconds as backup

## Webhook Types Handled

### 1. Connection Creation (`type: "auth"`, `operation: "creation"`)

**When**: User successfully connects Outlook/Gmail via OAuth

**Flow**:
1. User clicks "Connect" on Outlook integration
2. Backend creates Nango connect session with `endUser.id` and `endUser.tags.workspaceId`
3. Frontend opens Nango OAuth UI
4. User authorizes connection
5. Nango sends webhook to `/api/webhooks/nango/email`
6. Webhook handler:
   - Finds pending connection record
   - Updates `nangoConnectionId` and sets status to `'active'`
   - Triggers initial email sync via `UnifiedEmailSyncService.syncWorkspaceEmails()`

**Webhook Payload**:
```json
{
  "type": "auth",
  "operation": "creation",
  "success": true,
  "connectionId": "<NANGO-CONNECTION-ID>",
  "providerConfigKey": "outlook",
  "endUser": {
    "endUserId": "<USER-ID>",
    "tags": {
      "workspaceId": "<WORKSPACE-ID>"
    }
  }
}
```

### 2. Nango Sync Webhooks (`type: "sync"`)

**When**: A Nango sync execution finishes (if using Nango's built-in syncs)

**Flow**:
1. Nango sync completes (initial, incremental, or webhook-triggered)
2. Nango sends webhook with sync results
3. Webhook handler:
   - Validates connection is active
   - Checks if sync is email-related
   - If successful, triggers custom email sync
   - Stores `modifiedAfter` timestamp as bookmark for future syncs

**Webhook Payload**:
```json
{
  "type": "sync",
  "connectionId": "<CONNECTION-ID>",
  "providerConfigKey": "outlook",
  "syncName": "email-sync",
  "model": "Email",
  "syncType": "INCREMENTAL",
  "success": true,
  "modifiedAfter": "2025-01-21T18:52:49.838Z",
  "responseResults": {
    "added": 5,
    "updated": 2,
    "deleted": 0
  }
}
```

**Note**: Currently, we're not using Nango's built-in syncs, so these webhooks won't be received unless you configure syncs in the Nango dashboard.

### 3. External Webhook Forwarding (`type: "forward"`)

**When**: Microsoft Graph or Gmail sends change notifications that Nango forwards

**Flow**:
1. Microsoft Graph/Gmail detects new email
2. Sends change notification to Nango
3. Nango forwards webhook to our endpoint
4. Webhook handler:
   - Identifies provider (outlook/gmail)
   - Triggers custom email sync immediately

**Webhook Payload**:
```json
{
  "type": "forward",
  "from": "microsoft",
  "connectionId": "<CONNECTION-ID>",
  "providerConfigKey": "outlook",
  "payload": {
    // Raw payload from Microsoft Graph
  }
}
```

**Note**: This requires setting up Microsoft Graph change notifications or Gmail push notifications in Nango. This is the most real-time option but requires additional configuration.

### 4. Token Refresh Failures (`type: "auth"`, `operation: "refresh"`)

**When**: OAuth token refresh fails

**Flow**:
1. Nango attempts to refresh access token
2. Refresh fails (token expired, revoked, etc.)
3. Nango sends webhook with error details
4. Webhook handler logs the error for monitoring

**Webhook Payload**:
```json
{
  "type": "auth",
  "operation": "refresh",
  "connectionId": "<CONNECTION-ID>",
  "success": false,
  "error": {
    "type": "token_refresh_failed",
    "description": "Token expired"
  }
}
```

## Webhook Signature Verification

All webhooks are verified using Nango's signature method:

```
SHA256(secretKey + payload)
```

**Implementation**: `verifyNangoSignature()` in `/api/webhooks/nango/email/route.ts`

**Security**:
- Uses `crypto.timingSafeEqual()` to prevent timing attacks
- Requires `X-Nango-Signature` header
- Falls back to unverified mode if `NANGO_SECRET_KEY` not configured (development only)

## Email Sync Service

The `UnifiedEmailSyncService` handles the actual email synchronization:

1. **Fetches emails** from Outlook/Gmail via Nango proxy
2. **Normalizes data** into consistent format
3. **Stores emails** in `email_messages` table
4. **Links to entities** (people, companies, leads, opportunities)
5. **Creates action records** for timeline visibility

**Date Filtering**:
- Fetches emails from last 24 hours OR since last sync (whichever is more recent)
- Includes 5-minute buffer to prevent missing emails
- Uses `lastSyncAt` from connection record

## UI Auto-Refresh

As a fallback mechanism, the Inbox UI automatically refreshes every 30 seconds:

- **Location**: `InboxProvider.tsx`
- **Mechanism**: `useEffect` with `setInterval`
- **Purpose**: Ensures UI stays up-to-date even if webhooks fail

## Setting Up Automatic Sync

### Step 1: Configure Nango Webhook URL

In Nango Dashboard → Environment Settings → Webhook URLs:

```
https://action.adrata.com/api/webhooks/nango/email
```

Enable:
- ✅ Send New Connection Creation Webhooks
- ✅ Send Sync Completion Webhooks (if using Nango syncs)

### Step 2: Verify Environment Variables

Ensure these are set in Vercel:

- `NANGO_SECRET_KEY` - For webhook signature verification
- `NANGO_HOST` - Nango API host (default: `https://api.nango.dev`)

### Step 3: Test Connection

1. Connect Outlook integration via Grand Central
2. Check Nango logs for webhook delivery
3. Check application logs for webhook processing
4. Verify emails appear in Inbox

## Troubleshooting

### Emails Not Syncing Automatically

1. **Check Webhook Delivery**:
   - Go to Nango Dashboard → Logs
   - Look for webhook delivery attempts
   - Check for 200 status codes

2. **Check Application Logs**:
   - Look for webhook processing logs
   - Check for errors in `UnifiedEmailSyncService`
   - Verify connection status is `'active'`

3. **Verify Webhook URL**:
   - Ensure URL is correct in Nango dashboard
   - Test endpoint with GET request (should return status info)

4. **Check Signature Verification**:
   - Ensure `NANGO_SECRET_KEY` is set correctly
   - Verify signature format matches Nango's specification

### Connection Stuck in "Pending"

1. **Check Webhook Delivery**:
   - Connection creation webhook may not have been received
   - Check Nango logs for webhook attempts

2. **Manual Activation**:
   - Use `/api/v1/integrations/nango/activate` endpoint
   - Pass `nangoConnectionId` and `workspaceId`

3. **Check Database**:
   - Verify connection record exists
   - Check `status` and `nangoConnectionId` fields

### New Emails Not Appearing

1. **Check Date Filtering**:
   - Verify `lastSyncAt` is recent
   - Check if date filter is too restrictive

2. **Manual Sync**:
   - Use `/api/v1/integrations/nango/sync-recent` endpoint
   - This syncs emails from last 24 hours

3. **Check Provider API**:
   - Verify Nango connection is active
   - Test API calls via Nango proxy

## Future Enhancements

### Microsoft Graph Change Notifications

For true real-time sync, we can set up Microsoft Graph change notifications:

1. **Subscribe to Mailbox Changes**:
   - Use Microsoft Graph API to subscribe to mailbox change notifications
   - Configure webhook URL in Graph API
   - Handle validation requests

2. **Process Notifications**:
   - Receive notifications when new emails arrive
   - Trigger immediate email sync
   - Update UI in real-time

**Benefits**:
- True real-time sync (no polling delay)
- Lower API usage (only sync when emails arrive)
- Better user experience

**Implementation**: Requires additional endpoint for Graph API validation and notification processing.

## Summary

Automatic email sync works through:

1. ✅ **Connection creation webhooks** - Initial sync on connect
2. ✅ **Nango sync webhooks** - When Nango syncs complete (if configured)
3. ✅ **External webhook forwarding** - Real-time notifications from providers (requires setup)
4. ✅ **UI auto-refresh** - 30-second polling as fallback

The system is designed to be resilient with multiple sync mechanisms ensuring emails are always up-to-date.

