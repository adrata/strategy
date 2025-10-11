#!/usr/bin/env node

/**
 * CHECK BUYER GROUP PROGRESS
 * 
 * Monitor buyer group discovery pipeline progress
 * Similar to check-enrichment-progress.js but tracks buyer group specific metrics
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
const OUTPUTS_DIR = path.join(__dirname, '../src/platform/pipelines/outputs');

async function checkBuyerGroupProgress() {
    try {
        await prisma.$connect();
        
        console.log('📊 BUYER GROUP DISCOVERY PROGRESS CHECK');
        console.log('=' .repeat(60));
        
        // Check database progress (if buyer group data is stored in DB)
        await checkDatabaseProgress();
        
        // Check output files progress
        await checkOutputFilesProgress();
        
        // Check checkpoint files
        await checkCheckpointProgress();
        
        // Overall summary
        await generateOverallSummary();
        
    } catch (error) {
        console.error('❌ Error checking buyer group progress:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * CHECK DATABASE PROGRESS
 */
async function checkDatabaseProgress() {
    console.log('\n🗄️ DATABASE PROGRESS:');
    
    try {
        // Count total companies
        const totalCompanies = await prisma.companies.count({
            where: {
                workspaceId: TOP_WORKSPACE_ID,
                deletedAt: null
            }
        });
        
        // Count companies with buyer group data (if stored in DB)
        // Note: This assumes buyer group data might be stored in a separate table
        // For now, we'll check for companies with enriched data as a proxy
        const enrichedCompanies = await prisma.companies.count({
            where: {
                workspaceId: TOP_WORKSPACE_ID,
                deletedAt: null,
                linkedinUrl: { not: null }
            }
        });
        
        // Count companies still needing buyer group discovery
        const needBuyerGroupDiscovery = await prisma.companies.count({
            where: {
                workspaceId: TOP_WORKSPACE_ID,
                deletedAt: null,
                OR: [
                    { description: null },
                    { size: null },
                    { linkedinUrl: null }
                ]
            }
        });
        
        console.log(`   Total companies: ${totalCompanies}`);
        console.log(`   Companies with enriched data: ${enrichedCompanies}`);
        console.log(`   Companies needing buyer group discovery: ${needBuyerGroupDiscovery}`);
        console.log(`   Database progress: ${Math.round((enrichedCompanies / totalCompanies) * 100)}%`);
        
        if (needBuyerGroupDiscovery === 0) {
            console.log('   🎉 All companies have enriched data!');
        } else {
            console.log(`   ⏳ Still processing ${needBuyerGroupDiscovery} companies...`);
        }
        
    } catch (error) {
        console.log(`   ⚠️ Database check failed: ${error.message}`);
    }
}

/**
 * CHECK OUTPUT FILES PROGRESS
 */
