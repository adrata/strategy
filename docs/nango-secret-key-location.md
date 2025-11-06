# Where to Find Your Nango Secret Key

## Location in Nango Dashboard

1. **Go to Nango Dashboard**: https://app.nango.dev
2. **Select Environment**: Make sure you're in the correct environment (e.g., "prod") - shown in top right
3. **Navigate to Environment Settings**:
   - Click **"Environment settings"** in the left sidebar (at the bottom)
   - OR go directly to: `https://app.nango.dev/prod/environment-settings`
4. **Find Secret Key**:
   - Scroll down to **"Backend Settings"** section
   - Look for **"Secret Key"** field
   - It will be masked with dots: `••••••••••••••••••••••••••••••••••••`
   - Click the **eye icon** 👁️ to reveal it, or click the **copy icon** 📋 to copy it

## Secret Key Format

**Note:** Secret key formats can vary:
- Some may start with `nango_sk_`
- Some may have different prefixes
- Some self-hosted instances may use different formats
- **The format doesn't matter** - use whatever Nango shows you

## What to Copy

Copy the **entire** secret key value exactly as shown in the dashboard. Don't add or remove any characters.

## Verify You Have the Right Key

After setting it in Vercel, check the logs when you try to connect. The logs will show:
- Which environment variable is being used
- First few characters of the key (for verification)
- Whether Nango accepts the key

## Common Mistakes

❌ **Wrong:** Copying the Public Key instead of Secret Key
- Public Key is for frontend SDK (optional)
- Secret Key is for backend API calls (required)

❌ **Wrong:** Using a key from a different environment
- If dashboard shows "prod", use the "prod" secret key
- If dashboard shows "dev", use the "dev" secret key

❌ **Wrong:** Using an old/expired key
- If you regenerated the key, make sure you're using the new one

## Still Can't Find It?

1. Check if you have access to the environment
2. Verify you're logged into the correct Nango account
3. Try the "Generate new secret key" button if available
4. Check Nango documentation for your specific instance type (cloud vs self-hosted)

