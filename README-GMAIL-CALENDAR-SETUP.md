# Gmail and Google Calendar Integration Setup

## Quick Start

### 1. Run Setup Script

```bash
npm run setup:gmail-calendar
```

Or directly:
```bash
./scripts/setup-gmail-calendar-nango.sh
```

This will:
- Check current environment variables
- Prompt for Integration IDs from Nango dashboard
- Update `.env.local` with the values
- Run verification

### 2. Verify Configuration

```bash
npm run verify:nango
```

Or directly:
```bash
node scripts/verify-gmail-calendar-nango-config.js
```

### 3. Get Vercel Commands

```bash
npm run vercel:env:gmail-calendar
```

Or directly:
```bash
./scripts/generate-vercel-env-commands.sh
```

## Complete Implementation

See the full implementation guide: [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)

## What Needs to Be Done

### Automated (Scripts Handle This)
- ✅ Environment variable setup in `.env.local`
- ✅ Configuration verification

### Manual Steps Required

1. **Google Cloud Console**:
   - Update OAuth consent screen name
   - Create production OAuth 2.0 credentials
   - Configure redirect URI: `https://api.nango.dev/oauth/callback`

2. **Nango Dashboard**:
   - Update Gmail integration with production Client ID/Secret
   - Update Google Calendar integration with production Client ID/Secret
   - Verify Integration IDs match environment variables

3. **Vercel**:
   - Set environment variables (use generated commands)
   - Redeploy application

## Documentation

- **Quick Fix**: [docs/gmail-calendar-quick-fix-guide.md](docs/gmail-calendar-quick-fix-guide.md)
- **Full Guide**: [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md)
- **Checklist**: [docs/gmail-calendar-nango-configuration-checklist.md](docs/gmail-calendar-nango-configuration-checklist.md)
- **Detailed Fix**: [docs/fix-gmail-google-calendar-oauth-consent-screen.md](docs/fix-gmail-google-calendar-oauth-consent-screen.md)

## Outlook Protection

✅ **Outlook integration is fully protected** and will continue working:
- Separate OAuth provider (Azure AD vs Google)
- Separate code paths with explicit safeguards
- Independent environment variables
- Priority verification in all scripts

## Support

Run the verification script to diagnose issues:
```bash
npm run verify:nango
```

