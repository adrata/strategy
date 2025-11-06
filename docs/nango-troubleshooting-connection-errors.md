# Nango "Integration Not Configured" Troubleshooting

## Problem
You see the integration in the Nango dashboard, but get error: "Outlook integration is not configured in Nango"

## Common Causes & Solutions

### 1. Environment Mismatch ⚠️ MOST COMMON

**Problem:** Your Nango dashboard shows "prod" environment, but your Vercel `NANGO_SECRET_KEY` might be for a different environment.

**Solution:**
1. In Nango dashboard, go to **Environment Settings**
2. Copy the **Secret Key** for the "prod" environment
3. In Vercel, go to **Settings → Environment Variables**
4. Update `NANGO_SECRET_KEY` with the "prod" environment secret key
5. Redeploy your application

**Verify:**
- Check `/api/v1/integrations/nango/config` endpoint
- It should show `nangoStatus: 'connected'` and list `outlook` in `availableIntegrations`

### 2. Integration Not Saved

**Problem:** Integration exists in UI but wasn't saved.

**Solution:**
1. Go to Nango dashboard → Integrations → Outlook
2. Click the **"Settings"** tab
3. Scroll to bottom
4. Click **"Save"** button (even if you didn't change anything)
5. Wait a few seconds for changes to propagate

### 3. Scopes Not Configured

**Problem:** Integration exists but scopes are missing or incorrect.

**Solution:**
1. In Nango dashboard → Outlook → Settings
2. Verify these scopes are present:
   - `offline_access`
   - `https://graph.microsoft.com/Mail.Read`
   - `https://graph.microsoft.com/Mail.Send`
   - `https://graph.microsoft.com/Calendars.ReadWrite`
   - `https://graph.microsoft.com/User.Read`
   - `openid`
   - `email`
   - `profile`
3. Click **"Save"** if you added any scopes

### 4. Azure AD Configuration Mismatch

**Problem:** Client ID/Secret in Nango doesn't match Azure AD.

**Solution:**
1. Go to Azure Portal → App registrations
2. Find your app (Client ID: `8335dd15-23e0-40ed-8978-5700fddf00eb`)
3. Verify:
   - **Redirect URIs** includes: `https://api.nango.dev/oauth/callback`
   - **Client Secret** matches what's in Nango (create new one if needed)
   - **API Permissions** are granted:
     - Mail.Read
     - Mail.Send
     - Calendars.ReadWrite
     - User.Read
     - offline_access
4. Update Nango with correct Client Secret if needed

### 5. Integration ID Mismatch

**Problem:** Integration ID in code doesn't match dashboard.

**Solution:**
1. In Nango dashboard → Outlook → Settings
2. Note the exact **Integration ID** (should be `outlook`)
3. In Vercel, set `NANGO_OUTLOOK_INTEGRATION_ID=outlook`
4. Or verify the default fallback in code matches

### 6. Nango Host Mismatch

**Problem:** Using wrong Nango host URL.

**Solution:**
1. Check Nango dashboard URL: `app.nango.dev` = cloud, custom domain = self-hosted
2. In Vercel, set `NANGO_HOST`:
   - Cloud: `https://api.nango.dev` (default)
   - Self-hosted: Your custom Nango API URL

## Debugging Steps

### Step 1: Check Configuration Endpoint

```bash
curl https://action.adrata.com/api/v1/integrations/nango/config
```

**Expected Response:**
```json
{
  "nangoStatus": "connected",
  "availableIntegrations": ["outlook", "gmail", ...],
  "outlookIntegrationExists": true
}
```

**If `outlookIntegrationExists: false`:**
- Environment mismatch (wrong secret key)
- Integration not in the environment you're using

### Step 2: Check Nango Logs

1. Go to Nango dashboard → **Logs**
2. Look for errors when you click "Connect"
3. Check for:
   - "Integration not found"
   - "Invalid credentials"
   - "Missing scopes"

### Step 3: Verify Environment Variables

In Vercel, ensure these are set:
```bash
NANGO_SECRET_KEY=nango_sk_... (from prod environment)
NANGO_HOST=https://api.nango.dev
NANGO_OUTLOOK_INTEGRATION_ID=outlook (optional, defaults to 'outlook')
```

### Step 4: Test Direct API Call

```bash
curl -X POST https://api.nango.dev/connect/sessions \
  -H "Authorization: Bearer YOUR_NANGO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user": {
      "id": "test-user-123"
    },
    "allowed_integrations": ["outlook"]
  }'
```

**If this fails:** The integration doesn't exist in that environment
**If this works:** The issue is in your application code

## Quick Fix Checklist

- [ ] Secret key matches "prod" environment in Nango dashboard
- [ ] Integration is saved in Nango dashboard (click Save button)
- [ ] Scopes are configured in Nango dashboard
- [ ] Client ID and Secret match Azure AD
- [ ] Redirect URI in Azure AD matches `https://api.nango.dev/oauth/callback`
- [ ] API Permissions granted in Azure AD
- [ ] Environment variables set in Vercel
- [ ] Application redeployed after env var changes

## Still Not Working?

1. Check Nango dashboard → Logs for detailed error messages
2. Verify the exact error message from `/api/v1/integrations/nango/connect`
3. Compare Integration ID in dashboard vs. what code is using
4. Contact Nango support with:
   - Integration ID
   - Environment name
   - Error message from logs

