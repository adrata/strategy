# Manual Email Sync Commands

This document provides commands to manually trigger email sync for testing and debugging.

## Prerequisites

1. You must be authenticated (logged in to the application)
2. You need your workspace ID and user ID (or use the browser's authenticated session)

## Method 1: Browser Console (Easiest)

Open your browser's developer console (F12) on the integrations page and run:

```javascript
// Trigger sync for current workspace
fetch('/api/v1/integrations/nango/sync-now', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('Sync Result:', data);
  console.log('Summary:', data.summary);
  console.log('Results:', data.results);
})
.catch(err => console.error('Sync Error:', err));
```

## Method 2: cURL (Command Line)

### Get your session cookie first:
1. Open browser DevTools → Application/Storage → Cookies
2. Copy the `__Secure-next-auth.session-token` or `next-auth.session-token` value

### Then run:
```bash
# Replace YOUR_SESSION_TOKEN with your actual session token
# Replace YOUR_DOMAIN with your domain (e.g., action.adrata.com or localhost:3000)

curl -X POST https://YOUR_DOMAIN/api/v1/integrations/nango/sync-now \
  -H "Content-Type: application/json" \
  -H "Cookie: __Secure-next-auth.session-token=YOUR_SESSION_TOKEN" \
  -v
```

### For local development:
```bash
curl -X POST http://localhost:3000/api/v1/integrations/nango/sync-now \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -v
```

## Method 3: Direct API Call (with workspace/user ID)

If you have workspace and user IDs, you can use the email sync API directly:

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/communications/email/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: __Secure-next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{}' \
  -v
```

## Method 4: Sync Specific Connection

If you have a connection ID:

```bash
curl -X POST https://YOUR_DOMAIN/api/grand-central/sync/CONNECTION_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: __Secure-next-auth.session-token=YOUR_SESSION_TOKEN" \
  -v
```

## Expected Response

A successful sync will return:

```json
{
  "success": true,
  "message": "Email sync triggered successfully",
  "results": [
    {
      "provider": "outlook",
      "connectionId": "...",
      "success": true,
      "count": 10,
      "fetched": 10,
      "failed": 0
    }
  ],
  "summary": {
    "totalConnections": 1,
    "successful": 1,
    "failed": 0,
    "totalEmailsProcessed": 10
  }
}
```

## Troubleshooting

### If you get "Unauthorized":
- Make sure you're logged in
- Check that your session token is valid
- Try refreshing the page and getting a new session token

### If sync returns 0 emails:
- Check server logs for errors
- Verify the connection is active in the database
- Check Nango logs for proxy request failures
- Verify date filters are correct (should not be in the future)

### If you see errors in the response:
- Check the `results` array for specific error messages
- Look at server logs for detailed error information
- Verify Nango connection is active and tokens are valid

## Checking Sync Status

You can also check the sync status:

```javascript
// In browser console
fetch('/api/v1/communications/email/sync', {
  method: 'GET',
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('Sync Status:', data))
.catch(err => console.error('Error:', err));
```

## Testing Different Scenarios

### Force 30-day sync (first sync):
Disconnect and reconnect the integration, or manually update `lastSyncAt` to null in the database.

### Test incremental sync:
Wait for a sync to complete, then trigger another sync - it should only fetch emails from the last hour.

### Test with low email count:
If you have fewer than 50 emails, the system should automatically use a 30-day lookback window.

