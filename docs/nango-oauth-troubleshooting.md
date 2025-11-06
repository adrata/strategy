# Nango OAuth Integration Troubleshooting Guide

## Current Error: 400 Bad Request

### Common Causes

1. **Integration ID Mismatch**
   - The `provider` value must exactly match the Integration ID in your Nango dashboard
   - Check your Nango dashboard → Integrations → Find Outlook integration
   - Common values: `outlook`, `microsoft-outlook`, or a custom ID

2. **Missing or Incorrect Configuration**
   - Verify `NANGO_SECRET_KEY` is set correctly
   - Verify `NANGO_HOST` is correct (default: `https://api.nango.dev`)
   - Check that the Outlook integration is properly configured in Nango dashboard

3. **OAuth Credentials Not Set**
   - In Nango dashboard, ensure Outlook integration has:
     - Client ID from Azure AD
     - Client Secret from Azure AD
     - Correct scopes configured
     - Redirect URI matches: `https://api.nango.dev/oauth/callback`

## Step-by-Step Debugging

### Step 1: Verify Nango Configuration

```bash
# Check environment variables
curl https://action.adrata.com/api/v1/integrations/nango/config
```

Expected response:
```json
{
  "config": {
    "hasSecretKey": true,
    "hasPublicKey": true,
    "host": "https://api.nango.dev"
  },
  "nangoStatus": "connected"
}
```

### Step 2: Check Integration ID in Nango Dashboard

1. Go to https://app.nango.dev
2. Navigate to **Integrations** tab
3. Find your Outlook integration
4. Note the **Integration ID** (this is what you need to use as `provider`)

### Step 3: Test with Correct Integration ID

If your Integration ID is different from `outlook`, update the frontend:

```typescript
// In src/app/[workspace]/grand-central/integrations/page.tsx
body: JSON.stringify({
  provider: "your-actual-integration-id", // Use the exact ID from Nango dashboard
  workspaceId: user.activeWorkspaceId,
  redirectUrl: `${window.location.origin}/${user.activeWorkspaceId}/grand-central/integrations`,
}),
```

### Step 4: Check Nango Logs

1. Go to Nango dashboard → **Logs** tab
2. Look for errors related to `createConnectSession`
3. Check for specific error messages about:
   - Missing integration
   - Invalid credentials
   - Configuration issues

### Step 5: Verify OAuth Setup in Azure AD

1. Go to https://portal.azure.com
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find your app (Client ID: `8335dd15-23e0-40ed-8978-5700fddf00eb`)
4. Verify:
   - **Redirect URIs** includes: `https://api.nango.dev/oauth/callback`
   - **API permissions** are granted:
     - `Mail.Read`
     - `Mail.Send`
     - `Calendars.ReadWrite`
     - `User.Read`
     - `offline_access`
   - **Certificates & secrets** has a valid client secret

## Quick Fixes

### Fix 1: Update Integration ID

If your Nango Integration ID is `microsoft-outlook` instead of `outlook`:

```typescript
// Update in integrations/page.tsx
provider: "microsoft-outlook", // Match your Nango dashboard
```

### Fix 2: Add Better Error Display

The error message should now show:
- The exact Integration ID that failed
- Steps to verify configuration
- The actual error from Nango

### Fix 3: Test Connection Directly

```bash
# Test Nango connection
curl -X POST https://api.nango.dev/connect/sessions \
  -H "Authorization: Bearer YOUR_NANGO_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "end_user": {
      "id": "test-user-123",
      "email": "test@example.com"
    },
    "allowed_integrations": ["outlook"]
  }'
```

## Expected Flow

1. **Frontend** calls `/api/v1/integrations/nango/connect` with `provider: "outlook"`
2. **Backend** calls `nango.createConnectSession()` with `allowed_integrations: ["outlook"]`
3. **Nango** validates the integration exists and returns a session token
4. **Frontend** uses `nango.openConnectUI()` with the session token
5. **Nango** shows OAuth modal
6. **User** authorizes
7. **Nango** sends webhook to `/api/webhooks/nango/email`
8. **Backend** stores connection and triggers email sync

## Next Steps

1. Check Nango dashboard logs for the exact error
2. Verify Integration ID matches exactly
3. Ensure all environment variables are set
4. Test with a simple curl command first
5. Check Azure AD configuration matches Nango requirements

