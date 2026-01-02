#!/usr/bin/env node

/**
 * HYBRID PIPELINE: BatchData Search + Tracerfy Skip-Trace
 * 
 * Uses BatchData for property SEARCH (cheap, ~$0.01/property)
 * Uses Tracerfy for skip-trace (cheap, $0.009/lead)
 * 
 * Total cost: ~$0.02 per lead with phone number
 * 
 * Usage: node scripts/users/hybrid-batchdata-tracerfy.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

const prisma = new PrismaClient();

// Configuration
const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const AZ_CODES = ['480', '520', '602', '623', '928'];
const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY;
const TRACERFY_API_KEY = process.env.TRACERFY_API_KEY;
const TRACERFY_BASE_URL = 'https://tracerfy.com/v1/api';

// Helpers
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getAreaCode(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits.substring(0, 3);
  if (digits.length === 11 && digits.startsWith('1')) return digits.substring(1, 4);
  return null;
}

function isArizonaPhone(phone) {
  return phone && AZ_CODES.includes(getAreaCode(phone));
}

function normalizePhone(phone) {
  if (!phone) return null;
  return String(phone).replace(/\D/g, '').slice(-10);
}

// ============== STEP 1: BATCHDATA PROPERTY SEARCH ==============

async function searchBatchDataProperties(skip = 0, take = 50) {
  try {
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

    const data = await response.json();
    
    // Check for errors
    if (response.status === 403 || data.status?.code === 403) {
      return { properties: [], error: 'CREDITS_EXHAUSTED' };
    }
    
    if (data.status?.message?.toLowerCase().includes('insufficient')) {
      return { properties: [], error: 'CREDITS_EXHAUSTED' };
    }
    
    if (data.status?.code && data.status.code !== 200) {
      console.log(`   BatchData response: ${JSON.stringify(data.status)}`);
      return { properties: [], error: data.status?.message || 'API_ERROR' };
    }

    const properties = (data.results?.properties || []).map(p => ({
      address: p.address?.street,
      city: p.address?.city || 'Paradise Valley',
      state: p.address?.state || 'AZ',
      zip: p.address?.zip || '85253',
      firstName: p.owner?.names?.[0]?.first || '',
      lastName: p.owner?.names?.[0]?.last || '',
      ownerName: p.owner?.fullName || ''
    })).filter(p => p.address);

    return { properties, error: null, total: data.results?.meta?.total };
  } catch (err) {
    console.log(`   BatchData fetch error: ${err.message}`);
    return { properties: [], error: err.message };
  }
}

async function getAllBatchDataProperties(existingAddresses, maxProperties = 500) {
  console.log('\n' + '═'.repeat(60));
  console.log('   STEP 1: BATCHDATA PROPERTY SEARCH');
  console.log('   (Getting REAL Paradise Valley addresses)');
  console.log('═'.repeat(60) + '\n');

  const allProperties = [];
  let skip = 0;
  const take = 50;
  let creditsExhausted = false;

  while (!creditsExhausted && allProperties.length < maxProperties) {
    console.log(`   Fetching properties ${skip} to ${skip + take}...`);
    
    const { properties, error, total } = await searchBatchDataProperties(skip, take);
    
    if (error === 'CREDITS_EXHAUSTED') {
      console.log('   ⚠️  BatchData credits exhausted');
      creditsExhausted = true;
      break;
    }
    
    if (error) {
      console.log(`   ⚠️  Error: ${error}`);
      break;
    }
    
    if (properties.length === 0) {
      console.log('   No more properties available');
      break;
    }

    // Filter out existing addresses
    const newProps = properties.filter(p => 
      !existingAddresses.has(p.address.toLowerCase())
    );
    
    console.log(`   Got ${properties.length} properties (${newProps.length} new)`);
    allProperties.push(...newProps);
    
    if (total) {
      console.log(`   Total available: ${total}`);
    }
    
    skip += take;
    await sleep(500);
  }

  console.log(`\n   ✅ Total new properties from BatchData: ${allProperties.length}`);
  return allProperties;
}

// ============== STEP 2: TRACERFY SKIP-TRACE ==============

async function tracerfyRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${TRACERFY_BASE_URL}${endpoint}`);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${TRACERFY_API_KEY}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 503) {
          reject(new Error('Rate limited'));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`API error ${res.statusCode}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function skipTraceWithTracerfy(properties) {
  console.log('\n' + '═'.repeat(60));
  console.log('   STEP 2: TRACERFY SKIP-TRACE');
  console.log('   (Getting phone numbers for real addresses)');
  console.log('═'.repeat(60) + '\n');

  if (properties.length === 0) {
    console.log('   No properties to skip-trace');
    return [];
  }

  // Check balance
  console.log('💰 Checking Tracerfy balance...');
  await sleep(2000);
  try {
    const analytics = await tracerfyRequest('/analytics/');
    console.log(`   Balance: $${analytics.balance || analytics.credits || 'N/A'}`);
  } catch (e) {
    console.log(`   Could not check balance`);
  }

  // Create CSV
  const csvPath = path.join(__dirname, 'batchdata-properties.csv');
  const headers = 'address,city,state,zip,first_name,last_name,mail_address,mail_city,mail_state,mailing_zip';
  const rows = properties.map(p => 
    `"${p.address}","${p.city}","${p.state}","${p.zip}","${p.firstName}","${p.lastName}","${p.address}","${p.city}","${p.state}","${p.zip}"`
  );
  fs.writeFileSync(csvPath, [headers, ...rows].join('\n'));

  console.log(`\n📤 Submitting ${properties.length} REAL properties to Tracerfy...`);

  // Submit job
  const formData = new FormData();
  formData.append('csv_file', fs.createReadStream(csvPath), { filename: 'properties.csv', contentType: 'text/csv' });
  formData.append('address_column', 'address');
  formData.append('city_column', 'city');
  formData.append('state_column', 'state');
  formData.append('zip_column', 'zip');
  formData.append('first_name_column', 'first_name');
  formData.append('last_name_column', 'last_name');
  formData.append('mail_address_column', 'mail_address');
  formData.append('mail_city_column', 'mail_city');
  formData.append('mail_state_column', 'mail_state');
  formData.append('mailing_zip_column', 'mailing_zip');

  const job = await new Promise((resolve, reject) => {
    const url = new URL(`${TRACERFY_BASE_URL}/trace/`);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TRACERFY_API_KEY}`, ...formData.getHeaders() }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.unlinkSync(csvPath);
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          reject(new Error(`Submit failed ${res.statusCode}: ${data.substring(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid response')); }
      });
    });
    req.on('error', reject);
    formData.pipe(req);
  });

  console.log(`   ✅ Job submitted: queue_id=${job.queue_id}`);

  // Wait for results
  console.log('\n⏳ Waiting for Tracerfy to process (5-15 min)...');
  const maxWait = 15 * 60 * 1000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    await sleep(25000);

    try {
      const queues = await tracerfyRequest('/queues/');
      const thisJob = queues.find(q => q.id === job.queue_id);
      
      if (!thisJob) continue;

      console.log(`   Job ${job.queue_id}: pending=${thisJob.pending}, credits=${thisJob.credits_deducted || 0}`);

      if (!thisJob.pending && thisJob.download_url) {
        console.log('   ✅ Job completed!');
        console.log(`   💰 Credits used: ${thisJob.credits_deducted || 0}`);
        
        // Download results
        const csvData = await new Promise((resolve, reject) => {
          https.get(thisJob.download_url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
          }).on('error', reject);
        });

        return parseCSV(csvData);
      }
    } catch (err) {
      if (err.message.includes('Rate limit')) {
        console.log('   ⏸️  Rate limited, waiting...');
        await sleep(25000);
      }
    }
  }

  throw new Error('Tracerfy job timed out');
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => 
    h.trim().toLowerCase().replace(/"/g, '').replace(/[^a-z0-9]/g, '_')
  );

  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record = {};
    headers.forEach((h, i) => {
      record[h] = (values[i] || '').replace(/^"|"$/g, '');
    });
    return record;
  });
}

function findBestAZPhone(record) {
  const phoneFields = [
    'primary_phone', 'mobile_1', 'mobile_2', 'mobile_3', 'mobile_4', 'mobile_5',
    'landline_1', 'landline_2', 'landline_3'
  ];
  
  for (const field of phoneFields) {
    const phone = record[field];
    if (phone && isArizonaPhone(phone)) {
      return normalizePhone(phone);
    }
  }
  return null;
}

// ============== STEP 3: DATABASE IMPORT ==============

async function importToDatabase(records, existingPhones) {
  console.log('\n' + '═'.repeat(60));
  console.log('   STEP 3: DATABASE IMPORT');
  console.log('   (Arizona phones only, 50/50 split)');
  console.log('═'.repeat(60) + '\n');

  const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
  const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });

  let imported = 0;
  let skippedNoPhone = 0;
  let skippedNonAZ = 0;
  let skippedDuplicate = 0;
  let assignToJosh = true;

  for (const record of records) {
    const address = record.address;
    if (!address) continue;

    const azPhone = findBestAZPhone(record);

    if (!azPhone) {
      const hasPhone = ['primary_phone', 'mobile_1', 'landline_1'].some(f => record[f]);
      hasPhone ? skippedNonAZ++ : skippedNoPhone++;
      continue;
    }

    if (existingPhones.has(azPhone)) {
      skippedDuplicate++;
      continue;
    }

    const firstName = record.first_name || 'Homeowner';
    const lastName = record.last_name || '';

    await prisma.people.create({
      data: {
        workspaceId: WORKSPACE_ID,
        mainSellerId: assignToJosh ? josh.id : clients.id,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim() || 'Unknown',
        phone: azPhone,
        mobilePhone: azPhone,
        email: record.email_1 || null,
        address,
        city: record.city || 'Paradise Valley',
        state: 'AZ',
        postalCode: record.zip || '85253',
        country: 'US',
        status: 'LEAD',
        source: 'BatchData+Tracerfy Hybrid'
      }
    });

    existingPhones.add(azPhone);
    imported++;

    const assignedTo = assignToJosh ? 'Josh' : 'Clients';
    assignToJosh = !assignToJosh;

    console.log(`   ✅ ${firstName} ${lastName} | ${azPhone} → ${assignedTo}`);
  }

  const joshCount = await prisma.people.count({
    where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null }
  });
  const clientsCount = await prisma.people.count({
    where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null }
  });

  return { imported, skippedNoPhone, skippedNonAZ, skippedDuplicate, joshCount, clientsCount };
}

// ============== MAIN ==============

async function main() {
  console.log('\n╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(12) + 'HYBRID PIPELINE: BATCHDATA + TRACERFY' + ' '.repeat(17) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║   BatchData: SEARCH real properties (~$0.01/property)' + ' '.repeat(12) + '║');
  console.log('║   Tracerfy: SKIP-TRACE for phone numbers ($0.009/lead)' + ' '.repeat(10) + '║');
  console.log('║   Total cost: ~$0.02 per lead with phone number' + ' '.repeat(18) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  if (!BATCHDATA_API_KEY || !TRACERFY_API_KEY) {
    console.error('❌ Missing API keys in .env');
    process.exit(1);
  }

  try {
    await prisma.$connect();

    // Get existing data
    const existing = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID },
      select: { address: true, phone: true, mobilePhone: true }
    });

    const existingAddresses = new Set(existing.map(p => p.address?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(
      existing.flatMap(p => [p.phone, p.mobilePhone].map(normalizePhone).filter(Boolean))
    );

    console.log(`📊 Existing: ${existingAddresses.size} addresses, ${existingPhones.size} phones\n`);

    // STEP 1: Get real properties from BatchData
    const properties = await getAllBatchDataProperties(existingAddresses, 300);
    
    if (properties.length === 0) {
      console.log('\n⚠️  No new properties found. Need more BatchData credits or all properties already imported.');
      await prisma.$disconnect();
      return;
    }

    // STEP 2: Skip-trace with Tracerfy
    const records = await skipTraceWithTracerfy(properties);

    // STEP 3: Import to database
    const results = await importToDatabase(records, existingPhones);

    await prisma.$disconnect();

    // Final report
    console.log('\n╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(22) + 'PIPELINE COMPLETE' + ' '.repeat(28) + '║');
    console.log('╠' + '═'.repeat(68) + '╣');
    console.log(`║   Properties searched (BatchData):  ${String(properties.length).padEnd(30)}║`);
    console.log(`║   NEW leads imported:               ${String(results.imported).padEnd(30)}║`);
    console.log(`║   Skipped (no phone):               ${String(results.skippedNoPhone).padEnd(30)}║`);
    console.log(`║   Skipped (non-AZ phone):           ${String(results.skippedNonAZ).padEnd(30)}║`);
    console.log(`║   Skipped (duplicate):              ${String(results.skippedDuplicate).padEnd(30)}║`);
    console.log('╠' + '═'.repeat(68) + '╣');
    console.log(`║   Josh total:                       ${String(results.joshCount).padEnd(30)}║`);
    console.log(`║   Clients total:                    ${String(results.clientsCount).padEnd(30)}║`);
    console.log(`║   GRAND TOTAL:                      ${String(results.joshCount + results.clientsCount).padEnd(30)}║`);
    console.log('╚' + '═'.repeat(68) + '╝\n');

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();












