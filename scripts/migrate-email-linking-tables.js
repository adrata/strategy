#!/usr/bin/env node

/**
 * Migrate Email Linking Tables
 * Transfers data from EmailToAccount/EmailToContact to EmailToPerson/EmailToCompany
 * Then drops the old tables
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 MIGRATING EMAIL LINKING TABLES');
  console.log('==================================\n');

  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Current State');
    console.log('------------------------');
    await showCurrentState();

    // Step 2: Migrate EmailToContact to EmailToPerson
    console.log('\n👤 Step 2: Migrating EmailToContact → EmailToPerson');
    console.log('---------------------------------------------------');
    await migrateEmailToContactToPerson();

    // Step 3: Migrate EmailToAccount to EmailToCompany
    console.log('\n🏢 Step 3: Migrating EmailToAccount → EmailToCompany');
    console.log('----------------------------------------------------');
    await migrateEmailToAccountToCompany();

    // Step 4: Migrate EventToContact to EventToPerson
    console.log('\n📅 Step 4: Migrating EventToContact → EventToPerson');
    console.log('---------------------------------------------------');
    await migrateEventToContactToPerson();

    // Step 5: Migrate EventToAccount to EventToCompany
    console.log('\n📅 Step 5: Migrating EventToAccount → EventToCompany');
    console.log('----------------------------------------------------');
    await migrateEventToAccountToCompany();

    // Step 6: Show final state
    console.log('\n📈 Step 6: Final State');
    console.log('----------------------');
    await showCurrentState();

    // Step 7: Drop old tables
    console.log('\n🗑️  Step 7: Dropping Old Tables');
    console.log('-------------------------------');
    await dropOldTables();

    console.log('\n✅ MIGRATION COMPLETE!');
    console.log('======================');

  } catch (error) {
    console.error('❌ Error in migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Show current state of all email/event linking tables
 */
async function showCurrentState() {
  const getCount = async (tableName) => {
    try {
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
      return result[0]?.count || 0;
    } catch (error) {
      return 0; // Table doesn't exist
    }
  };

  console.log('📧 Email Linking Tables:');
  console.log(`   EmailToContact (old): ${await getCount('"_EmailToContact"')}`);
  console.log(`   EmailToAccount (old): ${await getCount('"_EmailToAccount"')}`);
  console.log(`   EmailToPerson (new):  ${await getCount('"_EmailToPerson"')}`);
  console.log(`   EmailToCompany (new): ${await getCount('"_EmailToCompany"')}`);
  console.log(`   EmailToAction (new):  ${await getCount('"_EmailToAction"')}`);

  console.log('\n📅 Event Linking Tables:');
  console.log(`   EventToContact (old): ${await getCount('"_EventToContact"')}`);
  console.log(`   EventToAccount (old): ${await getCount('"_EventToAccount"')}`);
  console.log(`   EventToPerson (new):  ${await getCount('"_EventToPerson"')}`);
  console.log(`   EventToCompany (new): ${await getCount('"_EventToCompany"')}`);
}

/**
 * Migrate EmailToContact to EmailToPerson
 */
