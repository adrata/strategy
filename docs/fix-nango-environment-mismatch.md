# Fix Nango Environment Mismatch

## The Problem

**Error:** `Integration does not exist` for "outlook"

**Root Cause:** Your Nango dashboard shows "prod" environment, but your Vercel `NANGO_SECRET_KEY` is for a different environment.

## Solution

### Step 1: Get the Correct Secret Key

1. Go to https://app.nango.dev
2. **IMPORTANT:** Make sure you're in the "prod" environment (check top right)
3. Go to **Environment Settings** (left sidebar, at the bottom)
4. Scroll to **Backend Settings** section
5. Find the **Secret Key** field (it may be masked with dots)
6. Click the **eye icon** or **copy icon** to reveal/copy the secret key
7. **Note:** The key format may vary - it might start with `nango_sk_` or have a different format depending on your Nango instance

### Step 2: Update Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Find `NANGO_SECRET_KEY`
3. **Update it** with the secret key from Step 1
4. Make sure it's set for **Production** environment
5. **Redeploy** your application

### Step 3: Verify

After redeploy, check:
```
https://action.adrata.com/api/v1/integrations/nango/verify?integrationId=outlook
```

Should show:
- `integrationExists: true`
- `outlook` in `availableIntegrations`

## Quick Check

To verify which environment your secret key is for:

1. The secret key format: `nango_sk_<environment>_<random>`
2. Check the first few characters after `nango_sk_` - they might indicate the environment
3. Or use the verification endpoint to see what integrations are available

## Alternative: Check for Multiple Environments

If you have multiple Nango projects/environments:

1. Check if you have a "dev" environment in Nango
2. Your `NANGO_SECRET_KEY_DEV` might be set instead of `NANGO_SECRET_KEY`
3. Make sure you're using the right one for production

## Still Not Working?

1. Double-check the Integration ID in Nango dashboard matches exactly "outlook"
2. Try clicking "Save" in the Outlook integration settings (even if nothing changed)
3. Wait a few seconds after saving for changes to propagate
4. Check Nango dashboard → Logs for any errors

