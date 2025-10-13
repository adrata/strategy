# Excel Import via AI Chat

## Overview

The Excel Import via AI Chat feature allows users to drag and drop Excel files into the AI chat area to automatically process and import people/companies with intelligent status assignment and connection point creation.

## How It Works

### 1. File Upload
- Drag and drop an Excel file (.xlsx or .xls) into the AI chat area
- The system automatically detects Excel files and triggers the import analysis

### 2. AI Analysis
- The AI analyzes the Excel structure and content
- Provides intelligent column mapping suggestions
- Determines appropriate person status (LEAD, PROSPECT, CUSTOMER)
- Identifies connection point opportunities

### 3. Import Process
- User confirms the import by saying "Import the Excel data" or "Start the import process"
- The system processes the data with smart deduplication
- Creates people and companies with appropriate status
- Generates connection points and activities

## Features

### Intelligent Column Mapping
- Automatically maps Excel columns to database fields
- Supports fuzzy matching for column names
- Handles common variations (e.g., "First Name", "fname", "given name")

### Smart Status Assignment
- **LEAD**: New contacts without engagement history
- **PROSPECT**: Contacts with some engagement or warm indicators
- **CUSTOMER**: Existing customers or revenue-generating contacts

### Connection Point Generation
- Import activity: Always created with timestamp
- Historical activities: From date/interaction columns
- Next actions: Based on lead quality and data completeness

### Data Quality Features
- Duplicate detection and handling
- Data validation and cleaning
- Error reporting with specific row information
- Import confidence scoring

## Supported Excel Formats

- **File Types**: .xlsx, .xls
- **Size Limit**: 10MB maximum
- **Structure**: First sheet is used as primary data source
- **Headers**: First row should contain column headers

## Column Mapping

The system intelligently maps Excel columns to database fields:

### People Fields
- `firstName`, `first`, `fname`, `given`, `forename`
- `lastName`, `last`, `lname`, `surname`, `family`
- `fullName`, `name`, `full`, `complete`, `contact`
- `email`, `e-mail`, `mail`, `address`
- `phone`, `tel`, `mobile`, `cell`, `telephone`
- `jobTitle`, `title`, `position`, `role`, `job`, `designation`
- `company`, `organization`, `org`, `firm`, `business`
- `department`, `dept`, `division`, `team`, `unit`

### Company Fields
- `companyName`, `company`, `organization`, `org`, `firm`, `business`
- `website`, `url`, `web`, `site`
- `industry`, `sector`, `vertical`, `domain`
- `size`, `employees`, `headcount`, `staff`

### Address Fields
- `address`, `street`, `location`
- `city`, `town`, `municipality`
- `state`, `province`, `region`
- `country`, `nation`
- `postalCode`, `zip`, `postal`, `code`, `postcode`

### Status and Engagement
- `status`, `stage`, `phase`, `state`
- `priority`, `importance`, `level`
- `source`, `origin`, `referral`
- `lastContact`, `last`, `contact`, `touch`, `reach`
- `nextAction`, `next`, `action`, `follow`, `up`

## Usage Examples

### Basic Import
1. Drag Excel file into chat
2. Wait for AI analysis
3. Say "Import the Excel data"

### Custom Import
1. Drag Excel file into chat
2. Wait for AI analysis
3. Say "Show import options" to customize settings
4. Say "Import the Excel data" when ready

## Error Handling

The system provides detailed error reporting:
- Row-specific error messages
- Data validation errors
- File format issues
- Import confidence scores

## API Endpoints

### POST /api/v1/data/import-excel
- Accepts Excel files via FormData
- Returns detailed import results
- Supports import options configuration

## Technical Implementation

### Files Modified
- `src/app/api/v1/data/import-excel/route.ts` - API endpoint
- `src/platform/services/ExcelImportService.ts` - Import service
- `src/platform/ui/components/chat/RightPanel.tsx` - Chat integration
- `src/platform/services/ClaudeAIService.ts` - AI intelligence
- `src/platform/services/OpenRouterService.ts` - AI intelligence
- `src/platform/services/universal-document-parser.ts` - Excel parsing

### Key Components
- **ExcelImportService**: Handles data processing and import logic
- **AI Integration**: Provides intelligent analysis and recommendations
- **Chat Integration**: Seamless user experience in the chat interface
- **Database Integration**: Creates people, companies, and activities

## Best Practices

1. **File Preparation**
   - Use clear column headers
   - Ensure data consistency
   - Remove empty rows
   - Use standard date formats

2. **Data Quality**
   - Include email addresses when possible
   - Use consistent company names
   - Provide job titles for better status assignment

3. **Import Strategy**
   - Start with small test files
   - Review AI recommendations
   - Use duplicate detection
   - Monitor import results

## Troubleshooting

### Common Issues
- **File not detected**: Ensure file is .xlsx or .xls format
- **No data found**: Check that first sheet contains data
- **Mapping errors**: Review column headers and data format
- **Import failures**: Check file size and data structure

### Support
- Check console logs for detailed error messages
- Verify file format and structure
- Contact support for persistent issues
