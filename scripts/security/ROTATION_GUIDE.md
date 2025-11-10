# Database Credential Rotation Guide

This guide walks you through rotating your Neon database credentials securely.

## Overview

Credential rotation is a security best practice that should be done periodically (recommended: every 90 days) or immediately if credentials are compromised.

## Prerequisites

- Access to [Neon Console](https://console.neon.tech)
- Admin access to your Neon project
- Access to your local development environment
- Access to Vercel (if deploying to production)

## Step-by-Step Rotation Process

### Step 1: Create New Database User in Neon

**Important**: You're creating a **database user** (for database connections), NOT an API key (for Neon's API).

1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project
3. In the sidebar, look for one of these sections:
   - **"Connection Details"** (most common)
   - **"Users"** or **"Database Users"**
   - **"Roles"** (PostgreSQL terminology)
   - **"Settings"** → then look for user management
   
   ⚠️ **NOT** the "API Keys" section - that's for Neon's API access, not database connections

4. Look for **"Create User"**, **"Add User"**, or **"Add Role"** button
5. Enter a new username (e.g., `adrata_app_2025`)
6. Generate a secure password (save it securely - you'll need it!)
7. Grant the user appropriate permissions (typically full access to your database)
8. Copy the connection string or note down:
   - Username
   - Password
   - Host (e.g., `ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech`)
   - Database name (e.g., `neondb`)

**Alternative**: If you can't find the user creation UI, you can create a user via SQL:
1. Go to **"SQL Editor"** in Neon Console
2. Run this SQL (replace `new_username` and `new_password`):
   ```sql
   CREATE USER new_username WITH PASSWORD 'new_password';
   GRANT ALL PRIVILEGES ON DATABASE neondb TO new_username;
   ```

### Step 2: Run the Rotation Script

Use the automated rotation script:

```bash
node scripts/security/rotate-database-credentials.js
```

The script will:
- Prompt you for new credentials
- Test the new connection
- Update all critical configuration files
- Create backups of modified files
- Guide you through remaining steps

### Step 3: Test the New Connection

Test the new credentials manually:

```bash
# Set the new DATABASE_URL
export DATABASE_URL="postgresql://new_username:new_password@host/database?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000"

# Test the connection
node scripts/security/test-new-database-user.js
```

Or test with Prisma:

```bash
npx prisma db pull
```

### Step 4: Update Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. Click **Edit** and update with your new connection string
5. Save the changes
6. Redeploy your application (or wait for next deployment)

Alternatively, use the Vercel CLI:

```bash
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# Paste your new DATABASE_URL when prompted
```

### Step 5: Test Your Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test critical features:
   - User login/authentication
   - Data queries (companies, people, etc.)
   - Write operations (creating records)
   - API endpoints

3. Verify everything works correctly before proceeding

### Step 6: Update Additional Services

If you use other services that need database access:

- **GitHub Secrets** (for CI/CD): Update `DATABASE_URL` secret
- **Desktop Application**: Update build configuration if needed
- **Other deployment environments**: Update their environment variables

### Step 7: Delete Old User (After Verification)

⚠️ **IMPORTANT**: Only delete the old user after confirming everything works!

1. Go to Neon Console
2. Navigate to **"Users"**
3. Find the old user (typically `neondb_owner`)
4. Click **Delete** or **Remove**
5. Confirm the deletion

**Note**: This step is irreversible. Make sure your application is fully tested and working with the new credentials.

## Files Updated by Rotation Script

The rotation script automatically updates:

- `.env` and `.env.local` files
- `scripts/config/environments.js` (production database URL fallback)
- `scripts/deploy-neon-optimizations-to-vercel.js` (Vercel deployment config)
- `scripts/set-vercel-env-vars.js` (Vercel environment variables)

## Additional Files with Hardcoded Credentials

The following files contain hardcoded credentials but are typically one-time scripts. Update them when you use them:

- `scripts/audit/*.js` - Audit scripts
- `scripts/migrate-*.js` - Migration scripts
- `scripts/debug-*.js` - Debug scripts
- `src-desktop/build.rs` - Desktop build configuration

## Troubleshooting

### Connection Test Fails

- Verify credentials in Neon Console
- Check that SSL is enabled (`sslmode=require`)
- Ensure the user has proper permissions
- Verify host and database name are correct

### Application Errors After Rotation

- Check that `.env` file has the new `DATABASE_URL`
- Restart your development server
- Clear any cached connections
- Verify Vercel environment variables are updated (for production)

### Old User Still Works

This is expected! Both users will work until you delete the old one. This allows for a safe rollback if needed.

## Security Best Practices

1. **Rotate regularly**: Every 90 days or as per your security policy
2. **Use strong passwords**: Generate secure, random passwords
3. **Limit user permissions**: Only grant necessary permissions
4. **Monitor access**: Check Neon logs for unusual activity
5. **Delete old users**: Remove old credentials promptly after verification
6. **Never commit credentials**: Always use environment variables

## Rollback Procedure

If something goes wrong, you can rollback:

1. Restore `.env` files from backups (created by rotation script)
2. Restore updated config files from backups
3. Revert Vercel environment variables if needed
4. The old user will still work until deleted

## Support

If you encounter issues during rotation:

1. Check the error messages carefully
2. Verify credentials in Neon Console
3. Test connection manually using the test script
4. Check Neon documentation: https://neon.tech/docs

