# Outlook vs Gmail/Google Calendar Nango Configuration Comparison

## Overview

This document compares the working Outlook integration configuration with Gmail and Google Calendar to identify differences and ensure consistency.

## Key Differences

### 1. OAuth Provider

| Aspect | Outlook | Gmail/Google Calendar |
|--------|--------|----------------------|
| **OAuth Provider** | Azure AD (Microsoft) | Google Cloud Console |
| **Consent Screen** | Azure AD App Registration | Google Cloud Console OAuth Consent Screen |
| **Client ID Format** | UUID (e.g., `8335dd15-23e0-40ed-8978-5700fddf00eb`) | String (e.g., `123456789-abc.apps.googleusercontent.com`) |
| **Client Secret** | Azure AD Client Secret | Google OAuth Client Secret |

### 2. Integration Structure

| Aspect | Outlook | Gmail/Google Calendar |
|--------|--------|----------------------|
| **Connection Model** | Single connection for email + calendar | Separate connections for email and calendar |
| **Provider Name** | `outlook` | `gmail` and `google-calendar` |
| **Integration IDs** | `outlook` (or `microsoft-outlook`) | `google-mail` and `google-calendar` |
| **Database Storage** | `provider: 'outlook'` | `provider: 'gmail'` and `provider: 'google-calendar'` |

### 3. Nango Configuration

#### Outlook Integration

- **Integration ID**: `outlook` (or `microsoft-outlook`)
- **Client ID**: From Azure AD App Registration
- **Client Secret**: From Azure AD App Registration
- **Scopes**: 
  - `openid email profile`
  - `https://graph.microsoft.com/Mail.Read`
  - `https://graph.microsoft.com/Mail.Send`
  - `https://graph.microsoft.com/Calendars.ReadWrite`
  - `https://graph.microsoft.com/User.Read`
  - `offline_access`
- **Redirect URI**: `https://api.nango.dev/oauth/callback`

#### Gmail Integration

- **Integration ID**: `google-mail` (or `gmail`)
- **Client ID**: From Google Cloud Console OAuth 2.0 Credentials
- **Client Secret**: From Google Cloud Console OAuth 2.0 Credentials
- **Scopes**:
  - `https://mail.google.com/`
  - `https://www.googleapis.com/auth/gmail.readonly`
- **Redirect URI**: `https://api.nango.dev/oauth/callback`

#### Google Calendar Integration

- **Integration ID**: `google-calendar` (or `calendar`)
- **Client ID**: From Google Cloud Console OAuth 2.0 Credentials (can be same as Gmail)
- **Client Secret**: From Google Cloud Console OAuth 2.0 Credentials (can be same as Gmail)
- **Scopes**:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.readonly`
- **Redirect URI**: `https://api.nango.dev/oauth/callback`

### 4. Environment Variables

#### Outlook

```bash
NANGO_OUTLOOK_INTEGRATION_ID=outlook
```

#### Gmail

```bash
NANGO_GMAIL_INTEGRATION_ID=google-mail
```

#### Google Calendar

```bash
NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=google-calendar
```

### 5. OAuth Consent Screen Configuration

#### Outlook (Azure AD)

- **App Name**: Set in Azure AD App Registration → Branding
- **App Logo**: Optional, set in Azure AD
- **Publisher Domain**: Verified domain in Azure AD
- **Admin Consent**: Required for organization-wide access

#### Gmail/Google Calendar (Google Cloud Console)

- **App Name**: Set in Google Cloud Console → OAuth consent screen
- **User Type**: External (for public use) or Internal (for Google Workspace)
- **App Domain**: Your production domain
- **Authorized Domains**: Must include your domain
- **Scopes**: Must be added to consent screen
- **Publishing Status**: Testing (limited users) or In production (public)

## Common Configuration Issues

### Issue 1: OAuth Consent Screen Name

**Outlook**: Works correctly - Azure AD app name is set properly

**Gmail/Calendar**: Shows "Nango Developers Only - Not For Production"
- **Cause**: OAuth consent screen in Google Cloud Console has test/development name
- **Fix**: Update OAuth consent screen "App name" in Google Cloud Console

