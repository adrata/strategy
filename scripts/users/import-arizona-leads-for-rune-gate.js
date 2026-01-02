#!/usr/bin/env node

/**
 * Import Arizona Leads for Rune Gate Co.
 * 
 * Fetches leads from BatchData, filters for Arizona phones, and imports them
 * assigning leads to Josh and Clients users.
 * 
 * Target:
 * - Josh: 100 total (has 33, needs 67 more)
 * - Clients: 100 total (has 0, needs 100)
 * 
 * Usage: node scripts/users/import-arizona-leads-for-rune-gate.js
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
      searchCriteria: {
        query: 'Paradise Valley, AZ'
      },
      options: { skip, take }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Property search failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.results?.properties || [];
}

async function skipTraceProperties(properties) {
  const requests = properties.map((p, idx) => ({
    requestId: `req_${idx}`,
    propertyAddress: {
      street: p.address?.street,
      city: p.address?.city,
      state: p.address?.state,
      zip: p.address?.zip
    }
  }));

  const response = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Skip trace failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const persons = data.results?.persons || [];

  // Merge phone data into properties
  return properties.map((prop, idx) => {
    const person = persons[idx];
    const phones = person?.phoneNumbers || [];
    const safePhones = phones.filter(p => !p.dnc);
    const primaryPhone = safePhones.find(p => p.type === 'Mobile') || safePhones[0] || phones[0];

    return {
      address: prop.address?.street,
      city: prop.address?.city,
      state: prop.address?.state,
      postalCode: prop.address?.zip,
      ownerName: prop.owner?.fullName || person?.name?.full || 'Unknown',
      firstName: person?.name?.first || prop.owner?.names?.[0]?.first || 'Homeowner',
      lastName: person?.name?.last || prop.owner?.names?.[0]?.last || '',
      phone: primaryPhone?.number || null,
      phoneType: primaryPhone?.type?.toLowerCase() || null,
      email: prop.owner?.emails?.[0] || person?.emails?.[0] || null,
      homeValue: prop.valuation?.estimatedValue || null,
      lotSizeSqFt: prop.lot?.lotSizeSqFt || null
    };
  });
}

async function main() {
  console.log('\n============================================================');
  console.log('   IMPORT ARIZONA LEADS FOR RUNE GATE CO.');
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

    // Fetch properties (get more than needed to account for filtering)
    console.log('STEP 1: Fetching properties from BatchData...');
    let allProperties = [];
    let skip = 0;
    
    while (allProperties.length < totalNeeded * 3) {
      console.log(`  Fetching batch at skip=${skip}...`);
      const properties = await searchProperties(skip, 20);
      if (properties.length === 0) break;
      allProperties.push(...properties);
      skip += 20;
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`  Found ${allProperties.length} properties\n`);

    // Skip trace in batches
    console.log('STEP 2: Skip-tracing for phone numbers...');
    let allHomeowners = [];
    
    for (let i = 0; i < allProperties.length; i += 50) {
      const batch = allProperties.slice(i, i + 50);
      console.log(`  Processing batch ${Math.floor(i/50) + 1}/${Math.ceil(allProperties.length/50)}...`);
      const homeowners = await skipTraceProperties(batch);
      allHomeowners.push(...homeowners);
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`  Skip-traced ${allHomeowners.length} homeowners\n`);

    // Filter for Arizona phones
    console.log('STEP 3: Filtering for Arizona phone numbers...');
    const arizonaLeads = allHomeowners.filter(h => isArizonaPhone(h.phone));
    console.log(`  Arizona leads: ${arizonaLeads.length}\n`);

    if (arizonaLeads.length < totalNeeded) {
      console.log(`  WARNING: Only found ${arizonaLeads.length} Arizona leads, needed ${totalNeeded}`);
    }

    // Check for existing addresses to avoid duplicates
    console.log('STEP 4: Checking for duplicates...');
    const existingAddresses = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID },
      select: { address: true }
    });
    const existingSet = new Set(existingAddresses.map(p => p.address?.toLowerCase()));

    const newLeads = arizonaLeads.filter(h => !existingSet.has(h.address?.toLowerCase()));
    console.log(`  New leads (not duplicates): ${newLeads.length}\n`);

    // Import leads
    console.log('STEP 5: Importing leads...');
    
    let importedForJosh = 0;
    let importedForClients = 0;
    let errors = 0;

    for (const lead of newLeads) {
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
            phone: lead.phone ? String(lead.phone) : null,
            mobilePhone: lead.phoneType === 'mobile' ? String(lead.phone) : null,
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
    console.log('============================================================\n');

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
