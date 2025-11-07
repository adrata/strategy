# Bugfix: Speedrun Company Action Logging

## Issue

When users tried to add an action to a **company** in Speedrun, they received an error:

```
Failed to save action log: Person with ID 01K9DGA4YQP4BSE9AC4WD44RV3 not found or has been deleted
```

## Root Cause

The Speedrun action logging code (`SpeedrunContent.tsx`) was treating ALL records as people and always sending `personId`, even when the record was actually a company.

**Key Insight:**
- **Company IDs**: ULID format (26-char strings like `01K9DGA4YQP4BSE9AC4WD44RV3`)
- **Person IDs**: Numeric integers (like `12345`)

The API correctly validated the `personId` and found it didn't exist because it was actually a company ID.

## Solution

Added logic to detect record type based on ID format and send the correct field:

```typescript
// Determine if this is a company or person based on ID format
// Companies use ULID (string), People use numeric IDs
const isCompany = typeof selectedPerson.id === 'string' && selectedPerson.id.length > 20;
const recordIdField = isCompany ? 'companyId' : 'personId';

console.log(`🔍 [SPEEDRUN] Saving action for ${isCompany ? 'company' : 'person'}: ${selectedPerson.name} (ID: ${selectedPerson.id})`);

// Use dynamic field name
body: JSON.stringify({
  [recordIdField]: selectedPerson.id.toString(),
  // ... rest of action data
})
```

## Changes Made

**File**: `src/products/speedrun/SpeedrunContent.tsx`

**Lines**: 647-661

- Added detection logic to determine if record is company vs person
- Dynamically use `companyId` or `personId` based on record type  
- Added logging to track which type is being saved
- Ensured ID is converted to string for API compatibility

## Testing

### Test Case 1: Company Action
1. Go to Speedrun
2. Select a company (ID will be ULID format)
3. Click "Complete" and add an action
4. ✅ Should save successfully with `companyId`

### Test Case 2: Person Action
1. Go to Speedrun
2. Select a person (ID will be numeric)
3. Click "Complete" and add an action
4. ✅ Should save successfully with `personId`

## Impact

- ✅ Companies can now have actions logged in Speedrun
- ✅ People continue to work as before
- ✅ Proper validation and error messages
- ✅ Better logging for debugging

## Related Code

The API validation that caught this error:

**File**: `src/app/api/v1/actions/route.ts`

```typescript
if (body.personId) {
  const personExists = await prisma.people.findUnique({
    where: { id: body.personId, deletedAt: null }
  });
  if (!personExists) {
    return NextResponse.json(
      { success: false, error: `Person with ID ${body.personId} not found or has been deleted` },
      { status: 400 }
    );
  }
}
```

This validation was working correctly - it was the client-side code that was sending the wrong field.

## Prevention

To prevent similar issues:

1. ✅ Check ID format when dealing with mixed record types
2. ✅ Add logging to show record type being processed
3. ✅ Server-side validation catches mismatched IDs
4. Consider adding `recordType` field to SpeedrunPerson interface for clarity

## Date

November 7, 2025

## Status

✅ **Fixed and Deployed**

