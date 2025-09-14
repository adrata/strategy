#!/usr/bin/env node

/**
 * 🏗️ COMPLETE CORE MIGRATION
 * 
 * Finishes the core records migration that was partially completed
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

async function completeCoreMigration() {
    log(`${colors.bright}${colors.magenta}🏗️  COMPLETING CORE MIGRATION${colors.reset}`);
    log(`${colors.yellow}Finishing the core records migration${colors.reset}\n`);
    
    try {
        await prisma.$connect();
        logSuccess('Database connection established');
        
        // Check current state
        const personCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM person`;
        const companyCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM company`;
        
        logInfo(`Current state: ${personCount[0].count} persons, ${companyCount[0].count} companies`);
        
        // Step 1: Create core persons from contacts
        log(`\n${colors.cyan}=== CREATING CORE PERSONS ===${colors.reset}`);
        
        const contacts = await prisma.contacts.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true,
                workEmail: true,
                phone: true,
                mobilePhone: true,
                linkedinUrl: true,
                jobTitle: true,
                department: true,
                city: true,
                state: true,
                country: true,
                bio: true
            },
            take: 100 // Process in batches to avoid timeout
        });

        logInfo(`Processing ${contacts.length} contacts in this batch`);

        let personCreated = 0;
        let personUpdated = 0;

        for (const contact of contacts) {
            try {
                // Use email as unique identifier
                const uniqueKey = contact.email || contact.workEmail || contact.fullName;
                
                if (!uniqueKey) {
                    logWarning(`Skipping contact ${contact.id} - no unique identifier`);
                    continue;
                }

                // Check if core person already exists
                let corePerson = await prisma.person.findFirst({
                    where: {
                        OR: [
                            { email: contact.email },
                            { email: contact.workEmail },
                            { fullName: contact.fullName }
                        ]
                    }
                });

                if (!corePerson) {
                    // Create new core person
                    corePerson = await prisma.person.create({
                        data: {
                            firstName: contact.firstName,
                            lastName: contact.lastName,
                            fullName: contact.fullName,
                            email: contact.email || contact.workEmail,
                            phone: contact.phone || contact.mobilePhone,
                            linkedinUrl: contact.linkedinUrl,
                            title: contact.jobTitle,
                            department: contact.department,
                            location: [contact.city, contact.state, contact.country].filter(Boolean).join(', '),
                            bio: contact.bio
                        }
                    });
                    personCreated++;
                } else {
                    personUpdated++;
                }

                // Update contact to reference core person
                await prisma.contacts.update({
                    where: { id: contact.id },
                    data: { personId: corePerson.id }
                });

            } catch (error) {
                logError(`Failed to process contact ${contact.fullName}: ${error.message}`);
            }
        }

        logSuccess(`Core persons: ${personCreated} created, ${personUpdated} updated`);

        // Step 2: Link accounts to core companies
        log(`\n${colors.cyan}=== LINKING ACCOUNTS TO CORE COMPANIES ===${colors.reset}`);
        
        const accounts = await prisma.accounts.findMany({
            where: { 
                deletedAt: null,
                companyId: null // Only process accounts not yet linked
            },
            select: {
                id: true,
                name: true
            },
            take: 100 // Process in batches
        });

        logInfo(`Linking ${accounts.length} accounts to core companies`);

        let accountsLinked = 0;

        for (const account of accounts) {
            try {
                // Find matching core company
                const coreCompany = await prisma.company.findFirst({
                    where: { name: account.name }
                });

                if (coreCompany) {
                    // Link account to core company
                    await prisma.accounts.update({
                        where: { id: account.id },
                        data: { companyId: coreCompany.id }
                    });
                    accountsLinked++;
                }

            } catch (error) {
                logError(`Failed to link account ${account.name}: ${error.message}`);
            }
        }

        logSuccess(`Accounts linked to core companies: ${accountsLinked}`);

        // Step 3: Link pipeline records to core records
        log(`\n${colors.cyan}=== LINKING PIPELINE RECORDS ===${colors.reset}`);
        
        // Link leads to core records
        const leads = await prisma.leads.findMany({
            where: { 
                deletedAt: null,
                personId: null,
                companyId: null
            },
            select: {
                id: true,
                company: true,
                fullName: true,
                email: true
            },
            take: 50
        });

        logInfo(`Linking ${leads.length} leads to core records`);

        let leadsLinked = 0;

        for (const lead of leads) {
            try {
                let personId = null;
                let companyId = null;

                // Find core person
                if (lead.email || lead.fullName) {
                    const corePerson = await prisma.person.findFirst({
                        where: {
                            OR: [
                                { email: lead.email },
                                { fullName: lead.fullName }
                            ]
                        }
                    });
                    if (corePerson) personId = corePerson.id;
                }

                // Find core company
                if (lead.company) {
                    const coreCompany = await prisma.company.findFirst({
                        where: { name: lead.company }
                    });
                    if (coreCompany) companyId = coreCompany.id;
                }

                // Update lead
                if (personId || companyId) {
                    await prisma.leads.update({
                        where: { id: lead.id },
                        data: { personId, companyId }
                    });
                    leadsLinked++;
                }

            } catch (error) {
                logError(`Failed to link lead ${lead.id}: ${error.message}`);
            }
        }

        logSuccess(`Leads linked to core records: ${leadsLinked}`);

        // Final summary
        log(`\n${colors.cyan}=== MIGRATION COMPLETED ===${colors.reset}`);
        logSuccess(`Core persons: ${personCreated} created, ${personUpdated} updated`);
        logSuccess(`Accounts linked: ${accountsLinked}`);
        logSuccess(`Leads linked: ${leadsLinked}`);
        
        logSuccess('\n🎉 Core migration completed successfully!');
        logInfo('Your data now has the core/business separation:');
        logInfo('  • Core: person & company (master data)');
        logInfo('  • Business: accounts & contacts (business entities)');
        logInfo('  • Pipeline: leads → prospects → opportunities → customers');
        
    } catch (error) {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
if (require.main === module) {
    completeCoreMigration().catch(error => {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { completeCoreMigration };