### Issue 2: Client ID/Secret Mismatch

**Outlook**: Uses production Azure AD app

**Gmail/Calendar**: May be using test OAuth app
- **Cause**: Nango dashboard configured with test OAuth Client ID
- **Fix**: Update Nango dashboard to use production OAuth Client ID/Secret

### Issue 3: Integration ID Mismatch

**Outlook**: `NANGO_OUTLOOK_INTEGRATION_ID` matches Nango dashboard

**Gmail/Calendar**: Integration IDs may not match
- **Cause**: Environment variable doesn't match Nango dashboard Integration ID
- **Fix**: Verify Integration ID in Nango dashboard and update environment variable

### Issue 4: Scopes Not Configured

**Outlook**: All required scopes configured in Azure AD

**Gmail/Calendar**: Scopes may be missing
- **Cause**: Scopes not added to OAuth consent screen or Nango integration
- **Fix**: Add required scopes to both Google Cloud Console and Nango dashboard

## Verification Checklist

Use this checklist to ensure Gmail/Calendar matches Outlook's working configuration:

### Nango Dashboard

- [ ] Gmail integration exists in Nango dashboard (prod environment)
- [ ] Google Calendar integration exists in Nango dashboard (prod environment)
- [ ] Integration IDs match environment variables in Vercel
- [ ] Client IDs are from production OAuth apps (not test apps)
- [ ] Client Secrets match production OAuth apps
- [ ] Required scopes are configured
- [ ] Integrations are saved (not in draft state)
- [ ] Redirect URI is `https://api.nango.dev/oauth/callback`

### Google Cloud Console

- [ ] OAuth consent screen configured with production app name
- [ ] OAuth 2.0 Client IDs created (production, not test)
- [ ] Redirect URI `https://api.nango.dev/oauth/callback` is authorized
- [ ] Required scopes added to consent screen
- [ ] App domain and authorized domains configured

### Environment Variables

- [ ] `NANGO_GMAIL_INTEGRATION_ID` set and matches Nango dashboard
- [ ] `NANGO_GOOGLE_CALENDAR_INTEGRATION_ID` set and matches Nango dashboard
- [ ] `NANGO_SECRET_KEY` matches prod environment in Nango
- [ ] `NANGO_HOST` set to `https://api.nango.dev`

### Code Configuration

- [ ] Provider mapping in `connect/route.ts` handles both integrations
- [ ] Webhook handler in `email/route.ts` handles both providers
- [ ] UI in `integrations/page.tsx` displays both integration cards

## Testing Comparison

### Outlook (Working)

1. Go to Grand Central → Integrations
2. Click "Connect Outlook"
3. OAuth consent screen shows proper app name
4. Complete OAuth flow
5. Connection appears as "Connected"
6. Emails and calendar events sync

### Gmail (Should Match)

1. Go to Grand Central → Integrations
2. Click "Connect Gmail"
3. OAuth consent screen should show proper app name (not "Developers Only")
4. Complete OAuth flow
5. Connection appears as "Connected"
6. Emails sync

### Google Calendar (Should Match)

1. Go to Grand Central → Integrations
2. Click "Connect Google Calendar"
3. OAuth consent screen should show proper app name (not "Developers Only")
4. Complete OAuth flow
5. Connection appears as "Connected"
6. Calendar events sync

## Action Items

Based on this comparison, ensure:

1. **Google Cloud Console OAuth consent screen** has production app name (not "Developers Only")
2. **Nango dashboard** uses production OAuth Client IDs (not test apps)
3. **Environment variables** match Integration IDs in Nango dashboard
4. **Scopes** are configured in both Google Cloud Console and Nango
5. **Redirect URIs** are correctly set

## References

- Outlook Setup: `docs/grand-central-outlook-setup-guide.md`
- Gmail Setup: `docs/gmail-integration-setup.md`
- Google Calendar Setup: `docs/google-calendar-integration-setup.md`
- OAuth Fix Guide: `docs/fix-gmail-google-calendar-oauth-consent-screen.md`

