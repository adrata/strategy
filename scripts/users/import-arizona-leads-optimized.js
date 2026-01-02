#!/usr/bin/env node

/**
 * CREDIT-OPTIMIZED Arizona Lead Import
 * 
 * Optimizations:
 * 1. Batch skip-trace (20 properties per API call vs 1-by-1)
 * 2. Only search Paradise Valley, AZ (guaranteed Arizona addresses)
 * 3. Only import leads with verified Arizona phone numbers
 * 4. 50/50 split between Josh and Clients
 * 
 * Credit costs (approximate):
 * - Property search: ~$0.01 per property
 * - Skip-trace: ~$0.10-0.15 per property
 * - Batch skip-trace saves overhead vs individual calls
 * 
 * Usage: node scripts/users/import-arizona-leads-optimized.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const AZ_CODES = ['480', '520', '602', '623', '928'];
const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY;
const BATCH_SIZE = 20; // Optimal batch size for skip-trace

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

function getBestAZPhone(phones) {
  if (!phones || !phones.length) return null;
  
  // Filter for safe (non-DNC) phones first
  const safePhones = phones.filter(p => !p.dnc && p.number);
  
  // Find first Arizona phone, preferring mobile
  const mobile = safePhones.find(p => p.type === 'Mobile' && isArizonaPhone(p.number));
  if (mobile) return mobile;
  
  const landline = safePhones.find(p => isArizonaPhone(p.number));
  return landline || null;
}

async function searchProperties(skip = 0) {
  console.log(`   Searching properties (skip=${skip}, take=${BATCH_SIZE})...`);
  
  const response = await fetch('https://api.batchdata.com/api/v1/property/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      searchCriteria: {
        query: 'Paradise Valley, AZ',
        general: { 
          propertyType: { inList: ['SFR'] }  // Single Family Residential only
        }
      },
      options: { skip, take: BATCH_SIZE }
    })
  });

  const data = await response.json();
  
  if (data.status?.code === 403) {
    return { properties: [], error: 'CREDITS_EXHAUSTED', message: data.status.message };
  }
  if (data.status?.code !== 200) {
    return { properties: [], error: 'API_ERROR', message: data.status?.message };
  }
  
  return { properties: data.results?.properties || [], error: null };
}

async function batchSkipTrace(properties) {
  if (!properties.length) return [];
  
  console.log(`   Batch skip-tracing ${properties.length} properties...`);
  
  // Build batch request
  const requests = properties.map((prop, i) => ({
    requestId: `req_${i}`,
    propertyAddress: {
      street: prop.address?.street,
      city: prop.address?.city || 'Paradise Valley',
      state: prop.address?.state || 'AZ',
      zip: prop.address?.zip
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

  const data = await response.json();
  
  if (data.status?.code === 403) {
    return { results: [], error: 'CREDITS_EXHAUSTED', message: data.status.message };
  }
  if (data.status?.code !== 200) {
    return { results: [], error: 'API_ERROR', message: data.status?.message };
  }
  
  // Match results back to properties
  const resultsMap = new Map();
  for (const result of (data.results?.persons || [])) {
    resultsMap.set(result.requestId, result);
  }
  
  return { 
    results: properties.map((prop, i) => ({
      property: prop,
      skipTrace: resultsMap.get(`req_${i}`) || null
    })),
    error: null 
  };
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('   CREDIT-OPTIMIZED ARIZONA LEAD IMPORT');
  console.log('   - Batch skip-trace (20 at once)');
  console.log('   - Only Arizona phone numbers');
  console.log('   - 50/50 Josh/Clients split');
  console.log('='.repeat(70) + '\n');

  if (!BATCHDATA_API_KEY || BATCHDATA_API_KEY.includes('your_')) {
    console.error('❌ BATCHDATA_API_KEY not configured in .env');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get users
    const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
    const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });
    
    if (!josh || !clients) {
      console.error('❌ Could not find Josh or Clients users');
      process.exit(1);
    }

    // Get existing addresses to avoid duplicates
    const existing = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID, deletedAt: null },
      select: { address: true }
    });
    const existingSet = new Set(existing.map(p => p.address?.toLowerCase()).filter(Boolean));
    console.log(`📊 Existing leads: ${existing.length}`);

    // Stats
    let skip = 0;
    let totalSearched = 0;
    let totalSkipTraced = 0;
    let imported = 0;
    let skippedNoPhone = 0;
    let skippedNonAZ = 0;
    let skippedDuplicate = 0;
    let creditsExhausted = false;
    let assignToJosh = true;

    console.log('\n📍 Starting optimized import...\n');

    while (!creditsExhausted && imported < 200) {
      // STEP 1: Batch search properties
      const { properties, error: searchError, message: searchMsg } = await searchProperties(skip);
      
      if (searchError === 'CREDITS_EXHAUSTED') {
        console.log(`\n⚠️  Search credits exhausted: ${searchMsg}`);
        creditsExhausted = true;
        break;
      }
      
      if (searchError || properties.length === 0) {
        console.log(properties.length === 0 ? '   No more properties' : `   Error: ${searchMsg}`);
        break;
      }
      
      totalSearched += properties.length;
      console.log(`   Found ${properties.length} properties`);
      
      // STEP 2: Batch skip-trace (ONE API call for all 20)
      const { results, error: stError, message: stMsg } = await batchSkipTrace(properties);
      
      if (stError === 'CREDITS_EXHAUSTED') {
        console.log(`\n⚠️  Skip-trace credits exhausted: ${stMsg}`);
        creditsExhausted = true;
        break;
      }
      
      totalSkipTraced += results.length;
      
      // STEP 3: Filter and import only AZ phone leads
      for (const { property, skipTrace } of results) {
        const address = property.address;
        if (!address?.street) continue;
        
        // Check duplicate
        if (existingSet.has(address.street.toLowerCase())) {
          skippedDuplicate++;
          continue;
        }
        
        // Get best Arizona phone
        const phones = skipTrace?.phoneNumbers || [];
        const bestPhone = getBestAZPhone(phones);
        
        if (!bestPhone) {
          // Check if they had phones but none were AZ
          const hasAnyPhone = phones.some(p => p.number);
          if (hasAnyPhone) {
            skippedNonAZ++;
          } else {
            skippedNoPhone++;
          }
          continue;
        }
        
        // IMPORT - has Arizona phone!
        const owner = property.owner || {};
        const nameParts = (owner.fullName || '').split(/\s+/);
        const firstName = nameParts[0] || 'Homeowner';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await prisma.people.create({
          data: {
            workspaceId: WORKSPACE_ID,
            mainSellerId: assignToJosh ? josh.id : clients.id,
            firstName,
            lastName,
            fullName: owner.fullName || `${firstName} ${lastName}`.trim(),
            phone: String(bestPhone.number),
            mobilePhone: bestPhone.type === 'Mobile' ? String(bestPhone.number) : null,
            email: owner.emails?.[0] || skipTrace?.emails?.[0] || null,
            address: address.street,
            city: address.city || 'Paradise Valley',
            state: 'AZ',
            postalCode: address.zip || '85253',
            country: 'US',
            status: 'LEAD',
            source: 'BatchData - Paradise Valley AZ'
          }
        });
        
        existingSet.add(address.street.toLowerCase());
        imported++;
        
        const assignedTo = assignToJosh ? 'Josh' : 'Clients';
        assignToJosh = !assignToJosh;
        
        console.log(`   ✅ ${firstName} ${lastName} | ${bestPhone.number} → ${assignedTo}`);
      }
      
      skip += BATCH_SIZE;
      
      // Brief pause between batches
      await new Promise(r => setTimeout(r, 500));
    }

    // Final stats
    const joshCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null }
    });
    const clientsCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null }
    });

    console.log('\n' + '='.repeat(70));
    console.log('   IMPORT COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n   📊 CREDIT USAGE:`);
    console.log(`   Properties searched: ${totalSearched}`);
    console.log(`   Skip-traces used: ${totalSkipTraced}`);
    console.log(`\n   📋 RESULTS:`);
    console.log(`   Imported (with AZ phone): ${imported}`);
    console.log(`   Skipped - no phone: ${skippedNoPhone}`);
    console.log(`   Skipped - non-AZ phone: ${skippedNonAZ}`);
    console.log(`   Skipped - duplicate: ${skippedDuplicate}`);
    console.log(`\n   👥 FINAL COUNTS (all have AZ phones):`);
    console.log(`   Josh: ${joshCount}`);
    console.log(`   Clients: ${clientsCount}`);
    console.log(`   Total: ${joshCount + clientsCount}`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
