# Grand Central Meeting Integrations Setup Guide

Complete guide for setting up meeting notetaking integrations in Grand Central.

## Overview

Grand Central now supports the following meeting notetaking and transcription services:

- **Zoom** - Access meeting recordings and AI-generated transcripts
- **Fireflies.ai** - AI-powered meeting transcription and notes
- **Otter.ai** - Real-time meeting transcription and notes
- **Microsoft Teams** - Teams meeting recordings and transcripts via Microsoft Graph

## Integration Categories

All integrations are organized into categories for easy navigation:

- **Email** - Outlook and Gmail email sync
- **Calendar** - Google Calendar sync
- **Meeting Notes** - Zoom, Fireflies, Otter, and Microsoft Teams meeting transcripts

## Authentication Methods

### OAuth 2.0 (Zoom, Microsoft Teams)
OAuth provides secure, permission-based access without exposing credentials. The integration will:
1. Redirect you to the provider's login page
2. Request specific permissions
3. Store encrypted access tokens securely
4. Automatically refresh tokens as needed

### API Key (Fireflies, Otter)
API keys provide direct access to your account. Your API key is:
- Encrypted using AES-256 encryption before storage
- Never exposed in logs or error messages
- Validated before connection is established
- Stored securely in the database

## Zoom Integration Setup

### Requirements
- Zoom Pro, Business, or Enterprise account
- Access to Zoom App Marketplace
- Meeting recording enabled

### Step-by-Step Setup

#### 1. Create Zoom App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click "Develop" → "Build App"
3. Choose "Server-to-Server OAuth" app type
4. Fill in app information:
   - **App Name**: Adrata Grand Central Integration
   - **Company Name**: Your company name
   - **Developer Contact**: Your email

#### 2. Configure Scopes

Add the following scopes to your app:
- `meeting:read:admin` - Read meeting information
- `recording:read:admin` - Read cloud recordings
- `cloud_recording:read:admin` - Access recording metadata

#### 3. Get Credentials

1. Copy your **Account ID**
2. Copy your **Client ID**
3. Copy your **Client Secret**
4. Keep these credentials secure

#### 4. Add to Nango (Optional)

If using Nango for OAuth management:
1. Log in to Nango dashboard
2. Go to Integrations → Add Integration
3. Select Zoom or create custom integration
4. Enter Client ID and Client Secret
5. Set redirect URL: `https://action.adrata.com/[workspace]/grand-central/integrations`

#### 5. Configure Environment Variables

Add to Vercel environment variables:

```bash
# Zoom Integration
NANGO_ZOOM_INTEGRATION_ID=zoom
```

#### 6. Connect in Grand Central

1. Go to Grand Central → Integrations
2. Click "Meeting Notes" category
3. Find Zoom card
4. Click "Connect Zoom"
5. Authorize the app when redirected

### Accessing Zoom Data

Once connected, Grand Central will:
- Sync meeting recordings every 5 minutes
- Extract AI-generated transcripts (if available)
- Link meetings to companies and people
- Store meeting metadata and participants

## Fireflies.ai Integration Setup

### Requirements
- Fireflies.ai account (Free, Pro, or Business)
- API access enabled (available on all plans)

### Step-by-Step Setup

#### 1. Get API Key

