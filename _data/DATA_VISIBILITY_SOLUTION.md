# TOP Engineering Plus Data Visibility Solution

**Date:** January 17, 2025  
**Objective:** Make TOP Engineering Plus data visible in Ross's account without assigning ownership  
**Status:** ✅ **SOLUTION IDENTIFIED**

## Problem Analysis

### Current Data Filtering Logic

The Adrata platform uses `assignedUserId` to filter data visibility:

```typescript
// From src/app/api/data/companies/route.ts
const accounts = await prisma.companies.findMany({
  where: {
    workspaceId: workspaceId,
    assignedUserId: userId, // SECURITY: Only show accounts assigned to this user
    deletedAt: null
  }
});
```

### Current TOP Engineering Plus Data State

- **People:** 1,342 records with `assignedUserId: null` (no ownership)
- **Companies:** 451 records with `assignedUserId: null` (no ownership)
- **Workspace:** `01K5D01YCQJ9TJ7CT4DZDE79T1` (TOP Engineering Plus)

## Solution Options

### Option 1: Modify API Filtering Logic (Recommended)

**Approach:** Update the data API endpoints to show workspace data without user assignment filtering for specific workspaces.

**Implementation:**
1. **Modify Companies API** (`src/app/api/data/companies/route.ts`)
2. **Modify People API** (`src/app/api/data/unified/route.ts`)
3. **Add workspace-level visibility logic**

**Code Changes:**

```typescript
// In src/app/api/data/companies/route.ts
const accounts = await prisma.companies.findMany({
  where: {
    workspaceId: workspaceId,
    // Modified: Show all companies in workspace, not just assigned ones
    OR: [
      { assignedUserId: userId }, // User's assigned companies
      { assignedUserId: null }    // Unassigned companies in workspace
    ],
    deletedAt: null
  }
});
```

```typescript
// In src/app/api/data/unified/route.ts (people section)
const people = await prisma.people.findMany({
  where: {
    workspaceId,
    deletedAt: null,
    // Modified: Show all people in workspace, not just assigned ones
    OR: [
      { assignedUserId: userId }, // User's assigned people
      { assignedUserId: null }    // Unassigned people in workspace
    ]
  }
});
```

### Option 2: Create Workspace-Level Permissions

**Approach:** Add workspace-level permissions that allow users to view all data in their workspace.

**Implementation:**
1. **Add workspace permissions table**
2. **Update user permissions logic**
3. **Modify data filtering based on permissions**

### Option 3: Bulk Assignment (Not Recommended)

**Approach:** Assign all TOP Engineering Plus data to Ross's user ID.

**Why Not Recommended:**
- Creates ownership conflicts
- Makes data appear as "Ross's data" rather than "TOP Engineering Plus data"
- Could cause confusion in reporting and analytics
- Violates the principle of not assigning ownership

## Recommended Implementation

### Step 1: Update Companies API

```typescript
// File: src/app/api/data/companies/route.ts
// Line: ~29-39

// BEFORE (restrictive):
const accounts = await prisma.companies.findMany({
  where: {
    workspaceId: workspaceId,
    assignedUserId: userId, // Only assigned companies
    deletedAt: null
  }
});

// AFTER (workspace-level visibility):
const accounts = await prisma.companies.findMany({
  where: {
    workspaceId: workspaceId,
    OR: [
      { assignedUserId: userId }, // User's assigned companies
      { assignedUserId: null }    // Unassigned companies in workspace
    ],
    deletedAt: null
  }
});
```

### Step 2: Update People API

```typescript
// File: src/app/api/data/unified/route.ts
// Line: ~844-862

// BEFORE (restrictive):
const people = await prisma.people.findMany({
  where: {
    workspaceId,
    deletedAt: null
    // Removed assignedUserId filter to show all people in workspace
  }
});

// AFTER (explicit workspace-level visibility):
const people = await prisma.people.findMany({
  where: {
    workspaceId,
    deletedAt: null,
    OR: [
      { assignedUserId: userId }, // User's assigned people
      { assignedUserId: null }    // Unassigned people in workspace
    ]
  }
});
```

### Step 3: Update Role-Based Personalization

```typescript
// File: src/platform/services/role-based-personalization.ts
// Line: ~190-220

// Add workspace-level data access
case 'workspace':
  // Show all data in workspace regardless of assignment
  filteredQuery['where'] = {
    ...filteredQuery.where,
    workspaceId: workspaceId
    // No assignedUserId filter
  };
  break;
```

## Implementation Steps

### 1. Update Companies API
```bash
# Edit src/app/api/data/companies/route.ts
# Modify the companies query to include unassigned companies
```

### 2. Update People API
```bash
# Edit src/app/api/data/unified/route.ts
# Modify the people query to include unassigned people
```

### 3. Test Data Visibility
```bash
# Test that Ross can see TOP Engineering Plus data
# Verify no ownership assignment occurs
```

### 4. Update UI Labels
```typescript
// Add visual indicators for unassigned data
// Show "Workspace Data" vs "My Data" labels
```

## Benefits of This Approach

### ✅ **Advantages**
- **No Ownership Assignment:** Data remains unassigned to any specific user
- **Workspace-Level Visibility:** All workspace members can see the data
- **Maintains Data Integrity:** No changes to actual data records
- **Flexible Permissions:** Can be extended for different permission levels
- **Clear Separation:** Distinguishes between "my data" and "workspace data"

### 🎯 **Business Value**
- **Ross can see TOP Engineering Plus data** without ownership conflicts
- **Data remains properly attributed** to TOP Engineering Plus workspace
- **Maintains audit trail** and data lineage
- **Enables collaboration** on workspace-level data
- **Preserves data ownership model** for future assignments

## Alternative: Workspace-Level Permissions

If more granular control is needed, implement workspace-level permissions:

```typescript
// Add to workspace permissions
interface WorkspacePermissions {
  canViewAllData: boolean;
  canEditAllData: boolean;
  canAssignData: boolean;
  canDeleteData: boolean;
}

// Check permissions before data access
const hasWorkspaceAccess = await checkWorkspacePermissions(userId, workspaceId, 'viewAllData');
if (hasWorkspaceAccess) {
  // Show all workspace data
} else {
  // Show only assigned data
}
```

## Conclusion

The recommended solution is to modify the API filtering logic to show workspace-level data without requiring user assignment. This approach:

1. **Makes TOP Engineering Plus data visible** to Ross without assignment
2. **Maintains data integrity** and proper workspace attribution
3. **Preserves the ownership model** for future use
4. **Enables workspace-level collaboration** on shared data
5. **Provides clear data visibility** without ownership conflicts

This solution ensures that Ross can see and work with the TOP Engineering Plus data while maintaining the proper data structure and workspace organization.

---

**Solution Status:** ✅ **READY FOR IMPLEMENTATION**  
**Implementation Time:** ~30 minutes  
**Risk Level:** Low (no data changes, only API filtering)  
**Business Impact:** High (enables data visibility without ownership conflicts)