async function checkOutputFilesProgress() {
    console.log('\n📁 OUTPUT FILES PROGRESS:');
    
    try {
        if (!fs.existsSync(OUTPUTS_DIR)) {
            console.log('   📂 Outputs directory does not exist yet');
            return;
        }
        
        // Find buyer group output files
        const files = fs.readdirSync(OUTPUTS_DIR);
        const buyerGroupFiles = files.filter(file => 
            file.includes('buyer-group') && 
            (file.endsWith('.csv') || file.endsWith('.json'))
        );
        
        if (buyerGroupFiles.length === 0) {
            console.log('   📄 No buyer group output files found');
            return;
        }
        
        console.log(`   📊 Found ${buyerGroupFiles.length} buyer group output files:`);
        
        let totalCompanies = 0;
        let totalBuyerGroups = 0;
        let totalMembers = 0;
        let avgConfidence = 0;
        let confidenceCount = 0;
        
        for (const file of buyerGroupFiles) {
            const filePath = path.join(OUTPUTS_DIR, file);
            const stats = fs.statSync(filePath);
            const fileSize = (stats.size / 1024 / 1024).toFixed(2); // MB
            
            console.log(`   📄 ${file} (${fileSize} MB, ${stats.mtime.toLocaleString()})`);
            
            // Analyze JSON files for detailed stats
            if (file.endsWith('.json')) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    if (data.results && Array.isArray(data.results)) {
                        const companies = data.results.length;
                        const buyerGroups = data.results.filter(r => r.buyerGroup).length;
                        const members = data.results.reduce((sum, r) => sum + (r.buyerGroup?.totalMembers || 0), 0);
                        const confidence = data.results.reduce((sum, r) => sum + (r.quality?.overallConfidence || 0), 0);
                        
                        totalCompanies += companies;
                        totalBuyerGroups += buyerGroups;
                        totalMembers += members;
                        avgConfidence += confidence;
                        confidenceCount += companies;
                        
                        console.log(`      📊 ${companies} companies, ${buyerGroups} buyer groups, ${members} total members`);
                        if (companies > 0) {
                            console.log(`      📈 Average confidence: ${Math.round(confidence / companies)}%`);
                        }
                    }
                } catch (error) {
                    console.log(`      ⚠️ Could not parse JSON file: ${error.message}`);
                }
            }
        }
        
        if (totalCompanies > 0) {
            console.log(`\n   📊 OVERALL OUTPUT STATS:`);
            console.log(`   Total companies processed: ${totalCompanies}`);
            console.log(`   Buyer groups found: ${totalBuyerGroups}`);
            console.log(`   Total buyer group members: ${totalMembers}`);
            console.log(`   Average buyer group size: ${Math.round(totalMembers / totalBuyerGroups)} members`);
            console.log(`   Average confidence: ${Math.round(avgConfidence / confidenceCount)}%`);
            console.log(`   Success rate: ${Math.round((totalBuyerGroups / totalCompanies) * 100)}%`);
        }
        
    } catch (error) {
        console.log(`   ⚠️ Output files check failed: ${error.message}`);
    }
}

/**
 * CHECK CHECKPOINT PROGRESS
 */
async function checkCheckpointProgress() {
    console.log('\n💾 CHECKPOINT PROGRESS:');
    
    try {
        const checkpointDir = path.join(OUTPUTS_DIR, 'checkpoints');
        
        if (!fs.existsSync(checkpointDir)) {
            console.log('   📂 No checkpoint directory found');
            return;
        }
        
        const checkpointFiles = fs.readdirSync(checkpointDir)
            .filter(file => file.includes('buyer-group-checkpoint'))
            .sort();
        
        if (checkpointFiles.length === 0) {
            console.log('   📄 No checkpoint files found');
            return;
        }
        
        console.log(`   📊 Found ${checkpointFiles.length} checkpoint files:`);
        
        // Analyze latest checkpoint
        const latestCheckpoint = checkpointFiles[checkpointFiles.length - 1];
        const checkpointPath = path.join(checkpointDir, latestCheckpoint);
        
        try {
            const checkpointData = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
            const stats = fs.statSync(checkpointPath);
            
            console.log(`   📄 Latest: ${latestCheckpoint}`);
            console.log(`   📅 Created: ${stats.mtime.toLocaleString()}`);
            console.log(`   📊 Progress: ${checkpointData.processedCount}/${checkpointData.totalCompanies} companies`);
            console.log(`   ✅ Successful: ${checkpointData.stats?.successful || 0}`);
            console.log(`   ❌ Errors: ${checkpointData.stats?.errors || 0}`);
            console.log(`   👥 Buyer groups: ${checkpointData.stats?.buyerGroupsFound || 0}`);
            console.log(`   👤 Total members: ${checkpointData.stats?.totalMembers || 0}`);
            
            if (checkpointData.totalCompanies > 0) {
                const progress = Math.round((checkpointData.processedCount / checkpointData.totalCompanies) * 100);
                console.log(`   📈 Overall progress: ${progress}%`);
            }
            
        } catch (error) {
            console.log(`   ⚠️ Could not parse latest checkpoint: ${error.message}`);
        }
        
    } catch (error) {
        console.log(`   ⚠️ Checkpoint check failed: ${error.message}`);
    }
}

