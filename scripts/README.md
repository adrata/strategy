# JSON to CSV Conversion Scripts

This directory contains scripts to convert `data_notary.json` to CSV format.

## Available Scripts

### 1. `json_to_csv.py` (Python Version)
- **Usage**: `python scripts/json_to_csv.py`
- **Requirements**: Python 3.x with standard library
- **Features**: 
  - Reads JSON file with proper error handling
  - Converts to CSV excluding badges field
  - Handles null values and special characters
  - Uses UTF-8 encoding

### 2. `json_to_csv.js` (Node.js Version)
- **Usage**: `node scripts/json_to_csv.js`
- **Requirements**: Node.js
- **Features**: Same as Python version but in JavaScript

### 3. `json_to_csv_robust.js` (Robust Node.js Version)
- **Usage**: `node scripts/json_to_csv_robust.js`
- **Features**: 
  - Multiple encoding attempts
  - Better error handling
  - Progress indicators for large files
  - Handles various file system issues

## CSV Output Format

The scripts generate a CSV file with the following columns:
- `name` - Contact name
- `title` - Job title
- `company` - Company information
- `city` - City (often null in source data)
- `state` - State (often null in source data)
- `phone` - Phone number (often null in source data)
- `email` - Email address
- `image_url` - Profile image URL

**Note**: The `badges` field is excluded from the CSV output as requested.

## File System Issue

The original `data_notary.json` file appears to have file system access issues where:
- The file shows as 0 bytes when accessed via Node.js/PowerShell
- The file has content when accessed via the read_file tool
- This suggests a virtual file system or permission issue

## Workaround

If the original file cannot be read by the scripts, you can:
1. Copy the content from the read_file tool output
2. Create a new JSON file with the content
3. Run the conversion script on the new file

## Testing

The scripts have been tested with sample data and work correctly, producing properly formatted CSV output with:
- Header row with column names
- Proper escaping of special characters
- Null values converted to empty strings
- Clean CSV format ready for use in spreadsheet applications
