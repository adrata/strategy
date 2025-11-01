#!/usr/bin/env node

/**
 * WINNING VARIANT BUYER GROUP DISCOVERY
 * 
 * Run buyer group discovery for the 4 target companies using the existing pipeline
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import the buyer group pipeline
const BuyerGroupPipeline = require('../src/platform/pipelines/pipelines/core/buyer-group-pipeline');

async function discoverWinningVariantBuyerGroups() {
    console.log('🎯 Starting buyer group discovery for Winning Variant demo...\n');

    // Initialize the pipeline
    const pipeline = new BuyerGroupPipeline();
    
    // Target companies for Winning Variant
    const companies = [
        {
            name: "Match Group",
            website: "https://mtch.com",
            industry: "Online Dating",
            size: "2000+ employees"
        },
        {
            name: "Brex", 
            website: "https://brex.com",
            industry: "FinTech",
            size: "500-1000 employees"
        },
        {
            name: "First Premier Bank",
            website: "https://firstpremier.com", 
            industry: "Banking",
            size: "1000-5000 employees"
        },
        {
            name: "Zuora",
            website: "https://zuora.com",
            industry: "Subscription Management", 
            size: "1000-5000 employees"
        }
    ];

    const results = [];

    for (const company of companies) {
        try {
            console.log(`\n🔍 Discovering buyer group for: ${company.name}`);
            
            // Run buyer group discovery
            const result = await pipeline.discoverBuyerGroup({
                companyName: company.name,
                website: company.website,
                industry: company.industry,
                companySize: company.size,
                workspaceId: 'demo-workspace-winning-variant',
                enrichmentLevel: 'enrich' // Medium level with contact details
            });

            if (result.success) {
                console.log(`✅ ${company.name} - ${result.members.length} buyer group members found`);
                console.log(`   Processing time: ${result.metadata?.executionTime}ms`);
                
                // Save individual result
                const outputDir = path.join(__dirname, '..', 'src', 'app', '(workshop)', 'private', 'winning-variant', 'data');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                const filename = `${company.name.toLowerCase().replace(/\s+/g, '-')}-buyer-group.json`;
                const filepath = path.join(outputDir, filename);
                
                fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
                console.log(`   📁 Data saved to: ${filepath}`);
                
                results.push({
                    company: company.name,
                    success: true,
                    members: result.members.length,
                    filepath: filepath
                });
                
            } else {
                console.log(`❌ ${company.name} - Discovery failed: ${result.error}`);
                results.push({
                    company: company.name,
                    success: false,
                    error: result.error
                });
            }
            
        } catch (error) {
            console.error(`❌ Error discovering ${company.name}:`, error.message);
            results.push({
                company: company.name,
                success: false,
                error: error.message
            });
        }
    }

    // Summary
    console.log('\n📊 Discovery Summary:');
    console.log('====================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
        console.log('\n📁 Generated Files:');
        successful.forEach(r => {
            console.log(`   ${r.company}: ${r.filepath}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ Failed Companies:');
        failed.forEach(r => {
            console.log(`   ${r.company}: ${r.error}`);
        });
    }

    console.log('\n🎉 Buyer group discovery complete!');
    console.log('You can now create the report pages using this data.');
}

// Run the discovery
discoverWinningVariantBuyerGroups().catch(console.error);
