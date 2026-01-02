#!/usr/bin/env node

/**
 * Generate Sample Arizona Leads for Rune Gate Co.
 * 
 * Creates realistic sample leads with Arizona phone numbers
 * for testing purposes.
 * 
 * Target:
 * - Josh: 100 total (has 33, needs 67 more)
 * - Clients: 100 total (has 0, needs 100)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';

// Arizona area codes
const AZ_AREA_CODES = ['480', '520', '602', '623', '928'];

// Paradise Valley street names
const STREETS = [
  'E Camelback Rd', 'N Tatum Blvd', 'E Lincoln Dr', 'N Scottsdale Rd',
  'E McDonald Dr', 'N 56th St', 'E Shea Blvd', 'N 64th St',
  'E Doubletree Ranch Rd', 'N Invergordon Rd', 'E Stanford Dr', 'N 48th St',
  'E Mountain View Rd', 'N 52nd St', 'E Desert Cove Ave', 'N 68th St',
  'E Mockingbird Ln', 'N Quail Run Rd', 'E Via Linda', 'N Palo Cristi Rd',
  'E Gold Dust Ave', 'N 44th St', 'E Cholla St', 'N 40th St',
  'E Beryl Ave', 'N Casa Blanca Dr', 'E Stella Ln', 'N Jokake Dr'
];

// First names
const FIRST_NAMES = [
  'James', 'Michael', 'Robert', 'David', 'William', 'Richard', 'Joseph', 'Thomas',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Paul', 'Andrew',
  'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy',
  'Charles', 'Kenneth', 'Steven', 'Edward', 'Brian', 'Ronald', 'Timothy', 'Jason',
  'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Helen', 'Samantha', 'Katherine'
];

// Last names
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell'
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone() {
  const areaCode = randomChoice(AZ_AREA_CODES);
  const exchange = Math.floor(Math.random() * 900) + 100;
  const subscriber = Math.floor(Math.random() * 9000) + 1000;
  return `${areaCode}${exchange}${subscriber}`;
}

function generateAddress(index) {
  const houseNumber = Math.floor(Math.random() * 9000) + 1000;
  const street = randomChoice(STREETS);
  return `${houseNumber} ${street}`;
}

function generateLead(index) {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    phone: generatePhone(),
    address: generateAddress(index),
    city: 'Paradise Valley',
    state: 'AZ',
    postalCode: '85253',
    country: 'US',
    status: 'LEAD',
    source: 'Sample Data - Paradise Valley'
  };
}

async function main() {
  console.log('\n============================================================');
  console.log('   GENERATE SAMPLE ARIZONA LEADS FOR RUNE GATE CO.');
  console.log('============================================================\n');

  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Get users
    const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
    const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });

    if (!josh || !clients) {
      console.error('ERROR: Users not found');
      process.exit(1);
    }

    console.log('USERS:');
    console.log(`  Josh: ${josh.id}`);
    console.log(`  Clients: ${clients.id}\n`);

    // Count current leads
    const joshLeadCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null }
    });
    const clientsLeadCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null }
    });

    console.log('CURRENT LEADS:');
    console.log(`  Josh: ${joshLeadCount}`);
    console.log(`  Clients: ${clientsLeadCount}\n`);

    const joshNeeds = Math.max(0, 100 - joshLeadCount);
    const clientsNeeds = Math.max(0, 100 - clientsLeadCount);

    console.log('GENERATING LEADS:');
    console.log(`  For Josh: ${joshNeeds}`);
    console.log(`  For Clients: ${clientsNeeds}\n`);

    let importedForJosh = 0;
    let importedForClients = 0;

    // Generate leads for Josh
    for (let i = 0; i < joshNeeds; i++) {
      const lead = generateLead(i);
      await prisma.people.create({
        data: {
          workspaceId: WORKSPACE_ID,
          mainSellerId: josh.id,
          ...lead
        }
      });
      importedForJosh++;
    }

    // Generate leads for Clients
    for (let i = 0; i < clientsNeeds; i++) {
      const lead = generateLead(i + joshNeeds);
      await prisma.people.create({
        data: {
          workspaceId: WORKSPACE_ID,
          mainSellerId: clients.id,
          ...lead
        }
      });
      importedForClients++;
    }

    // Final counts
    const finalJoshCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null }
    });
    const finalClientsCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null }
    });

    console.log('============================================================');
    console.log('   IMPORT COMPLETE');
    console.log('============================================================');
    console.log(`\n  Generated for Josh: ${importedForJosh}`);
    console.log(`  Generated for Clients: ${importedForClients}`);
    console.log(`\n  FINAL LEAD COUNTS:`);
    console.log(`  Josh: ${finalJoshCount}`);
    console.log(`  Clients: ${finalClientsCount}`);
    console.log('\n  All leads have Arizona phone numbers (480, 520, 602, 623, 928)');
    console.log('============================================================\n');

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
