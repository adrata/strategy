# Testing Your Outlook Connection - Step by Step

Follow these steps to test the Grand Central Outlook integration.

## Before You Begin

Make sure you have:
- [ ] Azure AD client secret
- [ ] Access to Vercel (for setting env vars)
- [ ] Admin access to a Microsoft account (for testing)

## Step 1: Set Environment Variables (5 minutes)

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Add required environment variables
vercel env add MICROSOFT_CLIENT_SECRET production
# When prompted, paste your Azure AD client secret

vercel env add OAUTH_REDIRECT_BASE_URL production
# When prompted, enter: https://action.adrata.com

# Verify they're set
vercel env ls
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/your-project
2. Click "Settings" → "Environment Variables"
3. Add these variables:
   - `MICROSOFT_CLIENT_SECRET`: Your Azure AD client secret
   - `OAUTH_REDIRECT_BASE_URL`: `https://action.adrata.com`

### Step 2: Deploy (5 minutes)

```bash
# Make sure your changes are committed
git add .
git commit -m "Add OAuth connect endpoint for Grand Central"
git push

# Deploy to production
vercel --prod

# Wait for deployment to complete
```

## Step 3: Run Automated Tests (2 minutes)

```bash
# Run the test script
node scripts/test-outlook-connection.js
```

**Expected Output:**
```
============================================================
      Grand Central Outlook Integration Test
============================================================

1. Environment Variables Check
✅ DATABASE_URL is set
✅ NEXT_PUBLIC_APP_URL is set
✅ MICROSOFT_CLIENT_ID is set
✅ MICROSOFT_CLIENT_SECRET is set
✅ NEXTAUTH_URL is set
✅ OAUTH_REDIRECT_BASE_URL is set
✅ Environment variables check passed

2. Database Connection Test
✅ Database connection successful
✅ Table 'grand_central_connections' exists
✅ Table 'email_messages' exists
✅ Table 'people' exists
✅ Table 'companies' exists
✅ Database connection test passed

3. Health Endpoint Test
✅ Health endpoint returned 200
✅ Health endpoint test passed

4. OAuth Connect Endpoint Test
✅ POST endpoint exists (returned 401 - expected without auth)
✅ OAuth connect endpoint test passed

5. OAuth Callback Endpoint Test
✅ Callback endpoint exists and redirects
✅ OAuth callback endpoint test passed

6. Database Schema Validation
✅ Database schema validation passed

7. Webhook Endpoint Test
✅ Webhook endpoint exists and requires signature
✅ Webhook endpoint test passed

============================================================
Test Summary
============================================================
✅ Environment Variables: PASSED
✅ Database Connection: PASSED
✅ Health Endpoint: PASSED
✅ OAuth Connect Endpoint: PASSED
✅ OAuth Callback Endpoint: PASSED
✅ Database Schema: PASSED
✅ Webhook Endpoint: PASSED

🎉 ALL TESTS PASSED! (7/7)

✅ The Outlook integration is ready to use!
```

### If Tests Fail

**Fewer than 7 tests passing?**
- Check which test failed
- Review error messages
- Check environment variables
- Ensure deployment completed successfully

## Step 4: Manual Browser Test (10 minutes)

### 4.1 Navigate to Grand Central

1. Open browser to: https://action.adrata.com
2. Sign in with your account
3. Navigate to: **Grand Central** → **Integrations**

### 4.2 Initiate Connection

1. Find "Microsoft Outlook" in the integrations list
2. Click the "Connect" button
3. **Expected**: You should be redirected to Microsoft login page

**If you see an error instead:**
- Check browser console for error messages
- Verify environment variables are set
- Check that deployment completed

### 4.3 Complete OAuth Flow

1. Sign in with your Microsoft account
2. Review the permissions requested:
   - Read your mail
   - Send mail
   - Read and write your calendars
   - View your basic profile
3. Click "Accept" or "Allow"
4. **Expected**: You should be redirected back to Grand Central
5. **Expected**: You should see "Connected" or "Active" status

### 4.4 Verify Connection in UI

Check that:
- [ ] Connection appears in the integrations list
- [ ] Status shows as "Active" or "Connected"
- [ ] Provider shows as "Outlook"
- [ ] Shows when connection was created

