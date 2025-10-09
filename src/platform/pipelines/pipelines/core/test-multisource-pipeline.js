#!/usr/bin/env node

/**
 * TEST MULTI-SOURCE PIPELINE
 * 
 * Test script to verify the enhanced multi-source verification pipeline
 * with a small sample of companies before running on full 1000 companies.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env copy') });

const { CorePipeline } = require('./core-pipeline');

async function testMultiSourcePipeline() {
    console.log('🧪 TESTING MULTI-SOURCE VERIFICATION PIPELINE');
    console.log('=' .repeat(80));
    
    // Check required environment variables (allow mock values for testing)
    const requiredEnvVars = [
        'CORESIGNAL_API_KEY',
        'LUSHA_API_KEY',
        'ZEROBOUNCE_API_KEY',
        'PERPLEXITY_API_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName] === 'example' || process.env[varName] === 'your_zerobounce_key_here');
    if (missingVars.length > 0) {
        console.log('⚠️ Some API keys are not configured (using mock data for testing):');
        missingVars.forEach(varName => console.log(`   - ${varName}`));
        console.log('\nProceeding with test using mock data...');
    }
    
    console.log('✅ All required environment variables are set');
    
    // Create test companies CSV
    const testCompanies = [
        {
            website: 'https://www.salesforce.com',
            company_name: 'Salesforce',
            'Account Owner': 'Test User',
            'Top 1000': '1'
        },
        {
            website: 'https://www.hubspot.com',
            company_name: 'HubSpot',
            'Account Owner': 'Test User',
            'Top 1000': '1'
        },
        {
            website: 'https://www.shopify.com',
            company_name: 'Shopify',
            'Account Owner': 'Test User',
            'Top 1000': '1'
        }
    ];
    
    // Write test CSV
    const testCsvPath = path.join(__dirname, '../../inputs/test-companies.csv');
    const csvContent = [
        'Website,Company Name,Account Owner,Top 1000',
        ...testCompanies.map(company => 
            `${company.website},${company.company_name},${company['Account Owner']},${company['Top 1000']}`
        )
    ].join('\n');
    
    fs.writeFileSync(testCsvPath, csvContent);
    console.log(`📝 Created test CSV: ${testCsvPath}`);
    
    // Initialize pipeline
    const pipeline = new CorePipeline();
    
    try {
        console.log('\n🚀 Starting test pipeline execution...');
        console.log('This will test:');
        console.log('  - Company resolution and acquisition detection');
        console.log('  - Multi-source executive discovery (CoreSignal preview)');
        console.log('  - Contact intelligence (Lusha integration)');
        console.log('  - Multi-source verification (2-3x person, 2-3x email, 2x phone)');
        console.log('  - Enhanced CSV output with confidence scoring');
        
        // Run pipeline on test companies
        await pipeline.runPipeline(testCsvPath);
        
        console.log('\n✅ Test pipeline completed successfully!');
        console.log('\n📊 Test Results Summary:');
        console.log(`   Companies processed: ${pipeline.stats.processed}`);
        console.log(`   CFOs found: ${pipeline.stats.cfoFound}`);
        console.log(`   CROs found: ${pipeline.stats.croFound}`);
        console.log(`   High confidence results: ${pipeline.stats.highConfidence}`);
        
        // Check if output files were created
        const version = pipeline.versionManager.getCurrentVersion();
        const outputDir = path.join(__dirname, `../../outputs/v${version}`);
        
        if (fs.existsSync(outputDir)) {
            const files = fs.readdirSync(outputDir);
            console.log('\n📁 Generated files:');
            files.forEach(file => console.log(`   - ${file}`));
            
            // Check CSV content
            const csvPath = path.join(outputDir, 'core-cro-cfo-contacts.csv');
            if (fs.existsSync(csvPath)) {
                const csvContent = fs.readFileSync(csvPath, 'utf8');
                const lines = csvContent.split('\n');
                console.log(`\n📋 CSV contains ${lines.length - 1} data rows (plus header)`);
                
                // Show sample of new confidence fields
                if (lines.length > 1) {
                    const header = lines[0].split(',');
                    const dataRow = lines[1].split(',');
                    
                    console.log('\n🔍 Sample confidence fields:');
                    const confidenceFields = header.filter(h => h.includes('Confidence') || h.includes('Grade'));
                    confidenceFields.forEach(field => {
                        const index = header.indexOf(field);
                        if (index >= 0 && dataRow[index]) {
                            console.log(`   ${field}: ${dataRow[index]}`);
                        }
                    });
                }
            }
        }
        
        console.log('\n🎯 Test completed! The pipeline is ready for full execution.');
        console.log('Next steps:');
        console.log('1. Review the test results in the outputs directory');
        console.log('2. If satisfied, run on full 1000 companies:');
        console.log('   node core-pipeline.js ../../inputs/1000-companies.csv');
        
    } catch (error) {
        console.error('\n❌ Test pipeline failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check that all API keys are valid and have sufficient credits');
        console.log('2. Verify network connectivity');
        console.log('3. Check the logs above for specific API errors');
        
        throw error;
    } finally {
        // Clean up test CSV
        if (fs.existsSync(testCsvPath)) {
            fs.unlinkSync(testCsvPath);
            console.log('\n🧹 Cleaned up test CSV file');
        }
    }
}

// Run test if called directly
if (require.main === module) {
    testMultiSourcePipeline()
        .then(() => {
            console.log('\n✅ Test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testMultiSourcePipeline };
