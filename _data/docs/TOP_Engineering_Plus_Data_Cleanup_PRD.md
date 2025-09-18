# TOP Engineering Plus Data Cleanup PRD

## Project Overview

**Project Name:** TOP Engineering Plus Data Cleanup and Migration  
**Workspace:** TOP Engineering Plus (`tops-engineering-plus`)  
**Workspace ID:** `01K5D01YCQJ9TJ7CT4DZDE79T1`  
**Created:** September 17, 2025  
**Status:** In Progress  

## Executive Summary

This project involves cleaning, deduplicating, and standardizing three datasets for TOP Engineering Plus, a workspace focused on engineering talent management and conference tracking. The goal is to create a unified, clean dataset ready for import into the Adrata platform.

## Data Sources Analysis

### 1. Exported Capsule Contacts 2025-08-29.xlsx
- **Size:** 1,902 records, 81 columns
- **Source:** Capsule CRM export
- **Content:** Mixed Person/Organization records
- **Key Fields:** Name, Email, Job Title, Organization, Phone, Address
- **Quality:** High - comprehensive contact data with multiple address types

### 2. Physical Mailer Campaign 2025-08-29.xlsx
- **Size:** 39 records, 81 columns
- **Source:** Capsule CRM export (subset)
- **Content:** Targeted campaign contacts
- **Key Fields:** Same structure as Capsule export
- **Quality:** High - focused on specific campaign recipients

### 3. UTC All Regions 2023.xlsx
- **Size:** 65 records, 14 columns
- **Source:** Legacy spreadsheet
- **Content:** Conference attendees/contacts
- **Key Fields:** Company, First Name, Last Name, Title, Email, Region
- **Quality:** Medium - basic contact information, some missing data

## Data Model Mapping

### Target Schema (Adrata Platform)

#### People Table
```sql
- id (String, Primary Key)
- workspaceId (String) - TOP Engineering Plus workspace
- companyId (String, Foreign Key to companies)
- assignedUserId (String)
- firstName (String)
- lastName (String)
- fullName (String)
- email (String)
- workEmail (String)
- personalEmail (String)
- phone (String)
- mobilePhone (String)
- workPhone (String)
- jobTitle (String)
- department (String)
- linkedinUrl (String)
- address (String)
- city (String)
- state (String)
- country (String)
- postalCode (String)
- notes (String)
- tags (String[])
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Companies Table
```sql
- id (String, Primary Key)
- workspaceId (String) - TOP Engineering Plus workspace
- assignedUserId (String)
- name (String)
- website (String)
- email (String)
- phone (String)
- address (String)
- city (String)
- state (String)
- country (String)
- postalCode (String)
- industry (String)
- size (String)
- description (String)
- notes (String)
- tags (String[])
- createdAt (DateTime)
- updatedAt (DateTime)
```

## Data Quality Issues Identified

### 1. Duplicate Records
- **Issue:** Same contacts across multiple datasets
- **Impact:** Data inconsistency, potential import conflicts
- **Solution:** Implement deduplication logic based on email + name matching

### 2. Inconsistent Field Mapping
- **Issue:** Different column names across datasets
- **Impact:** Data mapping complexity
- **Solution:** Create standardized field mapping

### 3. Missing Data
- **Issue:** Incomplete contact information
- **Impact:** Reduced data quality
- **Solution:** Data validation and enrichment

### 4. Mixed Data Types
- **Issue:** Person vs Organization records mixed
- **Impact:** Schema conflicts
- **Solution:** Separate processing logic

## Data Processing Strategy

### Phase 1: Data Analysis and Mapping
1. **Field Mapping Analysis**
   - Map source fields to target schema
   - Identify data type conversions needed
   - Document missing field mappings

2. **Data Quality Assessment**
   - Identify duplicate records
   - Assess data completeness
   - Flag data quality issues

### Phase 2: Data Cleaning
1. **Deduplication**
   - Email-based deduplication
   - Name-based fuzzy matching
   - Manual review of potential duplicates

2. **Data Standardization**
   - Phone number formatting
   - Email validation
   - Address standardization
   - Name normalization

3. **Data Enrichment**
   - Company information extraction
   - Industry classification
   - Geographic data validation

### Phase 3: Data Transformation
1. **Schema Conversion**
   - Convert to Adrata schema format
   - Handle data type conversions
   - Create proper relationships

2. **Data Validation**
   - Required field validation
   - Data format validation
   - Business rule validation

### Phase 4: Import Preparation
1. **Import File Generation**
   - Create CSV files for import
   - Generate import scripts
   - Prepare validation reports

2. **Testing and Validation**
   - Test import process
   - Validate data integrity
   - Performance testing

## Technical Implementation

### Tools and Technologies
- **Python 3.x** - Data processing and analysis
- **Pandas** - Data manipulation and analysis
- **OpenPyXL** - Excel file processing
- **SQLAlchemy** - Database operations
- **Prisma** - Database schema management

### File Structure
```
_data/
├── TOP_Engineering_Plus_Data_Cleanup_PRD.md
├── examine_data.py
├── data_cleanup.py
├── data_mapping.py
├── deduplication.py
├── import_preparation.py
├── validation.py
├── raw/
│   ├── Exported Capsule Contacts 2025-08-29.xlsx
│   ├── Physical Mailer Campaign 2025-08-29.xlsx
│   └── UTC All Regions 2023.xlsx
├── processed/
│   ├── cleaned_people.csv
│   ├── cleaned_companies.csv
│   └── import_log.txt
└── reports/
    ├── data_quality_report.md
    ├── deduplication_report.md
    └── import_validation_report.md