1. Log in to [Fireflies.ai](https://fireflies.ai/)
2. Click your profile → Settings
3. Navigate to "Integrations" section
4. Scroll to "API Key" or "Developer" section
5. Click "Generate API Key" (or copy existing key)
6. Copy the API key - it looks like: `ff_api_xxxxxxxxxxxxx`

#### 2. Connect in Grand Central

1. Go to Grand Central → Integrations
2. Click "Meeting Notes" category
3. Find Fireflies.ai card
4. Click "Enter API Key"
5. Paste your API key in the modal
6. Click "Connect"

#### 3. Verify Connection

The system will:
- Test your API key immediately
- Fetch your user information
- Display connection status
- Show any errors if validation fails

### API Key Management

**Important Security Notes:**
- Your API key is encrypted before storage
- Keys are validated before connection
- Invalid keys are rejected immediately
- You can update your key anytime by reconnecting

### Accessing Fireflies Data

Once connected, Grand Central can:
- Fetch meeting transcripts
- Access meeting summaries
- Extract action items and key points
- Link meetings to relevant contacts

## Otter.ai Integration Setup

### Requirements
- Otter.ai account (Basic, Pro, or Business)
- API access (may require Pro or Business plan)

### Step-by-Step Setup

#### 1. Get API Key

1. Log in to [Otter.ai](https://otter.ai/)
2. Go to Settings → Account
3. Navigate to "Integrations" or "Developer" section
4. Look for "API Access" or "API Key"
5. Generate a new API key if needed
6. Copy the API key

#### 2. Connect in Grand Central

1. Go to Grand Central → Integrations
2. Click "Meeting Notes" category
3. Find Otter.ai card
4. Click "Enter API Key"
5. Paste your API key
6. Click "Connect"

#### 3. Verify Connection

The system will test your key by:
- Fetching your user profile
- Verifying API permissions
- Checking account status
- Storing encrypted credentials

### Accessing Otter Data

Once connected, Grand Central can:
- Sync meeting transcripts
- Access real-time transcriptions
- Extract key topics and action items
- Link to calendar events

## Microsoft Teams Integration Setup

### Requirements
- Microsoft 365 account with Teams
- Azure AD admin access (for app permissions)
- Teams recording enabled

### Step-by-Step Setup

#### 1. Update Azure App Registration

If you already have Outlook connected, you'll need to add Teams permissions:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "App Registrations"
3. Find your Adrata integration app
4. Click "API permissions"
5. Click "Add a permission"
6. Select "Microsoft Graph"
7. Choose "Application permissions"
8. Add these permissions:
   - `CallRecords.Read.All` - Read call records
   - `OnlineMeetings.Read.All` - Read online meetings
   - `CallRecord-PstnCalls.Read.All` - Read PSTN call records (optional)

#### 2. Grant Admin Consent

**Important:** These permissions require admin consent.

1. Click "Grant admin consent for [Your Organization]"
2. Confirm the action
3. Wait for permissions to be granted
4. Verify all permissions show "Granted"

#### 3. Configure Environment Variables

Ensure these are set in Vercel:

```bash
# Microsoft Integration
MICROSOFT_CLIENT_ID=8335dd15-23e0-40ed-8978-5700fddf00eb
MICROSOFT_CLIENT_SECRET=your-client-secret
NANGO_TEAMS_INTEGRATION_ID=microsoft-teams
```

#### 4. Connect in Grand Central

1. Go to Grand Central → Integrations
2. Click "Meeting Notes" category
3. Find Microsoft Teams card
4. Click "Connect Microsoft Teams"
5. Sign in and authorize permissions

### Accessing Teams Data

Once connected, Grand Central can:
- Fetch Teams meeting recordings
- Access meeting transcripts
- Get meeting attendee lists
- Link meetings to opportunities

## Environment Variables Reference

### Required for All Meeting Integrations

```bash
# API Key Encryption
API_KEY_ENCRYPTION_SECRET=your-32-character-secret-key

# Nango Configuration (if using OAuth)
NANGO_SECRET_KEY=your-nango-secret-key
NANGO_HOST=https://api.nango.dev
```

### Optional Provider-Specific Variables

```bash
# Zoom
NANGO_ZOOM_INTEGRATION_ID=zoom

# Microsoft Teams
NANGO_TEAMS_INTEGRATION_ID=microsoft-teams

# Fireflies (no env vars needed - API key only)

# Otter (no env vars needed - API key only)
```

## Troubleshooting

### Zoom Issues

**Error: "Invalid OAuth credentials"**
- Verify your Zoom app is activated
- Check that all required scopes are added
- Ensure Client ID and Secret are correct in Nango

**Error: "No recordings found"**
- Verify meeting recording is enabled
- Check that meetings have completed
- Ensure cloud recording is enabled (not local)

### Fireflies Issues

**Error: "Invalid API key"**
- Generate a new API key from Fireflies
- Ensure you copied the entire key
- Check that API access is enabled on your plan

**Error: "API rate limit exceeded"**
- Fireflies limits API calls per minute
- Wait 60 seconds and try again
- Consider upgrading your Fireflies plan

### Otter Issues

**Error: "API access not available"**
- Verify your Otter plan includes API access
- Check with Otter support about API availability
- Consider upgrading to Pro or Business plan

**Error: "Authentication failed"**
- Regenerate your API key in Otter settings
- Ensure you're using the latest key
- Check for typos in the key

### Microsoft Teams Issues

**Error: "Insufficient permissions"**
- Verify admin consent was granted
- Check that CallRecords.Read.All permission is present
- Ensure you have Azure AD admin rights

**Error: "No meetings found"**
- Verify Teams recording is enabled
- Check that meetings have ended
- Ensure recordings are available (24-hour delay possible)

## Data Storage and Privacy

### Meeting Transcript Storage

All meeting data is stored in the `meeting_transcripts` table:

- **Encrypted Storage**: Sensitive data is encrypted at rest
- **Access Control**: Only workspace members can access
- **Data Retention**: Configurable per workspace
- **GDPR Compliant**: Can be deleted on request

### What We Store

- Meeting title and date
- Participant list (names/emails)
- Full transcript text
- AI-generated summary (if available)
- Action items extracted from meeting
- Links to companies and people

### What We Don't Store

- Raw video or audio files
- Screen sharing content
- Chat messages (unless in transcript)
- Private messages between participants

## Best Practices

### Security

1. **Rotate API Keys Regularly**: Update keys every 90 days
2. **Use Strong Encryption Secret**: Set API_KEY_ENCRYPTION_SECRET to a random 32-character string
3. **Limit Workspace Access**: Only grant access to trusted team members
4. **Monitor Integration Logs**: Check for unusual activity

### Performance

1. **Sync Scheduling**: Meetings sync every 5 minutes by default
2. **Large Meetings**: Transcripts for long meetings may take time to process
3. **Rate Limits**: Be aware of provider rate limits
4. **Batch Operations**: Use bulk import for historical data

### Data Quality

1. **Link Meetings to Companies**: Manually link important meetings
2. **Review Transcripts**: AI transcription may have errors
3. **Extract Action Items**: Use AI to identify follow-up tasks
4. **Tag Meetings**: Add tags for easy searching

## API Endpoints

### Connect API Key Integration

```http
POST /api/v1/integrations/api-key/connect
Content-Type: application/json

{
  "provider": "fireflies",
  "apiKey": "your-api-key",
  "workspaceId": "workspace-id"
}
```

### Connect OAuth Integration

```http
POST /api/v1/integrations/nango/connect
Content-Type: application/json

{
  "provider": "zoom",
  "workspaceId": "workspace-id",
  "redirectUrl": "https://action.adrata.com/[workspace]/grand-central/integrations"
}
```

### Disconnect Integration

```http
POST /api/v1/integrations/nango/disconnect
Content-Type: application/json

{
  "connectionId": "connection-id",
  "workspaceId": "workspace-id"
}
```

## Support

For issues or questions:

1. Check this documentation first
2. Review the provider's API documentation
3. Check Grand Central logs in Vercel
4. Contact the Adrata development team

## Additional Resources

- [Zoom API Documentation](https://developers.zoom.us/docs/api/)
- [Fireflies API Documentation](https://docs.fireflies.ai/)
- [Otter.ai API Documentation](https://developer.otter.ai/)
- [Microsoft Graph API Documentation](https://learn.microsoft.com/en-us/graph/api/resources/call-records-api-overview)
- [Nango Documentation](https://docs.nango.dev/)

## Changelog

### Version 1.0 (Current)
- Initial release of meeting integrations
- Support for Zoom, Fireflies, Otter, Microsoft Teams
- API key and OAuth authentication
- Meeting transcript storage and linking
- Categorized integration UI

