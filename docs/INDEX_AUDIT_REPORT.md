# Database Index Audit Report

## 🚨 CRITICAL FINDINGS

### ❌ INCORRECT INDEX CLAIMS
The following indexes were **INCORRECTLY CLAIMED** to exist but do NOT exist in the migration files:

1. **`idx_leads_workspace_assigned`** - ❌ DOES NOT EXIST
2. **`idx_leads_workspace_rank`** - ❌ DOES NOT EXIST  
3. **`idx_opportunities_workspace_assigned`** - ❌ DOES NOT EXIST

### ✅ ACTUAL INDEXES THAT EXIST

#### **LEADS TABLE** - Multiple indexes exist but different names:
- `idx_leads_workspace_status_priority` ✅
- `idx_leads_workspace_created_desc` ✅
- `idx_leads_assignedto_status` ✅
- `idx_leads_workspace_updated_desc` ✅
- `leads_workspaceId_idx` ✅
- `leads_assignedUserId_idx` ✅

#### **PEOPLE TABLE** - Well indexed:
- `idx_people_workspace_assigned_rank_updated` ✅
- `idx_people_workspace_deleted_rank_updated` ✅
- `idx_people_workspace_company_assigned` ✅
- `idx_people_workspace_assigned` ✅
- `idx_people_workspace_deleted` ✅
- `idx_people_company_id` ✅

#### **COMPANIES TABLE** - Well indexed:
- `idx_companies_workspace_assigned_rank_updated` ✅
- `idx_companies_workspace_deleted_rank_updated` ✅
- `idx_companies_workspace_assigned` ✅
- `idx_companies_workspace_deleted` ✅

#### **PROSPECTS TABLE** - Limited indexes:
- `idx_prospects_person_id` ✅
- `prospects_workspace_user_updated_idx` ✅
- `prospects_workspace_status_idx` ✅

#### **OPPORTUNITIES TABLE** - Multiple indexes exist:
- `idx_opportunities_workspace_stage_amount` ✅
- `idx_opportunities_assignedto_closedate` ✅
- `idx_opportunities_workspace_created_desc` ✅
- `opportunities_workspaceId_idx` ✅
- `opportunities_assignedUserId_idx` ✅

## 🔧 REQUIRED FIXES

### 1. **MISSING CRITICAL INDEXES**
Need to create the missing indexes that were incorrectly claimed:

```sql
-- Missing leads indexes
CREATE INDEX IF NOT EXISTS "idx_leads_workspace_assigned" 
ON "leads" ("workspaceId", "assignedUserId") 
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_leads_workspace_rank" 
ON "leads" ("workspaceId", "rank" ASC, "updatedAt" DESC) 
WHERE "deletedAt" IS NULL;

-- Missing opportunities index
CREATE INDEX IF NOT EXISTS "idx_opportunities_workspace_assigned" 
ON "opportunities" ("workspaceId", "assignedUserId") 
WHERE "deletedAt" IS NULL;
```

### 2. **VERIFY FIELD NAMES**
All existing indexes use correct camelCase field names:
- ✅ `workspaceId` (not `workspace_id`)
- ✅ `assignedUserId` (not `assigned_user_id`)
- ✅ `deletedAt` (not `deleted_at`)
- ✅ `updatedAt` (not `updated_at`)

## 📊 CURRENT STATUS

### ✅ WELL-INDEXED TABLES:
- **People** - Comprehensive indexing ✅
- **Companies** - Comprehensive indexing ✅

### ⚠️ PARTIALLY INDEXED TABLES:
- **Leads** - Has indexes but missing some claimed ones
- **Opportunities** - Has indexes but missing some claimed ones

### ❌ UNDER-INDEXED TABLES:
- **Prospects** - Limited indexing, may need more

## 🎯 RECOMMENDED ACTIONS

1. **Create missing indexes** for leads and opportunities
2. **Verify all existing indexes** are using correct field names
3. **Test query performance** for each section
4. **Add additional indexes** if specific queries are still slow
