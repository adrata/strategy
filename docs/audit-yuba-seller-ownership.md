# YUBA Water Agency - Seller Ownership Analysis

## Summary

Victoria Leland is correctly assigned as the main seller for YUBA Water Agency and most associated people, as verified by database audit on Nov 13, 2025.

## Victoria Leland Details

- **Name**: Victoria Leland
- **Email**: vleland@topengineersplus.com
- **User ID**: `01K75ZD7NKC33EDSDADF5X0WD7`
- **Workspace**: TOP Engineering Plus (top-engineering-plus)
- **Workspace ID**: `01K75ZD7DWHG1XF16HAF2YVKCK`

## Company Ownership

### YUBA Water Agency
- **Company ID**: `01K7DW5DX0WBRYZW0K5VHXHAK1`
- **Name**: Yuba Water Agency
- **Main Seller**: Victoria Leland ✅
- **Main Seller ID**: `01K75ZD7NKC33EDSDADF5X0WD7`
- **Status**: ACTIVE
- **Priority**: MEDIUM
- **Created**: Sep 17, 2025
- **Last Updated**: Oct 29, 2025

**Result**: ✅ Victoria is correctly assigned as main seller

## People Ownership at YUBA Water Agency

### Total People: 19

#### Victoria's People: 16 (84.2%)
1. Colby Givens - Ownership Member
2. Warren Frederickson - Communications Technician Supervisor (PROSPECT) ✅
3. Andrew Steward - SVP Head Of Marketing
4. Matt Murray - Senior Data Engineer
5. Justin Hoffman - Director Global Operations
6. Tyler Byrd - (No title)
7. Joel Ferrera - Software Developer
8. Terry Peterson - Administrative Technician
9. Ethan Koenigs - Hydro License Manager
10. Jason Osterholt - Information Technology Supervisor
11. Andrew Ramos - General Counsel
12. Jack Winship - Accounting Manager
13. Jamie Coleman - Power System Administrative Technician
14. Janice Taylor - Procurement Specialist
15. Kaitlyn Chow - Water Operations Project Manager
16. Karl Parker - Operations Manager

**All Last Updated**: Nov 12, 2025 between 22:03-22:09 UTC

#### Unassigned People: 3 (15.8%)
1. Aaron Esselman - Senior Hydro Engineer Mechanical
2. David DeVore - Information Systems And Security Manager
3. Keane Sommers - Director Of Power Systems

**All Last Updated**: Nov 12, 2025 at 17:50 UTC (earlier same day)

### Key Findings

1. **Warren Frederickson** (the reported prospect) HAS Victoria as main seller ✅
2. **3 recent additions** with NULL mainSeller were added earlier on Nov 12
3. **Bulk update occurred** on Nov 12 at 22:03-22:09 UTC for Victoria's people
4. **API filtering allows** both Victoria's people AND NULL mainSeller people

## Workspace-Wide Seller Distribution

### People
- **Total**: 2,469 people
- **Victoria's**: 1,917 (77.6%) ✅
- **Unassigned**: 552 (22.4%) ⚠️
- **Other Sellers**: 0 (0.0%)

### Companies
- **Total**: 342 companies
- **Victoria's**: 342 (100.0%) ✅
- **Unassigned**: 0 (0.0%)
- **Other Sellers**: 0 (0.0%)

## API Filter Compatibility

The People API uses this filter:

```sql
WHERE workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'
  AND deletedAt IS NULL
  AND (
    mainSellerId = '01K75ZD7NKC33EDSDADF5X0WD7'  -- Victoria's people
    OR mainSellerId IS NULL                       -- Unassigned people
  )
```

### Filter Simulation Results

**For YUBA Water Agency** (companyId = `01K7DW5DX0WBRYZW0K5VHXHAK1`):
- 16 people with Victoria as mainSeller → ✅ WILL BE RETURNED
- 3 people with NULL mainSeller → ✅ WILL BE RETURNED
- **Total: 19/19 people (100%) should be visible**

## Timeline Analysis

### Sep 17, 2025
- YUBA Water Agency company created
- Warren Frederickson person record created
- Initial data import/setup

### Oct 29, 2025 (12:52 PM)
- YUBA Water Agency record updated
- Likely maintenance or data cleanup

### Nov 12, 2025 (5:50 PM UTC / 10:50 AM PST)
- 3 new people added with NULL mainSeller:
  - Aaron Esselman
  - David DeVore  
  - Keane Sommers
- These were likely added via API or bulk import without mainSeller assignment

### Nov 12, 2025 (10:03-10:09 PM UTC / 3:03-3:09 PM PST)
- Mass update of 16 people records
- All 16 people timestamps updated simultaneously
- Likely Victoria assignment script ran
- Warren Frederickson updated to Victoria at this time

### Nov 13, 2025 (Current)
- User reports people not initially displaying, but later populated
- Database audit shows all people correctly assigned

## Victoria Assignment Script

### Script: `scripts/set-victoria-main-seller-top.js`

This script performs bulk updates:

```javascript
// Update people records
await prisma.people.updateMany({
  where: { 
    workspaceId: workspace.id,
    OR: [
      { mainSellerId: null },
      { mainSellerId: { not: victoria.id } }
    ]
  },
  data: { 
    mainSellerId: victoria.id,
    updatedAt: new Date()
  }
});

// Update companies records
await prisma.companies.updateMany({
  where: { 
    workspaceId: workspace.id,
    OR: [
      { mainSellerId: null },
      { mainSellerId: { not: victoria.id } }
    ]
  },
  data: { 
    mainSellerId: victoria.id,
    updatedAt: new Date()
  }
});
```

### Evidence of Recent Execution

The Nov 12, 2025 (22:03-22:09 UTC) timestamps strongly suggest this script ran:
- **16 people updated in 6-minute window**
- **All updated to have Victoria as mainSeller**
- **Sequential timestamp pattern** (22:03:46 → 22:03:47 → ... → 22:09:54)
- **Warren Frederickson included** (updated 22:09:54)

### Implications

If the script ran AFTER the user's initial page load:
1. User visits page → companyId lookup works
2. API call filters people → some have different/null mainSeller
3. API returns empty or partial results
4. User sees "no people"
5. Script runs → assigns Victoria to all people
6. User refreshes → API now returns all 19 people
7. User sees "later populated"

## Conclusion

### Seller Ownership Status: ✅ CORRECT

- Victoria IS the main seller for YUBA Water Agency company
- Victoria IS the main seller for 16/19 people (84.2%)
- 3 people with NULL mainSeller are still visible via API filter
- All 19 people SHOULD be visible to Victoria

### Script Timing: ⚠️ POTENTIAL ISSUE

Evidence suggests Victoria assignment script may have run during user's session on Nov 12:
- Bulk update at 22:03-22:09 UTC
- 3 new people added at 17:50 UTC (same day, earlier)
- Script may have been triggered to assign newly imported people

### Not a Seller Ownership Problem

The seller ownership configuration is CORRECT. The issue is NOT:
- ❌ Wrong seller assigned
- ❌ Victoria doesn't have access
- ❌ API filter excluding Victoria's people

### Likely Issue

Based on evidence, the problem is more likely:
- ⚠️ **Wrong company ID in URL** (see code flow analysis)
- ⚠️ **Timing/race condition** during data loading
- ⚠️ **Cache serving stale data** before Victoria assignment
- ⚠️ **Script execution during active session**

