const fs = require('fs');

// Helper function to parse CSV line with quoted fields
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Remove surrounding quotes if present
      let field = currentField.trim();
      if (field.startsWith('"') && field.endsWith('"') && field.length > 1) {
        field = field.slice(1, -1);
      }
      fields.push(field);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  // Handle last field
  let field = currentField.trim();
  if (field.startsWith('"') && field.endsWith('"') && field.length > 1) {
    field = field.slice(1, -1);
  }
  fields.push(field);
  return fields;
}

// Read the source file with LinkedIn URLs
const sourceContent = fs.readFileSync('top-temp-no-linkedin-4.csv', 'utf-8');
const sourceLines = sourceContent.split('\n').slice(0, 227); // Lines 1-226 (0-indexed: 0-226, but we need 1-226, so slice 0-227)

// Build a map of company name to LinkedIn URL (only for valid URLs, not "N/A" or empty)
const linkedInMap = {};
for (let i = 1; i < sourceLines.length; i++) {
  const line = sourceLines[i].trim();
  if (!line) continue;
  
  const fields = parseCSVLine(line);
  const companyName = fields[0] || '';
  const linkedInUrl = fields[2] || '';
  
  // Only add to map if LinkedIn URL is valid (not empty, not "N/A")
  if (linkedInUrl && linkedInUrl.trim() && linkedInUrl.trim() !== 'N/A' && linkedInUrl.trim() !== '"N/A"') {
    linkedInMap[companyName] = linkedInUrl.trim();
  }
  
  // Debug first few entries
  if (i <= 5) {
    console.log(`Line ${i}: Company="${companyName}", LinkedIn="${linkedInUrl}"`);
  }
}

console.log(`Loaded ${Object.keys(linkedInMap).length} LinkedIn URLs from source file`);

// Read the target file
const targetContent = fs.readFileSync('top-temp-companies-export.csv', 'utf-8');
const targetLines = targetContent.split('\n');

// Update LinkedIn URLs
let updatedCount = 0;
const updatedLines = [targetLines[0]]; // Keep header

for (let i = 1; i < targetLines.length; i++) {
  const line = targetLines[i].trim();
  if (!line) {
    updatedLines.push('');
    continue;
  }
  
  const fields = parseCSVLine(line);
  const companyName = fields[0] || '';
  const website = fields[1] || '';
  let linkedInUrl = fields[2] || '';
  
  // Check if we have a LinkedIn URL for this company
  if (linkedInMap[companyName]) {
    linkedInUrl = linkedInMap[companyName];
    updatedCount++;
    console.log(`Updating: ${companyName} -> ${linkedInUrl}`);
  }
  
  // Reconstruct the line with proper CSV formatting
  const updatedLine = `"${companyName}","${website}","${linkedInUrl}"`;
  updatedLines.push(updatedLine);
}

// Write the updated content back
fs.writeFileSync('top-temp-companies-export.csv', updatedLines.join('\n'), 'utf-8');

console.log(`\nUpdated ${updatedCount} companies with LinkedIn URLs`);
console.log('File saved: top-temp-companies-export.csv');

