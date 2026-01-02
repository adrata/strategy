#!/usr/bin/env node

/**
 * Import Arizona Leads for Rune Gate Co. (Limited Credits Version)
 * 
 * Gets as many leads as possible with limited BatchData credits.
 * Imports directly without skip-trace to save credits.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const AZ_CODES = ['480', '520', '602', '623', '928'];
const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY;

function getAreaCode(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits.substring(0, 3);
  if (digits.length === 11 && digits.startsWith('1')) return digits.substring(1, 4);
  return null;
}

function isArizonaPhone(phone) {
  const areaCode = getAreaCode(phone);
  return areaCode && AZ_CODES.includes(areaCode);
}

async function searchProperties(skip = 0, take = 20) {
  const response = await fetch('https://api.batchdata.com/api/v1/property/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      searchCriteria: { query: 'Paradise Valley, AZ' },
      options: { skip, take }
    })
  });

  const data = await response.json();
  
  if (data.status?.code !== 200) {
    return { properties: [], error: data.status?.message };
  }
  
  return { properties: data.results?.properties || [], error: null };
}

function parseOwnerName(fullName) {
  if (!fullName) return { firstName: 'Homeowner', lastName: '' };
  if (fullName.includes('TRUST') || fullName.includes('LLC') || fullName.includes('INC')) {
    return { firstName: fullName, lastName: '' };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function main() {
  console.log('\n============================================================');
  console.log('   IMPORT ARIZONA LEADS FOR RUNE GATE CO.');
  console.log('   (Limited Credits - Getting as many as possible)');
  console.log('============================================================\n');

  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Get users
    const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
    const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });

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
    const totalNeeded = joshNeeds + clientsNeeds;

    console.log(`Need: Josh=${joshNeeds}, Clients=${clientsNeeds}, Total=${totalNeeded}\n`);

    // Fetch properties until we run out of credits
    console.log('STEP 1: Fetching properties from BatchData...');
    let allProperties = [];
    let skip = 0;
    let creditsExhausted = false;
    
    while (!creditsExhausted && allProperties.length < totalNeeded * 2) {
      console.log(`  Fetching batch at skip=${skip}...`);
      const { properties, error } = await searchProperties(skip, 20);
      
      if (error) {
        console.log(`  Credits exhausted: ${error}`);
        creditsExhausted = true;
        break;
      }
      
      if (properties.length === 0) break;
      
      allProperties.push(...properties);
      console.log(`  Got ${properties.length} (total: ${allProperties.length})`);
      skip += 20;
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n  Total properties fetched: ${allProperties.length}\n`);

    if (allProperties.length === 0) {
      console.log('No properties fetched. Add more BatchData credits and try again.');
      return;
    }

    // Get existing addresses
    console.log('STEP 2: Checking for duplicates...');
    const existingAddresses = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID },
      select: { address: true }
    });
    const existingSet = new Set(existingAddresses.map(p => p.address?.toLowerCase()).filter(Boolean));

    // Process and import
    console.log('STEP 3: Importing leads...');
    
    let importedForJosh = 0;
    let importedForClients = 0;
    let skipped = 0;

    for (const prop of allProperties) {
      const address = prop.address?.street;
      if (!address || existingSet.has(address.toLowerCase())) {
        skipped++;
        continue;
      }

      // Determine assignment
      let assignTo = null;
      if (importedForJosh < joshNeeds) {
        assignTo = josh.id;
      } else if (importedForClients < clientsNeeds) {
        assignTo = clients.id;
      } else {
        break;
      }

      const owner = prop.owner || {};
      const nameParts = parseOwnerName(owner.fullName);
      const emails = owner.emails || [];

      try {
        await prisma.people.create({
          data: {
            workspaceId: WORKSPACE_ID,
            mainSellerId: assignTo,
            firstName: nameParts.firstName || 'Homeowner',
            lastName: nameParts.lastName || '',
            fullName: owner.fullName || 'Unknown',
            email: emails[0] || null,
            address: address,
            city: prop.address?.city || 'Paradise Valley',
            state: prop.address?.state || 'AZ',
            postalCode: prop.address?.zip || '85253',
            country: 'US',
            status: 'LEAD',
            source: 'BatchData - Paradise Valley'
          }
        });

        existingSet.add(address.toLowerCase());

        if (assignTo === josh.id) {
          importedForJosh++;
        } else {
          importedForClients++;
        }
      } catch (error) {
        // Skip on error
      }
    }

    // Final counts
    const finalJoshCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null }
    });
    const finalClientsCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null }
    });

    console.log('\n============================================================');
    console.log('   IMPORT COMPLETE');
    console.log('============================================================');
    console.log(`\n  Imported for Josh: ${importedForJosh}`);
    console.log(`  Imported for Clients: ${importedForClients}`);
    console.log(`  Skipped (duplicates): ${skipped}`);
    console.log(`\n  FINAL LEAD COUNTS:`);
    console.log(`  Josh: ${finalJoshCount}`);
    console.log(`  Clients: ${finalClientsCount}`);
    
    if (finalJoshCount < 100 || finalClientsCount < 100) {
      console.log('\n  NOTE: Add more BatchData credits and run again to get more leads.');
    }
    console.log('============================================================\n');

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
