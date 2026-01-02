#!/usr/bin/env node

/**
 * Import Leads for Rune Gate Co. (No Skip-Trace)
 * 
 * Uses property search data only (owner names, emails, addresses).
 * Skip-trace is skipped due to insufficient BatchData credits.
 * 
 * Target:
 * - Josh: 100 total (has 33, needs 67 more)
 * - Clients: 100 total (has 0, needs 100)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY;

async function searchProperties(skip = 0, take = 100) {
  const response = await fetch('https://api.batchdata.com/api/v1/property/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      searchCriteria: {
        query: 'Paradise Valley, AZ',
        general: { propertyType: { inList: ['SFR'] } },
        lot: { lotSizeSqFt: { min: 10000 } },
        valuation: { estimatedValue: { min: 1000000 } }
      },
      options: { skip, take, skipTrace: false, images: false }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Property search failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.results?.properties || [];
}

function parseOwnerName(fullName) {
  if (!fullName) return { firstName: 'Homeowner', lastName: '' };
  
  // Handle trusts/LLC
  if (fullName.includes('TRUST') || fullName.includes('LLC') || fullName.includes('INC')) {
    return { firstName: fullName, lastName: '' };
  }
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function main() {
  console.log('\n============================================================');
  console.log('   IMPORT LEADS FOR RUNE GATE CO. (No Skip-Trace)');
  console.log('============================================================\n');

  if (!BATCHDATA_API_KEY || BATCHDATA_API_KEY.includes('your_')) {
    console.error('ERROR: BATCHDATA_API_KEY not configured');
    process.exit(1);
  }

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
    console.log(`  Josh: ${joshLeadCount} (needs ${Math.max(0, 100 - joshLeadCount)} more)`);
    console.log(`  Clients: ${clientsLeadCount} (needs ${Math.max(0, 100 - clientsLeadCount)} more)\n`);

    const joshNeeds = Math.max(0, 100 - joshLeadCount);
    const clientsNeeds = Math.max(0, 100 - clientsLeadCount);
    const totalNeeded = joshNeeds + clientsNeeds;

    if (totalNeeded === 0) {
      console.log('Both users already have 100+ leads. Nothing to import.');
      return;
    }

    console.log(`Total leads needed: ${totalNeeded}\n`);

    // Fetch properties with skipTrace enabled in search
    console.log('STEP 1: Fetching properties from BatchData (with built-in skipTrace)...');
    let allProperties = [];
    let skip = 0;
    
    while (allProperties.length < totalNeeded * 2) {
      console.log(`  Fetching batch at skip=${skip}...`);
      const properties = await searchProperties(skip, 100);
      if (properties.length === 0) break;
      allProperties.push(...properties);
      skip += 100;
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`  Found ${allProperties.length} properties\n`);

    // Get existing addresses to avoid duplicates
    console.log('STEP 2: Checking for duplicates...');
    const existingAddresses = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID },
      select: { address: true }
    });
    const existingSet = new Set(existingAddresses.map(p => p.address?.toLowerCase()).filter(Boolean));

    // Process properties into leads
    const leads = allProperties.map(prop => {
      const owner = prop.owner || {};
      const address = prop.address || {};
      const nameParts = parseOwnerName(owner.fullName);
      const emails = owner.emails || [];
      
      return {
        address: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.zip,
        ownerName: owner.fullName || 'Unknown',
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        email: emails[0] || null
      };
    }).filter(lead => lead.address && !existingSet.has(lead.address?.toLowerCase()));

    console.log(`  New leads (not duplicates): ${leads.length}\n`);

    // Import leads
    console.log('STEP 3: Importing leads...');
    
    let importedForJosh = 0;
    let importedForClients = 0;
    let errors = 0;

    for (const lead of leads) {
      // Determine who to assign to
      let assignTo = null;
      if (importedForJosh < joshNeeds) {
        assignTo = josh.id;
      } else if (importedForClients < clientsNeeds) {
        assignTo = clients.id;
      } else {
        break; // We have enough
      }

      try {
        await prisma.people.create({
          data: {
            workspaceId: WORKSPACE_ID,
            firstName: lead.firstName || 'Homeowner',
            lastName: lead.lastName || '',
            fullName: lead.ownerName || `${lead.firstName} ${lead.lastName}`.trim() || 'Unknown',
            email: lead.email || null,
            address: lead.address || null,
            city: lead.city || null,
            state: lead.state || null,
            postalCode: lead.postalCode || null,
            country: 'US',
            status: 'LEAD',
            source: 'BatchData - Paradise Valley',
            mainSellerId: assignTo
          }
        });

        if (assignTo === josh.id) {
          importedForJosh++;
        } else {
          importedForClients++;
        }

        const total = importedForJosh + importedForClients;
        if (total % 25 === 0) {
          console.log(`  Progress: ${total} imported (Josh: ${importedForJosh}, Clients: ${importedForClients})`);
        }

      } catch (error) {
        errors++;
        if (errors <= 3) {
          console.log(`  Error importing ${lead.address}: ${error.message.substring(0, 100)}`);
        }
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
    console.log(`  Errors: ${errors}`);
    console.log(`\n  FINAL LEAD COUNTS:`);
    console.log(`  Josh: ${finalJoshCount}`);
    console.log(`  Clients: ${finalClientsCount}`);
    console.log('\n  NOTE: Leads imported without phone numbers due to');
    console.log('  insufficient BatchData skip-trace credits.');
    console.log('  Phone numbers can be added later when credits are available.');
    console.log('============================================================\n');

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
