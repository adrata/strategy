# Refresh Loop Test - Using Puppeteer MCP

## Test Credentials
- Username: vleland  
- Password: TOPgtm01!

## Test Procedure Using Puppeteer MCP

### Step 1: Navigate to Sign-In
**Action:** Navigate to `http://localhost:3000/sign-in`

### Step 2: Login
1. Fill email field: `vleland`
2. Fill password field: `TOPgtm01!`
3. Click submit/Start button
4. Wait for navigation to complete (should redirect to workspace)

### Step 3: Test Opportunity Record (Main Test)
1. **Navigate to opportunities:**
   - Click on "Opportunities" in sidebar, OR
   - Navigate directly to: `http://localhost:3000/{workspace}/opportunities`
   - Wait for table to load

2. **Click first opportunity record:**
   - Find first row in opportunities table
   - Click on it to open detail page
   - Note the URL (should be like `/opportunities/{id}`)

3. **Monitor for refresh loop (5 seconds):**
   - Start timer
   - Check URL every 500ms for 5 seconds
   - Count navigation events
   - Verify page content remains stable

4. **Expected Results:**
   - ✅ URL remains constant
   - ✅ Navigation events < 3
   - ✅ No page refreshes
   - ✅ Content stays visible

### Step 4: Test Lead Record (Main Test)
1. **Navigate to leads:**
   - Click on "Leads" in sidebar, OR
   - Navigate directly to: `http://localhost:3000/{workspace}/leads`
   - Wait for table to load

2. **Click first lead record:**
   - Find first row in leads table
   - Click on it to open detail page
   - Note the URL (should be like `/leads/{id}`)

3. **Monitor for refresh loop (5 seconds):**
   - Start timer
   - Check URL every 500ms for 5 seconds
   - Count navigation events
   - Verify page content remains stable

4. **Expected Results:**
   - ✅ URL remains constant
   - ✅ Navigation events < 3
   - ✅ No page refreshes
   - ✅ Content stays visible

### Step 5: Control Tests (Should Work Fine)
1. **Test Prospect Record:**
   - Navigate to prospects
   - Click first prospect
   - Monitor for 3 seconds
   - ✅ Should work normally (no refresh loop)

2. **Test People Record:**
   - Navigate to people
   - Click first person
   - Monitor for 3 seconds
   - ✅ Should work normally (no refresh loop)

## Validation Criteria

### ✅ PASS Criteria:
- URL remains constant during monitoring period
- Navigation events < 3 (allowing for initial load)
- No URL changes detected during monitoring
- Page content remains visible and functional
- No console errors related to infinite loops

### ❌ FAIL Criteria:
- URL changes during monitoring
- Navigation events ≥ 3
- Page continuously refreshes
- Content disappears or becomes unstable
- Console shows repeated loading messages

## Console Monitoring

Watch for these console messages:
- ❌ `🔄 [RECORD LOADING] Loading record: {id} (always fresh)` - Should only appear once
- ❌ Multiple `🔄 [RECORD LOADING]` messages in quick succession = refresh loop
- ✅ `✅ [RECORD LOADING] Record already loaded: {id}, skipping reload` = Good (prevents loop)

## Network Monitoring

Check Network tab for:
- ❌ Repeated API calls to `/api/v1/opportunities/{id}` or `/api/v1/people/{id}`
- ✅ Single API call on initial load
- ✅ No repeated requests every 1-2 seconds

## Summary

After running all tests:
- ✅ Opportunity records: No refresh loop
- ✅ Lead records: No refresh loop
- ✅ Prospect records: Works normally (control)
- ✅ People records: Works normally (control)

