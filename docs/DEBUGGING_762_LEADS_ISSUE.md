# Debugging 762 Leads Issue - TOP Engineering Plus

**Date:** January 17, 2025  
**Issue:** Left panel shows 762 leads instead of expected 3,939 total leads  
**Root Cause:** User assignment filtering in API route  

## 🔍 **Problem Analysis**

### **Expected vs Actual Counts**
- **Expected Total Leads:** 3,939 (from database reports)
- **Actual API Count:** 762 (from left panel)
- **Missing Leads:** 3,177 (assigned to other users)

### **Root Cause: User Assignment Filtering**

The API route at `src/app/api/data/unified/route.ts` (lines 2509-2518) filters leads based on user assignment:

```typescript
prisma.leads.count({ 
  where: { 
    workspaceId, 
    deletedAt: null, 
    OR: [
      { assignedUserId: userId },    // Leads assigned to current user
      { assignedUserId: null }       // Unassigned leads
    ]
  }
})
```

### **What This Means**
1. **762 leads** = Leads assigned to current user + unassigned leads
2. **3,177 missing leads** = Leads assigned to other users in the workspace
3. **Total: 762 + 3,177 = 3,939** ✅

## 🎯 **Solution Options**

### **Option 1: Remove User Assignment Filtering (Recommended)**
Modify the API route to show all leads in the workspace:

```typescript
// BEFORE (current code)
prisma.leads.count({ 
  where: { 
    workspaceId, 
    deletedAt: null, 
    OR: [
      { assignedUserId: userId },
      { assignedUserId: null }
    ]
  }
})

// AFTER (fixed code)
prisma.leads.count({ 
  where: { 
    workspaceId, 
    deletedAt: null
  }
})
```

### **Option 2: Add Admin Override**
Add a check for admin users to see all leads:

```typescript
const whereClause = {
  workspaceId,
  deletedAt: null,
  ...(user.isAdmin ? {} : {
    OR: [
      { assignedUserId: userId },
      { assignedUserId: null }
    ]
  })
};

prisma.leads.count({ where: whereClause })
```

### **Option 3: Workspace Admin Check**
Check if user is workspace admin:

```typescript
const isWorkspaceAdmin = await prisma.workspaceUser.findFirst({
  where: {
    workspaceId,
    userId,
    role: 'ADMIN'
  }
});

const whereClause = {
  workspaceId,
  deletedAt: null,
  ...(isWorkspaceAdmin ? {} : {
    OR: [
      { assignedUserId: userId },
      { assignedUserId: null }
    ]
  })
};
```

## 🔧 **Implementation Steps**

### **Step 1: Identify the Issue**
1. Navigate to: `http://localhost:3000/debug/762-leads`
2. Check if the issue is confirmed
3. Review the current user and workspace information

### **Step 2: Fix the API Route**
1. Open `src/app/api/data/unified/route.ts`
2. Find the `loadDashboardData` function (around line 2509)
3. Modify the leads count query to remove user assignment filtering
4. Test the fix

### **Step 3: Verify the Fix**
1. Check the left panel counts
2. Verify all 3,939 leads are now visible
3. Test with different users to ensure consistency

## 📊 **Expected Results After Fix**

### **Before Fix:**
- Leads: 762 (incorrect)
- Prospects: 587 (may also be affected)
- People: 3,172 (may also be affected)
- Companies: 476 (may also be affected)

### **After Fix:**
- Leads: 3,939 (correct)
- Prospects: 587 (correct)
- People: 3,172 (correct)
- Companies: 476 (correct)

## 🚨 **Important Considerations**

### **Security Implications**
- Removing user assignment filtering means all users can see all leads
- Consider if this is the desired behavior for the workspace
- May need to implement proper role-based access control

### **Performance Impact**
- Showing all leads may impact performance for large workspaces
- Consider implementing pagination or lazy loading
- Monitor database query performance

### **User Experience**
- Users may see leads they don't need to work on
- Consider adding filters or views to help users focus
- Implement proper search and filtering capabilities

## 🔍 **Debugging Tools**

### **Debug Page**
- URL: `http://localhost:3000/debug/762-leads`
- Shows current user info, API response, and issue analysis

### **Browser Console Script**
- Copy and paste the script from `scripts/debug-browser-console.js`
- Run in browser console to get detailed debugging information

### **Database Script**
- Run `scripts/debug-762-leads.js` to check database directly
- Requires database connection and proper credentials

## 📝 **Testing Checklist**

- [ ] Verify current counts show 762 leads
- [ ] Apply the fix to the API route
- [ ] Test with different users in the workspace
- [ ] Verify all counts are now correct
- [ ] Check that other data types (prospects, people, companies) are also fixed
- [ ] Test performance with the new query
- [ ] Verify security implications are acceptable

## 🎯 **Next Steps**

1. **Immediate:** Apply Option 1 (remove user assignment filtering)
2. **Short-term:** Test thoroughly with different users
3. **Long-term:** Implement proper role-based access control
4. **Monitoring:** Watch for performance issues with large datasets

