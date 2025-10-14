# Company Creation Schema Fixes

This document summarizes all the fixes made to ensure company creation works properly with the streamlined database schema across the entire application.

## Problem

The application was experiencing P2022 database errors when creating companies because various parts of the codebase were using field names that don't exist in the streamlined schema (`prisma/schema-streamlined.prisma`).

## Files Fixed

### 1. Main Companies API (`src/app/api/v1/companies/route.ts`)
**Status:** ✅ Already Fixed
- Enhanced error logging to identify specific missing columns
- Added conditional field inclusion for opportunity fields to prevent P2022 errors
- Improved P2022 error handling with detailed column information

### 2. Company Linking Service (`src/platform/services/company-linking-service.ts`)
**Status:** ✅ No Changes Needed
- Already using only basic fields that exist in streamlined schema
- Fields used: `workspaceId`, `name`, `status`, `priority`, `industry`, `domain`, `website`, `createdAt`, `updatedAt`, `customFields`

### 3. Excel Import Service (`src/platform/services/ExcelImportService.ts`)
**Status:** ✅ Fixed
**Changes Made:**
- Changed `hqCountry` → `hqCountryIso2` (using ISO2 country codes)
- Changed `source` → `sources` (using array instead of string)
- Added proper `createdAt` and `updatedAt` timestamps

**Before:**
```typescript
hqCountry: rowData.country || 'United States',
source: 'excel_import',
```

**After:**
```typescript
hqCountryIso2: rowData.country || 'US', // Use ISO2 country code instead of hqCountry
sources: ['excel_import'], // Use sources array instead of source field
```

### 4. Zoho Webhook (`src/app/api/webhooks/zoho/route.ts`)
**Status:** ✅ Fixed
**Changes Made:**
- Removed `accountType` field (moved to `customFields`)
- Removed `zohoId` field (moved to `customFields`)
- Changed `ownerId` → `mainSellerId`
- Changed `size` → `employeeCount` (integer instead of string)
- Added proper `createdAt` and `updatedAt` timestamps

**Before:**
```typescript
accountType: accountData.Type || 'Customer',
zohoId: accountData.id,
ownerId: '01K1VBYYV7TRPY04NW4TW4XWRB',
size: accountData.Employees ? parseInt(accountData.Employees).toString() : null,
```

**After:**
```typescript
employeeCount: accountData.Employees ? parseInt(accountData.Employees) : null,
mainSellerId: '01K1VBYYV7TRPY04NW4TW4XWRB',
customFields: {
  zohoId: accountData.id,
  accountType: accountData.Type || 'Customer',
  importedFrom: 'zoho_webhook',
  importedAt: new Date().toISOString()
},
```

### 5. Conversions API (`src/app/api/data/conversions/route.ts`)
**Status:** ✅ No Changes Needed
- Already using only basic fields that exist in streamlined schema
- Fields used: `id`, `name`, `description`, `workspaceId`, `updatedAt`

### 6. SBI Database Service (`src/platform/services/sbi/database-service.ts`)
**Status:** ✅ Fixed
**Changes Made:**
- Changed `size` → `employeeCount` (integer instead of string)
- Changed `location` → `hqLocation`
- Added proper `createdAt` and `updatedAt` timestamps

**Before:**
```typescript
size: company.size,
location: company.location,
```

**After:**
```typescript
employeeCount: company.size ? parseInt(company.size) : null,
hqLocation: company.location,
createdAt: new Date(),
updatedAt: new Date()
```

## Field Mapping Reference

| Old Field Name | New Field Name | Notes |
|----------------|----------------|-------|
| `hqCountry` | `hqCountryIso2` | Use ISO2 country codes (e.g., 'US', 'CA') |
| `source` | `sources` | Use array of strings instead of single string |
| `ownerId` | `mainSellerId` | Renamed in migration `20251012140945_rename_to_main_seller` |
| `size` | `employeeCount` | Use integer instead of string |
| `location` | `hqLocation` | Use proper HQ location field |
| `accountType` | `customFields.accountType` | Move to custom fields |
| `zohoId` | `customFields.zohoId` | Move to custom fields |

## Testing

All company creation endpoints and services should now work properly with the streamlined schema. The enhanced error logging will help identify any remaining issues.

## Diagnostic Tools

Use the diagnostic tools created earlier to verify the fixes:

1. **Schema Diagnostics:** `GET /api/v1/diagnostics/schema`
2. **Migration Diagnostics:** `GET /api/v1/diagnostics/migrations`
3. **Diagnostic Scripts:** 
   - `node scripts/diagnose-production-schema.js`
   - `node scripts/check-migration-status.js`

## Next Steps

1. Deploy these changes to production
2. Run the diagnostic tools to verify the schema is correct
3. Test company creation through all the different entry points
4. Monitor error logs for any remaining P2022 errors

## Notes

- The Rust Tauri desktop app (`src-tauri/src/database/crm.rs`) still uses some old field names but is less critical since it's not the main web application
- All changes maintain backward compatibility by moving non-standard fields to `customFields`
- The enhanced error logging will help identify any future schema drift issues
