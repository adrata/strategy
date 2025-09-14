#!/usr/bin/env node

/**
 * 🔧 FIX SUBSCRIBED PERSON DATA QUALITY ISSUE
 * 
 * Fixes the 2,048 contacts linked to the fake "SUBSCRIBED" person by:
 * 1. Creating proper person records based on actual email/name data
 * 2. Linking contacts to their real person records
 * 3. Removing the fake "SUBSCRIBED" person record
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

async function fixSubscribedPerson() {
    log(`🔧 FIXING SUBSCRIBED PERSON DATA QUALITY ISSUE`, 'cyan');
    log(`Creating proper person records for 2,048 orphaned contacts\n`);

    try {
        // 1. Find the fake "SUBSCRIBED" person
        const subscribedPerson = await prisma.person.findFirst({
            where: { fullName: 'SUBSCRIBED' }
        });

        if (!subscribedPerson) {
            logError('SUBSCRIBED person not found!');
            return;
        }

        logInfo(`Found SUBSCRIBED person: ${subscribedPerson.id}`);

        // 2. Get all contacts linked to SUBSCRIBED person
        const subscribedContacts = await prisma.contacts.findMany({
            where: { personId: subscribedPerson.id },
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

        logInfo(`Found ${subscribedContacts.length} contacts linked to SUBSCRIBED person`);

        // 3. Group contacts by unique identifier (email or fullName)
        const uniquePersons = new Map();
        
        for (const contact of subscribedContacts) {
            const identifier = contact.email || contact.workEmail || contact.fullName;
            
            if (!identifier) {
                logWarning(`Skipping contact ${contact.id} - no unique identifier`);
                continue;
            }

            if (!uniquePersons.has(identifier)) {
                uniquePersons.set(identifier, []);
            }
            uniquePersons.get(identifier).push(contact);
        }

        logInfo(`Identified ${uniquePersons.size} unique persons from ${subscribedContacts.length} contacts`);

        // 4. Create core person records and link contacts
        let createdPersons = 0;
        let linkedContacts = 0;
        let skippedContacts = 0;

        for (const [identifier, contacts] of uniquePersons) {
            try {
                // Use the first contact as the primary data source
                const primaryContact = contacts[0];
                const email = primaryContact.email || primaryContact.workEmail;
                
                // Check if person already exists
                let corePerson = null;
                if (email) {
                    corePerson = await prisma.person.findFirst({
                        where: { email: email }
                    });
                }
                
                if (!corePerson) {
                    // Create new core person record
                    corePerson = await prisma.person.create({
                        data: {
                            firstName: primaryContact.firstName,
                            lastName: primaryContact.lastName,
                            fullName: primaryContact.fullName,
                            email: email,
                            phone: primaryContact.phone || primaryContact.mobilePhone,
                            linkedinUrl: primaryContact.linkedinUrl,
                            title: primaryContact.jobTitle,
                            department: primaryContact.department,
                            location: [primaryContact.city, primaryContact.state, primaryContact.country].filter(Boolean).join(', '),
                            bio: primaryContact.bio
                        }
                    });
                    createdPersons++;
                } else {
                    logInfo(`Reusing existing person: ${corePerson.fullName} (${corePerson.email})`);
                }

                // Link all contacts for this person to the core person record
                for (const contact of contacts) {
                    await prisma.contacts.update({
                        where: { id: contact.id },
                        data: { personId: corePerson.id }
                    });
                    linkedContacts++;
                }

                if (createdPersons % 100 === 0) {
                    logInfo(`Processed ${createdPersons} persons, linked ${linkedContacts} contacts...`);
                }

            } catch (error) {
                logError(`Failed to process person ${identifier}: ${error.message}`);
                skippedContacts += contacts.length;
            }
        }

        // 5. Verify no contacts are still linked to SUBSCRIBED person
        const remainingContacts = await prisma.contacts.count({
            where: { personId: subscribedPerson.id }
        });

        if (remainingContacts === 0) {
            // 6. Delete the fake SUBSCRIBED person record
            await prisma.person.delete({
                where: { id: subscribedPerson.id }
            });
            logSuccess(`Deleted fake SUBSCRIBED person record`);
        } else {
            logWarning(`${remainingContacts} contacts still linked to SUBSCRIBED person`);
        }

        // 7. Final verification
        const finalStats = await Promise.all([
            prisma.person.count(),
            prisma.contacts.count({ where: { personId: { not: null } } }),
            prisma.contacts.count()
        ]);

        logSuccess(`\n🎉 DATA QUALITY FIX COMPLETED!`);
        logInfo(`Results:`);
        logInfo(`  Core persons created: ${createdPersons}`);
        logInfo(`  Contacts linked: ${linkedContacts}`);
        logInfo(`  Contacts skipped: ${skippedContacts}`);
        logInfo(`  Total core persons: ${finalStats[0]}`);
        logInfo(`  Total linked contacts: ${finalStats[1]}/${finalStats[2]}`);

    } catch (error) {
        logError(`Failed to fix SUBSCRIBED person: ${error.message}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixSubscribedPerson().catch(console.error);
