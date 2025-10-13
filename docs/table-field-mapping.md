# Table Field Mapping Reference

## Overview
This document provides a comprehensive mapping between database fields, API responses, and UI columns for all table sections in the Adrata platform.

## Database Schema Analysis

### Schema Comparison: `schema.prisma` vs `schema-streamlined.prisma`

**Key Differences:**
- `schema.prisma` includes `email_messages` table (missing from streamlined)
- Both schemas have identical `people` and `companies` table structures
- Streamlined schema appears to be the active version

**Recommendation:** Use `schema-streamlined.prisma` as the source of truth.

## Section-by-Section Field Mapping

### 1. Speedrun Section

**Database Source:** `people` table with `coSellers` relation
**API Endpoint:** `/api/v1/speedrun`
**UI Columns:** Rank, Name, Company, Status, Main-Seller, Co-Sellers, Last Action, Next Action

| UI Column | Database Field | API Field | Notes |
|-----------|----------------|-----------|-------|
| Rank | `globalRank` | `rank` | Sequential ranking (index + 1) |
| Name | `fullName` | `name` | Fallback: `firstName + lastName` |
| Company | `company.name` | `company.name` | Via company relation |
| Status | `status` | `status` | PersonStatus enum |
| Main-Seller | `mainSeller.name` | `mainSeller` | Transformed to "Me" for current user |
| Co-Sellers | `coSellers[].user.name` | `coSellers` | Comma-separated list |
| Last Action | `lastAction` | `lastAction` | With `lastActionTime` formatting |
| Next Action | `nextAction` | `nextAction` | With `nextActionTiming` formatting |

**Sort Fields:**
- `rank` → `globalRank` (asc)
- `name` → `fullName`
- `company` → `company.name`
- `status` → `status`
- `lastContact` → `lastActionDate`

**Filters:**
- `status` → `status` enum
- `priority` → `priority` enum
- `vertical` → `vertical` field

### 2. Leads Section

**Database Source:** `people` table where `status='LEAD'`
**API Endpoint:** `/api/v1/people?section=leads`
**UI Columns:** Name, Company, Title, Email, Last Action, Next Action

| UI Column | Database Field | API Field | Notes |
|-----------|----------------|-----------|-------|
| Name | `fullName` | `fullName` | Fallback: `firstName + lastName` |
| Company | `company.name` | `company.name` | Via company relation |
| Title | `jobTitle` | `jobTitle` | Job title field |
| Email | `email` | `email` | Primary email |
| Last Action | `lastAction` | `lastAction` | With date formatting |
| Next Action | `nextAction` | `nextAction` | With date formatting |

**Sort Fields:**
- `name` → `fullName`
- `company` → `company.name`
- `title` → `jobTitle`
- `lastActionDate` → `lastActionDate`
- `createdAt` → `createdAt`

**Filters:**
- `search` → Multiple fields (firstName, lastName, fullName, email, jobTitle, department)
- `status` → `status` (filtered to 'LEAD')
- `priority` → `priority`
- `companyId` → `companyId`

### 3. Prospects Section

**Database Source:** `people` table where `status='PROSPECT'`
**API Endpoint:** `/api/v1/people?section=prospects`
**UI Columns:** Name, Company, Title, Last Action, Next Action

| UI Column | Database Field | API Field | Notes |
|-----------|----------------|-----------|-------|
| Name | `fullName` | `fullName` | Fallback: `firstName + lastName` |
| Company | `company.name` | `company.name` | Via company relation |
| Title | `jobTitle` | `jobTitle` | Job title field |
| Last Action | `lastAction` | `lastAction` | With date formatting |
| Next Action | `nextAction` | `nextAction` | With date formatting |

**Sort Fields:**
- `name` → `fullName`
- `company` → `company.name`
- `title` → `jobTitle`
- `lastActionDate` → `lastActionDate`
- `createdAt` → `createdAt`

**Filters:**
- `search` → Multiple fields (firstName, lastName, fullName, email, jobTitle, department)
- `status` → `status` (filtered to 'PROSPECT')
- `priority` → `priority`
- `companyId` → `companyId`

### 4. Opportunities Section

**Database Source:** `people` table where `status='OPPORTUNITY'`
**API Endpoint:** `/api/v1/people?section=opportunities`
**UI Columns:** Rank, Name, Account, Amount, Stage, Probability, Close Date, Last Action

| UI Column | Database Field | API Field | Notes |
|-----------|----------------|-----------|-------|
| Rank | `globalRank` | `rank` | Global ranking |
| Name | `fullName` | `fullName` | Person name |
| Account | `company.name` | `company.name` | Company name |
| Amount | `company.opportunityAmount` | `company.opportunityAmount` | Via company relation |
| Stage | `company.opportunityStage` | `company.opportunityStage` | Via company relation |
| Probability | `company.opportunityProbability` | `company.opportunityProbability` | Via company relation |
| Close Date | `company.expectedCloseDate` | `company.expectedCloseDate` | Via company relation |
| Last Action | `lastAction` | `lastAction` | With date formatting |

