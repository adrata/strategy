#!/usr/bin/env node

/**
 * 🏗️ POPULATE CORE RECORDS MIGRATION
 * 
 * Creates core person and company records from existing business data
 * Ensures 1:1 mapping between core and business records
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

async function populateCoreCompanies() {
    log(`\n${colors.cyan}=== POPULATING CORE COMPANIES ===${colors.reset}`);
    
    try {
        // Get all unique companies from accounts
        const accounts = await prisma.accounts.findMany({
            where: { deletedAt: null },
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
                revenue: true
            }
        });

        logInfo(`Found ${accounts.length} accounts to process`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const account of accounts) {
            try {
                // Check if core company already exists
                let coreCompany = await prisma.company.findFirst({
                    where: { name: account.name }
                });

                if (!coreCompany) {
                    // Create new core company
                    coreCompany = await prisma.company.create({
                        data: {
                            name: account.name,
                            website: account.website,
                            industry: account.industry,
                            size: account.size,
                            description: account.description,
                            headquarters: [account.address, account.city, account.state, account.country].filter(Boolean).join(', '),
                            revenue: account.revenue?.toString()
                        }
                    });
                    createdCount++;
                } else {
                    // Update existing core company with new data
                    coreCompany = await prisma.company.update({
                        where: { id: coreCompany.id },
                        data: {
                            website: account.website || coreCompany.website,
                            industry: account.industry || coreCompany.industry,
                            size: account.size || coreCompany.size,
                            description: account.description || coreCompany.description,
                            headquarters: [account.address, account.city, account.state, account.country].filter(Boolean).join(', ') || coreCompany.headquarters,
                            revenue: account.revenue?.toString() || coreCompany.revenue
                        }
                    });
                    updatedCount++;
                }

                // Update account to reference core company
                await prisma.accounts.update({
                    where: { id: account.id },
                    data: { companyId: coreCompany.id }
                });

            } catch (error) {
                logError(`Failed to process account ${account.name}: ${error.message}`);
            }
        }

        logSuccess(`Core companies: ${createdCount} created, ${updatedCount} updated`);
        return { created: createdCount, updated: updatedCount };

    } catch (error) {
        logError(`Failed to populate core companies: ${error.message}`);
        throw error;
    }
}

async function populateCorePersons() {
    log(`\n${colors.cyan}=== POPULATING CORE PERSONS ===${colors.reset}`);
    
    try {
        // Get all unique persons from contacts
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
            }
        });

        logInfo(`Found ${contacts.length} contacts to process`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const contact of contacts) {
            try {
                // Use email as unique identifier, fallback to fullName
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
                    createdCount++;
                } else {
                    // Update existing core person with new data
                    corePerson = await prisma.person.update({
                        where: { id: corePerson.id },
                        data: {
                            firstName: contact.firstName || corePerson.firstName,
                            lastName: contact.lastName || corePerson.lastName,
                            fullName: contact.fullName || corePerson.fullName,
                            email: contact.email || contact.workEmail || corePerson.email,
                            phone: contact.phone || contact.mobilePhone || corePerson.phone,
                            linkedinUrl: contact.linkedinUrl || corePerson.linkedinUrl,
                            title: contact.jobTitle || corePerson.title,
                            department: contact.department || corePerson.department,
                            location: [contact.city, contact.state, contact.country].filter(Boolean).join(', ') || corePerson.location,
                            bio: contact.bio || corePerson.bio
                        }
                    });
                    updatedCount++;
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

        logSuccess(`Core persons: ${createdCount} created, ${updatedCount} updated`);
        return { created: createdCount, updated: updatedCount };

    } catch (error) {
        logError(`Failed to populate core persons: ${error.message}`);
        throw error;
    }
}

async function updatePipelineRecords() {
    log(`\n${colors.cyan}=== UPDATING PIPELINE RECORDS ===${colors.reset}`);
    
    try {
        // Update leads to reference core records
        const leads = await prisma.leads.findMany({
            where: { deletedAt: null },
            select: { id: true, company: true, fullName: true, email: true }
        });

        logInfo(`Updating ${leads.length} leads`);

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
                await prisma.leads.update({
                    where: { id: lead.id },
                    data: { personId, companyId }
                });

            } catch (error) {
                logError(`Failed to update lead ${lead.id}: ${error.message}`);
            }
        }

        // Update prospects to reference core records
        const prospects = await prisma.prospects.findMany({
            where: { deletedAt: null },
            select: { id: true, company: true, fullName: true, email: true }
        });

        logInfo(`Updating ${prospects.length} prospects`);

        for (const prospect of prospects) {
            try {
                let personId = null;
                let companyId = null;

                // Find core person
                if (prospect.email || prospect.fullName) {
                    const corePerson = await prisma.person.findFirst({
                        where: {
                            OR: [
                                { email: prospect.email },
                                { fullName: prospect.fullName }
                            ]
                        }
                    });
                    if (corePerson) personId = corePerson.id;
                }

                // Find core company
                if (prospect.company) {
                    const coreCompany = await prisma.company.findFirst({
                        where: { name: prospect.company }
                    });
                    if (coreCompany) companyId = coreCompany.id;
                }

                // Update prospect
                await prisma.prospects.update({
                    where: { id: prospect.id },
                    data: { personId, companyId }
                });

            } catch (error) {
                logError(`Failed to update prospect ${prospect.id}: ${error.message}`);
            }
        }

        // Update opportunities to reference core records
        const opportunities = await prisma.opportunities.findMany({
            where: { deletedAt: null },
            select: { id: true, accountId: true }
        });

        logInfo(`Updating ${opportunities.length} opportunities`);

        for (const opportunity of opportunities) {
            try {
                let personId = null;
                let companyId = null;

                // Get account to find company
                if (opportunity.accountId) {
                    const account = await prisma.accounts.findUnique({
                        where: { id: opportunity.accountId },
                        select: { companyId: true }
                    });
                    if (account?.companyId) {
                        companyId = account.companyId;
                    }
                }

                // Update opportunity
                await prisma.opportunities.update({
                    where: { id: opportunity.id },
                    data: { personId, companyId }
                });

            } catch (error) {
                logError(`Failed to update opportunity ${opportunity.id}: ${error.message}`);
            }
        }

        // Update clients to reference core records
        const clients = await prisma.clients.findMany({
            where: { deletedAt: null },
            select: { id: true, accountId: true }
        });

        logInfo(`Updating ${clients.length} clients`);

        for (const client of clients) {
            try {
                let personId = null;
                let companyId = null;

                // Get account to find company
                if (client.accountId) {
                    const account = await prisma.accounts.findUnique({
                        where: { id: client.accountId },
                        select: { companyId: true }
                    });
                    if (account?.companyId) {
                        companyId = account.companyId;
                    }
                }

                // Update client
                await prisma.clients.update({
                    where: { id: client.id },
                    data: { personId, companyId }
                });

            } catch (error) {
                logError(`Failed to update client ${client.id}: ${error.message}`);
            }
        }

        logSuccess('Pipeline records updated successfully');

    } catch (error) {
        logError(`Failed to update pipeline records: ${error.message}`);
        throw error;
    }
}

async function main() {
    log(`${colors.bright}${colors.magenta}🏗️  CORE RECORDS MIGRATION${colors.reset}`);
    log(`${colors.yellow}Creating core person and company records from existing data${colors.reset}\n`);
    
    try {
        await prisma.$connect();
        logSuccess('Database connection established');
        
        // Populate core companies
        const companyStats = await populateCoreCompanies();
        
        // Populate core persons
        const personStats = await populateCorePersons();
        
        // Update pipeline records
        await updatePipelineRecords();
        
        // Summary
        log(`\n${colors.cyan}=== MIGRATION SUMMARY ===${colors.reset}`);
        logSuccess(`Core companies: ${companyStats.created} created, ${companyStats.updated} updated`);
        logSuccess(`Core persons: ${personStats.created} created, ${personStats.updated} updated`);
        logSuccess('Pipeline records updated with core references');
        
        logSuccess('\n🎉 Core records migration completed successfully!');
        logInfo('Your data now has a clean core/business separation:');
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

// Handle process termination
process.on('SIGINT', async () => {
    logWarning('\nMigration interrupted by user');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logWarning('\nMigration terminated');
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
