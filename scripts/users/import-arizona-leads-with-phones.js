#!/usr/bin/env node

/**
 * Import Arizona Leads for Rune Gate Co.
 * 
 * REQUIREMENTS:
 * - Only imports leads with phone numbers
 * - Only Arizona area codes (480, 520, 602, 623, 928)
 * - Splits 50/50 between Josh and Clients
 * 
 * Usage: node scripts/users/import-arizona-leads-with-phones.js
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
        query: 'Paradise Valley, AZ',
        general: { propertyType: { inList: ['SFR'] } }
      },
      options: { skip, take }
    })
  });

  const data = await response.json();
  if (data.status?.code !== 200) {
    return { properties: [], error: data.status?.message };
  }
  return { properties: data.results?.properties || [], error: null };
}

async function skipTraceProperty(address) {
  const response = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{
        requestId: 'req_1',
        propertyAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip
        }
      }]
    })
  });

  const data = await response.json();
  if (data.status?.code !== 200) {
    return { person: null, error: data.status?.message };
  }
  
  const person = data.results?.persons?.[0];
  return { person, error: null };
}

async function main() {
  console.log('\n============================================================');
  console.log('   IMPORT ARIZONA LEADS WITH PHONE NUMBERS');
  console.log('   (Only imports leads with verified AZ phone numbers)');
  console.log('============================================================\n');

  if (!BATCHDATA_API_KEY || BATCHDATA_API_KEY.includes('your_')) {
    console.error('ERROR: BATCHDATA_API_KEY not configured');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
    const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });

    // Get existing addresses
    const existing = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID },
      select: { address: true }
    });
    const existingSet = new Set(existing.map(p => p.address?.toLowerCase()).filter(Boolean));

    console.log('Existing leads:', existing.length);
    console.log('Starting property search and skip-trace...\n');

    let skip = 0;
    let totalProcessed = 0;
    let imported = 0;
    let skippedNoPhone = 0;
    let skippedNonAZ = 0;
    let skippedDuplicate = 0;
    let creditsExhausted = false;
    let assignToJosh = true; // Alternate between Josh and Clients

    while (!creditsExhausted && imported < 200) {
      // Fetch properties
      console.log(`Fetching properties at skip=${skip}...`);
      const { properties, error } = await searchProperties(skip, 20);
      
      if (error) {
        console.log(`  Search credits exhausted: ${error}`);
        creditsExhausted = true;
        break;
      }
      
      if (properties.length === 0) {
        console.log('  No more properties available');
        break;
      }

      // Process each property
      for (const prop of properties) {
        if (creditsExhausted) break;
        
        const address = prop.address;
        if (!address?.street) continue;
        
        // Check for duplicate
        if (existingSet.has(address.street.toLowerCase())) {
          skippedDuplicate++;
          continue;
        }
        
        totalProcessed++;
        
        // Skip-trace to get phone
        const { person, error: stError } = await skipTraceProperty(address);
        
        if (stError) {
          console.log(`  Skip-trace credits exhausted: ${stError}`);
          creditsExhausted = true;
          break;
        }
        
        // Check for phone
        const phones = person?.phoneNumbers || [];
        const safePhones = phones.filter(p => !p.dnc);
        const primaryPhone = safePhones.find(p => p.type === 'Mobile') || safePhones[0];
        
        if (!primaryPhone?.number) {
          skippedNoPhone++;
          continue;
        }
        
        // Check Arizona area code
        if (!isArizonaPhone(primaryPhone.number)) {
          skippedNonAZ++;
          continue;
        }
        
        // Import the lead
        const owner = prop.owner || {};
        const nameParts = (owner.fullName || '').split(/\s+/);
        const firstName = nameParts[0] || 'Homeowner';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await prisma.people.create({
          data: {
            workspaceId: WORKSPACE_ID,
            mainSellerId: assignToJosh ? josh.id : clients.id,
            firstName,
            lastName,
            fullName: owner.fullName || 'Unknown',
            phone: String(primaryPhone.number),
            mobilePhone: primaryPhone.type === 'Mobile' ? String(primaryPhone.number) : null,
            email: owner.emails?.[0] || person?.emails?.[0] || null,
            address: address.street,
            city: address.city || 'Paradise Valley',
            state: address.state || 'AZ',
            postalCode: address.zip || '85253',
            country: 'US',
            status: 'LEAD',
            source: 'BatchData - Paradise Valley'
          }
        });
        
        existingSet.add(address.street.toLowerCase());
        imported++;
        assignToJosh = !assignToJosh; // Alternate
        
        console.log(`  ✅ Imported: ${owner.fullName || 'Unknown'} | ${primaryPhone.number} | ${assignToJosh ? 'Clients' : 'Josh'}`);
        
        // Small delay
        await new Promise(r => setTimeout(r, 100));
      }
      
      skip += 20;
      await new Promise(r => setTimeout(r, 300));
    }

    // Final counts
    const joshCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null }
    });
    const clientsCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null }
    });

    console.log('\n============================================================');
    console.log('   IMPORT COMPLETE');
    console.log('============================================================');
    console.log(`\n  Properties processed: ${totalProcessed}`);
    console.log(`  Imported (with AZ phone): ${imported}`);
    console.log(`  Skipped - no phone: ${skippedNoPhone}`);
    console.log(`  Skipped - non-AZ phone: ${skippedNonAZ}`);
    console.log(`  Skipped - duplicate: ${skippedDuplicate}`);
    console.log(`\n  FINAL LEAD COUNTS (all have AZ phones):`);
    console.log(`  Josh: ${joshCount}`);
    console.log(`  Clients: ${clientsCount}`);
    console.log('============================================================\n');

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
