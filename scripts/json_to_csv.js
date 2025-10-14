#!/usr/bin/env node
/**
 * JSON to CSV Converter
 * Converts data_notary.json to data_notary.csv format
 */

const fs = require('fs');
const path = require('path');

/**
 * Convert JSON file to CSV format
 * @param {string} jsonFilePath - Path to input JSON file
 * @param {string} csvFilePath - Path to output CSV file
 */
function convertJsonToCsv(jsonFilePath, csvFilePath) {
    try {
        // Read JSON file
        const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
        const data = JSON.parse(jsonData);
        
        // Define CSV columns (excluding badges)
        const fieldnames = ['name', 'title', 'company', 'city', 'state', 'phone', 'email', 'image_url'];
        
        // Create CSV content
        let csvContent = '';
        
        // Add header row
        csvContent += fieldnames.join(',') + '\n';
        
        // Add data rows
        data.forEach(record => {
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
