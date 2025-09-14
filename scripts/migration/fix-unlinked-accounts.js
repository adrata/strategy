#!/usr/bin/env node

/**
 * 🔧 FIX UNLINKED ACCOUNTS
 * 
 * Fixes the remaining 56 unlinked accounts to achieve 100% company mapping by:
 * 1. Finding accounts without companyId
 * 2. Creating core company records for them
 * 3. Linking accounts to their core company records
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

async function fixUnlinkedAccounts() {
    log(`🔧 FIXING UNLINKED ACCOUNTS`, 'cyan');
    log(`Achieving 100% company mapping\n`);

    try {
        // 1. Find all unlinked accounts
        const unlinkedAccounts = await prisma.accounts.findMany({
            where: { companyId: null },
            select: {
                id: true,
                name: true,
                website: true,
                industry: true,
                size: true,
                description: true,
                address: true,
                city: true,
                state: true,
                country: true,
                revenue: true,
                workspaceId: true
            }
        });

        logInfo(`Found ${unlinkedAccounts.length} unlinked accounts`);

        if (unlinkedAccounts.length === 0) {
            logSuccess('All accounts are already linked!');
            return;
        }

        // 2. Group accounts by unique company name
        const uniqueCompanies = new Map();
        
        for (const account of unlinkedAccounts) {
            const companyName = account.name;
            
            if (!companyName) {
                logWarning(`Skipping account ${account.id} - no company name`);
                continue;
            }

            if (!uniqueCompanies.has(companyName)) {
                uniqueCompanies.set(companyName, []);
            }
            uniqueCompanies.get(companyName).push(account);
        }

        logInfo(`Identified ${uniqueCompanies.size} unique companies from ${unlinkedAccounts.length} accounts`);

        // 3. Create core company records and link accounts
        let createdCompanies = 0;
        let linkedAccounts = 0;
        let skippedAccounts = 0;

        for (const [companyName, accounts] of uniqueCompanies) {
            try {
                // Use the first account as the primary data source
                const primaryAccount = accounts[0];
                
                // Check if company already exists
                let coreCompany = await prisma.company.findFirst({
                    where: { name: companyName }
                });
                
                if (!coreCompany) {
                    // Create new core company record
                    coreCompany = await prisma.company.create({
                        data: {
                            name: companyName,
                            website: primaryAccount.website,
                            industry: primaryAccount.industry,
                            size: primaryAccount.size,
                            description: primaryAccount.description,
                            headquarters: [primaryAccount.address, primaryAccount.city, primaryAccount.state, primaryAccount.country].filter(Boolean).join(', '),
                            revenue: primaryAccount.revenue?.toString()
                        }
                    });
                    createdCompanies++;
                } else {
                    logInfo(`Reusing existing company: ${coreCompany.name}`);
                }

                // Link all accounts for this company to the core company record
                for (const account of accounts) {
                    await prisma.accounts.update({
                        where: { id: account.id },
                        data: { companyId: coreCompany.id }
                    });
                    linkedAccounts++;
                }

                if (createdCompanies % 10 === 0) {
                    logInfo(`Processed ${createdCompanies} companies, linked ${linkedAccounts} accounts...`);
                }

            } catch (error) {
                logError(`Failed to process company ${companyName}: ${error.message}`);
                skippedAccounts += accounts.length;
            }
        }

        // 4. Final verification
        const finalStats = await Promise.all([
            prisma.accounts.count(),
            prisma.accounts.count({ where: { companyId: { not: null } } }),
            prisma.company.count()
        ]);

        const totalAccounts = finalStats[0];
        const linkedAccountsFinal = finalStats[1];
        const totalCompanies = finalStats[2];
        const unlinkedAccountsFinal = totalAccounts - linkedAccountsFinal;

        logSuccess(`\n🎉 UNLINKED ACCOUNTS FIX COMPLETED!`);
        logInfo(`Results:`);
        logInfo(`  Core companies created: ${createdCompanies}`);
        logInfo(`  Accounts linked: ${linkedAccounts}`);
        logInfo(`  Accounts skipped: ${skippedAccounts}`);
        logInfo(`  Total core companies: ${totalCompanies}`);
        logInfo(`  Total accounts: ${totalAccounts}`);
        logInfo(`  Linked accounts: ${linkedAccountsFinal}/${totalAccounts} (${((linkedAccountsFinal/totalAccounts)*100).toFixed(1)}%)`);
        
        if (unlinkedAccountsFinal === 0) {
            logSuccess(`🎯 ACHIEVED 100% COMPANY MAPPING!`);
        } else {
            logWarning(`⚠️  Still ${unlinkedAccountsFinal} unlinked accounts remaining`);
        }

    } catch (error) {
        logError(`Failed to fix unlinked accounts: ${error.message}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixUnlinkedAccounts().catch(console.error);
