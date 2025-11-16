# Refresh Loop Test - Using Puppeteer MCP

## Test Credentials
- Username: vleland
- Password: TOPgtm01!

## Test Steps Using Puppeteer MCP

### Step 1: Navigate to Sign-In
Navigate to: `http://localhost:3000/sign-in`

### Step 2: Login
1. Fill email field with: `vleland`
2. Fill password field with: `TOPgtm01!`
3. Click submit button
4. Wait for navigation to complete

### Step 3: Test Opportunity Record
1. Navigate to opportunities section (click on opportunities in sidebar or go to `/workspace/opportunities`)
2. Wait for opportunities table to load
3. Click on the first opportunity record in the table
4. **Monitor for 5 seconds:**
   - Check URL remains constant
   - Count navigation events (should be < 3)
   - Verify page content is stable
5. **Expected:** No refresh loop, URL stays the same

### Step 4: Test Lead Record
1. Navigate to leads section (click on leads in sidebar or go to `/workspace/leads`)
2. Wait for leads table to load
3. Click on the first lead record in the table
4. **Monitor for 5 seconds:**
   - Check URL remains constant
   - Count navigation events (should be < 3)
   - Verify page content is stable
5. **Expected:** No refresh loop, URL stays the same

### Step 5: Control Tests (Should Work Fine)
1. Test prospect record - should work normally
2. Test people record - should work normally

## Validation Criteria

✅ **PASS Criteria:**
- URL remains constant during 5-second monitoring period
- Navigation events < 3 (allowing for initial load)
- No URL changes detected during monitoring
- Page content remains visible and functional

❌ **FAIL Criteria:**
- URL changes during monitoring
- Navigation events ≥ 3
- Page continuously refreshes
- Content disappears or becomes unstable

## Expected Results

- ✅ Opportunity records: No refresh loop
- ✅ Lead records: No refresh loop  
- ✅ Prospect records: Works normally (control)
- ✅ People records: Works normally (control)

