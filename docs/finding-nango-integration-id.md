# How to Find Your Nango Integration ID

## Quick Steps

1. **Go to the Integrations Tab**
   - In your Nango dashboard (https://app.nango.dev)
   - Click on **"Integrations"** in the left sidebar (not "Environment Settings")

2. **Find Your Outlook Integration**
   - You should see a list of configured integrations
   - Look for "Microsoft Outlook" or "Outlook" integration
   - Click on it to view details

3. **Copy the Integration ID**
   - The Integration ID is displayed in the integration details
   - It might be labeled as "Integration ID" or "Provider Config Key"
   - Common values: `outlook`, `microsoft-outlook`, or a custom ID you created

## Visual Guide

```
Nango Dashboard
├── Environment Settings (where you are now - has Secret Key)
├── Integrations ← GO HERE
│   └── Microsoft Outlook
│       └── Integration ID: "outlook" (or whatever yours is)
├── Connections
├── Logs
└── Metrics
```

## Setting It in Vercel

Once you find your Integration ID:

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add a new variable:
   - **Key**: `NANGO_OUTLOOK_INTEGRATION_ID`
   - **Value**: The Integration ID you copied (e.g., `outlook`)
3. Save and redeploy

## If You Don't Have an Integration Yet

If you don't see an Outlook integration:

1. In the **Integrations** tab, click **"Configure New Integration"**
2. Search for "Microsoft Outlook" or "Outlook"
3. Configure it with:
   - Your Azure AD Client ID
   - Your Azure AD Client Secret
   - Required scopes
4. The Integration ID will be created (you can customize it or use the default)

## Common Integration IDs

- Default: `outlook` or `microsoft-outlook`
- Custom: Whatever you named it when creating the integration

The Integration ID is what you'll use in the `NANGO_OUTLOOK_INTEGRATION_ID` environment variable.

