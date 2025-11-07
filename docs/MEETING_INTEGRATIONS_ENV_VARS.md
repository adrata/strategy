# Meeting Integrations Environment Variables

Complete reference for all environment variables needed for Grand Central meeting integrations.

## Required Variables

### API Key Encryption (REQUIRED)

```bash
API_KEY_ENCRYPTION_SECRET=your-32-character-random-string
```

Used to encrypt API keys before storing in database. Generate a secure random 32-character string:

```bash
openssl rand -base64 32
```

### Nango Configuration (REQUIRED for OAuth)

Required for Zoom and Microsoft Teams OAuth integrations:

```bash
NANGO_SECRET_KEY=your-nango-secret-key-here
NANGO_HOST=https://api.nango.dev
NANGO_PUBLIC_KEY=your-nango-public-key-here  # Optional
```

Get these from your Nango dashboard: https://app.nango.dev

## Optional Variables

### Zoom Integration

```bash
NANGO_ZOOM_INTEGRATION_ID=zoom
```

Default: `zoom`. Only needed if your Nango integration ID differs.

### Microsoft Teams Integration

```bash
NANGO_TEAMS_INTEGRATION_ID=microsoft-teams
MICROSOFT_CLIENT_ID=8335dd15-23e0-40ed-8978-5700fddf00eb
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

Teams uses your existing Microsoft OAuth setup. These may already be configured for Outlook.

### Fireflies.ai

No environment variables needed! Users enter their API key directly in the UI.

### Otter.ai

No environment variables needed! Users enter their API key directly in the UI.

## Setup Instructions

### For Vercel

1. Go to your Vercel project
2. Navigate to Settings → Environment Variables
3. Add each variable for Production, Preview, and Development
4. Redeploy your application

### For Local Development

1. Copy to `.env.local`:

```bash
API_KEY_ENCRYPTION_SECRET=your-32-character-random-string
NANGO_SECRET_KEY=your-nango-secret-key
NANGO_HOST=https://api.nango.dev
```

2. Restart your development server

## Getting Credentials

### Nango

1. Sign up at https://app.nango.dev
2. Create a new project
3. Copy your secret key from Settings
4. Add integrations for Zoom and Microsoft Teams

### Zoom

1. Go to https://marketplace.zoom.us/
2. Click Develop → Build App
3. Create Server-to-Server OAuth app
4. Add scopes: `meeting:read`, `recording:read`, `cloud_recording:read`
5. Add the app to Nango with your Client ID and Secret

### Microsoft Teams

1. Go to https://portal.azure.com/
2. Navigate to App Registrations
3. Find your existing Microsoft app
4. Add API permissions:
   - `CallRecords.Read.All`
   - `OnlineMeetings.Read.All`
5. Grant admin consent
6. Add to Nango if not already configured

## Security Best Practices

- Never commit secrets to version control
- Use different keys for dev/staging/production
- Rotate secrets every 90 days
- Use Vercel's encrypted environment variables
- API keys are encrypted before database storage

## Troubleshooting

### "Nango is not configured"
- Verify `NANGO_SECRET_KEY` is set
- Check that the key is correct
- Ensure Nango service is accessible

### "Invalid API key" (Fireflies/Otter)
- Verify `API_KEY_ENCRYPTION_SECRET` is set
- Check that user's API key is valid
- Test API key directly with provider's API

### "OAuth failed" (Zoom/Teams)
- Check Nango integration is configured
- Verify redirect URLs match
- Ensure all required scopes are added
- Check client ID and secret are correct

### "Permission denied" (Teams)
- Verify admin consent was granted in Azure
- Check `CallRecords.Read.All` permission exists
- Ensure user has necessary Teams license

