# Comprehensive AI Right Panel Audit Plan

## Objective
Ensure AI Right Panel works intelligently across ALL record types and list views with full context awareness.

## Test Matrix

### Record Types to Test:
1. ✅ **Person/Speedrun** - Camille Murdock (TESTED - WORKING)
2. ✅ **List View (Leads)** - (TESTED - WORKING)
3. ⏳ **Company Record** - Need to test
4. ⏳ **Opportunity Record** - Need to test
5. ⏳ **Prospect Record** - Need to test
6. ⏳ **List View (Companies)** - Current page
7. ⏳ **List View (Opportunities)** - Current page

### Test Scenarios for Each Type:

#### Person/Lead/Prospect/Speedrun Records
- [x] Extract record ID from URL
- [x] Fetch from `people` table
- [x] Normalize fields (name, company, title, etc.)
- [x] Include intelligence data
- [x] AI uses person's actual name
- [x] AI uses Victoria's name in signature
- [x] Response is personalized and specific

#### Company Records
- [ ] Extract company ID from URL
- [ ] Fetch from `companies` table
- [ ] Normalize fields (name, industry, size, etc.)
- [ ] Include company intelligence
- [ ] AI understands company context
- [ ] Response focuses on company-level strategies

#### Opportunity Records
- [ ] Extract opportunity ID from URL
- [ ] Fetch from appropriate table
- [ ] Normalize opportunity fields
- [ ] AI understands deal stage/amount
- [ ] Response focuses on deal acceleration

#### List Views
- [x] Detect list view from URL pattern
- [x] Send `isListView` and `listViewSection` to API
- [x] AI provides strategic overview
- [ ] Test all list types (leads, prospects, opportunities, companies)

## Implementation Status

### ✅ Completed:
1. Smart database fetching for `people` table
2. Record ID extraction from URL
3. List view detection
4. API receives `recordIdFromUrl`, `isListView`, `listViewSection`
5. Companies table fetching implemented
6. Record type detection based on status

### ⏳ In Progress:
- Testing company records
- Testing opportunity records
- Testing all list views

### 🔍 To Verify:
- Edge cases (deleted records, missing data)
- Performance (database query speed)
- Error handling (database connection failures)
- Multi-workspace support

## Success Criteria

For each record type and scenario:
- ✅ AI has full context (no "I don't have enough context")
- ✅ AI uses real data from database
- ✅ AI personalizes response
- ✅ AI uses Victoria's name in signature
- ✅ Response is actionable and specific
- ✅ Response time < 15 seconds
- ✅ No errors in console/logs

## Next Steps
1. Test company record detail page
2. Test opportunity record detail page
3. Test all list views
4. Create comprehensive test report
5. Document any edge cases found