```

## Success Criteria

### Data Quality Metrics
- **Deduplication Rate:** >95% of duplicates identified and resolved
- **Data Completeness:** >80% of required fields populated
- **Data Accuracy:** >95% of email addresses valid
- **Import Success Rate:** 100% successful import with no errors

### Business Metrics
- **Total Clean Records:** Expected ~1,800-2,000 unique contacts
- **Company Records:** Expected ~200-300 unique companies
- **Data Coverage:** Complete contact information for key prospects

## Risk Assessment

### High Risk
- **Data Loss:** Risk of losing important contact information during deduplication
- **Import Failures:** Database constraints or validation errors during import

### Medium Risk
- **Data Quality:** Inconsistent data quality across sources
- **Performance:** Large dataset processing performance

### Low Risk
- **Schema Changes:** Minor schema adjustments needed
- **User Training:** Minimal training required for data review

## Timeline

### Week 1: Analysis and Planning
- [x] Data source analysis
- [x] Schema mapping
- [ ] Data quality assessment
- [ ] Deduplication strategy

### Week 2: Data Cleaning
- [ ] Implement deduplication logic
- [ ] Data standardization
- [ ] Data enrichment
- [ ] Quality validation

### Week 3: Import Preparation
- [ ] Schema conversion
- [ ] Import file generation
- [ ] Testing and validation
- [ ] Documentation

### Week 4: Import and Validation
- [ ] Data import execution
- [ ] Post-import validation
- [ ] Performance monitoring
- [ ] Final reporting

## Next Steps

1. **Immediate Actions**
   - Complete data quality assessment
   - Implement deduplication logic
   - Create data mapping specifications

2. **Short-term Goals**
   - Process and clean all three datasets
   - Generate clean import files
   - Validate data quality

3. **Long-term Goals**
   - Successful import to TOP Engineering Plus workspace
   - Establish data maintenance processes
   - Create data quality monitoring

## Appendices

### A. Field Mapping Specifications
[To be completed during implementation]

### B. Data Quality Rules
[To be completed during implementation]

### C. Import Scripts
[To be completed during implementation]

---

**Document Version:** 1.0  
**Last Updated:** September 17, 2025  
**Next Review:** September 24, 2025
