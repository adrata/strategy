#!/usr/bin/env node
/**
 * JSON to CSV Converter
 * 
 * Converts notary data from JSON format to CSV format.
 * Handles badges array by converting to pipe-separated string.
 */

const fs = require('fs');
const path = require('path');

/**
 * Convert badges array to pipe-separated string
 * @param {Array} badges - Array of badge strings
 * @returns {string} Pipe-separated string or empty string
 */
function convertBadgesToString(badges) {
    if (!badges || !Array.isArray(badges) || badges.length === 0) {
        return '';
    }
    return badges.map(badge => String(badge)).join('|');
}

/**
 * Escape CSV field value
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCsvField(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    const stringValue = String(value);
    
    // If value contains comma, newline, or double quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
}

/**
 * Convert JSON file to CSV format
 * @param {string} inputFile - Path to input JSON file
 * @param {string} outputFile - Path to output CSV file
 */
function jsonToCsv(inputFile, outputFile) {
    try {
        // Read JSON data
        const jsonData = fs.readFileSync(inputFile, 'utf8');
        // Remove zero-width spaces and other problematic characters, then trim
        const cleanedJsonData = jsonData.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        const data = JSON.parse(cleanedJsonData);
        
        if (!Array.isArray(data)) {
            throw new Error('JSON file must contain an array of objects');
        }
        
        if (data.length === 0) {
            console.log('Warning: JSON file is empty');
            return;
        }
        
        // Get field names from first record
        const fieldnames = Object.keys(data[0]);
        
        // Ensure consistent field order
        const orderedFields = ['name', 'title', 'company', 'city', 'state', 'phone', 'email', 'image_url', 'badges'];
        const orderedFieldnames = orderedFields.filter(field => fieldnames.includes(field));
        
        // Create CSV content
        let csvContent = '';
        
        // Write header
        csvContent += orderedFieldnames.map(field => escapeCsvField(field)).join(',') + '\n';
        
        // Write data rows
        for (const record of data) {
            const row = orderedFieldnames.map(field => {
                let value = record[field];
                
                // Handle badges array conversion
                if (field === 'badges') {
                    value = convertBadgesToString(value);
                } else {
                    // Handle null values
                    value = value !== null && value !== undefined ? value : '';
                }
                
                return escapeCsvField(value);
            });
            
            csvContent += row.join(',') + '\n';
        }
        
        // Write CSV file
        fs.writeFileSync(outputFile, csvContent, 'utf8');
        
        console.log(`Successfully converted ${data.length} records from ${inputFile} to ${outputFile}`);
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: Input file '${inputFile}' not found`);
        } else if (error instanceof SyntaxError) {
            console.error(`Error: Invalid JSON in file '${inputFile}': ${error.message}`);
        } else {
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    }
}

/**
 * Main function with command line argument support
 */
function main() {
    // Default paths
    const scriptDir = __dirname;
    const projectRoot = path.dirname(scriptDir);
    const defaultInput = path.join(projectRoot, 'data', 'data_notary.json');
    const defaultOutput = path.join(projectRoot, 'data', 'data_notary.csv');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    let inputFile, outputFile;
    
    if (args.length === 0) {
        // Use default paths
        inputFile = defaultInput;
        outputFile = defaultOutput;
    } else if (args.length === 2) {
        // Use provided paths
        inputFile = args[0];
        outputFile = args[1];
    } else {
        console.log('Usage: node json_to_csv.js [input_file] [output_file]');
        console.log(`Default: node json_to_csv.js ${defaultInput} ${defaultOutput}`);
        process.exit(1);
    }
    
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file '${inputFile}' does not exist`);
        process.exit(1);
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputFile);
    if (outputDir && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert JSON to CSV
    jsonToCsv(inputFile, outputFile);
}

// Run main function if this script is executed directly
if (require.main === module) {
    main();
}

module.exports = { jsonToCsv, convertBadgesToString, escapeCsvField };