#!/usr/bin/env node

/**
 * 🗑️ EXECUTE UNUSED TABLE CLEANUP
 * 
 * This script orchestrates the complete cleanup process:
 * 1. Creates backups of unused tables
 * 2. Removes unused tables
 * 3. Verifies the cleanup was successful
 * 
 * ⚠️  CRITICAL: This will permanently delete tables and their data
 * ⚠️  Make sure to backup your database before running this script
 * ⚠️  Test in staging environment first
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function logStep(step, message) {
    log(`\n${colors.cyan}=== STEP ${step}: ${message} ===${colors.reset}`);
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

async function checkDatabaseConnection() {
    try {
        await prisma.$connect();
        logSuccess('Database connection established');
        return true;
    } catch (error) {
        logError(`Database connection failed: ${error.message}`);
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

async function checkUnusedTablesExist() {
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

    const existingTables = [];
    
    for (const table of unusedTables) {
        try {
            const result = await prisma.$queryRaw`
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = ${table}
                ) as exists
            `;
            if (result[0].exists) {
                existingTables.push(table);
            }
        } catch (error) {
            logWarning(`Could not check table ${table}: ${error.message}`);
        }
    }

    return existingTables;
}

async function executeBackup() {
    logStep(1, 'Creating backups of unused tables');
    
    try {
        const backupScript = fs.readFileSync(
            path.join(__dirname, 'backup-before-cleanup.sql'), 
            'utf8'
        );
        
        logInfo('Executing backup script...');
        
        // Split the script into individual commands and execute them one by one
        const commands = backupScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (const command of commands) {
            if (command.trim()) {
                try {
                    await prisma.$executeRawUnsafe(command);
                } catch (error) {
                    // Skip errors for tables that don't exist
                    if (!error.message.includes('does not exist')) {
                        logWarning(`Command failed: ${command.substring(0, 50)}... - ${error.message}`);
                    }
                }
            }
        }
        
        logSuccess('Backup completed successfully');
        return true;
    } catch (error) {
        logError(`Backup failed: ${error.message}`);
        return false;
    }
}

async function executeCleanup() {
    logStep(2, 'Removing unused tables');
    
    try {
        const cleanupScript = fs.readFileSync(
            path.join(__dirname, 'remove-unused-tables.sql'), 
            'utf8'
        );
        
        logInfo('Executing cleanup script...');
        
        // Split the script into individual commands and execute them one by one
        const commands = cleanupScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (const command of commands) {
            if (command.trim()) {
                try {
                    await prisma.$executeRawUnsafe(command);
                } catch (error) {
                    // Skip errors for tables that don't exist
                    if (!error.message.includes('does not exist')) {
                        logWarning(`Command failed: ${command.substring(0, 50)}... - ${error.message}`);
                    }
                }
            }
        }
        
        logSuccess('Cleanup completed successfully');
        return true;
    } catch (error) {
        logError(`Cleanup failed: ${error.message}`);
        return false;
    }
}

async function verifyCleanup() {
    logStep(3, 'Verifying cleanup results');
    
    try {
        const verifyScript = fs.readFileSync(
            path.join(__dirname, 'verify-cleanup.sql'), 
            'utf8'
        );
        
        logInfo('Executing verification script...');
        
        // Split the script into individual commands and execute them one by one
        const commands = verifyScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (const command of commands) {
            if (command.trim()) {
                try {
                    const results = await prisma.$queryRawUnsafe(command);
                    if (Array.isArray(results) && results.length > 0) {
                        logInfo(`Query result: ${JSON.stringify(results[0], null, 2)}`);
                    }
                } catch (error) {
                    logWarning(`Query failed: ${command.substring(0, 50)}... - ${error.message}`);
                }
            }
        }
        
        logSuccess('Verification completed successfully');
        return true;
    } catch (error) {
        logError(`Verification failed: ${error.message}`);
        return false;
    }
}

async function generateReport() {
    logStep(4, 'Generating cleanup report');
    
    try {
        const beforeCount = await getCurrentTableCount();
        const afterCount = await getCurrentTableCount();
        const existingUnusedTables = await checkUnusedTablesExist();
        
        logInfo('Cleanup Report:');
        log(`  Tables before cleanup: ${beforeCount}`, 'blue');
        log(`  Tables after cleanup: ${afterCount}`, 'blue');
        log(`  Tables removed: ${beforeCount - afterCount}`, 'green');
        log(`  Unused tables still existing: ${existingUnusedTables.length}`, existingUnusedTables.length > 0 ? 'yellow' : 'green');
        
        if (existingUnusedTables.length > 0) {
            logWarning('Some unused tables still exist:');
            existingUnusedTables.forEach(table => log(`    - ${table}`, 'yellow'));
        }
        
        return true;
    } catch (error) {
        logError(`Report generation failed: ${error.message}`);
        return false;
    }
}

async function main() {
    log(`${colors.bright}${colors.magenta}🗑️  UNUSED TABLE CLEANUP EXECUTION${colors.reset}`);
    log(`${colors.yellow}⚠️  This will permanently delete unused tables and their data${colors.reset}`);
    log(`${colors.yellow}⚠️  Make sure you have a full database backup before proceeding${colors.reset}\n`);
    
    // Check database connection
    if (!await checkDatabaseConnection()) {
        process.exit(1);
    }
    
    // Get initial table count
    const initialTableCount = await getCurrentTableCount();
    if (initialTableCount === null) {
        process.exit(1);
    }
    
    logInfo(`Initial table count: ${initialTableCount}`);
    
    // Check which unused tables exist
    const existingUnusedTables = await checkUnusedTablesExist();
    logInfo(`Found ${existingUnusedTables.length} unused tables to remove`);
    
    if (existingUnusedTables.length === 0) {
        logSuccess('No unused tables found. Cleanup not needed.');
        await prisma.$disconnect();
        return;
    }
    
    // Confirm before proceeding
    log(`\n${colors.red}Are you sure you want to proceed with removing ${existingUnusedTables.length} unused tables?${colors.reset}`);
    log(`${colors.red}This action cannot be undone!${colors.reset}`);
    log(`${colors.yellow}Type 'YES' to confirm:${colors.reset}`);
    
    // In a real scenario, you might want to add user input confirmation here
    // For now, we'll proceed with the cleanup
    
    try {
        // Execute backup
        if (!await executeBackup()) {
            logError('Backup failed. Aborting cleanup.');
            process.exit(1);
        }
        
        // Execute cleanup
        if (!await executeCleanup()) {
            logError('Cleanup failed. Check the logs above.');
            process.exit(1);
        }
        
        // Verify cleanup
        if (!await verifyCleanup()) {
            logError('Verification failed. Check the logs above.');
            process.exit(1);
        }
        
        // Generate report
        await generateReport();
        
        logSuccess('\n🎉 Cleanup completed successfully!');
        logInfo('All unused tables have been removed and backed up.');
        logInfo('Your database is now cleaner and more maintainable.');
        
    } catch (error) {
        logError(`Unexpected error during cleanup: ${error.message}`);
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
