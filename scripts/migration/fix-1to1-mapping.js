#!/usr/bin/env node

/**
 * 🔧 FIX 1:1 MAPPING
 * 
 * Creates a core person/company record for EVERY account/contact
 * to achieve true 1:1 mapping between core and business records
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

async function fixOneToOneMapping() {
    log(`${colors.bright}${colors.magenta}🔧 FIXING 1:1 MAPPING${colors.reset}`);
    log(`${colors.yellow}Creating core records for ALL accounts and contacts${colors.reset}\n`);
    
    try {
        await prisma.$connect();
        logSuccess('Database connection established');
        
        // Step 1: Create core companies for ALL accounts
        log(`\n${colors.cyan}=== CREATING CORE COMPANIES FOR ALL ACCOUNTS ===${colors.reset}`);
        
        const accounts = await prisma.accounts.findMany({
            where: { 
                deletedAt: null,
                companyId: null // Only process accounts not yet linked
            },
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

        logInfo(`Found ${accounts.length} accounts without core companies`);

        let companiesCreated = 0;
        let accountsLinked = 0;

        for (const account of accounts) {
            try {
                // Create core company for this account
                const coreCompany = await prisma.company.create({
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

                // Link account to core company
                await prisma.accounts.update({
                    where: { id: account.id },
                    data: { companyId: coreCompany.id }
                });

                companiesCreated++;
                accountsLinked++;

                if (companiesCreated % 100 === 0) {
                    logInfo(`Processed ${companiesCreated} accounts...`);
                }

            } catch (error) {
                logError(`Failed to process account ${account.name}: ${error.message}`);
            }
        }

        logSuccess(`Core companies created: ${companiesCreated}`);
        logSuccess(`Accounts linked: ${accountsLinked}`);

        // Step 2: Create core persons for ALL contacts
        log(`\n${colors.cyan}=== CREATING CORE PERSONS FOR ALL CONTACTS ===${colors.reset}`);
        
        const contacts = await prisma.contacts.findMany({
            where: { 
                deletedAt: null,
                personId: null // Only process contacts not yet linked
            },
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

        logInfo(`Found ${contacts.length} contacts without core persons`);

        let personsCreated = 0;
        let contactsLinked = 0;

        for (const contact of contacts) {
            try {
                // Check if a person with this email already exists
                const existingPerson = await prisma.person.findFirst({
                    where: {
                        OR: [
                            { email: contact.email },
                            { email: contact.workEmail },
                            { fullName: contact.fullName }
                        ]
                    }
                });

                let corePerson;

                if (existingPerson) {
                    // Use existing person
                    corePerson = existingPerson;
                } else {
                    // Create new core person for this contact
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
                    personsCreated++;
                }

                // Link contact to core person
                await prisma.contacts.update({
                    where: { id: contact.id },
                    data: { personId: corePerson.id }
                });

                contactsLinked++;

                if (contactsLinked % 100 === 0) {
                    logInfo(`Processed ${contactsLinked} contacts...`);
                }

            } catch (error) {
                logError(`Failed to process contact ${contact.fullName}: ${error.message}`);
            }
        }

        logSuccess(`Core persons created: ${personsCreated}`);
        logSuccess(`Contacts linked: ${contactsLinked}`);

        // Final verification
        log(`\n${colors.cyan}=== VERIFICATION ===${colors.reset}`);
        
        const finalCounts = await Promise.all([
            prisma.accounts.count(),
            prisma.contacts.count(),
            prisma.person.count(),
            prisma.company.count()
        ]);

        const [accountsCount, contactsCount, personCount, companyCount] = finalCounts;

        logInfo(`Final counts:`);
        logInfo(`  Accounts: ${accountsCount}`);
        logInfo(`  Contacts: ${contactsCount}`);
        logInfo(`  Core Persons: ${personCount}`);
        logInfo(`  Core Companies: ${companyCount}`);

        const accountsLinkedCount = await prisma.accounts.count({
            where: { companyId: { not: null } }
        });

        const contactsLinkedCount = await prisma.contacts.count({
            where: { personId: { not: null } }
        });

        logInfo(`Linked counts:`);
        logInfo(`  Accounts linked to core companies: ${accountsLinkedCount}`);
        logInfo(`  Contacts linked to core persons: ${contactsLinkedCount}`);

        // Check 1:1 mapping
        const isAccountsOneToOne = accountsCount === companyCount && accountsLinkedCount === accountsCount;
        const isContactsOneToOne = contactsCount === personCount && contactsLinkedCount === contactsCount;

        log(`\n${colors.cyan}=== 1:1 MAPPING STATUS ===${colors.reset}`);
        if (isAccountsOneToOne) {
            logSuccess(`✅ Accounts ↔ Core Companies: PERFECT 1:1 mapping`);
        } else {
            logWarning(`⚠️  Accounts ↔ Core Companies: ${accountsCount} accounts, ${companyCount} companies, ${accountsLinkedCount} linked`);
        }

        if (isContactsOneToOne) {
            logSuccess(`✅ Contacts ↔ Core Persons: PERFECT 1:1 mapping`);
        } else {
            logWarning(`⚠️  Contacts ↔ Core Persons: ${contactsCount} contacts, ${personCount} persons, ${contactsLinkedCount} linked`);
        }

        if (isAccountsOneToOne && isContactsOneToOne) {
            logSuccess('\n🎉 PERFECT 1:1 MAPPING ACHIEVED!');
            logInfo('Every account has a corresponding core company');
            logInfo('Every contact has a corresponding core person');
        } else {
            logWarning('\n⚠️  Some records still need attention');
        }
        
    } catch (error) {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
if (require.main === module) {
    fixOneToOneMapping().catch(error => {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { fixOneToOneMapping };
