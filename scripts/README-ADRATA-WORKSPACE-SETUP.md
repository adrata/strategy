# Adrata Workspace Setup for Production

This directory contains scripts to set up the "Adrata" workspace in production with user "dan" and migrate his data from other workspaces.

## 🎯 Objective

Ensure that:

1. An "Adrata" workspace exists in production
2. User "dan@adrata.com" exists with password "danpass"
3. All of Dan's leads, contacts, opportunities, and accounts are consolidated in the Adrata workspace

## 📋 Available Scripts

### 1. Interactive Setup Script (Recommended)

```bash
./scripts/setup-adrata-production.sh
```

This interactive script provides three options:

- **Option 1**: Verify current state only
- **Option 2**: Run setup/migration only
- **Option 3**: Verify then setup (recommended)

### 2. Individual Scripts

#### Verification Script

```bash
node scripts/verify-dan-data-production.js
```

- **Purpose**: Check current state without making changes
- **Safe**: Read-only operation
- **Output**: Shows Dan's data distribution across workspaces

#### Setup Script

```bash
node scripts/setup-adrata-workspace-production.js
```

- **Purpose**: Create workspace, user, and migrate data
- **⚠️ WARNING**: Modifies production data
- **Output**: Complete setup and migration

## 🔄 Recommended Workflow

1. **First, verify the current state:**

   ```bash
   ./scripts/setup-adrata-production.sh
   # Choose option 1
   ```

2. **Review the verification output** to understand:
   - Does the Adrata workspace exist?
   - Does user Dan exist?
   - How much data needs to be migrated?

3. **Run the setup if needed:**
   ```bash
   ./scripts/setup-adrata-production.sh
   # Choose option 2 or 3
   ```

## ✅ What the Setup Script Does

### Workspace Setup

- ✅ Creates "Adrata" workspace if it doesn't exist
- ✅ Ensures workspace has proper configuration

### User Setup

- ✅ Creates user "dan@adrata.com" if it doesn't exist
- ✅ Updates password to "danpass" (bcrypt hashed)
- ✅ Sets proper user details (name, firstName, lastName)
- ✅ Adds Dan as admin member of Adrata workspace

### Data Migration

- ✅ Finds all leads assigned to Dan in other workspaces
- ✅ Moves leads to Adrata workspace
- ✅ Moves related contacts to Adrata workspace
- ✅ Moves related opportunities to Adrata workspace
- ✅ Moves related accounts to Adrata workspace

## 🛡️ Safety Features

- **Read-first approach**: Verification script shows what will change
- **Confirmation prompts**: Setup script asks for confirmation
- **Detailed logging**: All operations are logged with clear output
- **Transaction safety**: Database operations use proper error handling

## 📊 Expected Output

After successful setup, you should see:

```
📊 FINAL SUMMARY:
================
✅ Workspace: Adrata (workspace-id)
✅ User: Dan (dan@adrata.com)
✅ Leads in Adrata workspace: X
✅ Contacts in Adrata workspace: Y
✅ Opportunities in Adrata workspace: Z
✅ Accounts in Adrata workspace: W

🎉 ADRATA WORKSPACE SETUP COMPLETE!
====================================
Login credentials:
  Email: dan@adrata.com
  Password: danpass
  Workspace: Adrata
```

## 🔗 Testing After Setup

1. **Visit**: https://action.adrata.com
2. **Login with**:
   - Email: `dan@adrata.com`
   - Password: `danpass`
3. **Verify**: All data is accessible in the Adrata workspace

## 🔧 Troubleshooting

### Common Issues

1. **"Permission denied" error**

   ```bash
   chmod +x scripts/setup-adrata-production.sh
   ```

2. **"Database connection failed"**
   - Check VPN connection
   - Verify database URL in script

3. **"User not found" during verification**
   - This is normal if Dan doesn't exist yet
   - The setup script will create the user

### Manual Database Checks

If you need to manually verify the database:

```sql
-- Check workspaces
SELECT id, name, slug FROM "Workspace" WHERE name ILIKE '%adrata%';

-- Check Dan user
SELECT id, email, name FROM "User" WHERE email = 'dan@adrata.com';

-- Check Dan's data counts
SELECT
  'leads' as type,
  COUNT(*) as count,
  w.name as workspace
FROM "Lead" l
JOIN "User" u ON l."assignedUserId" = u.id
JOIN "Workspace" w ON l."workspaceId" = w.id
WHERE u.email = 'dan@adrata.com'
GROUP BY w.name;
```

## 🎯 Production Database

The scripts connect to:

- **Database**: Production Neon PostgreSQL
- **Environment**: Production
- **URL**: `postgresql://neondb_owner:...@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb`

## ⚠️ Important Notes

- **Backup recommended**: Consider backing up before major migrations
- **Test credentials**: Verify login works after setup
- **Data integrity**: Scripts maintain all relationships and foreign keys
- **Workspace isolation**: Data is properly moved, not duplicated
