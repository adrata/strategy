# Record Update & Status Advancement Test Plan

## ✅ Fixes Implemented

### 1. Database Schema Updates
- Added missing fields to `people` table: `relationshipWarmth`, `decisionPowerScore`, `yearsExperience`, `educationLevel`, `skills`, `valueDriver`, `bestContactTime`
- Used `npx prisma db push` to safely update database

### 2. API Field Whitelisting
- **People API** (`/api/v1/people/[id]`): Added comprehensive field whitelist with 70+ allowed fields
- **Companies API** (`/api/v1/companies/[id]`): Added field whitelist with 30+ allowed fields
- Invalid fields are now filtered out before sending to Prisma

### 3. Status Advancement Event Fixes
- **Fixed Event Name**: Changed from `refresh-counts` to `pipeline-data-refresh`
- **Added Section Details**: Events now include `section`, `type`, `fromSection`, `recordId`
- **Added Navigation Delay**: 300ms delay before navigation to allow left panel refresh
- **Fixed Inline Status Updates**: Status field changes now trigger proper section refresh

## 🧪 Test Cases

### Test 1: Basic Record Updates
**Goal**: Verify all record types can be updated without errors

1. **People Records (Leads/Prospects/Opportunities)**
   - [ ] Edit name, email, phone via inline edit
   - [ ] Edit job title, company via inline edit
   - [ ] Edit status via dropdown
   - [ ] Edit engagement level, decision power via modal
   - [ ] Edit intelligence fields (communication style, etc.)
   - [ ] Edit career fields (years experience, education, skills)
   - [ ] Edit notes and tags

2. **Company Records**
   - [ ] Edit company name, website, industry
   - [ ] Edit address, phone, email
   - [ ] Edit status, priority
   - [ ] Edit notes and tags

### Test 2: Status Advancement Flows
**Goal**: Verify records move correctly between sections with left panel refresh

1. **Lead → Prospect Advancement**
   - [ ] Start with a LEAD record in leads section
   - [ ] Click "Advance to Prospect" button
   - [ ] Verify API call succeeds (status changes to PROSPECT)
   - [ ] Verify `pipeline-data-refresh` event is dispatched
   - [ ] Verify left panel refreshes (record disappears from leads)
   - [ ] Verify navigation to prospects section
   - [ ] Verify record appears in prospects list
   - [ ] Verify record is selected in prospects section

2. **Prospect → Opportunity Advancement**
   - [ ] Start with a PROSPECT record in prospects section
   - [ ] Click "Advance to Opportunity" button
   - [ ] Verify API call succeeds (status changes to OPPORTUNITY)
   - [ ] Verify `pipeline-data-refresh` event is dispatched
   - [ ] Verify left panel refreshes (record disappears from prospects)
   - [ ] Verify navigation to opportunities section
   - [ ] Verify record appears in opportunities list
   - [ ] Verify record is selected in opportunities section

### Test 3: Inline Status Changes
**Goal**: Verify status changes via inline edit work correctly

1. **Status Dropdown Changes**
   - [ ] Change LEAD → PROSPECT via inline dropdown
   - [ ] Verify `pipeline-data-refresh` event dispatched for prospects section
   - [ ] Change PROSPECT → OPPORTUNITY via inline dropdown
   - [ ] Verify `pipeline-data-refresh` event dispatched for opportunities section
   - [ ] Change OPPORTUNITY → CLIENT via inline dropdown
   - [ ] Verify `pipeline-data-refresh` event dispatched for clients section

### Test 4: Error Handling
**Goal**: Verify invalid fields are handled gracefully

1. **Invalid Field Filtering**
   - [ ] Try to send non-existent fields to people API
   - [ ] Verify fields are filtered out (no Prisma errors)
   - [ ] Try to send person fields to company API
   - [ ] Verify fields are filtered out (no Prisma errors)

2. **Network Error Handling**
   - [ ] Test with network disconnected
   - [ ] Verify proper error messages shown
   - [ ] Verify no infinite retry loops

## 🔍 Debugging Checklist

### Console Logs to Monitor
- `🔄 [UNIVERSAL] Saving field = value` - Field save attempts
- `✅ [UNIVERSAL] Successfully advanced to prospect/opportunity` - Status advancement
- `🔗 [ADVANCE] Navigating to section` - Navigation events
- `🔄 Refreshing section data after operation` - Left panel refresh
- `❌ API call failed` - API errors (should not occur)

### Network Tab to Monitor
- PATCH requests to `/api/v1/people/[id]` should return 200 OK
- PATCH requests to `/api/v1/companies/[id]` should return 200 OK
- No 500 errors from Prisma field validation
- Response times should be fast (< 1 second)

### Left Panel Behavior
- Records should disappear from old section immediately after status change
- Records should appear in new section after navigation
- Counts should update correctly
- No duplicate records should appear

## 🚨 Known Issues to Watch For

1. **Race Conditions**: If navigation happens too quickly, left panel might not refresh
2. **Event Timing**: If events are dispatched before listeners are ready
3. **Cache Issues**: If old data is cached and not refreshed
4. **URL Mismatch**: If slug generation creates invalid URLs

## 📊 Success Criteria

- ✅ All record updates complete in < 2 seconds
- ✅ No console errors during updates
- ✅ Status advancement moves records to correct sections
- ✅ Left panel refreshes and shows updated data
- ✅ Navigation works correctly after status changes
- ✅ No data loss or corruption
- ✅ Invalid fields are silently ignored