### 4.5 Check Database

```sql
-- Connect to your database
psql $DATABASE_URL

-- Check the connection was created
SELECT 
  id,
  provider,
  status,
  "connectionName",
  "createdAt"
FROM grand_central_connections
WHERE provider = 'outlook'
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Expected Result:**
```
                id                | provider | status |   connectionName   |        createdAt
----------------------------------+----------+--------+-------------------+-------------------------
 01HQJR8... (your connection id)  | outlook  | active | outlook Connection| 2024-01-15 10:30:45.123
```

## Step 5: Test Email Sync (10-15 minutes)

### 5.1 Wait for Initial Sync

**Option A: Wait for automatic sync**
- Wait 5-10 minutes for automatic sync to run
- Email sync runs every 5 minutes

**Option B: Trigger manual sync (if you have the endpoint)**
```bash
# If you have a manual sync endpoint
curl -X POST https://action.adrata.com/api/v1/emails/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 5.2 Check for Emails in Database

```sql
-- Check if emails have been synced
SELECT 
  COUNT(*) as total_emails,
  MIN("receivedAt") as earliest_email,
  MAX("receivedAt") as latest_email
FROM email_messages
WHERE provider = 'outlook';
```

**Expected**: At least a few emails (depending on how many you have)

### 5.3 Check Email Details

```sql
-- View some synced emails
SELECT 
  subject,
  "from",
  "to",
  "receivedAt",
  "isRead"
FROM email_messages
WHERE provider = 'outlook'
ORDER BY "receivedAt" DESC
LIMIT 5;
```

### 5.4 Verify Email Linking

```sql
-- Check if emails are linked to people
SELECT 
  e.subject,
  e."from",
  e."receivedAt",
  p."firstName",
  p."lastName",
  p.email as person_email,
  c.name as company_name
FROM email_messages e
LEFT JOIN people p ON e."personId" = p.id
LEFT JOIN companies c ON e."companyId" = c.id
WHERE e.provider = 'outlook'
  AND e."personId" IS NOT NULL
LIMIT 5;
```

**Expected**: Some emails should be linked to people (if email addresses match)

### 5.5 Check Actions Created

```sql
-- Check if actions were created for emails
SELECT 
  a.type,
  a.subject,
  a.status,
  a."completedAt",
  e.subject as email_subject,
  e."from"
FROM actions a
JOIN email_messages e ON a."personId" = e."personId" 
WHERE a.type = 'EMAIL'
  AND e.provider = 'outlook'
ORDER BY a."completedAt" DESC
LIMIT 5;
```

## Step 6: Test Webhook (Optional - if using Nango)

If you're using Nango, test the webhook:

### 6.1 Send Test Email

1. Send an email TO your connected Outlook account
2. Wait 30-60 seconds for webhook to fire

### 6.2 Check Logs

```bash
# Check Vercel logs for webhook activity
vercel logs --prod | grep -i webhook

# Look for lines like:
# "📧 Received verified Nango email webhook"
# "✅ Email webhook processed successfully"
```

### 6.3 Verify Email Appeared

```sql
-- Check if the email appeared
SELECT *
FROM email_messages
WHERE provider = 'outlook'
  AND "receivedAt" > NOW() - INTERVAL '5 minutes'
ORDER BY "receivedAt" DESC;
```

## Step 7: Monitor Health (Ongoing)

### Daily Health Check

```bash
# Check overall health
curl https://action.adrata.com/api/health/email-sync | jq .

# Check specific metrics
curl https://action.adrata.com/api/health/email-sync | jq '.emailStats'
```

### Weekly Monitoring

```bash
# Email sync statistics
psql $DATABASE_URL << EOF
SELECT 
  provider,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE "personId" IS NOT NULL) as linked_emails,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "personId" IS NOT NULL) / COUNT(*), 2) as link_rate,
  MIN("receivedAt") as oldest_email,
  MAX("receivedAt") as newest_email
FROM email_messages
GROUP BY provider;
EOF
```

## Success Criteria

