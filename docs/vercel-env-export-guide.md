# Exporting Vercel Environment Variables for Staging

This guide explains how to export environment variables from Vercel production and configure them for staging.

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
# Run the export script
node scripts/export-vercel-env-for-staging.js

# This will create:
# - .env.staging - Environment file with transformed URLs
# - scripts/vercel-staging-env-commands.sh - CLI commands to push to Vercel
```

### Option 2: Manual Export via Vercel Dashboard

1. Go to Vercel Dashboard: https://vercel.com/[your-team]/[your-project]/settings/environment-variables
2. Export production environment variables
3. Manually update URL-related variables for staging

### Option 3: Vercel CLI

```bash
# List all production environment variables
vercel env ls production

# For each variable, you'll need to manually copy the value
# Then set it for preview (staging) environment:
echo "value" | vercel env add VARIABLE_NAME preview
```

## Automated Script Details

The `export-vercel-env-for-staging.js` script:

1. **Fetches** all environment variables from Vercel production
2. **Transforms** URL-related variables automatically:
   - `action.adrata.com` → `staging.adrata.com`
   - `https://action.adrata.com` → `https://staging.adrata.com`
3. **Generates** a `.env.staging` file with:
   - Auto-transformed URL variables (ready to use)
   - Placeholders for sensitive variables (need manual input)
   - Comments explaining what needs to be done

## URL Variables That Get Auto-Transformed

The following variables are automatically transformed for staging:

- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `OAUTH_REDIRECT_BASE_URL`
- Any variable containing `URL`, `REDIRECT`, `WEBHOOK`, `BASE_URL`, `DOMAIN`, or `HOST` in the name

## Manual Configuration Required

Some variables cannot be automatically transformed and require manual input:

1. **Sensitive API Keys**: Copy from Vercel production dashboard
2. **Database URLs**: May need staging-specific database
3. **OAuth Client Secrets**: Should use staging OAuth apps
4. **Webhook Secrets**: May need different values for staging

## Setting Up Staging Environment Variables

### Method 1: Using Generated Script

```bash
# 1. Edit the generated script to fill in [PRODUCTION_VALUE] placeholders
nano scripts/vercel-staging-env-commands.sh

# 2. Run the script
bash scripts/vercel-staging-env-commands.sh
```

### Method 2: Using Vercel Dashboard

1. Go to: https://vercel.com/[team]/[project]/settings/environment-variables
2. Select **Preview** environment
3. Add each variable from `.env.staging`
4. For transformed URLs, use the staging values
5. For sensitive values, copy from production

### Method 3: Using Vercel CLI (One by One)

```bash
# For each variable in .env.staging:
echo "staging-value" | vercel env add VARIABLE_NAME preview
```

## Required Staging Environment Variables

Based on the staging configuration, ensure these are set:

```bash
# Core URLs (auto-transformed)
NEXTAUTH_URL=https://staging.adrata.com
NEXT_PUBLIC_APP_URL=https://staging.adrata.com
OAUTH_REDIRECT_BASE_URL=https://staging.adrata.com

# Database (may be same or different)
DATABASE_URL=[staging-database-url]

# Authentication
NEXTAUTH_SECRET=[same-or-different-secret]

# API Keys (copy from production or use staging keys)
OPENAI_API_KEY=[api-key]
# ... other API keys
```

## OAuth Provider Configuration

After setting environment variables, configure OAuth providers:

### Microsoft Azure AD

Add staging redirect URI:
- `https://staging.adrata.com/outlook/auth_callback/`

### Google Cloud Console

Add staging redirect URI:
- `https://staging.adrata.com/api/auth/oauth/callback`

Add to authorized domains:
- `staging.adrata.com`

## Webhook Configuration

Update webhook URLs in external services:

### Zoho CRM

Update webhook URL to:
- `https://staging.adrata.com/api/webhooks/zoho`

### Nango

Update webhook URL to:
- `https://staging.adrata.com/api/webhooks/nango/email`

## Verification

After setting up staging environment variables:

1. **Deploy to staging** (or trigger a preview deployment)
2. **Check environment variables** in deployment logs:
   ```bash
   vercel logs [deployment-url] --follow
   ```
3. **Test OAuth flows** on staging
4. **Verify webhooks** are receiving requests
5. **Check share links** use staging URLs

## Troubleshooting

### Script Fails: "Vercel CLI not found"

```bash
npm install -g vercel
vercel login
```

### Script Fails: "Not authenticated"

```bash
vercel login
```

### Variables Not Appearing in Staging

- Ensure you're setting variables for **Preview** environment (not Production)
- Check that the deployment is using the Preview environment
- Verify variable names match exactly (case-sensitive)

### URLs Still Pointing to Production

- Check that URL transformation worked in `.env.staging`
- Verify variables were set correctly in Vercel
- Clear browser cache and cookies
- Check deployment logs for actual environment variable values

## Security Notes

- **Never commit** `.env.staging` with real values to git
- Use Vercel's environment variable management for sensitive data
- Consider using different API keys for staging vs production
- Review which variables should be different between environments

## Related Documentation

- [Environment Variables Configuration](./environment-variables.md)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

