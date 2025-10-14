#!/usr/bin/env node
/**
 * Robust JSON to CSV Converter
 * Handles various file encoding and access issues
 */

const fs = require('fs');
const path = require('path');

/**
 * Convert JSON file to CSV format with robust error handling
 * @param {string} jsonFilePath - Path to input JSON file
 * @param {string} csvFilePath - Path to output CSV file
 */
function convertJsonToCsv(jsonFilePath, csvFilePath) {
    try {
        console.log(`Attempting to read: ${jsonFilePath}`);
        
        // Try multiple approaches to read the file
        let data = null;
        let readMethod = '';
        
        // Method 1: Standard UTF-8 read
        try {
            const content = fs.readFileSync(jsonFilePath, 'utf8');
            if (content && content.length > 0) {
                data = JSON.parse(content);
                readMethod = 'UTF-8';
            }
        } catch (e) {
            console.log(`UTF-8 read failed: ${e.message}`);
        }
        
        // Method 2: Try with different encodings
        if (!data) {
            const encodings = ['utf16le', 'latin1', 'ascii'];
            for (const encoding of encodings) {
                try {
                    const content = fs.readFileSync(jsonFilePath, encoding);
                    if (content && content.length > 0) {
                        // Clean the content
                        let cleanContent = content.trim();
                        // Remove BOM if present
                        if (cleanContent.charCodeAt(0) === 0xFEFF) {
                            cleanContent = cleanContent.slice(1);
                        }
                        // Remove invisible characters
                        cleanContent = cleanContent.replace(/^[\u200B-\u200D\uFEFF]+/, '');
                        
                        data = JSON.parse(cleanContent);
                        readMethod = encoding;
                        break;
                    }
                } catch (e) {
                    console.log(`${encoding} read failed: ${e.message}`);
                }
            }
        }
        
        // Method 3: Try reading as buffer and converting
        if (!data) {
            try {
                const buffer = fs.readFileSync(jsonFilePath);
                const content = buffer.toString('utf8');
                if (content && content.length > 0) {
                    data = JSON.parse(content);
                    readMethod = 'Buffer to UTF-8';
                }
            } catch (e) {
                console.log(`Buffer read failed: ${e.message}`);
            }
        }
        
        if (!data) {
            throw new Error('Could not read the JSON file with any method. The file may be corrupted, empty, or have encoding issues.');
        }
        
        console.log(`Successfully read file using ${readMethod} method`);
        console.log(`Found ${data.length} records`);
        
        // Define CSV columns (excluding badges)
        const fieldnames = ['name', 'title', 'company', 'city', 'state', 'phone', 'email', 'image_url'];
        
        // Create CSV content
        let csvContent = '';
        
        // Add header row
        csvContent += fieldnames.join(',') + '\n';
        
        // Add data rows
        data.forEach((record, index) => {
            const row = fieldnames.map(field => {
                const value = record[field];
                // Handle null/undefined values
                if (value === null || value === undefined) {
                    return '';
                }
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return '"' + stringValue.replace(/"/g, '""') + '"';
                }
                return stringValue;
            });
            csvContent += row.join(',') + '\n';
            
            // Progress indicator for large files
            if (index % 100 === 0 && index > 0) {
                console.log(`Processed ${index} records...`);
            }
        });
        
        // Write CSV file
        fs.writeFileSync(csvFilePath, csvContent, 'utf8');
        
        console.log(`Successfully converted ${data.length} records from ${jsonFilePath} to ${csvFilePath}`);
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: File ${jsonFilePath} not found`);
        } else if (error instanceof SyntaxError) {
            console.error(`Error: Invalid JSON in ${jsonFilePath}: ${error.message}`);
        } else {
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    }
}

/**
 * Main function
 */
function main() {
    // Get the directory where this script is located
    const scriptDir = __dirname;
    const projectRoot = path.dirname(scriptDir);
    
    // Define file paths
    const jsonFile = path.join(projectRoot, 'data_notary.json');
    const csvFile = path.join(projectRoot, 'data_notary.csv');
    
    // Check if JSON file exists
    if (!fs.existsSync(jsonFile)) {
        console.error(`Error: ${jsonFile} not found`);
        process.exit(1);
    }
    
    // Convert JSON to CSV
    convertJsonToCsv(jsonFile, csvFile);
}

// Run the script
if (require.main === module) {
    main();
}
