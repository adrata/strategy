# Nango Integration Troubleshooting Guide

## Overview

This guide helps troubleshoot issues with the Nango Outlook integration. Use this when you encounter errors during the OAuth connection flow.

## Common Error: "No integrations found" or "Integration does not exist"

### Root Cause

The `NANGO_SECRET_KEY` environment variable is pointing to a different Nango environment than where your Outlook integration is configured.

### Symptoms

- Error message: "Integration 'outlook' is not configured in Nango"
- Logs show: `Available integrations: []`
- Connection fails with 400 or 500 error

### Solution Steps

#### 1. Identify Which Environment Has Your Integration

1. Go to [Nango Dashboard](https://app.nango.dev)
2. Check the environment dropdown (top right) - it shows which environment you're currently viewing
3. Click on **Integrations** tab
4. Look for your Outlook integration
5. Note which environment it's in (e.g., "prod", "dev", "staging")

#### 2. Get the Correct Secret Key

1. In Nango dashboard, switch to the environment where Outlook integration exists
2. Go to **Environment Settings**
3. Find the **Secret Key** section
4. Copy the secret key (starts with a UUID, not necessarily with `nango_sk_`)
5. This is the key you need in Vercel

#### 3. Update Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `NANGO_SECRET_KEY`
5. Update it with the secret key from step 2
6. **Important**: Make sure it's set for **Production** environment
7. **Redeploy** your application for changes to take effect

#### 4. Verify the Integration ID

1. In Nango dashboard, go to **Integrations**
2. Click on your Outlook integration
3. Look for the **Integration ID** (also called "Unique Key")
4. Common values: `outlook`, `microsoft-outlook`, or a custom ID
5. In Vercel, set `NANGO_OUTLOOK_INTEGRATION_ID` to this exact value

## Diagnostic Endpoints

### Test Endpoint

Visit this URL while logged in to check Nango configuration:
```
https://action.adrata.com/api/v1/integrations/nango/test
```

**What it shows:**
- Whether secret keys are configured
- Which secret key is being used (NANGO_SECRET_KEY vs NANGO_SECRET_KEY_DEV)
- Connection to Nango API status
- Available integrations
- Whether Outlook integration exists

### Verify Endpoint

Check specific integration status:
```
https://action.adrata.com/api/v1/integrations/nango/verify?integrationId=outlook
```

**What it shows:**
- Nango connection status
- List of all available integrations
- Whether the specified integration exists
- Detailed debug information

## Required Environment Variables

### Production (Vercel)

Set these in Vercel → Settings → Environment Variables:

```bash
# Required: Secret key from Nango dashboard (prod environment)
NANGO_SECRET_KEY=your-secret-key-here

# Optional: Outlook Integration ID (defaults to 'outlook')
NANGO_OUTLOOK_INTEGRATION_ID=outlook

# Optional: Nango API host (defaults to https://api.nango.dev)
NANGO_HOST=https://api.nango.dev

# Required: Webhook secret for verifying Nango webhooks
NANGO_WEBHOOK_SECRET=your-webhook-secret-here
```

### How to Find Each Value

| Variable | Where to Find It |
|----------|------------------|
| `NANGO_SECRET_KEY` | Nango Dashboard → Environment Settings → Secret Key |
| `NANGO_OUTLOOK_INTEGRATION_ID` | Nango Dashboard → Integrations → Click Outlook → Integration ID |
| `NANGO_HOST` | Usually `https://api.nango.dev` (use custom if self-hosting) |
| `NANGO_WEBHOOK_SECRET` | Nango Dashboard → Environment Settings → Webhook Secret |

## Webhook Configuration

The webhook must be configured in Nango for the integration to work properly.

### Setup Steps

1. Go to Nango Dashboard → Environment Settings
2. Find **Notification Settings** → **Webhooks URLs**
3. Set **Primary URL** to:
   ```
   https://action.adrata.com/api/webhooks/nango/email
   ```
4. Enable these checkboxes:
   - ✓ **Auth: new connection webhooks** (required)
   - ✓ **Auth: token refresh error webhooks** (optional)
   - ✓ **Syncs: error webhooks** (optional)
5. Click **Save**

### Verify Webhook Works

After connecting, check Vercel logs for:
```
📧 Received verified Nango webhook:
🔗 Processing connection creation webhook: aaf5c822-65aa-...
✅ Connection created and activated: aaf5c822-65aa-...
```

If you don't see these logs, the webhook isn't firing.

## Common Issues and Solutions

### Issue: "Failed to get session token from backend"

**Cause:** Backend is crashing or returning an error

**Solution:**
1. Check Vercel logs for detailed error
2. Look for `❌ [NANGO CONNECT]` errors
3. Verify environment variables are set
4. Check if secret key is valid

### Issue: "Integration 'outlook' not configured"

**Cause:** Integration ID mismatch or wrong environment

**Solution:**
1. Verify Integration ID in Nango dashboard
2. Check secret key is for correct environment
3. Ensure integration is saved in Nango

### Issue: Connection stays "pending" forever

**Cause:** Webhook not firing or webhook secret mismatch

**Solution:**
1. Verify webhook URL is set in Nango
2. Verify `NANGO_WEBHOOK_SECRET` in Vercel matches Nango
3. Check Vercel logs for webhook errors
4. Ensure webhook URL is publicly accessible

### Issue: "Cannot read properties of undefined"

**Cause:** Nango API response format changed or error in code

**Solution:**
1. Check Vercel logs for full error stack
2. Look for `📋 [NANGO CONNECT] Full response structure:` log
3. Verify Nango SDK version is compatible

## Vercel Logs Analysis

### What to Look For

When connecting, check logs for this sequence:

1. **Environment diagnostics:**
   ```
   🔍 [NANGO CONNECT] Environment diagnostics: {
     hasSecretKey: true,
     secretKeySource: 'NANGO_SECRET_KEY',
     ...
   }
   ```

2. **Integration verification:**
   ```
   🔍 [NANGO CONNECT] Available integrations: ['outlook']
   🔍 [NANGO CONNECT] Integration exists: true
   ```

3. **Session token creation:**
   ```
   ✅ [NANGO CONNECT] Session token created: ey...
   ```

4. **Database save:**
   ```
   💾 [NANGO CONNECT] Saving connection to database...
   ✅ [NANGO CONNECT] Connection saved to database successfully
   ```

5. **Response sent:**
   ```
   📤 [NANGO CONNECT] Sending response with session token
   ✅ [NANGO CONNECT] Response sent successfully
   ```

### Red Flags

- `Available integrations: []` - Wrong environment or no integrations
- `Integration exists: false` - Integration ID mismatch
- `❌ [NANGO CONNECT] Database error:` - Database issue
- `❌ [NANGO CONNECT] createConnectSession error:` - Nango API error

## Step-by-Step Debugging

### 1. Verify Environment Variables

```bash
# In Vercel, check these are set for Production:
NANGO_SECRET_KEY          ✓ Set
NANGO_OUTLOOK_INTEGRATION_ID  ✓ Set (or defaults to 'outlook')
NANGO_WEBHOOK_SECRET      ✓ Set
```

### 2. Test Nango Connection

Visit: `https://action.adrata.com/api/v1/integrations/nango/test`

Expected response:
```json
{
  "overallStatus": "healthy",
  "tests": {
    "clientInitialization": { "success": true },
    "listProviders": { "success": true, "providerCount": 1 },
    "outlookIntegration": { "success": true, "found": true }
  }
}
```

### 3. Try Connecting

1. Go to `https://action.adrata.com/adrata/grand-central/integrations`
2. Click **Connect Outlook**
3. Watch for errors in browser console
4. Check Vercel logs for backend errors

### 4. Verify Webhook

1. Check Nango Logs (dashboard → Logs)
2. Look for webhook delivery attempts
3. Verify webhook URL is correct
4. Check Vercel logs for webhook receipt

## Support

If you're still stuck after following this guide:

1. Check Vercel logs for errors
2. Visit the diagnostic endpoint
3. Verify all environment variables
4. Check Nango dashboard for integration status
5. Ensure webhook is configured
6. Review the comprehensive audit document: `docs/nango-outlook-integration-audit.md`

## Quick Reference

**Test Connection:**
```
https://action.adrata.com/api/v1/integrations/nango/test
```

**Verify Integration:**
```
https://action.adrata.com/api/v1/integrations/nango/verify?integrationId=outlook
```

**Webhook Endpoint:**
```
https://action.adrata.com/api/webhooks/nango/email
```

**Nango Dashboard:**
```
https://app.nango.dev
```

**Vercel Dashboard:**
```
https://vercel.com/dashboard
```

