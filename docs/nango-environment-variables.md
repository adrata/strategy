# Nango Environment Variables Configuration

## Required Environment Variables

Set these in your Vercel project settings:

### Core Nango Configuration
```bash
# Nango Secret Key (from Nango dashboard → API Keys)
NANGO_SECRET_KEY=your_nango_secret_key_here

# Nango Public Key (optional, for frontend SDK)
NANGO_PUBLIC_KEY=your_nango_public_key_here

# Nango Host (default: https://api.nango.dev)
NANGO_HOST=https://api.nango.dev

# Webhook Secret (for verifying webhook signatures)
NANGO_WEBHOOK_SECRET=your_webhook_secret_here
```

### Integration ID Mapping (Security)

**IMPORTANT:** These map the simple provider names (used in frontend) to your actual Nango Integration IDs.

```bash
# Outlook Integration ID (from Nango dashboard → Integrations)
# This is the exact Integration ID you see in your Nango dashboard
NANGO_OUTLOOK_INTEGRATION_ID=outlook

# Gmail Integration ID (if using Gmail)
NANGO_GMAIL_INTEGRATION_ID=gmail
```

## How It Works

1. **Frontend** sends simple provider name: `"outlook"`
2. **Backend** maps it to actual Integration ID using environment variable: `NANGO_OUTLOOK_INTEGRATION_ID`
3. **Backend** uses the Integration ID to create the Nango connect session

This keeps Integration IDs secure and allows you to change them without updating frontend code.

## Finding Your Integration ID

1. Go to https://app.nango.dev
2. Navigate to **Integrations** tab
3. Find your Outlook (or Gmail) integration
4. The **Integration ID** is shown in the integration details
5. Copy it and set it as `NANGO_OUTLOOK_INTEGRATION_ID` in Vercel

## Example

If your Nango dashboard shows:
- Integration Name: "Microsoft Outlook"
- Integration ID: `microsoft-outlook`

Then set:
```bash
NANGO_OUTLOOK_INTEGRATION_ID=microsoft-outlook
```

The frontend code will continue to send `provider: "outlook"`, and the backend will automatically map it to `microsoft-outlook`.

