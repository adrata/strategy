#!/usr/bin/env node

/**
 * 🗑️ DIRECT UNUSED TABLE CLEANUP
 * 
 * This script directly removes unused tables using Prisma
 * More reliable than SQL file execution
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// List of unused tables to remove
const unusedTables = [
    'App', 'AuditLog', 'Bundle', 'BundleApp', 'BuyerCompanyProfile', 'BuyerGroup',
    'ChangeLog', 'Chat', 'ChatMember', 'Company', 'ConnectedProvider', 'CreditTransaction',
    'DataRegion', 'DataTransferLog', 'DecisionMaker', 'DocumentShare', 'Email',
    'EnrichmentAnalytics', 'EnrichmentCache', 'EnrichmentExecution', 'EnrichmentStep',
    'Event', 'Grid', 'IntelligenceReport', 'Meeting', 'MembershipApp', 'Message',
    'MessageReaction', 'OpportunityActivity', 'OpportunityStakeholder', 'OutboxSettings',
    'Paper', 'Partnership', 'PartnershipLead', 'Person', 'PipelineExecution',
    'PipelineResult', 'PipelineStep', 'Pitch', 'ProviderToken', 'Role', 'RolePermission',
    'SCIMConnection', 'SCIMSyncOperation', 'SSOProvider', 'SecurityEvent', 'SecurityMetrics',
    'SellerProductPortfolio', 'SellerProfile', 'UserApp', 'UserChatReadState',
    'UserCreditBalance', 'UserProfile', 'UserRoleHistory', 'VectorEmbedding',
    'WorkspaceApp', 'WorkspaceMembership', 'WorkspaceRegion'
];

// Relationship tables to remove
const relationshipTables = [
    'ContactToOpportunity', 'EmailToAccount', 'EmailToContact', 'EmailToLead', 
    'EmailToOpportunity', 'EmailToPipelineExecution', 'EmailToProspect', 'ProspectOpportunities'
];

async function checkTableExists(tableName) {
    try {
        const result = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = ${tableName}
            ) as exists
        `;
        return result[0].exists;
    } catch (error) {
        logWarning(`Could not check table ${tableName}: ${error.message}`);
        return false;
    }
}

async function createBackup(tableName) {
    try {
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${tableName}_backup" AS SELECT * FROM "${tableName}"`);
        logSuccess(`Backed up table: ${tableName}`);
        return true;
    } catch (error) {
        logWarning(`Could not backup table ${tableName}: ${error.message}`);
        return false;
    }
}

async function dropTable(tableName) {
    try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        logSuccess(`Dropped table: ${tableName}`);
        return true;
    } catch (error) {
        logError(`Could not drop table ${tableName}: ${error.message}`);
        return false;
    }
}

async function getCurrentTableCount() {
    try {
        const result = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        return result[0].count;
    } catch (error) {
        logError(`Failed to get table count: ${error.message}`);
        return null;
    }
}

async function main() {
    log(`${colors.bright}${colors.magenta}🗑️  DIRECT UNUSED TABLE CLEANUP${colors.reset}`);
    log(`${colors.yellow}⚠️  This will permanently delete unused tables and their data${colors.reset}\n`);
    
    try {
        await prisma.$connect();
        logSuccess('Database connection established');
        
        const initialTableCount = await getCurrentTableCount();
        logInfo(`Initial table count: ${initialTableCount}`);
        
        // Check which unused tables exist
        const existingTables = [];
        for (const table of [...unusedTables, ...relationshipTables]) {
            if (await checkTableExists(table)) {
                existingTables.push(table);
            }
        }
        
        logInfo(`Found ${existingTables.length} unused tables to remove`);
        
        if (existingTables.length === 0) {
            logSuccess('No unused tables found. Cleanup not needed.');
            return;
        }
        
        // Create backups
        log(`\n${colors.cyan}=== CREATING BACKUPS ===${colors.reset}`);
        for (const table of existingTables) {
            await createBackup(table);
        }
        
        // Drop tables
        log(`\n${colors.cyan}=== REMOVING UNUSED TABLES ===${colors.reset}`);
        for (const table of existingTables) {
            await dropTable(table);
        }
        
        // Verify cleanup
        const finalTableCount = await getCurrentTableCount();
        const tablesRemoved = initialTableCount - finalTableCount;
        
        log(`\n${colors.cyan}=== CLEANUP SUMMARY ===${colors.reset}`);
        logInfo(`Tables before cleanup: ${initialTableCount}`);
        logInfo(`Tables after cleanup: ${finalTableCount}`);
        logSuccess(`Tables removed: ${tablesRemoved}`);
        
        // Check if any unused tables still exist
        const remainingUnusedTables = [];
        for (const table of [...unusedTables, ...relationshipTables]) {
            if (await checkTableExists(table)) {
                remainingUnusedTables.push(table);
            }
        }
        
        if (remainingUnusedTables.length > 0) {
            logWarning(`Some unused tables still exist: ${remainingUnusedTables.join(', ')}`);
        } else {
            logSuccess('All unused tables have been successfully removed!');
        }
        
        logSuccess('\n🎉 Cleanup completed successfully!');
        logInfo('Your database is now cleaner and more maintainable.');
        
    } catch (error) {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    logWarning('\nCleanup interrupted by user');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logWarning('\nCleanup terminated');
    await prisma.$disconnect();
    process.exit(0);
});

// Run the main function
if (require.main === module) {
    main().catch(error => {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main };
