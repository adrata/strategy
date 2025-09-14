#!/usr/bin/env node

/**
 * 🔧 FIX UNLINKED CONTACTS
 * 
 * Fixes the remaining 769 unlinked contacts to achieve 100% contact mapping by:
 * 1. Finding contacts without personId
 * 2. Creating core person records for them (or linking to existing ones)
 * 3. Linking contacts to their core person records
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

async function fixUnlinkedContacts() {
    log(`🔧 FIXING UNLINKED CONTACTS`, 'cyan');
    log(`Achieving 100% contact mapping\n`);

    try {
        // 1. Find all unlinked contacts
        const unlinkedContacts = await prisma.contacts.findMany({
            where: { personId: null },
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
                bio: true,
                workspaceId: true
            }
        });

        logInfo(`Found ${unlinkedContacts.length} unlinked contacts`);

        if (unlinkedContacts.length === 0) {
            logSuccess('All contacts are already linked!');
            return;
        }

        // 2. Group contacts by unique identifier (email or fullName)
        const uniquePersons = new Map();
        
        for (const contact of unlinkedContacts) {
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

        logInfo(`Identified ${uniquePersons.size} unique persons from ${unlinkedContacts.length} contacts`);

        // 3. Create core person records and link contacts
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

                if (createdPersons % 50 === 0) {
                    logInfo(`Processed ${createdPersons} persons, linked ${linkedContacts} contacts...`);
                }

            } catch (error) {
                logError(`Failed to process person ${identifier}: ${error.message}`);
                skippedContacts += contacts.length;
            }
        }

        // 4. Final verification
        const finalStats = await Promise.all([
            prisma.contacts.count(),
            prisma.contacts.count({ where: { personId: { not: null } } }),
            prisma.person.count()
        ]);

        const totalContacts = finalStats[0];
        const linkedContactsFinal = finalStats[1];
        const totalPersons = finalStats[2];
        const unlinkedContactsFinal = totalContacts - linkedContactsFinal;

        logSuccess(`\n🎉 UNLINKED CONTACTS FIX COMPLETED!`);
        logInfo(`Results:`);
        logInfo(`  Core persons created: ${createdPersons}`);
        logInfo(`  Contacts linked: ${linkedContacts}`);
        logInfo(`  Contacts skipped: ${skippedContacts}`);
        logInfo(`  Total core persons: ${totalPersons}`);
        logInfo(`  Total contacts: ${totalContacts}`);
        logInfo(`  Linked contacts: ${linkedContactsFinal}/${totalContacts} (${((linkedContactsFinal/totalContacts)*100).toFixed(1)}%)`);
        
        if (unlinkedContactsFinal === 0) {
            logSuccess(`🎯 ACHIEVED 100% CONTACT MAPPING!`);
        } else {
            logWarning(`⚠️  Still ${unlinkedContactsFinal} unlinked contacts remaining`);
        }

    } catch (error) {
        logError(`Failed to fix unlinked contacts: ${error.message}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixUnlinkedContacts().catch(console.error);
