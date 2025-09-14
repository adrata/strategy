#!/usr/bin/env node

/**
 * 🎯 PROPER 1:1 MAPPING
 * 
 * Creates ONE core person per unique person (by email/fullName)
 * Links ALL contacts for the same person to the same core person record
 * This achieves true 1:1 mapping between unique persons and core person records
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

async function createProperOneToOneMapping() {
    log(`${colors.bright}${colors.magenta}🎯 CREATING PROPER 1:1 MAPPING${colors.reset}`);
    log(`${colors.yellow}One core person per unique person, all contacts linked to same person${colors.reset}\n`);
    
    try {
        await prisma.$connect();
        logSuccess('Database connection established');
        
        // Step 1: Get all unique persons (by email or fullName)
        log(`\n${colors.cyan}=== IDENTIFYING UNIQUE PERSONS ===${colors.reset}`);
        
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

        logInfo(`Found ${contacts.length} contacts to process`);

        // Group contacts by unique identifier (email or fullName)
        const uniquePersons = new Map();
        
        for (const contact of contacts) {
            const identifier = contact.email || contact.workEmail || contact.fullName;
            
            if (!identifier) {
                logWarning(`Skipping contact ${contact.id} - no unique identifier`);
                continue;
            }

            if (!uniquePersons.has(identifier)) {
                uniquePersons.set(identifier, {
                    identifier,
                    contacts: [],
                    bestContact: contact // Use first contact as the "best" data source
                });
            }

            uniquePersons.get(identifier).contacts.push(contact);
            
            // Update best contact if this one has more complete data
            const current = uniquePersons.get(identifier).bestContact;
            const currentScore = (current.email ? 1 : 0) + (current.workEmail ? 1 : 0) + (current.phone ? 1 : 0) + (current.linkedinUrl ? 1 : 0);
            const newScore = (contact.email ? 1 : 0) + (contact.workEmail ? 1 : 0) + (contact.phone ? 1 : 0) + (contact.linkedinUrl ? 1 : 0);
            
            if (newScore > currentScore) {
                uniquePersons.get(identifier).bestContact = contact;
            }
        }

        logInfo(`Identified ${uniquePersons.size} unique persons`);
        logInfo(`Total contacts to link: ${contacts.length}`);

        // Step 2: Create core persons and link all contacts
        log(`\n${colors.cyan}=== CREATING CORE PERSONS AND LINKING CONTACTS ===${colors.reset}`);
        
        let personsCreated = 0;
        let contactsLinked = 0;
        let personsReused = 0;

        for (const [identifier, personData] of uniquePersons) {
            try {
                const bestContact = personData.bestContact;
                
                // Check if a person with this identifier already exists
                const existingPerson = await prisma.person.findFirst({
                    where: {
                        OR: [
                            { email: bestContact.email },
                            { email: bestContact.workEmail },
                            { fullName: bestContact.fullName }
                        ]
                    }
                });

                let corePerson;

                if (existingPerson) {
                    // Use existing person
                    corePerson = existingPerson;
                    personsReused++;
                } else {
                    // Create new core person
                    corePerson = await prisma.person.create({
                        data: {
                            firstName: bestContact.firstName,
                            lastName: bestContact.lastName,
                            fullName: bestContact.fullName,
                            email: bestContact.email || bestContact.workEmail,
                            phone: bestContact.phone || bestContact.mobilePhone,
                            linkedinUrl: bestContact.linkedinUrl,
                            title: bestContact.jobTitle,
                            department: bestContact.department,
                            location: [bestContact.city, bestContact.state, bestContact.country].filter(Boolean).join(', '),
                            bio: bestContact.bio
                        }
                    });
                    personsCreated++;
                }

                // Link ALL contacts for this person to the same core person
                for (const contact of personData.contacts) {
                    await prisma.contacts.update({
                        where: { id: contact.id },
                        data: { personId: corePerson.id }
                    });
                    contactsLinked++;
                }

                if (contactsLinked % 500 === 0) {
                    logInfo(`Processed ${contactsLinked} contacts...`);
                }

            } catch (error) {
                logError(`Failed to process person ${identifier}: ${error.message}`);
            }
        }

        logSuccess(`Core persons created: ${personsCreated}`);
        logSuccess(`Core persons reused: ${personsReused}`);
        logSuccess(`Contacts linked: ${contactsLinked}`);

        // Step 3: Do the same for companies (one core company per unique company name)
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

        logInfo(`Found ${accounts.length} accounts to process`);

        // Group accounts by company name
        const uniqueCompanies = new Map();
        
        for (const account of accounts) {
            const companyName = account.name;
            
            if (!companyName) {
                logWarning(`Skipping account ${account.id} - no company name`);
                continue;
            }

            if (!uniqueCompanies.has(companyName)) {
                uniqueCompanies.set(companyName, {
                    name: companyName,
                    accounts: [],
                    bestAccount: account
                });
            }

            uniqueCompanies.get(companyName).accounts.push(account);
            
            // Update best account if this one has more complete data
            const current = uniqueCompanies.get(companyName).bestAccount;
            const currentScore = (current.website ? 1 : 0) + (current.industry ? 1 : 0) + (current.description ? 1 : 0);
            const newScore = (account.website ? 1 : 0) + (account.industry ? 1 : 0) + (account.description ? 1 : 0);
            
            if (newScore > currentScore) {
                uniqueCompanies.get(companyName).bestAccount = account;
            }
        }

        logInfo(`Identified ${uniqueCompanies.size} unique companies`);

        let companiesCreated = 0;
        let accountsLinked = 0;
        let companiesReused = 0;

        for (const [companyName, companyData] of uniqueCompanies) {
            try {
                const bestAccount = companyData.bestAccount;
                
                // Check if a company with this name already exists
                const existingCompany = await prisma.company.findFirst({
                    where: { name: companyName }
                });

                let coreCompany;

                if (existingCompany) {
                    // Use existing company
                    coreCompany = existingCompany;
                    companiesReused++;
                } else {
                    // Create new core company
                    coreCompany = await prisma.company.create({
                        data: {
                            name: companyName,
                            website: bestAccount.website,
                            industry: bestAccount.industry,
                            size: bestAccount.size,
                            description: bestAccount.description,
                            headquarters: [bestAccount.address, bestAccount.city, bestAccount.state, bestAccount.country].filter(Boolean).join(', '),
                            revenue: bestAccount.revenue?.toString()
                        }
                    });
                    companiesCreated++;
                }

                // Link ALL accounts for this company to the same core company
                for (const account of companyData.accounts) {
                    await prisma.accounts.update({
                        where: { id: account.id },
                        data: { companyId: coreCompany.id }
                    });
                    accountsLinked++;
                }

                if (accountsLinked % 500 === 0) {
                    logInfo(`Processed ${accountsLinked} accounts...`);
                }

            } catch (error) {
                logError(`Failed to process company ${companyName}: ${error.message}`);
            }
        }

        logSuccess(`Core companies created: ${companiesCreated}`);
        logSuccess(`Core companies reused: ${companiesReused}`);
        logSuccess(`Accounts linked: ${accountsLinked}`);

        // Final verification
        log(`\n${colors.cyan}=== FINAL VERIFICATION ===${colors.reset}`);
        
        const finalCounts = await Promise.all([
            prisma.accounts.count(),
            prisma.contacts.count(),
            prisma.person.count(),
            prisma.company.count(),
            prisma.accounts.count({ where: { companyId: { not: null } } }),
            prisma.contacts.count({ where: { personId: { not: null } } })
        ]);

        const [accountsCount, contactsCount, personCount, companyCount, linkedAccounts, linkedContacts] = finalCounts;

        logInfo(`Final counts:`);
        logInfo(`  Accounts: ${accountsCount} (linked: ${linkedAccounts})`);
        logInfo(`  Contacts: ${contactsCount} (linked: ${linkedContacts})`);
        logInfo(`  Core Persons: ${personCount}`);
        logInfo(`  Core Companies: ${companyCount}`);

        // Check if all business records are linked
        const allAccountsLinked = linkedAccounts === accountsCount;
        const allContactsLinked = linkedContacts === contactsCount;

        log(`\n${colors.cyan}=== 1:1 MAPPING STATUS ===${colors.reset}`);
        if (allAccountsLinked) {
            logSuccess(`✅ All ${accountsCount} accounts linked to core companies`);
        } else {
            logWarning(`⚠️  ${linkedAccounts}/${accountsCount} accounts linked`);
        }

        if (allContactsLinked) {
            logSuccess(`✅ All ${contactsCount} contacts linked to core persons`);
        } else {
            logWarning(`⚠️  ${linkedContacts}/${contactsCount} contacts linked`);
        }

        log(`\n${colors.cyan}=== UNIQUE RECORD ANALYSIS ===${colors.reset}`);
        logInfo(`Unique persons: ${personCount} (from ${contactsCount} contacts)`);
        logInfo(`Unique companies: ${companyCount} (from ${accountsCount} accounts)`);
        logInfo(`Deduplication ratio: ${Math.round((contactsCount/personCount)*100)/100}:1 contacts per person`);
        logInfo(`Deduplication ratio: ${Math.round((accountsCount/companyCount)*100)/100}:1 accounts per company`);

        if (allAccountsLinked && allContactsLinked) {
            logSuccess('\n🎉 PERFECT 1:1 MAPPING ACHIEVED!');
            logInfo('✅ Every account linked to a core company');
            logInfo('✅ Every contact linked to a core person');
            logInfo('✅ One core person per unique person');
            logInfo('✅ One core company per unique company');
        }
        
    } catch (error) {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the proper mapping
if (require.main === module) {
    createProperOneToOneMapping().catch(error => {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { createProperOneToOneMapping };