**Sort Fields:**
- `rank` → `globalRank`
- `name` → `fullName`
- `amount` → `company.opportunityAmount`
- `stage` → `company.opportunityStage`
- `expectedCloseDate` → `company.expectedCloseDate`

**Filters:**
- `search` → Multiple fields
- `status` → `status` (filtered to 'OPPORTUNITY')
- `stage` → `company.opportunityStage`
- `amount` → `company.opportunityAmount` (range)

### 5. Companies Section

**Database Source:** `companies` table
**API Endpoint:** `/api/v1/companies`
**UI Columns:** Company, Last Action, Next Action, Industry, Size, Revenue

| UI Column | Database Field | API Field | Notes |
|-----------|----------------|-----------|-------|
| Company | `name` | `name` | Company name |
| Last Action | `lastAction` | `lastAction` | With date formatting |
| Next Action | `nextAction` | `nextAction` | With date formatting |
| Industry | `industry` | `industry` | Industry field |
| Size | `size` | `size` | Company size |
| Revenue | `revenue` | `revenue` | Annual revenue |

**Sort Fields:**
- `name` → `name`
- `globalRank` → `globalRank`
- `lastActionDate` → `lastActionDate`
- `createdAt` → `createdAt`

**Filters:**
- `search` → Multiple fields (name, legalName, website, domain)
- `status` → `status`
- `priority` → `priority`
- `industry` → `industry`

### 6. People Section

**Database Source:** `people` table (all statuses)
**API Endpoint:** `/api/v1/people`
**UI Columns:** Name, Company, Title, Last Action, Next Action

| UI Column | Database Field | API Field | Notes |
|-----------|----------------|-----------|-------|
| Name | `fullName` | `fullName` | Fallback: `firstName + lastName` |
| Company | `company.name` | `company.name` | Via company relation |
| Title | `jobTitle` | `jobTitle` | Job title field |
| Last Action | `lastAction` | `lastAction` | With date formatting |
| Next Action | `nextAction` | `nextAction` | With date formatting |

**Sort Fields:**
- `name` → `fullName`
- `company` → `company.name`
- `title` → `jobTitle`
- `lastActionDate` → `lastActionDate`
- `createdAt` → `createdAt`

**Filters:**
- `search` → Multiple fields (firstName, lastName, fullName, email, jobTitle, department)
- `status` → `status` (all statuses)
- `priority` → `priority`
- `companyId` → `companyId`

## Field Name Inconsistencies

### Identified Issues:

1. **Last Action Date:**
   - Database: `lastActionDate`
   - Some UI references: `lastContactDate`
   - **Fix needed:** Standardize to `lastActionDate`

2. **Next Action Date:**
   - Database: `nextActionDate`
   - Some UI references: `nextContactDate`
   - **Fix needed:** Standardize to `nextActionDate`

3. **Main Seller Display:**
   - Database: `mainSellerId` (relation)
   - UI: Transformed to "Me" for current user
   - **Status:** Working correctly

4. **Rank Field:**
   - Database: `globalRank`
   - UI: Sequential `rank` (index + 1)
   - **Status:** Working correctly

## Missing Fields Analysis

### Fields Present in Database but Not Used in UI:

1. **People Table:**
   - `displayName`, `salutation`, `suffix`
   - `department`, `seniority`
   - `workEmail`, `personalEmail`
   - `mobilePhone`, `workPhone`
   - `address`, `city`, `state`, `country`, `postalCode`
   - `dateOfBirth`, `gender`, `bio`
   - `profilePictureUrl`
   - `source`, `tags`, `customFields`
   - `preferredLanguage`, `timezone`
   - `emailVerified`, `phoneVerified`
   - `engagementScore`, `companyRank`
   - `entityId`, `deletedAt`
   - `vertical`

2. **Companies Table:**
   - `legalName`, `tradingName`, `localName`
   - `description`, `website`, `email`, `phone`, `fax`
   - `address`, `city`, `state`, `country`, `postalCode`
   - `sector`, `revenue`, `currency`, `employeeCount`
   - `foundedYear`, `registrationNumber`, `taxId`, `vatNumber`
   - `domain`, `logoUrl`
   - `tags`, `customFields`, `notes`
   - `actionStatus`, `entityId`, `deletedAt`
   - `mainSellerId`, `actualCloseDate`
   - `opportunityAmount`, `opportunityProbability`, `opportunityStage`

### Fields Used in UI but Missing from Database:

**None identified** - All UI fields map to existing database fields.

## Recommendations

1. **Standardize field names** across UI and API
2. **Add missing filters** for commonly used fields (industry, size, etc.)
3. **Implement proper date formatting** for action dates
4. **Add column visibility controls** for additional fields
5. **Create consistent fallback values** for missing data
