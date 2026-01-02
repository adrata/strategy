#!/usr/bin/env node

/**
 * COMPLETE Tracerfy Skip Trace Integration
 * 
 * This is a fully working solution for importing Arizona leads
 * using Tracerfy's skip tracing API ($0.009 per lead).
 * 
 * Features:
 * - Tests API connection before starting
 * - Handles async job processing with polling
 * - Downloads and parses CSV results
 * - Only imports leads with Arizona phone numbers
 * - 50/50 split between Josh and Clients
 * 
 * Usage: node scripts/users/tracerfy-complete.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const AZ_CODES = ['480', '520', '602', '623', '928'];
const TRACERFY_BASE_URL = 'https://tracerfy.com/v1/api';
const TRACERFY_API_KEY = process.env.TRACERFY_API_KEY;

// Arizona phone helpers
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

function findBestAZPhone(record) {
  // Check all possible phone fields
  const phoneFields = [
    'primary_phone',
    'mobile_1', 'mobile_2', 'mobile_3', 'mobile_4', 'mobile_5',
    'landline_1', 'landline_2', 'landline_3',
    'phone', 'phone1', 'phone2', 'phone3'
  ];
  
  for (const field of phoneFields) {
    const phone = record[field];
    if (phone && isArizonaPhone(phone)) {
      return phone;
    }
  }
  return null;
}

function hasAnyPhone(record) {
  const phoneFields = [
    'primary_phone',
    'mobile_1', 'mobile_2', 'mobile_3', 'mobile_4', 'mobile_5',
    'landline_1', 'landline_2', 'landline_3',
    'phone', 'phone1', 'phone2', 'phone3'
  ];
  
  for (const field of phoneFields) {
    if (record[field] && String(record[field]).replace(/\D/g, '').length >= 10) {
      return true;
    }
  }
  return false;
}

// Tracerfy API functions
async function tracerfyRequest(endpoint, options = {}) {
  const url = `${TRACERFY_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TRACERFY_API_KEY}`,
      ...options.headers
    }
  });

  const text = await response.text();
  
  if (!response.ok) {
    throw new Error(`Tracerfy API error ${response.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function testConnection() {
  console.log('🔌 Testing Tracerfy API connection...');
  try {
    const result = await tracerfyRequest('/analytics/');
    console.log('   ✅ Connected successfully');
    if (result.credits !== undefined) {
      console.log(`   💰 Credits available: ${result.credits}`);
    }
    if (result.balance !== undefined) {
      console.log(`   💰 Balance: $${result.balance}`);
    }
    return true;
  } catch (err) {
    console.log(`   ❌ Connection failed: ${err.message}`);
    return false;
  }
}

async function submitSkipTraceJob(properties) {
  console.log(`\n📤 Submitting ${properties.length} properties for skip tracing...`);
  
  // Create CSV content
  const headers = ['address', 'city', 'state', 'zip', 'first_name', 'last_name', 'mail_address', 'mail_city', 'mail_state', 'mailing_zip'];
  const rows = properties.map(p => [
    p.address || '',
    p.city || 'Paradise Valley',
    p.state || 'AZ',
    p.zip || '85253',
    p.firstName || '',
    p.lastName || '',
    p.address || '',
    p.city || 'Paradise Valley',
    p.state || 'AZ',
    p.zip || '85253'
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  
  // Save CSV temporarily
  const csvPath = path.join(__dirname, 'temp-properties.csv');
  fs.writeFileSync(csvPath, csvContent);
  console.log(`   CSV saved to: ${csvPath}`);
  
  // Use node-fetch with FormData that works properly
  const FormData = require('form-data');
  const formData = new FormData();
  
  // IMPORTANT: csv_file must be added first, then column mappings
  formData.append('csv_file', fs.createReadStream(csvPath), {
    filename: 'properties.csv',
    contentType: 'text/csv'
  });
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

  // Use https module for proper multipart handling
  const https = require('https');
  const url = new URL(`${TRACERFY_BASE_URL}/trace/`);
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRACERFY_API_KEY}`,
        ...formData.getHeaders()
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Clean up temp file
        try { fs.unlinkSync(csvPath); } catch {}
        
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          reject(new Error(`Submit job failed: ${res.statusCode} - ${data}`));
          return;
        }
        
        try {
          const result = JSON.parse(data);
          console.log(`   ✅ Job submitted: queue_id=${result.queue_id}`);
          resolve(result);
        } catch (e) {
          reject(new Error(`Invalid response: ${data}`));
        }
      });
    });
    
    req.on('error', (e) => {
      try { fs.unlinkSync(csvPath); } catch {}
      reject(e);
    });
    
    formData.pipe(req);
  });
}

async function waitForJob(queueId) {
  console.log(`\n⏳ Waiting for job ${queueId} to complete...`);
  
  const maxWait = 10 * 60 * 1000; // 10 minutes
  const startTime = Date.now();
  let pollInterval = 5000;
  
  while (Date.now() - startTime < maxWait) {
    // Get all queues and find ours
    const queues = await tracerfyRequest('/queues/');
    const job = queues.find(q => q.id === queueId);
    
    if (!job) {
      throw new Error(`Job ${queueId} not found`);
    }
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`   Status: pending=${job.pending}, elapsed=${elapsed}s`);
    
    if (!job.pending && job.download_url) {
      console.log('   ✅ Job completed!');
      return job;
    }
    
    await new Promise(r => setTimeout(r, pollInterval));
  }
  
  throw new Error('Job timed out after 10 minutes');
}

async function downloadResults(downloadUrl) {
  console.log('\n📥 Downloading results...');
  
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  
  const csvText = await response.text();
  return parseCSV(csvText);
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((h, idx) => {
      record[h.trim().toLowerCase().replace(/\s+/g, '_')] = values[idx] || '';
    });
    records.push(record);
  }
  
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

// Generate Paradise Valley properties
function generateProperties(count) {
  const streets = [
    'N Mockingbird Ln', 'E Stanford Dr', 'E Desert Cove Ave', 'N 56th St',
    'E Doubletree Ranch Rd', 'N Invergordon Rd', 'E Cheney Dr', 'N Tatum Blvd',
    'E Lincoln Dr', 'N Scottsdale Rd', 'E McDonald Dr', 'N 64th St',
    'E Camelback Rd', 'N 68th St', 'E Indian Bend Rd', 'N 52nd St',
    'E Gold Dust Ave', 'N 60th St', 'E Via Linda', 'E Shea Blvd',
    'N 44th St', 'E Cactus Rd', 'N 40th St', 'E Thunderbird Rd',
    'E Jackrabbit Rd', 'N Paradise Valley Dr', 'E Hummingbird Ln', 'N Quail Run Rd',
    'E Camelhead Rd', 'N Mummy Mountain Rd', 'E Echo Canyon Dr', 'N Palo Cristi Rd',
    'E Mountain View Rd', 'N Casa Blanca Dr', 'E Desert Vista Dr', 'N Moonlight Way',
    'E Fanfol Dr', 'N Saguaro Rd', 'E Ocotillo Rd', 'N Chaparral Rd'
  ];
  
  const zips = ['85253', '85254', '85255'];
  const properties = [];
  
  for (let i = 0; i < count; i++) {
    const street = streets[i % streets.length];
    const houseNum = 4000 + (i * 47) % 8000; // Spread out numbers
    
    properties.push({
      address: `${houseNum} ${street}`,
      city: 'Paradise Valley',
      state: 'AZ',
      zip: zips[i % zips.length],
      firstName: '',
      lastName: ''
    });
  }
  
  return properties;
}

// Main function
async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('   TRACERFY COMPLETE SOLUTION');
  console.log('   Skip tracing at $0.009/lead');
  console.log('   Only importing Arizona phone numbers (480, 520, 602, 623, 928)');
  console.log('═'.repeat(70) + '\n');

  if (!TRACERFY_API_KEY) {
    console.error('❌ TRACERFY_API_KEY not set in .env');
    process.exit(1);
  }

  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot connect to Tracerfy API');
      process.exit(1);
    }

    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get users
    const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
    const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });
    
    if (!josh || !clients) {
      console.error('❌ Could not find Josh or Clients users');
      process.exit(1);
    }

    // Get existing addresses
    const existing = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID, deletedAt: null },
      select: { address: true }
    });
    const existingSet = new Set(existing.map(p => p.address?.toLowerCase()).filter(Boolean));
    console.log(`📊 Current leads: ${existing.length}`);

    // Generate properties to trace
    const allProperties = generateProperties(300);
    const newProperties = allProperties.filter(p => 
      !existingSet.has(p.address.toLowerCase())
    );
    
    console.log(`📍 Properties to trace: ${newProperties.length}`);
    
    if (newProperties.length === 0) {
      console.log('⚠️  No new properties to process');
      return;
    }

    // Submit skip trace job (process in batches of 100)
    const batchSize = 100;
    let imported = 0;
    let skippedNoPhone = 0;
    let skippedNonAZ = 0;
    let assignToJosh = true;

    for (let i = 0; i < newProperties.length && imported < 200; i += batchSize) {
      const batch = newProperties.slice(i, i + batchSize);
      
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`BATCH ${Math.floor(i/batchSize) + 1}: Processing ${batch.length} properties`);
      console.log('─'.repeat(50));

      try {
        // Submit job
        const job = await submitSkipTraceJob(batch);
        
        // Wait for completion
        const result = await waitForJob(job.queue_id);
        
        // Get results
        let records;
        if (result.download_url) {
          records = await downloadResults(result.download_url);
        } else if (result.results) {
          records = result.results;
        } else if (result.properties) {
          records = result.properties;
        } else {
          console.log('   ⚠️  No results in response');
          continue;
        }

        console.log(`\n📋 Processing ${records.length} results...`);

        // Process each record
        for (const record of records) {
          const address = record.address || record.property_address;
          if (!address) continue;
          
          // Skip duplicates
          if (existingSet.has(address.toLowerCase())) continue;
          
          // Find Arizona phone
          const azPhone = findBestAZPhone(record);
          
          if (!azPhone) {
            if (hasAnyPhone(record)) {
              skippedNonAZ++;
            } else {
              skippedNoPhone++;
            }
            continue;
          }

          // Import lead
          const firstName = record.first_name || record.owner_first_name || 'Homeowner';
          const lastName = record.last_name || record.owner_last_name || '';
          const email = record.email || record.primary_email || record.email_1 || null;

          await prisma.people.create({
            data: {
              workspaceId: WORKSPACE_ID,
              mainSellerId: assignToJosh ? josh.id : clients.id,
              firstName,
              lastName,
              fullName: `${firstName} ${lastName}`.trim() || 'Unknown',
              phone: azPhone,
              mobilePhone: azPhone,
              email,
              address,
              city: record.city || 'Paradise Valley',
              state: 'AZ',
              postalCode: record.zip || '85253',
              country: 'US',
              status: 'LEAD',
              source: 'Tracerfy - Paradise Valley AZ'
            }
          });

          existingSet.add(address.toLowerCase());
          imported++;
          
          const assignedTo = assignToJosh ? 'Josh' : 'Clients';
          assignToJosh = !assignToJosh;
          
          console.log(`   ✅ ${firstName} ${lastName} | ${azPhone} → ${assignedTo}`);
        }
      } catch (err) {
        console.error(`   ❌ Batch error: ${err.message}`);
        if (err.message.includes('balance') || err.message.includes('credit') || err.message.includes('insufficient')) {
          console.log('   💰 Credits exhausted, stopping...');
          break;
        }
      }

      // Pause between batches
      await new Promise(r => setTimeout(r, 2000));
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
    console.log(`   Imported (with AZ phone): ${imported}`);
    console.log(`   Skipped - no phone: ${skippedNoPhone}`);
    console.log(`   Skipped - non-AZ phone: ${skippedNonAZ}`);
    console.log(`\n   👥 FINAL COUNTS:`);
    console.log(`   Josh: ${joshCount}`);
    console.log(`   Clients: ${clientsCount}`);
    console.log(`   Total: ${joshCount + clientsCount}`);
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();












