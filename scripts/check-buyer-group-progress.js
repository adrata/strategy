#!/usr/bin/env node

/**
 * CHECK BUYER GROUP PROGRESS
 * 
 * Monitor the progress of buyer group pipeline execution
 * Similar to check-enrichment-progress.js but for buyer group discovery
 */

const fs = require('fs');
const path = require('path');

class BuyerGroupProgressChecker {
    constructor() {
        this.outputDir = path.join(__dirname, '../src/platform/pipelines/outputs');
        this.checkpointDir = path.join(__dirname, '../src/platform/pipelines/outputs/checkpoints');
    }

    /**
     * CHECK CURRENT PROGRESS
     */
    async checkProgress() {
        console.log('🔍 BUYER GROUP PIPELINE PROGRESS CHECKER');
        console.log('=' .repeat(60));
        console.log('Checking buyer group discovery progress...\n');

        try {
            // Check for output files
            await this.checkOutputFiles();
            
            // Check for checkpoint files
            await this.checkCheckpointFiles();
            
            // Check for error logs
            await this.checkErrorLogs();
            
            // Check database progress
            await this.checkDatabaseProgress();
            
        } catch (error) {
            console.error('❌ Error checking progress:', error.message);
        }
    }

    /**
     * CHECK OUTPUT FILES
     */
    async checkOutputFiles() {
        console.log('📊 Checking Output Files...');
        
        if (!fs.existsSync(this.outputDir)) {
            console.log('   ⚠️ Output directory does not exist');
            return;
        }

        const files = fs.readdirSync(this.outputDir);
        const buyerGroupFiles = files.filter(file => 
            file.includes('buyer-group') && 
            (file.endsWith('.csv') || file.endsWith('.json'))
        );

        if (buyerGroupFiles.length === 0) {
            console.log('   ⚠️ No buyer group output files found');
            return;
        }

        console.log(`   📁 Found ${buyerGroupFiles.length} buyer group files:`);
        
        for (const file of buyerGroupFiles) {
            const filePath = path.join(this.outputDir, file);
            const stats = fs.statSync(filePath);
            const sizeKB = Math.round(stats.size / 1024);
            const modified = stats.mtime.toLocaleString();
            
            console.log(`   📄 ${file} (${sizeKB}KB, modified: ${modified})`);
            
            // If it's a CSV, try to count rows
            if (file.endsWith('.csv')) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim());
                    const dataRows = lines.length - 1; // Subtract header
                    console.log(`      📊 ${dataRows} companies processed`);
                } catch (error) {
                    console.log(`      ⚠️ Could not read CSV content`);
                }
            }
        }
    }

    /**
     * CHECK CHECKPOINT FILES
     */
    async checkCheckpointFiles() {
        console.log('\n💾 Checking Checkpoint Files...');
        
        if (!fs.existsSync(this.checkpointDir)) {
            console.log('   ⚠️ Checkpoint directory does not exist');
            return;
        }

        const files = fs.readdirSync(this.checkpointDir);
        const checkpointFiles = files.filter(file => 
            file.includes('buyer-group-checkpoint') && file.endsWith('.json')
        );

        if (checkpointFiles.length === 0) {
            console.log('   ⚠️ No checkpoint files found');
            return;
        }

        console.log(`   📁 Found ${checkpointFiles.length} checkpoint files:`);
        
        // Sort by modification time (newest first)
        const sortedFiles = checkpointFiles.sort((a, b) => {
            const aPath = path.join(this.checkpointDir, a);
            const bPath = path.join(this.checkpointDir, b);
            return fs.statSync(bPath).mtime - fs.statSync(aPath).mtime;
        });

        for (const file of sortedFiles.slice(0, 5)) { // Show last 5 checkpoints
            const filePath = path.join(this.checkpointDir, file);
            const stats = fs.statSync(filePath);
            const modified = stats.mtime.toLocaleString();
            
            try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const processed = content.processedCount || 0;
                const total = content.totalCompanies || 0;
                const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
                
                console.log(`   📄 ${file}`);
                console.log(`      📊 Progress: ${processed}/${total} (${progress}%)`);
                console.log(`      ⏰ Modified: ${modified}`);
                
                if (content.stats) {
                    const stats = content.stats;
                    console.log(`      ✅ Successful: ${stats.successful || 0}`);
                    console.log(`      ❌ Errors: ${stats.errors || 0}`);
                    console.log(`      👥 Buyer Groups: ${stats.buyerGroupsFound || 0}`);
                    console.log(`      📧 Contacts Enriched: ${stats.contactsEnriched || 0}`);
                }
                
            } catch (error) {
                console.log(`   ⚠️ Could not read checkpoint: ${file}`);
            }
        }
    }

    /**
     * CHECK ERROR LOGS
     */
    async checkErrorLogs() {
        console.log('\n🚨 Checking Error Logs...');
        
        const errorLogPath = path.join(__dirname, '../src/platform/pipelines/pipelines/core/logs/buyer-group-errors.json');
        
        if (!fs.existsSync(errorLogPath)) {
            console.log('   ✅ No error logs found');
            return;
        }

        try {
            const content = JSON.parse(fs.readFileSync(errorLogPath, 'utf8'));
            const errorCount = content.length;
            
            if (errorCount === 0) {
                console.log('   ✅ No errors logged');
                return;
            }

            console.log(`   ⚠️ Found ${errorCount} errors:`);
            
            // Show recent errors
            const recentErrors = content.slice(-5);
            for (const error of recentErrors) {
                const timestamp = new Date(error.timestamp).toLocaleString();
                const company = error.context?.company || 'Unknown';
                const message = error.error?.message || 'Unknown error';
                
                console.log(`   📄 ${timestamp} - ${company}: ${message}`);
            }
            
        } catch (error) {
            console.log('   ⚠️ Could not read error logs');
        }
    }

    /**
     * CHECK DATABASE PROGRESS (STREAMLINED)
     */
    async checkDatabaseProgress() {
        console.log('\n💾 Checking Database Progress...');
        
        try {
            // Try to connect to database and check buyer group records
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            // Count people with buyer group roles
            const memberCount = await prisma.people.count({
                where: {
                    buyerGroupRole: {
                        not: null
                    }
                }
            });
            
            // Count unique companies with buyer group members
            const companyCount = await prisma.people.groupBy({
                by: ['companyId'],
                where: {
                    buyerGroupRole: {
                        not: null
                    },
                    companyId: {
                        not: null
                    }
                }
            });
            
            console.log(`   📊 Companies with Buyer Groups: ${companyCount.length}`);
            console.log(`   👥 Total Buyer Group Members: ${memberCount}`);
            
            if (memberCount > 0) {
                const avgMembers = companyCount.length > 0 ? Math.round(memberCount / companyCount.length) : 0;
                console.log(`   📈 Average Members per Company: ${avgMembers}`);
                
                // Check recent activity
                const recentMembers = await prisma.people.findMany({
                    where: {
                        buyerGroupRole: {
                            not: null
                        }
                    },
                    include: {
                        company: true
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 10
                });
                
                console.log('   📄 Recent Buyer Group Members:');
                const groupedByCompany = {};
                recentMembers.forEach(member => {
                    const companyName = member.company?.name || 'Unknown Company';
                    if (!groupedByCompany[companyName]) {
                        groupedByCompany[companyName] = [];
                    }
                    groupedByCompany[companyName].push(member);
                });
                
                Object.entries(groupedByCompany).slice(0, 5).forEach(([company, members]) => {
                    const date = members[0].updatedAt.toLocaleString();
                    const roles = members.map(m => m.buyerGroupRole).join(', ');
                    console.log(`      ${company}: ${members.length} members (${roles}) - ${date}`);
                });
            }
            
            await prisma.$disconnect();
            
        } catch (error) {
            console.log('   ⚠️ Could not connect to database:', error.message);
        }
    }

    /**
     * GET SUMMARY
     */
    getSummary() {
        console.log('\n📋 SUMMARY');
        console.log('=' .repeat(30));
        console.log('Use this information to monitor buyer group pipeline progress:');
        console.log('• Check output files for completed results');
        console.log('• Monitor checkpoint files for real-time progress');
        console.log('• Review error logs for any issues');
        console.log('• Check database for stored buyer groups');
        console.log('\n💡 Tips:');
        console.log('• Run this script regularly during pipeline execution');
        console.log('• Check the latest checkpoint file for current progress');
        console.log('• Review error logs if pipeline seems stuck');
        console.log('• Database records indicate successful processing');
    }
}

// CLI execution
if (require.main === module) {
    const checker = new BuyerGroupProgressChecker();
    
    checker.checkProgress()
        .then(() => {
            checker.getSummary();
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Progress check failed:', error.message);
            process.exit(1);
        });
}

module.exports = BuyerGroupProgressChecker;