async function migrateEmailToContactToPerson() {
  try {
    // Get all EmailToContact relationships
    const emailToContactData = await prisma.$queryRaw`
      SELECT etc."A" as "emailId", etc."B" as "contactId"
      FROM "_EmailToContact" etc
    `;

    console.log(`   Found ${emailToContactData.length} EmailToContact relationships`);

    let migrated = 0;
    let skipped = 0;

    for (const row of emailToContactData) {
      try {
        // Find the person associated with this contact
        const person = await prisma.people.findFirst({
          where: {
            // Assuming contactId maps to personId or we need to find by email
            // You might need to adjust this based on your data structure
            id: row.contactId
          }
        });

        if (person) {
          // Create EmailToPerson relationship
          await prisma.$executeRaw`
            INSERT INTO "_EmailToPerson" ("A", "B")
            VALUES (${row.emailId}, ${person.id})
            ON CONFLICT DO NOTHING
          `;
          migrated++;
        } else {
          // Try to find person by email if direct ID doesn't work
          const contact = await prisma.$queryRaw`
            SELECT email FROM contacts WHERE id = ${row.contactId}
          `;
          
          if (contact[0]?.email) {
            const personByEmail = await prisma.people.findFirst({
              where: {
                OR: [
                  { email: contact[0].email },
                  { workEmail: contact[0].email },
                  { personalEmail: contact[0].email }
                ]
              }
            });

            if (personByEmail) {
              await prisma.$executeRaw`
                INSERT INTO "_EmailToPerson" ("A", "B")
                VALUES (${row.emailId}, ${personByEmail.id})
                ON CONFLICT DO NOTHING
              `;
              migrated++;
            } else {
              skipped++;
            }
          } else {
            skipped++;
          }
        }
      } catch (error) {
        console.log(`     ⚠️  Error migrating email ${row.emailId}: ${error.message}`);
        skipped++;
      }
    }

    console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

/**
 * Migrate EmailToAccount to EmailToCompany
 */
async function migrateEmailToAccountToCompany() {
  try {
    const emailToAccountData = await prisma.$queryRaw`
      SELECT eta."A" as "emailId", eta."B" as "accountId"
      FROM "_EmailToAccount" eta
    `;

    console.log(`   Found ${emailToAccountData.length} EmailToAccount relationships`);

    let migrated = 0;
    let skipped = 0;

    for (const row of emailToAccountData) {
      try {
        // Find the company associated with this account
        const company = await prisma.companies.findFirst({
          where: {
            id: row.accountId
          }
        });

        if (company) {
          await prisma.$executeRaw`
            INSERT INTO "_EmailToCompany" ("A", "B")
            VALUES (${row.emailId}, ${company.id})
            ON CONFLICT DO NOTHING
          `;
          migrated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.log(`     ⚠️  Error migrating email ${row.emailId}: ${error.message}`);
        skipped++;
      }
    }

    console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

/**
 * Migrate EventToContact to EventToPerson
 */
async function migrateEventToContactToPerson() {
  try {
    const eventToContactData = await prisma.$queryRaw`
      SELECT etc."A" as "eventId", etc."B" as "contactId"
      FROM "_EventToContact" etc
    `;

    console.log(`   Found ${eventToContactData.length} EventToContact relationships`);

    let migrated = 0;
    let skipped = 0;

    for (const row of eventToContactData) {
      try {
        const person = await prisma.people.findFirst({
          where: {
            id: row.contactId
          }
        });

        if (person) {
          await prisma.$executeRaw`
            INSERT INTO "_EventToPerson" ("A", "B")
            VALUES (${row.eventId}, ${person.id})
            ON CONFLICT DO NOTHING
          `;
          migrated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.log(`     ⚠️  Error migrating event ${row.eventId}: ${error.message}`);
        skipped++;
      }
    }

    console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

/**
 * Migrate EventToAccount to EventToCompany
 */
async function migrateEventToAccountToCompany() {
  try {
    const eventToAccountData = await prisma.$queryRaw`
      SELECT eta."A" as "eventId", eta."B" as "accountId"
      FROM "_EventToAccount" eta
    `;

    console.log(`   Found ${eventToAccountData.length} EventToAccount relationships`);

    let migrated = 0;
    let skipped = 0;

    for (const row of eventToAccountData) {
      try {
        const company = await prisma.companies.findFirst({
          where: {
            id: row.accountId
          }
        });

        if (company) {
          await prisma.$executeRaw`
            INSERT INTO "_EventToCompany" ("A", "B")
            VALUES (${row.eventId}, ${company.id})
            ON CONFLICT DO NOTHING
          `;
          migrated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.log(`     ⚠️  Error migrating event ${row.eventId}: ${error.message}`);
        skipped++;
      }
    }

    console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

/**
 * Drop the old tables
 */
async function dropOldTables() {
  try {
    console.log('   Dropping old email linking tables...');
    await prisma.$executeRaw`DROP TABLE IF EXISTS "_EmailToContact"`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "_EmailToAccount"`;
    
    console.log('   Dropping old event linking tables...');
    await prisma.$executeRaw`DROP TABLE IF EXISTS "_EventToContact"`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS "_EventToAccount"`;
    
    console.log('   ✅ Old tables dropped successfully');
  } catch (error) {
    console.log(`   ❌ Error dropping tables: ${error.message}`);
  }
}

main().catch(console.error);
