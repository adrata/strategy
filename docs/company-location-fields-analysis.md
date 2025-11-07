# Company Location Fields Analysis

## Problem Statement

There are currently **two separate sets of location fields** for companies, which creates confusion:

### 1. Primary Address Fields (Regular Location)
- `address` - Street address
- `city` - City
- `state` - State/Province
- `country` - Country
- `postalCode` - Postal/ZIP code

### 2. Headquarters (HQ) Fields
- `hqLocation` - HQ Location (string)
- `hqFullAddress` - Complete HQ address (string)
- `hqCity` - HQ City
- `hqState` - HQ State/Province
- `hqStreet` - HQ Street address
- `hqZipcode` - HQ ZIP code
- `hqRegion` - HQ Region (array)
- `hqCountryIso2` - HQ Country ISO2 code
- `hqCountryIso3` - HQ Country ISO3 code

## Current Usage

### CompanyOverviewTab
- Shows "Headquarters" label
- Only uses `hqFullAddress` field (single field)
- Displays: `hqFullAddress || hqCity + hqState`

### UniversalCompanyTab
- Has **two separate sections**:
  1. "Primary Address" section with: `address`, `city`, `state`, `country`, `postalCode`
  2. "Headquarters" section with: `hqStreet`, `hqCity`, `hqState`, `hqZipcode`, `hqFullAddress`

## Issues

1. **Confusing duplication**: Two sets of location fields that may contain different data
2. **Inconsistent usage**: CompanyOverviewTab only shows HQ, UniversalCompanyTab shows both
3. **No synchronization**: Changes to one set don't update the other
4. **Unclear which is authoritative**: Is "Primary Address" or "Headquarters" the source of truth?

## Proposed Solution

### Option 1: Use HQ Fields as Primary (Recommended)
- **Consolidate to HQ fields only** - HQ fields are more specific and comprehensive
- **Map regular address fields to HQ fields** when saving:
  - `address` → `hqStreet`
  - `city` → `hqCity`
  - `state` → `hqState`
  - `country` → derive `hqCountryIso2`/`hqCountryIso3` or store in new `hqCountry` field
  - `postalCode` → `hqZipcode`
- **Update both tabs** to use HQ fields consistently
- **Remove or deprecate** regular address fields (or keep as fallback)

### Option 2: Use Regular Address Fields as Primary
- Consolidate to regular address fields
- Map HQ fields to regular fields when saving
- Less comprehensive (no ISO codes, regions, etc.)

### Option 3: Keep Both, Sync Automatically
- Keep both sets of fields
- Automatically sync when one is updated
- More complex, still confusing

## Recommended Implementation (Option 1)

### Step 1: Update CompanyOverviewTab
- Change "Headquarters" section to show individual HQ fields:
  - `hqStreet` (instead of just `hqFullAddress`)
  - `hqCity`
  - `hqState`
  - `hqZipcode`
  - `hqCountry` (or show ISO codes)
  - `hqFullAddress` (as computed/display field)

### Step 2: Update UniversalCompanyTab
- Remove "Primary Address" section
- Keep only "Headquarters" section
- Use HQ fields consistently

### Step 3: Add Field Mapping Logic
- When `address`, `city`, `state`, `country`, `postalCode` are updated:
  - Automatically map to corresponding HQ fields
  - Or show a migration notice to users

### Step 4: Update API
- Ensure API accepts both field sets
- Map regular fields to HQ fields in the backend
- Or deprecate regular fields over time

## Field Mapping

| Regular Field | HQ Field | Notes |
|--------------|----------|-------|
| `address` | `hqStreet` | Direct mapping |
| `city` | `hqCity` | Direct mapping |
| `state` | `hqState` | Direct mapping |
| `country` | `hqCountryIso2`/`hqCountryIso3` | Need country code lookup |
| `postalCode` | `hqZipcode` | Direct mapping |
| N/A | `hqFullAddress` | Computed from other fields |
| N/A | `hqLocation` | May be different from full address |
| N/A | `hqRegion` | Additional metadata |

## Database Schema

Current schema supports both field sets. We should:
1. Keep both for backward compatibility
2. Add migration script to sync existing data
3. Update UI to use HQ fields as primary
4. Eventually deprecate regular fields (optional)

