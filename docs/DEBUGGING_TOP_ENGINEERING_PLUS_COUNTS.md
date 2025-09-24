# Debugging TOP Engineering Plus Count Issues

**Date:** January 17, 2025  
**Issue:** Left panel counts showing incorrect values for TOP Engineering Plus workspace  
**Expected Counts:** Leads: 3,939, Prospects: 587, People: 3,172, Companies: 476

## 🔍 **Debugging Steps**

### **Step 1: Access Debug Page**
1. Navigate to: `http://localhost:3000/debug/top-engineering-plus`
2. This will show a debugging version of the left panel with detailed information

### **Step 2: Check Browser Console**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for debug messages starting with "🔍 [DEBUG LEFT PANEL]"
4. Check for any errors or warnings

### **Step 3: Run Browser Console Script**
1. Copy the contents of `scripts/debug-browser-console.js`
2. Paste into browser console
3. Press Enter to run
4. Review the output for issues

### **Step 4: Verify Workspace ID**
The workspace ID should be: `01K5D01YCQJ9TJ7CT4DZDE79T1`

Check in console:
```javascript
// Check current workspace ID
console.log('Workspace ID:', localStorage.getItem('activeWorkspaceId'));

// Check URL parameters
console.log('URL params:', new URLSearchParams(window.location.search).get('workspaceId'));
```

### **Step 5: Test API Directly**
Test the API endpoint directly:
```bash
curl "http://localhost:3000/api/data/unified?type=dashboard&action=get&workspaceId=01K5D01YCQJ9TJ7CT4DZDE79T1&userId=test-user"
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Wrong Workspace ID**
**Symptoms:** Counts show 0 or incorrect values  
**Cause:** User is not in the correct workspace  
**Solution:** 
1. Verify user is in TOP Engineering Plus workspace
2. Check `authUser.activeWorkspaceId` in console
3. Ensure workspace ID is `01K5D01YCQJ9TJ7CT4DZDE79T1`

### **Issue 2: Stale Cache**
**Symptoms:** Counts don't update after data changes  
**Cause:** Browser or server cache is stale  
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh page (Ctrl+F5)
3. Check if API response has `cacheHit: true`

### **Issue 3: Acquisition Data Not Loading**
**Symptoms:** Left panel shows loading state indefinitely  
**Cause:** `acquisitionData` is not loading properly  
**Solution:**
1. Check if `AcquisitionOSProvider` is properly configured
2. Verify workspace context is set correctly
3. Check for JavaScript errors in console

### **Issue 4: API Returning Wrong Data**
**Symptoms:** API call succeeds but returns incorrect counts  
**Cause:** Database query or workspace isolation issue  
**Solution:**
1. Check database connection
2. Verify workspace isolation in API
3. Check if data exists in database

### **Issue 5: Data Source Priority**
**Symptoms:** Counts change between page loads  
**Cause:** Multiple data sources with different priorities  
**Solution:**
1. Check if `acquisitionData` is loaded before API fallback
2. Verify data source priority in left panel component
3. Ensure consistent data source usage

## 🔧 **Quick Fixes**

### **Fix 1: Force Cache Refresh**
Add timestamp to API calls:
```javascript
const timestamp = Date.now();
fetch(`/api/data/unified?type=dashboard&t=${timestamp}`)
```

### **Fix 2: Clear All Caches**
```javascript
// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Reload page
window.location.reload();
```

### **Fix 3: Verify Workspace Context**
```javascript
// Check if user is in correct workspace
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User workspaces:', user.workspaces);
console.log('Active workspace:', user.activeWorkspaceId);
```

## 📊 **Expected vs Actual Data**

### **Database Reality (from reports):**
- **Leads:** 3,939 (48.2%)
- **People:** 3,172 (38.8%) 
- **Companies:** 476 (5.8%)
- **Prospects:** 587 (7.2%)
- **Opportunities:** 0 (0%)

### **What to Check:**
1. Are these counts showing in the left panel?
2. If not, what counts are showing instead?
3. Are the counts consistent across page refreshes?
4. Do the counts match the API response?

## 🎯 **Debugging Checklist**

- [ ] Workspace ID is `01K5D01YCQJ9TJ7CT4DZDE79T1`
- [ ] User is authenticated and in correct workspace
- [ ] API call returns correct data
- [ ] No JavaScript errors in console
- [ ] Cache is not stale
- [ ] Acquisition data is loading
- [ ] Data source priority is correct
- [ ] Database contains expected data
- [ ] Workspace isolation is working

## 📞 **Next Steps**

If the issue persists after following these steps:

1. **Check Database:** Verify data exists in database for TOP Engineering Plus
2. **Check API Logs:** Look for errors in server logs
3. **Check Network:** Verify API calls are successful
4. **Check Components:** Ensure left panel component is using correct data source
5. **Check Context:** Verify workspace context is properly set

## 🔗 **Related Files**

- `src/products/pipeline/components/PipelineLeftPanelStandalone.tsx` - Main left panel
- `src/products/pipeline/components/PipelineLeftPanelDebug.tsx` - Debug version
- `src/app/debug/top-engineering-plus/page.tsx` - Debug page
- `scripts/debug-browser-console.js` - Browser console script
- `src/platform/ui/components/DebugCounts.tsx` - Debug component