/**
 * GENERATE OVERALL SUMMARY
 */
async function generateOverallSummary() {
    console.log('\n📋 OVERALL SUMMARY:');
    console.log('=' .repeat(60));
    
    try {
        // Get latest output file for summary
        const files = fs.existsSync(OUTPUTS_DIR) ? fs.readdirSync(OUTPUTS_DIR) : [];
        const latestJsonFile = files
            .filter(file => file.includes('buyer-group') && file.endsWith('.json'))
            .sort()
            .pop();
        
        if (latestJsonFile) {
            const filePath = path.join(OUTPUTS_DIR, latestJsonFile);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.stats) {
                const stats = data.stats;
                const totalTime = Date.now() - stats.startTime;
                
                console.log(`📊 PIPELINE STATISTICS:`);
                console.log(`   Total processed: ${stats.processed || 0}`);
                console.log(`   Successful: ${stats.successful || 0}`);
                console.log(`   Errors: ${stats.errors || 0}`);
                console.log(`   Buyer groups found: ${stats.buyerGroupsFound || 0}`);
                console.log(`   Total members: ${stats.totalMembers || 0}`);
                console.log(`   Contacts enriched: ${stats.contactsEnriched || 0}`);
                console.log(`   High confidence (80%+): ${stats.highConfidence || 0}`);
                console.log(`   Cache hits: ${stats.cacheHits || 0}`);
                console.log(`   Cache misses: ${stats.cacheMisses || 0}`);
                console.log(`   API costs saved: $${(stats.apiCostsSaved || 0).toFixed(2)}`);
                console.log(`   Total processing time: ${Math.round(totalTime / 1000)}s`);
                
                if (stats.processed > 0) {
                    const successRate = Math.round((stats.successful / stats.processed) * 100);
                    const avgGroupSize = Math.round(stats.totalMembers / stats.buyerGroupsFound);
                    const avgConfidence = Math.round((stats.highConfidence / stats.buyerGroupsFound) * 100);
                    
                    console.log(`\n📈 QUALITY METRICS:`);
                    console.log(`   Success rate: ${successRate}%`);
                    console.log(`   Average buyer group size: ${avgGroupSize} members`);
                    console.log(`   High confidence rate: ${avgConfidence}%`);
                }
            }
        } else {
            console.log('📄 No buyer group output files found - pipeline may not have run yet');
        }
        
        // Recommendations
        console.log(`\n💡 RECOMMENDATIONS:`);
        
        if (latestJsonFile) {
            const filePath = path.join(OUTPUTS_DIR, latestJsonFile);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.stats) {
                const stats = data.stats;
                
                if (stats.errors > stats.successful * 0.1) {
                    console.log('   ⚠️ High error rate - check API keys and network connectivity');
                }
                
                if (stats.cacheMisses > stats.cacheHits) {
                    console.log('   💾 Low cache hit rate - consider running pipeline more frequently');
                }
                
                if (stats.highConfidence < stats.buyerGroupsFound * 0.7) {
                    console.log('   📊 Low confidence rate - review contact enrichment settings');
                }
                
                if (stats.processed > 0 && stats.successful / stats.processed > 0.9) {
                    console.log('   🎉 Pipeline performing well - ready for production use');
                }
            }
        } else {
            console.log('   🚀 Run the buyer group pipeline to start processing companies');
            console.log('   📖 Check BUYER_GROUP_EXECUTION_GUIDE.md for usage instructions');
        }
        
    } catch (error) {
        console.log(`   ⚠️ Summary generation failed: ${error.message}`);
    }
}

// CLI execution
if (require.main === module) {
    checkBuyerGroupProgress()
        .then(() => {
            console.log('\n✅ Progress check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Progress check failed:', error.message);
            process.exit(1);
        });
}

module.exports = { checkBuyerGroupProgress };