✅ **Integration is working if:**
- [ ] All automated tests pass (7/7)
- [ ] Can click "Connect" and reach Microsoft login
- [ ] OAuth flow completes without errors
- [ ] Connection shows as "Active" in UI
- [ ] Emails appear in database after sync
- [ ] Some emails link to people
- [ ] Actions created for linked emails
- [ ] Health endpoint returns "healthy"

## Troubleshooting Guide

### Problem: "Failed to initiate OAuth"

**Possible Causes:**
1. Missing `MICROSOFT_CLIENT_SECRET`
2. Invalid client secret
3. Environment variables not deployed

**Solutions:**
```bash
# Verify environment variable is set
vercel env ls | grep MICROSOFT_CLIENT_SECRET

# If missing, add it
vercel env add MICROSOFT_CLIENT_SECRET production

# Redeploy
vercel --prod
```

### Problem: OAuth redirects to error page

**Possible Causes:**
1. Redirect URI not configured in Azure AD
2. Invalid redirect URI

**Solutions:**
1. Go to Azure Portal → Your App → Authentication
2. Verify these URIs are listed:
   - `https://action.adrata.com/outlook/auth_callback/`
   - `https://action.adrata.com/api/auth/oauth/callback`
3. Save changes
4. Try connecting again

### Problem: No emails syncing

**Possible Causes:**
1. Connection not active
2. Sync scheduler not running
3. API permissions not granted

**Solutions:**
```sql
-- Check connection status
SELECT status FROM grand_central_connections WHERE provider = 'outlook';

-- If not 'active', check why
SELECT * FROM grand_central_connections WHERE provider = 'outlook';
```

Check Azure AD permissions:
1. Go to Azure Portal → Your App → API Permissions
2. Ensure "Mail.Read" has admin consent
3. Grant admin consent if needed

### Problem: Emails not linking to people

**Possible Causes:**
1. Email addresses don't match
2. People don't have email addresses

**Solutions:**
```sql
-- Check if people have email addresses
SELECT COUNT(*) FROM people WHERE email IS NOT NULL;

-- Check email formats
SELECT DISTINCT "from" FROM email_messages WHERE provider = 'outlook' LIMIT 10;
SELECT DISTINCT email FROM people LIMIT 10;
```

Ensure email formats match (lowercase, etc.)

### Problem: Webhook not working

**Possible Causes:**
1. Webhook URL not configured in Nango
2. Webhook secret mismatch
3. Rate limiting

**Solutions:**
1. Check Nango dashboard → Webhooks
2. Verify URL: `https://action.adrata.com/api/webhooks/nango/email`
3. Verify secret matches `NANGO_WEBHOOK_SECRET`
4. Check rate limits in logs

## Next Steps After Successful Test

1. **Roll out to team**
   - Have team members connect their accounts
   - Monitor for issues

2. **Set up monitoring**
   - Create daily health check cron job
   - Set up alerts for failures

3. **Optimize**
   - Review email linking rates
   - Adjust sync frequency if needed
   - Add filters for specific folders

4. **Documentation**
   - Create user guide for team
   - Document common issues

## Getting Help

If you encounter issues:

1. **Check the docs:**
   - [Setup Guide](./grand-central-outlook-setup-guide.md)
   - [Gap Analysis](./grand-central-outlook-gap-analysis.md)
   - [Quick Reference](./grand-central-outlook-quick-reference.md)

2. **Run diagnostics:**
   ```bash
   node scripts/test-outlook-connection.js
   curl https://action.adrata.com/api/health/email-sync | jq .
   vercel logs --prod | grep -i "oauth\|outlook\|email"
   ```

3. **Check database:**
   ```sql
   -- Connection status
   SELECT * FROM grand_central_connections WHERE provider = 'outlook';
   
   -- Email count
   SELECT COUNT(*) FROM email_messages WHERE provider = 'outlook';
   
   -- Recent errors (if you have error logging)
   SELECT * FROM error_logs WHERE context LIKE '%outlook%' ORDER BY timestamp DESC LIMIT 10;
   ```

## You're Ready! 🚀

The integration is complete and ready to use. Just follow these steps and you'll have Outlook emails syncing to Grand Central!

**Total Time**: ~30-45 minutes
**Difficulty**: Easy (if environment variables are available)

