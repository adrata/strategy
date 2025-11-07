# Grand Central Quick Start Guide

Get started with Grand Central meeting integrations in 5 minutes.

## What is Grand Central?

Grand Central is your central integration hub for connecting all your business tools and services. It now includes powerful meeting notetaking integrations that automatically capture and organize your meeting insights.

## Quick Start

### 1. Access Grand Central

1. Open Adrata
2. Click on **Grand Central** in the sidebar
3. Navigate to the **Integrations** page

### 2. Choose Your Category

Integrations are organized by category:

- **Email** - Outlook, Gmail
- **Calendar** - Google Calendar
- **Meeting Notes** - Zoom, Fireflies, Otter, Microsoft Teams

### 3. Connect a Service

#### For OAuth Services (Zoom, Teams):
1. Click **Connect [Service]**
2. You'll be redirected to the provider's login page
3. Sign in and authorize the requested permissions
4. You'll be redirected back to Grand Central
5. Connection complete!

#### For API Key Services (Fireflies, Otter):
1. Click **Enter API Key**
2. Follow the in-modal instructions to get your API key
3. Paste the API key
4. Click **Connect**
5. Connection verified!

## Where to Get API Keys

### Fireflies.ai
1. Log in to Fireflies.ai
2. Go to Settings → Integrations
3. Find "API Key" section
4. Copy your API key

### Otter.ai
1. Log in to Otter.ai
2. Go to Settings → Integrations
3. Find "API Access" section
4. Generate or copy your API key

### Zoom
1. Go to marketplace.zoom.us
2. Create a Server-to-Server OAuth app
3. Get your credentials
4. Use OAuth connection in Grand Central

### Microsoft Teams
Uses your existing Microsoft account - no additional setup needed if you have Outlook connected!

## What Happens After Connection?

Once connected, Grand Central will:

- ✅ Automatically sync your meeting transcripts
- ✅ Extract action items and key points
- ✅ Link meetings to relevant companies and people
- ✅ Make everything searchable across your workspace
- ✅ Sync every 5 minutes (configurable)

## Need Help?

See the full documentation: [Grand Central Meeting Integrations Setup Guide](./grand-central-meeting-integrations-setup.md)

## Environment Setup (For Developers)

Required environment variables:

```bash
# API Key Encryption
API_KEY_ENCRYPTION_SECRET=your-32-character-random-string

# Nango (for OAuth integrations)
NANGO_SECRET_KEY=your-nango-secret-key
NANGO_HOST=https://api.nango.dev

# Provider-specific (optional)
NANGO_ZOOM_INTEGRATION_ID=zoom
NANGO_TEAMS_INTEGRATION_ID=microsoft-teams
```

Add these to your Vercel project environment variables.

## Database Migration

After adding the new meeting integrations, run the Prisma migration:

```bash
npx prisma migrate dev --name add_meeting_transcripts
```

Or for production:

```bash
npx prisma migrate deploy
```

## Features

### Meeting Transcript Storage
- Full transcript text
- AI-generated summaries
- Participant lists
- Action items
- Key discussion points

### Smart Linking
- Automatically links meetings to companies
- Links meetings to people (participants)
- Creates timeline entries
- Surfaces buying signals

### Search & Discovery
- Full-text search across transcripts
- Filter by date, company, participant
- Tag meetings for organization
- Export transcripts

## Common Issues

**"Invalid API key"**
- Double-check you copied the entire key
- Make sure the key is active
- Try generating a new key

**"Connection failed"**
- Check your internet connection
- Verify the service is operational
- Try disconnecting and reconnecting

**"No meetings found"**
- New connections may take a few minutes to sync
- Ensure you have recordings available
- Check that recordings are enabled in your settings

## Support

For additional help:
- Review the full setup guide
- Check provider documentation
- Contact the development team

