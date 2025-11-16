# TOP Engineering Plus Data Quality Audit

**Date:** 2025-01-16  
**Workspace:** TOP Engineering Plus (ID: `01K75ZD7DWHG1XF16HAF2YVKCK`)

## Executive Summary

This audit analyzed all people and company data in the TOP Engineering Plus workspace to identify data quality issues, particularly focusing on capitalization inconsistencies and missing data.

### Key Findings

- **112 people** have capitalization issues (85 all caps, 27 all lowercase)
- **25 companies** have capitalization issues (24 all caps, 1 all lowercase)
- **158 people** are missing email addresses
- **944 people** are missing job titles
- **16 people** are not associated with a company
- **10 companies** are missing websites
- **93 companies** are missing industry information

## People Data Quality

### Statistics
- **Total People:** 6,790
- **Active People:** 1,881

### Capitalization Issues

**Total:** 112 issues

- **All Caps Names:** 85
- **All Lowercase Names:** 27

**Common Issues:**
- Names like "GARY MOORE" should be "Gary Moore"
- Names like "MILES Ley" should be "Miles Ley"
- Names like "athena sigmon" should be "Athena Sigmon"
- Acronyms like "DCIS" and "MSIS" are correctly preserved
- Initials like "JJ" and "B.J." are correctly preserved

**Sample Issues:**
- "GARY MOORE" → "Gary Moore"
- "MILES Ley" → "Miles Ley"
- "athena sigmon" → "Athena Sigmon"
- "DCIS Carlin Ables" → "DCIS Carlin Ables" (correctly preserved as acronym)

### Missing Data

- **Missing Email:** 158 people (8.4% of active)
- **Missing Job Title:** 944 people (50.2% of active)
- **Missing Company:** 16 people (0.9% of active)

### Recommendations for People Data

1. **Capitalization Fixes:**
   - Run the audit script with `--fix` flag to automatically correct capitalization issues
   - Review acronyms and initials to ensure they're preserved correctly
   - Handle special name prefixes (Mc, Mac, O', van, de, etc.)

2. **Missing Data:**
   - Enrich missing email addresses using external data sources
   - Update job titles from LinkedIn or other professional profiles
   - Associate orphaned people with companies where possible

3. **Data Standardization:**
   - Implement consistent name normalization on data import
   - Add validation rules to prevent all-caps or all-lowercase names
   - Use proper case conversion for all new data entries

## Companies Data Quality

### Statistics
- **Total Companies:** 920
- **Active Companies:** 403

### Capitalization Issues

**Total:** 25 issues

- **All Caps Names:** 24
- **All Lowercase Names:** 1

**Common Issues:**
- Company names like "GREAT RIVER ENERGY" should be "Great River Energy"
- Company names like "LOWER COLORADO RIVER AUTHORITY" should be "Lower Colorado River Authority"
- Business abbreviations (LLC, Inc, Corp, etc.) are correctly preserved
- State abbreviations (OH, USA, etc.) are correctly preserved

**Sample Issues:**
- "GREAT RIVER ENERGY" → "Great River Energy"
- "LOWER COLORADO RIVER AUTHORITY" → "Lower Colorado River Authority"
- "WEBB GLOBAL TRANSFER, LLC" → "Webb Global Transfer, LLC" (correctly preserves LLC)
- "EPC, LLC" → "EPC, LLC" (correctly preserves acronym and LLC)
- "AES OH" → "AES OH" (correctly preserves acronym and state)

### Missing Data

- **Missing Website:** 10 companies (2.5% of active)
- **Missing Industry:** 93 companies (23.1% of active)

### Recommendations for Companies Data

1. **Capitalization Fixes:**
   - Run the audit script with `--fix` flag to automatically correct capitalization issues
   - Preserve business abbreviations (LLC, Inc, Corp, etc.) in uppercase
   - Preserve state abbreviations and acronyms correctly

2. **Missing Data:**
   - Enrich missing websites using company domain lookups
   - Update industry information from company profiles or external sources
   - Consider using NAICS codes for industry classification

3. **Data Standardization:**
   - Implement consistent company name normalization on data import
   - Add validation rules to prevent all-caps company names
   - Use proper case conversion while preserving abbreviations

## Why Some Names Are All Caps

The audit identified several reasons why names appear in all caps:

1. **Data Import Issues:**
   - Data imported from systems that stored names in uppercase
   - CSV imports that didn't normalize capitalization
   - Legacy data that wasn't properly formatted

2. **Manual Entry:**
   - Users entering names in all caps
   - Copy-paste from sources that were all caps
   - Lack of validation on data entry forms

3. **External Data Sources:**
   - Some external APIs return names in all caps
   - Data enrichment services that don't normalize names
   - Imported data from systems with different formatting standards

## Additional Data Cleaning Recommendations

### 1. Implement Name Normalization on Import

Create a standardized name normalization function that:
- Converts all-caps names to proper case
- Preserves acronyms and abbreviations
- Handles special name prefixes (Mc, Mac, O', van, de, etc.)
- Normalizes whitespace and removes extra spaces

### 2. Add Data Validation Rules

Implement validation at the API and form level:
- Prevent all-caps or all-lowercase names on entry
- Validate email format and domain
- Require job titles for active people
- Require company association for people

### 3. Regular Data Quality Audits

Schedule regular audits to:
- Identify new data quality issues
- Track improvements over time
- Monitor data completeness metrics
- Generate reports for stakeholders

### 4. Data Enrichment Pipeline

Implement automated enrichment for:
- Missing email addresses
- Missing job titles
- Missing company websites
- Missing industry information
- Incomplete company profiles

### 5. Data Deduplication

Review and merge duplicate records:
- People with similar names and emails
- Companies with similar names and domains
- Consolidate data from multiple sources

### 6. Standardize Data Entry

Create guidelines for:
- Name formatting standards
- Company name formatting
- Required vs optional fields
- Data entry best practices

## Usage

### Running the Audit

```bash
# Run audit only (no changes)
node scripts/audit-top-engineering-plus-data-quality.js

# Run audit and fix issues automatically
node scripts/audit-top-engineering-plus-data-quality.js --fix
```

### Audit Output

The audit generates:
1. **Console Report:** Summary of findings with sample issues
2. **JSON Report:** Detailed report saved to `logs/top-engineering-plus-data-quality-audit-{timestamp}.json`

### Fix Mode

When run with `--fix` flag, the script will:
- Automatically correct capitalization issues for people names
- Automatically correct capitalization issues for company names
- Update fullName when firstName or lastName is fixed
- Preserve acronyms and abbreviations correctly

**Note:** Always review the audit report before running with `--fix` to ensure the suggested changes are correct.

## Next Steps

1. **Review the audit report** to understand the scope of issues
2. **Test the fix mode** on a small subset of data first
3. **Run the fix** on all data if satisfied with results
4. **Implement validation** to prevent future issues
5. **Schedule regular audits** to maintain data quality

## Related Scripts

- `scripts/stats-top-engineering-plus.js` - General statistics for TOP Engineering Plus
- `scripts/audit-top-temp-data-transfer.js` - Data transfer audit
- `scripts/verify-transfer-data-completeness.js` - Transfer completeness verification

