# Refresh Loop Test - Using Puppeteer MCP

This test validates that opportunity and lead records do not cause infinite refresh loops.

## Test Credentials
- Username: vleland
- Password: TOPgtm01!

## Test Steps

### 1. Test Opportunity Record

1. Navigate to sign-in page
2. Enter credentials (vleland / TOPgtm01!)
3. Wait for login to complete
4. Navigate to opportunities section
5. Click on first opportunity record
6. Monitor page for 5 seconds
7. Verify:
   - URL does not change
   - No excessive navigation events
   - Page remains stable

### 2. Test Lead Record

1. Navigate to leads section
2. Click on first lead record
3. Monitor page for 5 seconds
4. Verify:
   - URL does not change
   - No excessive navigation events
   - Page remains stable

### 3. Control Tests (Should Work Fine)

1. Test prospect record - should work normally
2. Test people record - should work normally

## Expected Results

- ✅ Opportunity records: No refresh loop (URL stable, < 3 navigation events)
- ✅ Lead records: No refresh loop (URL stable, < 3 navigation events)
- ✅ Prospect records: Works normally (control test)
- ✅ People records: Works normally (control test)

## Validation Criteria

- URL remains constant during 5-second monitoring period
- Navigation events < 3 (allowing for initial load)
- No URL changes detected during monitoring
- Page content remains visible and functional

