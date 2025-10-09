#!/usr/bin/env node

/**
 * CSV Splitter Demo
 * Demonstrates the CSV splitting functionality with sample data
 */

const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

async function createSampleData() {
    console.log('🧪 CSV SPLITTER DEMO');
    console.log('=' .repeat(40));
    
    try {
        // Create sample data with CFO and CRO contacts
        const sampleData = [
            {
                'Company Name': 'Salesforce',
                'Website': 'https://www.salesforce.com',
                'Industry': 'Software',
                'Employee Count': '50000',
                'Headquarters': 'San Francisco, CA',
                'Public/Private': 'Public',
                'Parent Company': '',
                'Relation Type': 'original',
                'CFO Name': 'Amy Weaver',
                'CFO Title': 'Chief Financial Officer',
                'CFO Email': 'amy.weaver@salesforce.com',
                'CFO Phone': '+1-415-901-7000',
                'CFO LinkedIn': 'https://linkedin.com/in/amyweaver',
                'CFO Confidence': '95',
                'CFO Tier': 'A',
                'CFO Person Confidence': '98',
                'CFO Person Sources': 'CoreSignal,Lusha',
                'CFO Person Reasoning': 'Multiple sources confirm CFO role',
                'CFO Email Confidence': '92',
                'CFO Email Validation Steps': 'Syntax,Domain,SMTP',
                'CFO Email Reasoning': 'Valid corporate email format',
                'CFO Phone Confidence': '88',
                'CFO Phone Sources': 'Lusha,PDL',
                'CFO Phone Reasoning': 'Corporate phone number verified',
                'CFO Overall Confidence': '93',
                'CFO Data Quality Grade': 'A',
                'CRO Name': 'Gavin Patterson',
                'CRO Title': 'Chief Revenue Officer',
                'CRO Email': 'gavin.patterson@salesforce.com',
                'CRO Phone': '+1-415-901-7001',
                'CRO LinkedIn': 'https://linkedin.com/in/gavinpatterson',
                'CRO Confidence': '89',
                'CRO Tier': 'A',
                'CRO Person Confidence': '91',
                'CRO Person Sources': 'CoreSignal,Lusha',
                'CRO Person Reasoning': 'Confirmed CRO role at Salesforce',
                'CRO Email Confidence': '87',
                'CRO Email Validation Steps': 'Syntax,Domain,SMTP',
                'CRO Email Reasoning': 'Valid corporate email',
                'CRO Phone Confidence': '85',
                'CRO Phone Sources': 'Lusha',
                'CRO Phone Reasoning': 'Corporate phone verified',
                'CRO Overall Confidence': '88',
                'CRO Data Quality Grade': 'A',
                'Account Owner': 'Test User',
                'Research Date': '2025-10-09'
            },
            {
                'Company Name': 'HubSpot',
                'Website': 'https://www.hubspot.com',
                'Industry': 'Software',
                'Employee Count': '8000',
                'Headquarters': 'Cambridge, MA',
                'Public/Private': 'Public',
                'Parent Company': '',
                'Relation Type': 'original',
                'CFO Name': 'Kate Bueker',
                'CFO Title': 'Chief Financial Officer',
                'CFO Email': 'kate.bueker@hubspot.com',
                'CFO Phone': '+1-617-482-3000',
                'CFO LinkedIn': 'https://linkedin.com/in/katebueker',
                'CFO Confidence': '92',
                'CFO Tier': 'A',
                'CFO Person Confidence': '94',
                'CFO Person Sources': 'CoreSignal,Lusha',
                'CFO Person Reasoning': 'Confirmed CFO role',
                'CFO Email Confidence': '89',
                'CFO Email Validation Steps': 'Syntax,Domain,SMTP',
                'CFO Email Reasoning': 'Valid corporate email',
                'CFO Phone Confidence': '86',
                'CFO Phone Sources': 'Lusha',
                'CFO Phone Reasoning': 'Corporate phone verified',
                'CFO Phone Type': 'Mobile',
                'CFO Phone Carrier': 'Verizon',
                'CFO Overall Confidence': '90',
                'CFO Data Quality Grade': 'A',
                'CRO Name': 'Yamini Rangan',
                'CRO Title': 'Chief Revenue Officer',
                'CRO Email': 'yamini.rangan@hubspot.com',
                'CRO Phone': '+1-617-482-3001',
                'CRO LinkedIn': 'https://linkedin.com/in/yaminirangan',
                'CRO Confidence': '87',
                'CRO Tier': 'A',
                'CRO Person Confidence': '89',
                'CRO Person Sources': 'CoreSignal,Lusha',
                'CRO Person Reasoning': 'Confirmed CRO role',
                'CRO Email Confidence': '84',
                'CRO Email Validation Steps': 'Syntax,Domain,SMTP',
                'CRO Email Reasoning': 'Valid corporate email',
                'CRO Phone Confidence': '82',
                'CRO Phone Sources': 'Lusha',
                'CRO Phone Reasoning': 'Corporate phone verified',
                'CRO Overall Confidence': '85',
                'CRO Data Quality Grade': 'A',
                'Account Owner': 'Test User',
                'Research Date': '2025-10-09'
            },
            {
                'Company Name': 'Shopify',
                'Website': 'https://www.shopify.com',
                'Industry': 'E-commerce',
                'Employee Count': '10000',
                'Headquarters': 'Ottawa, ON',
                'Public/Private': 'Public',
                'Parent Company': '',
                'Relation Type': 'original',
                'CFO Name': 'Jeff Hoffmeister',
                'CFO Title': 'Chief Financial Officer',
                'CFO Email': 'jeff.hoffmeister@shopify.com',
                'CFO Phone': '+1-613-241-2828',
                'CFO LinkedIn': 'https://linkedin.com/in/jeffhoffmeister',
                'CFO Confidence': '91',
                'CFO Tier': 'A',
                'CFO Person Confidence': '93',
                'CFO Person Sources': 'CoreSignal,Lusha',
                'CFO Person Reasoning': 'Confirmed CFO role',
                'CFO Email Confidence': '88',
                'CFO Email Validation Steps': 'Syntax,Domain,SMTP',
                'CFO Email Reasoning': 'Valid corporate email',
                'CFO Phone Confidence': '85',
                'CFO Phone Sources': 'Lusha',
                'CFO Phone Reasoning': 'Corporate phone verified',
                'CFO Overall Confidence': '89',
                'CFO Data Quality Grade': 'A',
                'CRO Name': 'Harley Finkelstein',
                'CRO Title': 'Chief Revenue Officer',
                'CRO Email': 'harley.finkelstein@shopify.com',
                'CRO Phone': '+1-613-241-2829',
                'CRO LinkedIn': 'https://linkedin.com/in/harleyfinkelstein',
                'CRO Confidence': '86',
                'CRO Tier': 'A',
                'CRO Person Confidence': '88',
                'CRO Person Sources': 'CoreSignal,Lusha',
                'CRO Person Reasoning': 'Confirmed CRO role',
                'CRO Email Confidence': '83',
                'CRO Email Validation Steps': 'Syntax,Domain,SMTP',
                'CRO Email Reasoning': 'Valid corporate email',
                'CRO Phone Confidence': '81',
                'CRO Phone Sources': 'Lusha',
                'CRO Phone Reasoning': 'Corporate phone verified',
                'CRO Overall Confidence': '84',
                'CRO Data Quality Grade': 'A',
                'Account Owner': 'Test User',
                'Research Date': '2025-10-09'
            }
        ];
        
        // Create demo directory
        const demoDir = path.join(__dirname, 'demo-output');
        if (!fs.existsSync(demoDir)) {
            fs.mkdirSync(demoDir, { recursive: true });
        }
        
        // Create sample CSV file
        const sampleCsvPath = path.join(demoDir, 'sample-contacts.csv');
        const csvWriter = createObjectCsvWriter({
            path: sampleCsvPath,
            header: Object.keys(sampleData[0]).map(key => ({ id: key, title: key }))
        });
        
        await csvWriter.writeRecords(sampleData);
        console.log(`📝 Created sample CSV: ${sampleCsvPath}`);
        
        // Now run the splitter on the sample data
        console.log('\n🔄 Running CSV splitter on sample data...');
        const { splitCsvByRole } = require('./split-csv-by-role');
        await splitCsvByRole(sampleCsvPath);
        
        console.log('\n✅ Demo completed successfully!');
        console.log('\n📁 Files created:');
        console.log('   - sample-contacts.csv (original combined data)');
        console.log('   - cfo-contacts-[date].csv (CFO contacts only)');
        console.log('   - cro-contacts-[date].csv (CRO contacts only)');
        console.log('   - contacts-summary-[date].json (summary report)');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        process.exit(1);
    }
}

// Run the demo
if (require.main === module) {
    createSampleData().catch(console.error);
}

module.exports = { createSampleData };
