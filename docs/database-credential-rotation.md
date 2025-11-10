# Neon.tech Database Credential Rotation Guide

This guide walks you through rotating your Neon.tech database credentials securely.

## Overview

When rotating database credentials, you need to:
1. Create a new database user in Neon Console
2. Update all local `.env` files
3. Update Vercel environment variables
4. Update GitHub secrets (if used in CI/CD)
5. Test the new credentials
6. Delete the old database user

## Prerequisites

- Access to [Neon Console](https://console.neon.tech)
- Access to Vercel dashboard
- Access to GitHub repository settings (for CI/CD secrets)
- Local environment with Node.js installed

## Step-by-Step Process

### Step 1: Create New Database User in Neon Console

1. Log into [Neon Console](https://console.neon.tech)
2. Select your project (e.g., `neondb`)
3. Navigate to **Dashboard** → **Users** (or **Settings** → **Users**)
4. Click **Create User** or **Add User**
5. Enter a new username (e.g., `adrata_app_2025`)
6. Generate a secure password (save it securely - you'll need it for the next steps)
7. Grant appropriate permissions to the new user
8. Note the connection string or connection details:
   - Host: `ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech` (or your endpoint)
   - Database: `neondb` (or your database name)
   - Username: Your new username
   - Password: Your new password

### Step 2: Update Local Environment Files

Use the automated script to update all local `.env` files:

```bash
# Set your new credentials as environment variables
export NEW_DATABASE_USERNAME="your_new_username"
export NEW_DATABASE_PASSWORD="your_new_password"

# Optionally override host/database if different
export DATABASE_HOST="ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech"
export DATABASE_NAME="neondb"

# Run the update script
./scripts/security/update-database-credentials.sh
```

The script will:
- Create backups of all `.env` files
- Update `DATABASE_URL` in all `.env` files
- Preserve other environment variables

**Manual Update (if needed):**

If you prefer to update manually, edit each `.env` file and update the `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://NEW_USERNAME:NEW_PASSWORD@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000"
```

### Step 3: Test New Credentials Locally

Before updating production, test the new credentials:

```bash
# Update the test script with your new credentials
# Edit scripts/security/test-new-database-user.js and update NEW_DATABASE_URL

# Run the test
node scripts/security/test-new-database-user.js
```

The test will verify:
- Connection to the database
- Table access permissions
- Query execution

### Step 4: Update Vercel Environment Variables

#### Option A: Using Vercel CLI

```bash
# Set the new DATABASE_URL in Vercel
vercel env add DATABASE_URL production

# When prompted, paste your new connection string:
# postgresql://NEW_USERNAME:NEW_PASSWORD@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000

# Also update POSTGRES_URL if it exists
vercel env add POSTGRES_URL production
```

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` in the production environment
5. Click **Edit** or **Remove** and **Add New**
6. Enter:
   - **Key**: `DATABASE_URL`
   - **Value**: Your new connection string
   - **Environment**: Production (and Preview/Development if needed)
7. Click **Save**
8. Repeat for `POSTGRES_URL` if it exists

#### Option C: Using Automated Script

If you have a script that sets Vercel environment variables, update it with the new credentials:

```bash
# Update scripts/set-vercel-env-vars.js or scripts/deploy-neon-optimizations-to-vercel.js
# with your new DATABASE_URL, then run:
node scripts/set-vercel-env-vars.js
```

### Step 5: Update GitHub Secrets (for CI/CD)

If your GitHub Actions workflows use database credentials:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Find `DATABASE_URL` or related secrets
4. Click **Update** and enter your new connection string
5. Update any environment-specific secrets:
   - `DATABASE_URL_PRODUCTION`
   - `DATABASE_URL_STAGING`
   - `DATABASE_URL_DEMO`
   - etc.

Alternatively, use the setup script:

```bash
# Set environment variable
export DATABASE_URL="postgresql://NEW_USERNAME:NEW_PASSWORD@..."

# Run the GitHub secrets setup
./scripts/setup/setup-github-secrets.sh
```

### Step 6: Update Configuration Files

Check and update any configuration files that might have hardcoded credentials:

1. **`scripts/config/environments.js`**: Update `PROD_DATABASE_URL` if it has a fallback
2. **Any deployment scripts**: Check for hardcoded connection strings
3. **Documentation files**: Update any examples with placeholder values

### Step 7: Verify Application Works

1. **Local Testing:**
   ```bash
   # Start your application locally
   npm run dev
   
   # Test database operations
   # Verify you can query data, create records, etc.
   ```

2. **Production Testing:**
   - Trigger a new Vercel deployment (or wait for next deployment)
   - Monitor application logs for database connection errors
   - Test critical database operations in production

### Step 8: Delete Old Database User

**IMPORTANT:** Only delete the old user after confirming everything works with the new credentials.

1. Log into [Neon Console](https://console.neon.tech)
2. Navigate to **Dashboard** → **Users**
3. Find the old database user (e.g., `neondb_owner`)
4. Click **Delete** or **Remove**
5. Confirm deletion

## Connection String Format

Your Neon.tech connection string should follow this format:

```
postgresql://USERNAME:PASSWORD@HOST/DATABASE?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000
```

**Parameters:**
- `sslmode=require`: Enforces SSL connection
- `pgbouncer=true`: Uses connection pooling (recommended for serverless)
- `connection_limit=20`: Maximum connections per pool
- `pool_timeout=20`: Timeout for getting a connection from the pool
- `statement_timeout=30000`: Maximum query execution time (30 seconds)

## Troubleshooting

### Connection Errors

If you encounter connection errors:

1. **Verify credentials:**
   ```bash
   node scripts/security/test-new-database-user.js
   ```

2. **Check Neon Console:**
   - Verify the user exists
   - Check user permissions
   - Verify the database endpoint is correct

3. **Check connection string format:**
   - Ensure special characters in password are URL-encoded
   - Verify all parameters are correct

### Application Still Using Old Credentials

1. **Clear environment variable cache:**
   - Restart your development server
   - Clear any cached environment variables

2. **Verify Vercel deployment:**
   - Check that new environment variables are deployed
   - Trigger a new deployment if needed

3. **Check for hardcoded credentials:**
   - Search codebase for old connection strings
   - Update any remaining hardcoded values

## Security Best Practices

1. **Never commit credentials to git** - Always use environment variables
2. **Use strong passwords** - Generate secure, random passwords
3. **Rotate regularly** - Consider rotating credentials quarterly or after security incidents
4. **Limit user permissions** - Grant only necessary permissions to database users
5. **Monitor access** - Review Neon Console logs for unusual activity
6. **Use connection pooling** - Always use `pgbouncer=true` for serverless environments

## Related Files

- `scripts/security/update-database-credentials.sh` - Automated credential update script
- `scripts/security/test-new-database-user.js` - Connection test script
- `scripts/config/environments.js` - Environment configuration
- `scripts/deployment/vercel-env-setup.sh` - Vercel environment setup
- `SECURITY_REMEDIATION.md` - Security remediation documentation

## Additional Resources

- [Neon.tech Documentation](https://neon.tech/docs)
- [Neon Console](https://console.neon.tech)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

