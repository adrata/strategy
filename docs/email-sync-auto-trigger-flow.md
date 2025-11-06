# Email Sync Auto-Trigger Flow

## Overview

Email sync is automatically triggered when a Nango connection is successfully created. This document explains the flow and troubleshooting steps.

## Auto-Trigger Flow

### Step 1: User Initiates OAuth (`/api/v1/integrations/nango/connect`)

When a user clicks "Connect" on the Outlook integration:

1. Backend creates a Nango connect session with:
   - `endUser.id`: User's internal ID
   - `endUser.tags.workspaceId`: Workspace ID
   - `allowed_integrations`: `['outlook']`

2. Backend creates a **pending** connection record in `grand_central_connections`:
   ```typescript
   {
     status: 'pending',
     nangoConnectionId: `session-${Date.now()}`, // Temporary
     providerConfigKey: 'outlook',
     userId: user.id,
     workspaceId: workspaceId
   }
   ```

3. Frontend receives `sessionToken` and opens Nango's OAuth UI

### Step 2: User Completes OAuth

User authorizes the connection in Nango's OAuth flow.

### Step 3: Nango Sends Webhook (`/api/webhooks/nango/email`)

**Expected webhook payload:**
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

### Step 4: Webhook Handler Processes Connection

The `handleConnectionCreation` function:

1. **Finds pending connection** by matching:
   - `userId` (from `endUser.endUserId`)
   - `workspaceId` (from `endUser.tags.workspaceId`)
   - `providerConfigKey` (from webhook)
   - `status: 'pending'`

2. **Updates connection** to active:
   ```typescript
   {
     nangoConnectionId: connectionId, // Real Nango connection ID
     status: 'active',
     lastSyncAt: new Date()
   }
   ```

3. **Triggers email sync**:
   ```typescript
   await UnifiedEmailSyncService.syncWorkspaceEmails(
     pendingConnection.workspaceId,
     pendingConnection.userId
   );
   ```

### Step 5: Email Sync Executes

`UnifiedEmailSyncService.syncWorkspaceEmails()`:

1. Finds all active email connections for the workspace
2. Fetches emails from each provider via Nango
3. Stores emails in `email_messages` table
4. Auto-links emails to people/companies
5. Creates action records for timeline

## Troubleshooting

### Issue: Webhook Not Firing

**Symptoms:**
- Connection shows "Pending" status in UI
- No emails synced after OAuth completion
- No webhook logs in server logs

**Checks:**

1. **Verify webhook URL in Nango dashboard:**
   - Go to Nango Dashboard → Environment Settings
   - Webhook URL should be: `https://action.adrata.com/api/webhooks/nango/email`
   - Ensure "Send New Connection Creation Webhooks" is **enabled**

2. **Check webhook signature verification:**
   - If `NANGO_SECRET_KEY` is not set, webhooks are accepted without verification (temporary)
   - For production, ensure `NANGO_SECRET_KEY` is set in Vercel

3. **Verify webhook payload structure:**
   - Check Nango dashboard → Logs for webhook delivery status
   - Check server logs for webhook receipt

### Issue: Webhook Fires But Connection Not Found

**Symptoms:**
- Webhook received but connection stays "pending"
- Logs show "Connection not found in pending state"

**Checks:**

1. **Verify `endUser` data in connect session:**
   - Ensure `endUser.id` matches the user's internal ID
   - Ensure `endUser.tags.workspaceId` is set correctly

2. **Check database for pending connections:**
   ```sql
   SELECT * FROM grand_central_connections 
   WHERE status = 'pending' 
   ORDER BY created_at DESC;
   ```

3. **Verify `providerConfigKey` matching:**
   - Webhook sends `providerConfigKey: "outlook"`
   - Database should have `providerConfigKey: "outlook"` (or the Nango Integration ID)

### Issue: Email Sync Fails After Webhook

**Symptoms:**
- Connection becomes "active" but no emails appear
- Webhook logs show sync error

**Checks:**

1. **Verify Nango connection is active:**
   - Check Nango dashboard → Connections
   - Connection should show as active

2. **Check sync logs:**
   - Look for `📧 Starting email sync for workspace: ...`
   - Look for `✅ ${provider} sync completed: X emails processed`

3. **Verify Nango operations are configured:**
   - `outlook_read_emails` operation should exist in Nango
   - Check Nango dashboard → Integrations → Outlook → Operations

4. **Test manual sync:**
   ```javascript
   fetch('/api/v1/integrations/nango/sync-now', {
     method: 'POST',
     credentials: 'include'
   }).then(r => r.json()).then(console.log);
   ```

## Manual Workarounds

### Manual Activation Endpoint

If webhook doesn't fire, use the manual activation endpoint:

```javascript
fetch('/api/v1/integrations/nango/activate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    nangoConnectionId: '<CONNECTION-ID-FROM-NANGO-DASHBOARD>',
    workspaceId: '<WORKSPACE-ID>'
  })
}).then(r => r.json()).then(console.log);
```

### Manual Sync Trigger

To manually trigger email sync:

```javascript
fetch('/api/v1/integrations/nango/sync-now', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

## Verification Checklist

Before demo, verify:

- [ ] Webhook URL is configured in Nango dashboard
- [ ] "Send New Connection Creation Webhooks" is enabled
- [ ] `NANGO_SECRET_KEY` is set in Vercel (for production)
- [ ] Test connection creation and verify webhook fires
- [ ] Check server logs for webhook receipt
- [ ] Verify connection status changes from "pending" to "active"
- [ ] Verify emails appear in database after sync
- [ ] Test manual sync endpoint as backup

## Code Locations

- **Connect endpoint**: `src/app/api/v1/integrations/nango/connect/route.ts`
- **Webhook handler**: `src/app/api/webhooks/nango/email/route.ts`
- **Email sync service**: `src/platform/services/UnifiedEmailSyncService.ts`
- **Manual activate**: `src/app/api/v1/integrations/nango/activate/route.ts`
- **Manual sync**: `src/app/api/v1/integrations/nango/sync-now/route.ts`

