# 🗑️ Database Cleanup - Remove Unused Tables

This directory contains scripts to safely remove unused tables from the Adrata database schema.

## 📊 Overview

After comprehensive analysis of the entire codebase, we identified **65 unused tables** that can be safely removed to improve database performance and maintainability.

### Current State
- **Total Tables**: 95+ tables
- **Actively Used**: ~30 tables
- **Unused Tables**: 65 tables
- **Production Data**: 867+ leads, 277 prospects, 1130 contacts, 232 accounts

## 🎯 Goals

1. **Remove unused tables** that have no code references
2. **Improve database performance** by reducing schema complexity
3. **Enhance maintainability** by cleaning up legacy code
4. **Preserve all production data** in actively used tables

## 📁 Files

### Core Scripts
- `backup-before-cleanup.sql` - Creates backups of all unused tables
- `remove-unused-tables.sql` - Removes unused tables safely
- `verify-cleanup.sql` - Verifies cleanup was successful
- `execute-cleanup.js` - Orchestrates the entire cleanup process

### Documentation
- `README.md` - This file

## 🚨 Safety Measures

### ⚠️ CRITICAL WARNINGS
- **This will permanently delete tables and their data**
- **Make sure you have a full database backup before proceeding**
- **Test in staging environment first**
- **Production data in active tables will be preserved**

### 🛡️ Safety Features
- **Automatic backups** of all unused tables before removal
- **Transaction-based** operations for rollback capability
- **Comprehensive verification** after cleanup
- **Detailed logging** of all operations

## 🚀 Execution Process

### Option 1: Automated Execution (Recommended)
```bash
# Navigate to the cleanup directory
cd scripts/cleanup

# Make the script executable
chmod +x execute-cleanup.js

# Run the automated cleanup
node execute-cleanup.js
```

### Option 2: Manual Execution
```bash
# 1. Create backups
psql -d your_database -f backup-before-cleanup.sql

# 2. Remove unused tables
psql -d your_database -f remove-unused-tables.sql

# 3. Verify cleanup
psql -d your_database -f verify-cleanup.sql
```

## 📋 Tables to be Removed

### Core System (3 tables)
- `App`, `Bundle`, `BundleApp`

### Buyer Groups (3 tables)
- `BuyerCompanyProfile`, `BuyerGroup`, `BuyerGroupToPerson`

### Change Tracking (1 table)
- `ChangeLog`

### Chat System (4 tables)
- `Chat`, `ChatMember`, `Message`, `MessageReaction`

### Company Management (1 table)
- `Company`

### Provider Management (2 tables)
- `ConnectedProvider`, `ProviderToken`

### Credit System (2 tables)
- `CreditTransaction`, `UserCreditBalance`

### Data Governance (3 tables)
- `DataRegion`, `DataTransferLog`, `WorkspaceRegion`

### Decision Making (1 table)
- `DecisionMaker`

### Document Sharing (1 table)
- `DocumentShare`

### Email System (1 table)
- `Email` (legacy)

### Enrichment System (4 tables)
- `EnrichmentAnalytics`, `EnrichmentCache`, `EnrichmentExecution`, `EnrichmentStep`

### Calendar System (2 tables)
- `Event`, `Meeting`

### Document System (3 tables)
- `Grid`, `Paper`, `Pitch`

### Intelligence (1 table)
- `IntelligenceReport`

### App Management (3 tables)
- `MembershipApp`, `UserApp`, `WorkspaceApp`

### Opportunity System (2 tables)
- `OpportunityActivity`, `OpportunityStakeholder`

### Email Settings (1 table)
- `OutboxSettings`

### Partnership System (2 tables)
- `Partnership`, `PartnershipLead`

### Person System (1 table)
- `Person`

### Pipeline System (3 tables)
- `PipelineExecution`, `PipelineResult`, `PipelineStep`

### Role System (4 tables)
- `Role`, `RolePermission`, `UserProfile`, `UserRoleHistory`

### Enterprise Features (3 tables)
- `SCIMConnection`, `SCIMSyncOperation`, `SSOProvider`

### Security System (2 tables)
- `SecurityEvent`, `SecurityMetrics`

### Seller System (2 tables)
- `SellerProductPortfolio`, `SellerProfile`

### Chat System (1 table)
- `UserChatReadState`

### Vector System (1 table)
- `VectorEmbedding`

### Workspace System (1 table)
- `WorkspaceMembership`

### Relationship Tables (8 tables)
- `ContactToOpportunity`, `EmailToAccount`, `EmailToContact`, `EmailToLead`, `EmailToOpportunity`, `EmailToPipelineExecution`, `EmailToProspect`, `ProspectOpportunities`

**Total: 65 unused tables**

## ✅ Tables to be Preserved

### Core CRM (5 tables)
- `leads`, `prospects`, `contacts`, `accounts`, `opportunities`

### User Management (4 tables)
- `users`, `workspaces`, `activities`, `notes`

### Specialized Features (8 tables)
- `clients`, `partners`, `speedrun_*`, `email_*`

### AI & Intelligence (4 tables)
- `business_*`, `strategic_*`, `user_ai_preferences`

### System & Infrastructure (5 tables)
- `api_*`, `cache_*`, `data_*`

### Recruiting Features (4 tables)
- `candidates`, `jobs`, `interviews`, `job_applications`

**Total: ~30 actively used tables**

## 🔍 Verification

After cleanup, the verification script will check:

1. **Core CRM tables** still exist
2. **User management tables** still exist
3. **Specialized feature tables** still exist
4. **AI & intelligence tables** still exist
5. **System & infrastructure tables** still exist
6. **Recruiting feature tables** still exist
7. **Backup tables** were created successfully

## 📊 Expected Results

### Before Cleanup
- **Total Tables**: 95+ tables
- **Schema Complexity**: High
- **Maintenance Overhead**: High

### After Cleanup
- **Total Tables**: ~30 tables
- **Schema Complexity**: Low
- **Maintenance Overhead**: Low
- **Performance**: Improved

## 🚨 Rollback Procedure

If you need to rollback the cleanup:

1. **Restore from backup tables**:
   ```sql
   -- Example for one table
   CREATE TABLE "App" AS SELECT * FROM "App_backup";
   ```

2. **Or restore from full database backup**:
   ```bash
   # Restore from your full database backup
   pg_restore -d your_database your_backup_file.dump
   ```

## 📞 Support

If you encounter any issues during the cleanup process:

1. **Check the logs** for specific error messages
2. **Verify database connectivity** and permissions
3. **Ensure sufficient disk space** for backups
4. **Contact the development team** if problems persist

## 🎉 Benefits

After successful cleanup:

- **Faster database operations** due to reduced schema complexity
- **Easier maintenance** with fewer tables to manage
- **Improved performance** for queries and migrations
- **Cleaner codebase** with no unused table references
- **Better documentation** with only relevant tables

---

**⚠️ Remember: Always test in staging first and have a full database backup before proceeding!**
