# Grand Central Outlook Integration - Setup Guide

## Overview

This guide will walk you through setting up the Grand Central Outlook integration from scratch. Follow these steps in order to get to 100% completion.

## Prerequisites

- Access to Azure AD (for Microsoft OAuth app)
- Admin access to Vercel (for environment variables)
- Nango account (or ability to create one)
- Access to production database

## Step-by-Step Setup

### Step 1: Azure AD Configuration (30 minutes)

1. **Verify Azure AD Application**:
   - Go to https://portal.azure.com
   - Navigate to Azure Active Directory → App registrations
   - Find your app (Client ID: `8335dd15-23e0-40ed-8978-5700fddf00eb`)

2. **Verify Redirect URIs**:
   ```
   https://action.adrata.com/outlook/auth_callback/
   https://action.adrata.com/api/auth/oauth/callback
   ```

3. **Verify API Permissions**:
   - Go to "API permissions" tab
   - Ensure these permissions are granted:
     - `openid`
     - `email`
     - `profile`
     - `Mail.Read`
     - `Mail.Send`
     - `Calendars.ReadWrite`
     - `User.Read`
     - `offline_access`
   - Click "Grant admin consent" if not already done

4. **Get Client Secret**:
   - Go to "Certificates & secrets" tab
   - If no valid secret exists, create a new one
   - Copy the secret value (you'll need it later)
   - Store securely

### Step 2: Nango Setup (1 hour)

#### Option A: Use Nango (Recommended)

1. **Create Nango Account**:
   ```bash
   # Go to https://nango.dev
   # Sign up for an account
   # Create a new project: "Adrata Production"
   ```

2. **Configure Microsoft Outlook Integration**:
   - In Nango dashboard, go to "Integrations"
   - Click "Add Integration"
   - Search for "Microsoft Outlook"
   - Configure:
     - **Provider Config Key**: `microsoft-outlook`
     - **Client ID**: `8335dd15-23e0-40ed-8978-5700fddf00eb`
     - **Client Secret**: (from Azure AD)
     - **Scopes**: 
       ```
       openid email profile
       https://graph.microsoft.com/Mail.Read
       https://graph.microsoft.com/Mail.Send
       https://graph.microsoft.com/Calendars.ReadWrite
       https://graph.microsoft.com/User.Read
       offline_access
       ```
     - **Redirect URI**: `https://api.nango.dev/oauth/callback`

3. **Configure Webhook**:
   - In Nango dashboard, go to "Webhooks"
   - Add new webhook:
     - **URL**: `https://action.adrata.com/api/webhooks/nango/email`
     - **Events**: `connection.created`, `connection.updated`, `sync.completed`
     - **Secret**: Generate a strong secret (save for later)

4. **Get API Keys**:
   - Go to "API Keys" in Nango dashboard
   - Copy:
     - **Secret Key** (starts with `nango_sk_`)
     - **Public Key** (starts with `nango_pk_`)
   - Store securely

#### Option B: Skip Nango (Direct OAuth)

If not using Nango, the existing OAuthService handles everything. You only need:
- Azure AD client secret
- Proper redirect URIs configured

### Step 3: Environment Variables (30 minutes)

1. **Create Environment File** (for local testing):
   ```bash
   # Create .env.local file
   cat > .env.local << EOL
   # Nango Configuration (if using Nango)
   NANGO_SECRET_KEY=nango_sk_xxxxxxxxxxxxx
   NANGO_PUBLIC_KEY=nango_pk_xxxxxxxxxxxxx
   NANGO_HOST=https://api.nango.dev
   NANGO_WEBHOOK_SECRET=your_webhook_secret_here

   # Microsoft OAuth
   MICROSOFT_CLIENT_ID=8335dd15-23e0-40ed-8978-5700fddf00eb
   MICROSOFT_CLIENT_SECRET=your_microsoft_secret_here

   # Google OAuth (for Gmail)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_secret

   # Application URLs
   NEXT_PUBLIC_APP_URL=https://action.adrata.com
   OAUTH_REDIRECT_BASE_URL=https://action.adrata.com
   NEXTAUTH_URL=https://action.adrata.com

   # Database (already configured)
   DATABASE_URL=your_database_url
   EOL
   ```

2. **Set Vercel Environment Variables**:
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel

   # Link to your project
   vercel link

   # Add environment variables
   vercel env add NANGO_SECRET_KEY production
   # Paste your Nango secret key when prompted

   vercel env add NANGO_PUBLIC_KEY production
   # Paste your Nango public key

   vercel env add NANGO_WEBHOOK_SECRET production
   # Paste your webhook secret

   vercel env add MICROSOFT_CLIENT_SECRET production
   # Paste your Microsoft client secret

   # Optional: Add the same for preview and development
   vercel env add NANGO_SECRET_KEY preview
   vercel env add NANGO_SECRET_KEY development
   ```

3. **Verify Environment Variables**:
   ```bash
   vercel env ls
   ```

### Step 4: Deploy Updated Code (15 minutes)

1. **Build Locally** (optional):
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Add OAuth connect endpoint for Grand Central"
   git push origin develop

   # If you want to deploy immediately
   vercel --prod
   ```

3. **Wait for Deployment**:
   - Monitor deployment at https://vercel.com/your-project
   - Ensure deployment succeeds

### Step 5: Verify Setup (30 minutes)

1. **Check Health Endpoint**:
   ```bash
   curl https://action.adrata.com/api/health/email-sync | jq .
   ```

   Expected output:
   ```json
   {
     "status": "healthy",
     "database": { "status": "healthy" },
     "environment": {
       "status": "healthy",
       "variables": {
         "nangoSecret": true,
         "nangoPublic": true,
         "microsoftClient": true
       }
     }
   }
   ```

2. **Test OAuth Providers Endpoint**:
   ```bash
   curl https://action.adrata.com/api/auth/oauth/connect | jq .
   ```

3. **Check Database Tables**:
   ```bash
   # Using Prisma Studio
   npx prisma studio

   # Or direct SQL
   psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('grand_central_connections', 'email_messages');"
   ```

### Step 6: Test OAuth Connection (30 minutes)

1. **Test in Browser**:
   - Navigate to https://action.adrata.com
   - Sign in to your workspace
   - Go to Grand Central → Integrations
   - Click "Connect" on Microsoft Outlook
   - You should be redirected to Microsoft login

2. **Complete OAuth Flow**:
   - Sign in with Microsoft account
   - Grant permissions
   - You should be redirected back to Grand Central
   - Connection should show as "Active"

3. **Verify in Database**:
   ```sql
   SELECT 
     id,
     provider,
     status,
     connectionName,
     createdAt,
     lastSyncAt
   FROM grand_central_connections
   WHERE provider = 'outlook'
   ORDER BY createdAt DESC
   LIMIT 5;
   ```

4. **Check Logs**:
   ```bash
   vercel logs --prod | grep -i "oauth\|outlook"
   ```

### Step 7: Test Email Sync (30 minutes)

1. **Trigger Manual Sync**:
   ```bash
   # Call sync endpoint (if you create one)
   # Or wait for automatic sync (5 minute intervals)
   ```

2. **Verify Emails in Database**:
   ```sql
   SELECT 
     COUNT(*) as total_emails,
     provider,
     COUNT(*) FILTER (WHERE "personId" IS NOT NULL) as linked_emails
   FROM email_messages
   GROUP BY provider;
   ```

3. **Test Webhook** (if using Nango):
   - Send a test email to connected account
   - Check if webhook is triggered
   - Verify email appears in database

4. **Check Email Linking**:
   ```sql
   SELECT 
     e.subject,
     e.from,
     e.provider,
     p.firstName,
     p.lastName,
     p.email,
     c.name as companyName
   FROM email_messages e
   LEFT JOIN people p ON e."personId" = p.id
   LEFT JOIN companies c ON e."companyId" = c.id
   WHERE e.provider = 'outlook'
   LIMIT 10;
   ```

## Troubleshooting

### Issue: "Missing environment variable"

**Solution**:
```bash
# Check which variables are missing
node -e "console.log('NANGO_SECRET_KEY:', !!process.env.NANGO_SECRET_KEY)"

# Add missing variables
vercel env add VARIABLE_NAME production
```

### Issue: "OAuth connection fails"

**Symptoms**: User clicks connect but gets error

**Solutions**:
1. Check redirect URIs match exactly in Azure AD
2. Verify client secret is correct
3. Check logs: `vercel logs --prod | grep "OAUTH"`
4. Ensure admin consent granted for API permissions

### Issue: "Emails not syncing"

**Symptoms**: Connection active but no emails in database

**Solutions**:
1. Check webhook configuration in Nango
2. Verify webhook secret matches
3. Check webhook endpoint logs: `vercel logs --prod | grep "webhook"`
4. Manually trigger sync if scheduler not running

### Issue: "Emails not linking to people"

**Symptoms**: Emails in database but `personId` is NULL

**Solutions**:
1. Check email addresses in people table match format
2. Verify linking logic in `UnifiedEmailSyncService.linkEmailsToEntities()`
3. Run linking manually:
   ```typescript
   await UnifiedEmailSyncService.linkEmailsToEntities(workspaceId);
   ```

## Testing Checklist

- [ ] Health endpoint returns "healthy"
- [ ] Environment variables all set
- [ ] OAuth connect button redirects to Microsoft
- [ ] OAuth callback processes successfully
- [ ] Connection appears in Grand Central UI as "Active"
- [ ] Emails sync from Outlook
- [ ] Emails link to people/companies
- [ ] Actions created for timeline
- [ ] Webhook receives notifications (if using Nango)
- [ ] Rate limiting works on webhook endpoint
- [ ] Error scenarios handled gracefully

## Production Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Azure AD app configured correctly
- [ ] Nango integrations configured (if using)
- [ ] Webhook URL registered (if using Nango)
- [ ] Code deployed to production
- [ ] Health check passes
- [ ] Test account connected successfully
- [ ] Email sync verified
- [ ] Monitoring configured
- [ ] Alerts set up for failures
- [ ] Documentation updated
- [ ] Team trained on usage

## Monitoring

### Daily Checks

```bash
# Health status
curl https://action.adrata.com/api/health/email-sync | jq '.status'

# Connection count
psql $DATABASE_URL -c "SELECT COUNT(*), status FROM grand_central_connections GROUP BY status;"

# Recent emails
psql $DATABASE_URL -c "SELECT COUNT(*) FROM email_messages WHERE \"createdAt\" > NOW() - INTERVAL '24 hours';"
```

### Weekly Checks

```bash
# Email linking rate
psql $DATABASE_URL -c "
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE \"personId\" IS NOT NULL) as linked,
    ROUND(100.0 * COUNT(*) FILTER (WHERE \"personId\" IS NOT NULL) / COUNT(*), 2) as link_rate
  FROM email_messages;
"

# Sync frequency
psql $DATABASE_URL -c "
  SELECT 
    provider,
    AVG(EXTRACT(EPOCH FROM (NOW() - \"lastSyncAt\"))/60) as avg_minutes_since_sync
  FROM grand_central_connections
  WHERE status = 'active'
  GROUP BY provider;
"
```

## Support Contacts

- **Azure AD Issues**: Microsoft Support
- **Nango Issues**: support@nango.dev
- **Database Issues**: Database Admin
- **Deployment Issues**: DevOps Team

## Additional Resources

- [Grand Central Implementation Summary](./grand-central-implementation-summary.md)
- [Grand Central Production Deployment](./grand-central-production-deployment.md)
- [Email Integration Architecture](./email-integration-architecture.md)
- [Gap Analysis](./grand-central-outlook-gap-analysis.md)

## Success Criteria

The integration is 100% complete when:

1. ✅ OAuth connect endpoint exists and works
2. ✅ Environment variables all configured
3. ✅ User can connect Outlook account
4. ✅ OAuth flow completes successfully
5. ✅ Connection shows as "Active" in UI
6. ✅ Emails sync automatically
7. ✅ Emails link to people and companies
8. ✅ Actions appear in timeline
9. ✅ Webhooks process correctly
10. ✅ Health check returns "healthy"

## Timeline

- **Setup**: 2-3 hours
- **Testing**: 1-2 hours
- **Verification**: 30 minutes
- **Total**: 4-6 hours

You are now ready to connect Outlook accounts and test the full integration!

