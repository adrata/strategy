# AI Data Access Summary

## Overview
The AI right panel now has comprehensive access to ALL fields and data associated with records and lists.

## What Data the AI Has Access To

### 1. **Current Record (Detail View)**
When viewing a specific record, the AI has access to:

#### **Structured Context** (Formatted for readability):
- Basic information (name, title, company, email, phone, LinkedIn)
- Status, priority, stage (for opportunities)
- Company context (industry, size, location, website, description)
- Intelligence data (influence level, decision power, engagement strategy)
- Pain points, motivations, decision factors
- Strategic intelligence (strategic wants, critical needs, Adrata strategy)
- Monaco enrichment data (if available)
- Speedrun/Pipeline context (if applicable)

#### **Complete Record Data** (All Fields):
- **NEW**: The complete `currentRecord` object is now included as JSON
- This includes ALL fields from the database record
- Includes nested objects (company, customFields, etc.)
- Includes arrays (competitors, techStack, businessChallenges, etc.)
- Includes metadata (createdAt, updatedAt, etc.)
- Truncated to 5000 characters to prevent token limits, but all key fields are included

### 2. **List View Context**
When viewing a list of records, the AI has access to:

#### **List Information**:
- Active section (leads, prospects, opportunities, etc.)
- Total record count
- Current page number and total pages
- Visible records count (records 1-50 of 500, for example)
- Applied filters (search, status, priority, sort, etc.)

#### **Visible Records Data**:
- Top 15 records from the current page
- For each record, includes:
  - Name, company, title, status, priority
  - **NEW**: Complete record data as JSON (truncated to 500 chars per record)
- All fields from each visible record are available

### 3. **Intelligence Data** (From Database)
The AI reads stored intelligence from the database:

#### **Company Intelligence**:
- Industry, description, employee count
- Strategic wants, critical needs
- Strategic intelligence summary
- Adrata strategy recommendations
- Business units

#### **Person Intelligence**:
- Influence level, decision power, engagement level
- Buyer group role, seniority, department
- Pain points, motivations, decision factors
- Intelligence confidence and reasoning

#### **Lead/Prospect/Opportunity Intelligence**:
- Influence level, engagement strategy
- Seniority, buyer group membership
- Pain points, motivations, decision factors
- Opportunity-specific: stage, value, close date

### 4. **System Context**
- Current date and time (user's timezone)
- Day of the week
- User's workspace and preferences
- Application type and context

### 5. **Document Context**
- Uploaded files and their content (if any)
- Extracted data from documents

### 6. **Competitor Strategy Report**
- TOP's Strategic Competitor Field Manual
- Automatically included when:
  - Query mentions competitors, competitive positioning, TOP, EPC
  - Workspace is TOP-related
- Includes competitor profiles (Burns & McDonnell, Black & Veatch, Lockard & White)
- Includes positioning strategies, talk tracks, discovery questions

## Data Completeness

### ✅ **All Record Fields Available**
The AI now has access to:
- **Every field** in the `currentRecord` object
- **Every field** in each visible record in list views
- Nested objects (company, customFields, monacoEnrichment, etc.)
- Arrays (competitors, techStack, businessChallenges, etc.)
- Metadata (timestamps, IDs, etc.)

### ✅ **Intelligence Data**
- Reads from database (not generated on-the-fly)
- Includes stored intelligence from `customFields`
- Falls back to inferred data if intelligence not available

### ✅ **List View Data**
- All visible records on current page
- Pagination information
- Filter and sort information
- Complete record data for each visible record

## Implementation Details

### Code Changes
1. **`AIContextService.ts`**:
   - Added "COMPLETE RECORD DATA" section with full JSON
   - Enhanced list view context to include complete record data
   - All fields are now accessible to the AI

2. **Data Flow**:
   - `currentRecord` object passed from frontend → API → AIContextService
   - `listViewContext.visibleRecords` passed from frontend → API → AIContextService
   - Complete objects are serialized to JSON and included in context

### Token Management
- Record data truncated to 5000 characters to prevent token limits
- List view records truncated to 500 characters per record
- Key fields are always included in structured format above JSON

## Testing Recommendations

1. **Test with Complete Records**:
   - Ask AI about specific fields (e.g., "What competitors does this company have?")
   - Verify AI can access all custom fields
   - Test with records that have rich data (customFields, nested objects)

2. **Test List Views**:
   - Ask about specific records in the list
   - Verify AI knows current page and total pages
   - Test with filtered/searched lists

3. **Test Intelligence Data**:
   - Verify AI uses stored intelligence from database
   - Test with records that have intelligence vs. those without

4. **Test Competitor Report**:
   - Ask about competitive positioning
   - Ask about specific competitors (Burns & McDonnell, etc.)
   - Verify AI references the field manual

## Notes

- **Intelligence Data**: Must be generated and stored in database first (via intelligence API endpoints)
- **Large Records**: Very large records may be truncated, but key fields are always in structured format
- **Performance**: JSON serialization adds some overhead, but provides complete data access

