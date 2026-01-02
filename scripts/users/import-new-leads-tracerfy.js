#!/usr/bin/env node

/**
 * Import NET NEW Arizona Leads using Tracerfy
 * 
 * Uses real Paradise Valley street names to find nearby properties
 * Filters out existing addresses AND phone numbers (net new only)
 * Only imports Arizona phone numbers
 * 50/50 split between Josh and Clients
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const AZ_CODES = ['480', '520', '602', '623', '928'];
const TRACERFY_BASE_URL = 'https://tracerfy.com/v1/api';
const TRACERFY_API_KEY = process.env.TRACERFY_API_KEY;

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

function findBestAZPhone(record) {
  const phoneFields = [
    'primary_phone', 'mobile-1', 'mobile-2', 'mobile-3', 'mobile-4', 'mobile-5',
    'landline-1', 'landline-2', 'landline-3'
  ];
  for (const field of phoneFields) {
    const phone = record[field];
    if (phone && isArizonaPhone(phone)) return normalizePhone(phone);
  }
  return null;
}

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
        if (res.statusCode !== 200) {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Invalid JSON: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function submitJob(csvPath) {
  return new Promise((resolve, reject) => {
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
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          reject(new Error(`Submit failed ${res.statusCode}: ${data}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Invalid response: ${data}`)); }
      });
    });
    req.on('error', reject);
    formData.pipe(req);
  });
}

async function waitForJob(queueId) {
  const maxWait = 5 * 60 * 1000;
  const start = Date.now();
  
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 20000)); // Rate limit: 20 sec between calls
    
    try {
      const queues = await tracerfyRequest('/queues/');
      const job = queues.find(q => q.id === queueId);
      
      if (!job) throw new Error(`Job ${queueId} not found`);
      
      console.log(`   Job ${queueId}: pending=${job.pending}, credits=${job.credits_deducted || 0}`);
      
      if (!job.pending && job.download_url) {
        return job.download_url;
      }
    } catch (err) {
      if (err.message.includes('Rate limit')) {
        console.log('   Rate limited, waiting...');
        await new Promise(r => setTimeout(r, 20000));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Job timed out');
}

async function downloadCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/("([^"]|"")*"|[^,]*)/g) || [];
    const record = {};
    headers.forEach((h, i) => {
      record[h] = (values[i] || '').replace(/^"|"$/g, '').replace(/""/g, '"');
    });
    return record;
  });
}

function generateNearbyAddresses(existingAddresses) {
  // Extract unique street names from existing addresses
  const streetPattern = /^\d+\s+(.+)$/;
  const streets = new Map();
  
  for (const addr of existingAddresses) {
    const match = addr.match(streetPattern);
    if (match) {
      const street = match[1];
      const num = parseInt(addr);
      if (!streets.has(street)) {
        streets.set(street, []);
      }
      streets.get(street).push(num);
    }
  }
  
  // Generate nearby addresses
  const newAddresses = [];
  const existingSet = new Set(existingAddresses.map(a => a.toLowerCase()));
  
  for (const [street, numbers] of streets) {
    numbers.sort((a, b) => a - b);
    const minNum = Math.min(...numbers);
    const maxNum = Math.max(...numbers);
    
    // Generate addresses around the known range
    for (let n = minNum - 200; n <= maxNum + 200; n += 2) {
      if (n < 1000) continue;
      const addr = `${n} ${street}`;
      if (!existingSet.has(addr.toLowerCase())) {
        newAddresses.push({
          address: addr,
          city: 'Paradise Valley',
          state: 'AZ',
          zip: '85253'
        });
      }
    }
  }
  
  return newAddresses;
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('   IMPORT NET NEW ARIZONA LEADS');
  console.log('   - Uses real street names from existing leads');
  console.log('   - Filters out existing addresses AND phone numbers');
  console.log('   - Only Arizona phones (480, 520, 602, 623, 928)');
  console.log('═'.repeat(70) + '\n');

  if (!TRACERFY_API_KEY) {
    console.error('❌ TRACERFY_API_KEY not set');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get users
    const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
    const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });
    if (!josh || !clients) throw new Error('Users not found');

    // Get ALL existing data to avoid duplicates
    const existing = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID },
      select: { address: true, phone: true, mobilePhone: true }
    });
    
    const existingAddresses = new Set(existing.map(p => p.address?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(existing.flatMap(p => 
      [p.phone, p.mobilePhone].map(normalizePhone).filter(Boolean)
    ));
    
    console.log(`📊 Existing addresses: ${existingAddresses.size}`);
    console.log(`📊 Existing phones: ${existingPhones.size}`);

    // Check Tracerfy balance
    console.log('\n🔌 Checking Tracerfy...');
    const analytics = await tracerfyRequest('/analytics/');
    console.log(`   💰 Balance: $${analytics.balance || analytics.credits || 'N/A'}`);

    // Generate new addresses based on real streets
    const realAddresses = [...existingAddresses];
    const newProperties = generateNearbyAddresses(realAddresses);
    console.log(`\n📍 Generated ${newProperties.length} potential new addresses`);

    if (newProperties.length === 0) {
      console.log('⚠️  No new addresses to process');
      return;
    }

    // Take first 200 for this run
    const batch = newProperties.slice(0, 200);
    console.log(`📤 Processing batch of ${batch.length} properties...\n`);

    // Create CSV
    const csvPath = path.join(__dirname, 'new-properties.csv');
    const headers = 'address,city,state,zip,first_name,last_name,mail_address,mail_city,mail_state,mailing_zip';
    const rows = batch.map(p => 
      `"${p.address}","${p.city}","${p.state}","${p.zip}","","","${p.address}","${p.city}","${p.state}","${p.zip}"`
    );
    fs.writeFileSync(csvPath, [headers, ...rows].join('\n'));

    // Submit to Tracerfy
    console.log('📤 Submitting to Tracerfy...');
    const job = await submitJob(csvPath);
    console.log(`   ✅ Job submitted: queue_id=${job.queue_id}`);
    fs.unlinkSync(csvPath);

    // Wait for results
    console.log('\n⏳ Waiting for results (this takes 5-15 minutes)...');
    const downloadUrl = await waitForJob(job.queue_id);
    console.log('   ✅ Job completed!');

    // Download and parse results
    console.log('\n📥 Downloading results...');
    const csvData = await downloadCSV(downloadUrl);
    const records = parseCSV(csvData);
    console.log(`   Got ${records.length} records`);

    // Import leads
    let imported = 0;
    let skippedNoPhone = 0;
    let skippedNonAZ = 0;
    let skippedDuplicate = 0;
    let assignToJosh = true;

    console.log('\n📋 Processing results...');
    
    for (const record of records) {
      const address = record.address;
      if (!address) continue;
      
      // Skip duplicate addresses
      if (existingAddresses.has(address.toLowerCase())) {
        skippedDuplicate++;
        continue;
      }
      
      // Find Arizona phone
      const azPhone = findBestAZPhone(record);
      
      if (!azPhone) {
        const hasPhone = ['primary_phone', 'mobile-1', 'landline-1'].some(f => record[f]);
        hasPhone ? skippedNonAZ++ : skippedNoPhone++;
        continue;
      }
      
      // Skip duplicate phones
      if (existingPhones.has(azPhone)) {
        skippedDuplicate++;
        continue;
      }

      // Import!
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
          email: record['email-1'] || null,
          address,
          city: record.city || 'Paradise Valley',
          state: 'AZ',
          postalCode: record.zip || '85253',
          country: 'US',
          status: 'LEAD',
          source: 'Tracerfy - Paradise Valley AZ'
        }
      });

      existingAddresses.add(address.toLowerCase());
      existingPhones.add(azPhone);
      imported++;
      
      const assignedTo = assignToJosh ? 'Josh' : 'Clients';
      assignToJosh = !assignToJosh;
      
      console.log(`   ✅ ${firstName} ${lastName} | ${azPhone} → ${assignedTo}`);
    }

    // Final counts
    const joshCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null }
    });
    const clientsCount = await prisma.people.count({
      where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null }
    });

    console.log('\n' + '═'.repeat(70));
    console.log('   IMPORT COMPLETE');
    console.log('═'.repeat(70));
    console.log(`\n   📋 RESULTS:`);
    console.log(`   NEW leads imported: ${imported}`);
    console.log(`   Skipped - no phone: ${skippedNoPhone}`);
    console.log(`   Skipped - non-AZ phone: ${skippedNonAZ}`);
    console.log(`   Skipped - duplicate: ${skippedDuplicate}`);
    console.log(`\n   👥 FINAL COUNTS:`);
    console.log(`   Josh: ${joshCount}`);
    console.log(`   Clients: ${clientsCount}`);
    console.log(`   Total: ${joshCount + clientsCount}`);
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('Rate limit')) {
      console.log('   Try running again in 20 seconds');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();












