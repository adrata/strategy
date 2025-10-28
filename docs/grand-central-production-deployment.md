# Grand Central Email Integration - Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Grand Central email integration to production. The integration enables users to connect their Outlook and Gmail accounts and automatically sync emails with intelligent linking to people and companies.

## Prerequisites

### 1. Nango Account Setup
- [ ] Nango account created at [nango.dev](https://nango.dev)
- [ ] Nango secret key and public key obtained
- [ ] Microsoft Outlook integration configured in Nango
- [ ] Google Workspace integration configured in Nango
- [ ] Webhook URL configured: `https://action.adrata.com/api/webhooks/nango/email`

### 2. OAuth Provider Setup

#### Microsoft Azure AD
- [ ] Azure AD application created
- [ ] Client ID: `8335dd15-23e0-40ed-8978-5700fddf00eb`
- [ ] Client secret obtained and stored securely
- [ ] Redirect URI added: `https://action.adrata.com/outlook/auth_callback/`
- [ ] API permissions granted:
  - `Mail.Read`
  - `Mail.Send`
  - `Calendars.ReadWrite`
  - `User.Read`
  - `offline_access`

#### Google Cloud Console
- [ ] Google Cloud project created
- [ ] Gmail API enabled
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URI added: `https://action.adrata.com/api/auth/oauth/callback`

### 3. Environment Variables

All required environment variables must be set in Vercel:

```bash
# Nango Configuration
NANGO_SECRET_KEY=your_nango_secret_key
NANGO_PUBLIC_KEY=your_nango_public_key
NANGO_HOST=https://api.nango.dev
NANGO_WEBHOOK_SECRET=your_webhook_secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=8335dd15-23e0-40ed-8978-5700fddf00eb
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application URLs
NEXT_PUBLIC_APP_URL=https://action.adrata.com
OAUTH_REDIRECT_BASE_URL=https://action.adrata.com

# Database
DATABASE_URL=your_database_url

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://action.adrata.com
```

## Deployment Steps

### Step 1: Validate Environment

```bash
# Run environment validation
node scripts/validate-environment.js
```

This script checks that all required environment variables are present and properly configured.

### Step 2: Run Production Tests

```bash
# Run comprehensive test suite
node scripts/test-email-integration-production.js
```

This script tests:
- Environment variable configuration
- Database connectivity
- Nango configuration
- API endpoints
- Webhook security
- Email linking logic
- Error handling

### Step 3: Deploy to Production

```bash
# Run the deployment script
./scripts/deploy-email-integration.sh
```

Or manually:

```bash
# Build the application
npm run build

# Deploy to Vercel
vercel --prod
```

### Step 4: Post-Deployment Configuration

#### Configure Nango Integrations

1. Log into your Nango dashboard
2. Navigate to Integrations
3. Configure Microsoft Outlook:
   - Set up OAuth credentials
   - Configure scopes: `Mail.Read`, `Mail.Send`, `Calendars.ReadWrite`
   - Test connection
4. Configure Google Workspace:
   - Set up OAuth credentials
   - Configure scopes: `gmail.readonly`, `gmail.send`, `calendar.readonly`
   - Test connection
5. Set up webhook:
   - URL: `https://action.adrata.com/api/webhooks/nango/email`
   - Events: `email.received`, `email.sent`
   - Secret: Use `NANGO_WEBHOOK_SECRET` value

#### Verify OAuth Redirect URIs

Ensure the following redirect URIs are configured:

- **Microsoft**: `https://action.adrata.com/outlook/auth_callback/`
- **Google**: `https://action.adrata.com/api/auth/oauth/callback`

## Testing the Deployment

### 1. Health Check

Visit: `https://action.adrata.com/api/health/email-sync`

This endpoint provides:
- Database connectivity status
- Environment variable validation
- Connection statistics
- Email sync metrics
- Performance recommendations

### 2. User Flow Testing

1. **Connect Email Account**:
   - Navigate to Grand Central
   - Click "Add Integration"
   - Select Outlook or Gmail
   - Complete OAuth flow
   - Verify connection appears as "Active"

2. **Email Sync**:
   - Wait for automatic sync (5-minute intervals)
   - Or trigger manual sync
   - Verify emails appear in database
   - Check email linking to people/companies

3. **Webhook Testing**:
   - Send test webhook to verify security
   - Check webhook logs in Vercel
   - Verify rate limiting works

### 3. Monitoring

#### Key Metrics to Monitor

- **OAuth Success Rate**: > 95%
- **Email Sync Success Rate**: > 99%
- **Email Linking Rate**: > 50%
- **Average Sync Latency**: < 30 seconds
- **Webhook Response Time**: < 5 seconds

#### Monitoring Endpoints

- Health Check: `/api/health/email-sync`
- Nango Config: `/api/v1/integrations/nango/config`
- Email Stats: Available in Grand Central UI

## Security Considerations

### 1. Webhook Security
- All webhooks require valid Nango signature
- Rate limiting: 10 requests per minute per IP
- Invalid requests are logged and rejected

### 2. OAuth Security
- PKCE (Proof Key for Code Exchange) implemented
- Secure token storage
- Proper scope validation
- Token refresh handling

### 3. Data Privacy
- Email data encrypted in transit and at rest
- User consent required for email access
- Data retention policies implemented
- GDPR compliance verified

## Troubleshooting

### Common Issues

#### 1. OAuth Failures
**Symptoms**: Users can't connect email accounts
**Solutions**:
- Verify redirect URIs match exactly
- Check client secrets are correct
- Ensure OAuth consent screen is configured
- Check API permissions are granted

#### 2. Email Sync Failures
**Symptoms**: No emails syncing
**Solutions**:
- Check Nango integration configuration
- Verify webhook URL is correct
- Check database connectivity
- Review error logs in Vercel

#### 3. Webhook Security Issues
**Symptoms**: Webhook requests rejected
**Solutions**:
- Verify `NANGO_WEBHOOK_SECRET` is set
- Check webhook signature verification
- Ensure rate limiting isn't blocking legitimate requests

### Debug Commands

```bash
# Check environment variables
node scripts/validate-environment.js

# Test all integrations
node scripts/test-email-integration-production.js

# Check database
npx prisma studio

# View logs
vercel logs --prod
```

## Performance Optimization

### 1. Database Optimization
- Email queries use proper indexing
- Pagination implemented for large datasets
- Connection pooling configured

### 2. API Optimization
- Retry logic with exponential backoff
- Rate limiting to prevent abuse
- Caching for frequently accessed data

### 3. Monitoring
- Health check endpoint for monitoring
- Structured logging for debugging
- Performance metrics collection

## Rollback Plan

If issues arise after deployment:

1. **Immediate Rollback**:
   ```bash
   vercel rollback
   ```

2. **Disable Email Integration**:
   - Set `EMAIL_SYNC_ENABLED=false` in environment
   - Disable webhook in Nango dashboard

3. **Data Cleanup** (if needed):
   ```sql
   -- Disconnect all email connections
   UPDATE grand_central_connections 
   SET status = 'inactive' 
   WHERE provider IN ('outlook', 'gmail');
   ```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Check health check endpoint
   - Review error logs
   - Monitor sync statistics

2. **Monthly**:
   - Review OAuth token refresh rates
   - Analyze email linking accuracy
   - Update documentation

3. **Quarterly**:
   - Security audit
   - Performance review
   - User feedback analysis

### Support Contacts

- **Technical Issues**: Development team
- **Nango Issues**: Nango support
- **OAuth Issues**: Microsoft/Google support
- **Database Issues**: Database administrator

## Success Criteria

The deployment is considered successful when:

- [ ] All health checks pass
- [ ] OAuth flows work for both providers
- [ ] Email sync functions correctly
- [ ] Webhook security is working
- [ ] Performance metrics meet targets
- [ ] User acceptance testing passes
- [ ] Monitoring and alerting is active

## Next Steps

After successful deployment:

1. **Gradual Rollout**:
   - Enable for beta users first
   - Monitor closely for 48 hours
   - Gradually expand to all users

2. **User Training**:
   - Create user documentation
   - Train support team
   - Prepare FAQ

3. **Feature Enhancements**:
   - Advanced email filtering
   - Bulk operations
   - Analytics dashboard
   - Mobile optimization

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: Production Ready
