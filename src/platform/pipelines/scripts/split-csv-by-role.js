#!/usr/bin/env node

/**
 * CSV Splitter by Role
 * Splits the main CSV output into separate files for CFO and CRO contacts
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

async function splitCsvByRole(inputCsvPath) {
        console.log('📊 SPLITTING CSV BY ROLE');
        console.log('=' .repeat(50));
        console.log('🎯 Finance Contacts (CFO) vs Revenue/Sales Contacts (CRO)');
    
    try {
        // Find the most recent CSV file if no path provided
        if (!inputCsvPath) {
            const outputsDir = path.join(__dirname, '../scripts/outputs');
            const versionDirs = fs.readdirSync(outputsDir)
                .filter(dir => dir.startsWith('v'))
                .sort((a, b) => {
                    const aNum = parseInt(a.substring(1));
                    const bNum = parseInt(b.substring(1));
                    return bNum - aNum; // Sort descending (newest first)
                });
            
            if (versionDirs.length === 0) {
                throw new Error('No output directories found');
            }
            
            const latestDir = versionDirs[0];
            inputCsvPath = path.join(outputsDir, latestDir, 'core-cro-cfo-contacts.csv');
        }
        
        console.log(`📁 Reading from: ${inputCsvPath}`);
        
        if (!fs.existsSync(inputCsvPath)) {
            throw new Error(`CSV file not found: ${inputCsvPath}`);
        }
        
        const cfoContacts = [];
        const croContacts = [];
        const allContacts = [];
        
        // Read the CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(inputCsvPath)
                .pipe(csv())
                .on('data', (row) => {
                    allContacts.push(row);
                    
                    // Check if CFO data exists
                    const cfoName = row['CFO Name'];
                    const cfoEmail = row['CFO Email'];
                    const cfoPhone = row['CFO Phone'];
                    
                    if (cfoName && cfoName.trim() && cfoName !== 'NONE' && cfoName !== '') {
                        cfoContacts.push(row);
                    }
                    
                    // Check if CRO data exists
                    const croName = row['CRO Name'];
                    const croEmail = row['CRO Email'];
                    const croPhone = row['CRO Phone'];
                    
                    if (croName && croName.trim() && croName !== 'NONE' && croName !== '') {
                        croContacts.push(row);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });
        
        console.log(`📊 Total contacts processed: ${allContacts.length}`);
        console.log(`💰 Finance contacts found: ${cfoContacts.length}`);
        console.log(`📈 Revenue/Sales contacts found: ${croContacts.length}`);
        
        // Get output directory
        const outputDir = path.dirname(inputCsvPath);
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Define CSV headers for each role
        const baseHeaders = [
            { id: 'Company Name', title: 'Company Name' },
            { id: 'Website', title: 'Website' },
            { id: 'Industry', title: 'Industry' },
            { id: 'Employee Count', title: 'Employee Count' },
            { id: 'Headquarters', title: 'Headquarters' },
            { id: 'Public/Private', title: 'Public/Private' },
            { id: 'Parent Company', title: 'Parent Company' },
            { id: 'Relation Type', title: 'Relation Type' },
            { id: 'Account Owner', title: 'Account Owner' },
            { id: 'Research Date', title: 'Research Date' }
        ];
        
        const cfoHeaders = [
            ...baseHeaders,
            { id: 'CFO Name', title: 'CFO Name' },
            { id: 'CFO Title', title: 'CFO Title' },
            { id: 'CFO Email', title: 'CFO Email' },
            { id: 'CFO Email Source', title: 'CFO Email Source' },
            { id: 'CFO Email Status', title: 'CFO Email Status' },
            { id: 'CFO Alt Emails', title: 'CFO Alt Emails' },
            { id: 'CFO Phone', title: 'CFO Phone' },
            { id: 'CFO Phone Type', title: 'CFO Phone Type' },
            { id: 'CFO Phone Carrier', title: 'CFO Phone Carrier' },
            { id: 'CFO LinkedIn', title: 'CFO LinkedIn' },
            { id: 'CFO Confidence', title: 'CFO Confidence' },
            { id: 'CFO Tier', title: 'CFO Tier' },
            { id: 'CFO Discovery Cost', title: 'CFO Discovery Cost' },
            { id: 'CFO Person Confidence', title: 'CFO Person Confidence' },
            { id: 'CFO Person Sources', title: 'CFO Person Sources' },
            { id: 'CFO Person Reasoning', title: 'CFO Person Reasoning' },
            { id: 'CFO Email Confidence', title: 'CFO Email Confidence' },
            { id: 'CFO Email Validation Steps', title: 'CFO Email Validation Steps' },
            { id: 'CFO Email Reasoning', title: 'CFO Email Reasoning' },
            { id: 'CFO Phone Confidence', title: 'CFO Phone Confidence' },
            { id: 'CFO Phone Sources', title: 'CFO Phone Sources' },
            { id: 'CFO Phone Reasoning', title: 'CFO Phone Reasoning' },
            { id: 'CFO Overall Confidence', title: 'CFO Overall Confidence' },
            { id: 'CFO Data Quality Grade', title: 'CFO Data Quality Grade' }
        ];
        
        const croHeaders = [
            ...baseHeaders,
            { id: 'CRO Name', title: 'CRO Name' },
            { id: 'CRO Title', title: 'CRO Title' },
            { id: 'CRO Email', title: 'CRO Email' },
            { id: 'CRO Phone', title: 'CRO Phone' },
            { id: 'CRO LinkedIn', title: 'CRO LinkedIn' },
            { id: 'CRO Confidence', title: 'CRO Confidence' },
            { id: 'CRO Tier', title: 'CRO Tier' },
            { id: 'CRO Person Confidence', title: 'CRO Person Confidence' },
            { id: 'CRO Person Sources', title: 'CRO Person Sources' },
            { id: 'CRO Person Reasoning', title: 'CRO Person Reasoning' },
            { id: 'CRO Email Confidence', title: 'CRO Email Confidence' },
            { id: 'CRO Email Validation Steps', title: 'CRO Email Validation Steps' },
            { id: 'CRO Email Reasoning', title: 'CRO Email Reasoning' },
            { id: 'CRO Phone Confidence', title: 'CRO Phone Confidence' },
            { id: 'CRO Phone Sources', title: 'CRO Phone Sources' },
            { id: 'CRO Phone Reasoning', title: 'CRO Phone Reasoning' },
            { id: 'CRO Overall Confidence', title: 'CRO Overall Confidence' },
            { id: 'CRO Data Quality Grade', title: 'CRO Data Quality Grade' }
        ];
        
        // Write Finance Contacts CSV
        if (cfoContacts.length > 0) {
            const cfoCsvPath = path.join(outputDir, `finance-contacts-${timestamp}.csv`);
            const cfoCsvWriter = createObjectCsvWriter({
                path: cfoCsvPath,
                header: cfoHeaders
            });
            
            await cfoCsvWriter.writeRecords(cfoContacts);
            console.log(`✅ Finance Contacts CSV created: ${cfoCsvPath}`);
            console.log(`   📊 ${cfoContacts.length} Finance contacts`);
        } else {
            console.log('⚠️ No Finance contacts found to export');
        }
        
        // Write Revenue/Sales Contacts CSV
        if (croContacts.length > 0) {
            const croCsvPath = path.join(outputDir, `revenue-sales-contacts-${timestamp}.csv`);
            const croCsvWriter = createObjectCsvWriter({
                path: croCsvPath,
                header: croHeaders
            });
            
            await croCsvWriter.writeRecords(croContacts);
            console.log(`✅ Revenue/Sales Contacts CSV created: ${croCsvPath}`);
            console.log(`   📊 ${croContacts.length} Revenue/Sales contacts`);
        } else {
            console.log('⚠️ No Revenue/Sales contacts found to export');
        }
        
        // Create summary report
        const summaryPath = path.join(outputDir, `contacts-summary-${timestamp}.json`);
        const summary = {
            timestamp: new Date().toISOString(),
            source_file: inputCsvPath,
            total_companies: allContacts.length,
            cfo_contacts: cfoContacts.length,
            cro_contacts: croContacts.length,
            cfo_success_rate: ((cfoContacts.length / allContacts.length) * 100).toFixed(1) + '%',
            cro_success_rate: ((croContacts.length / allContacts.length) * 100).toFixed(1) + '%',
            output_files: {
                finance_csv: cfoContacts.length > 0 ? `finance-contacts-${timestamp}.csv` : null,
                revenue_sales_csv: croContacts.length > 0 ? `revenue-sales-contacts-${timestamp}.csv` : null
            }
        };
        
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`📊 Summary report: ${summaryPath}`);
        
        // Display summary
        console.log('\n📈 CONTACT DISCOVERY SUMMARY');
        console.log('=' .repeat(40));
        console.log(`Total Companies: ${allContacts.length}`);
        console.log(`Finance Contacts: ${cfoContacts.length} (${summary.cfo_success_rate})`);
        console.log(`Revenue/Sales Contacts: ${croContacts.length} (${summary.cro_success_rate})`);
        
        if (cfoContacts.length > 0 || croContacts.length > 0) {
            console.log('\n✅ CSV files created successfully!');
            console.log('📁 Files are ready for import into CRM, Excel, or other tools');
        } else {
            console.log('\n⚠️ No contacts found - pipeline may need API keys for real data');
        }
        
    } catch (error) {
        console.error('❌ Error splitting CSV:', error.message);
        process.exit(1);
    }
}

// Run the splitter
if (require.main === module) {
    const inputPath = process.argv[2]; // Optional: path to specific CSV file
    splitCsvByRole(inputPath).catch(console.error);
}

module.exports = { splitCsvByRole };
