#!/usr/bin/env node

/**
 * FINAL OPTIMIZED PIPELINE
 * 
 * Strategy for maximum efficiency:
 * 1. BatchData: SEARCH ONLY (cheap, ~$0.01/property) - NO skip-trace
 * 2. Tracerfy: SKIP-TRACE (cheap, $0.009/lead) - you have $1000 credits
 * 3. Only import Arizona phones
 * 4. Skip all duplicates
 * 5. 50/50 split Josh/Clients
 * 
 * With $50 BatchData + $1000 Tracerfy:
 * - Can search ~500-1000 properties
 * - Skip-trace all of them
 * - Expected: 100-200 leads with AZ phones
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
const BATCHDATA_KEY = process.env.BATCHDATA_API_KEY;
const TRACERFY_KEY = process.env.TRACERFY_API_KEY;

// Helpers
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getAreaCode = p => {
  if (!p) return null;
  const d = String(p).replace(/\D/g, '');
  return d.length === 10 ? d.slice(0,3) : d.length === 11 && d[0]==='1' ? d.slice(1,4) : null;
};
const isAZ = p => p && AZ_CODES.includes(getAreaCode(p));
const norm = p => p ? String(p).replace(/\D/g, '').slice(-10) : null;

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           FINAL OPTIMIZED PIPELINE                           ║');
  console.log('║   BatchData: Search Only | Tracerfy: Skip-Trace              ║');
  console.log('║   Maximum efficiency - no wasted credits                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Pre-flight checks
  if (!BATCHDATA_KEY) { console.error('❌ Missing BATCHDATA_API_KEY'); process.exit(1); }
  if (!TRACERFY_KEY) { console.error('❌ Missing TRACERFY_API_KEY'); process.exit(1); }

  await prisma.$connect();
  console.log('✅ Database connected\n');

  // Get existing data to avoid duplicates
  const existing = await prisma.people.findMany({
    where: { workspaceId: WORKSPACE_ID },
    select: { address: true, phone: true, mobilePhone: true }
  });
  const existingAddrs = new Set(existing.map(e => e.address?.toLowerCase()).filter(Boolean));
  const existingPhones = new Set(existing.flatMap(e => [e.phone, e.mobilePhone].map(norm).filter(Boolean)));
  
  console.log(`📊 Already have: ${existingAddrs.size} addresses, ${existingPhones.size} phones`);
  console.log(`📊 Need to avoid these duplicates\n`);

  // ══════════════════════════════════════════════════════════════
  // STEP 1: BatchData Property SEARCH (no skip-trace)
  // ══════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 1: BATCHDATA PROPERTY SEARCH (no skip-trace charges)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Test connection first
  console.log('Testing BatchData API...');
  const testRes = await fetch('https://api.batchdata.com/api/v1/property/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${BATCHDATA_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchCriteria: { query: 'Paradise Valley, AZ' }, options: { skip: 0, take: 1 } })
  });
  const testData = await testRes.json();
  
  if (testData.status?.code === 403) {
    console.error('❌ BatchData: Insufficient balance');
    console.error('   Please add credits at batchdata.com');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  if (testData.status?.code !== 200) {
    console.error(`❌ BatchData error: ${testData.status?.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log('✅ BatchData connected and has credits\n');

  // Fetch properties in batches
  const properties = [];
  let skip = 0;
  const batchSize = 50;
  const maxProps = 500; // Stay within budget
  
  while (properties.length < maxProps) {
    process.stdout.write(`\r   Fetching ${skip}-${skip+batchSize}... (${properties.length} new so far)`);
    
    const res = await fetch('https://api.batchdata.com/api/v1/property/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${BATCHDATA_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchCriteria: { query: 'Paradise Valley, AZ' },
        options: { skip, take: batchSize }
      })
    });
    
    const data = await res.json();
    
    if (data.status?.code === 403) {
      console.log('\n   ⚠️ BatchData credits exhausted');
      break;
    }
    
    if (data.status?.code !== 200 || !data.results?.properties?.length) {
      console.log('\n   No more properties available');
      break;
    }
    
    // Extract new properties only
    for (const p of data.results.properties) {
      const addr = p.address?.street;
      if (addr && !existingAddrs.has(addr.toLowerCase())) {
        properties.push({
          address: addr,
          city: p.address?.city || 'Paradise Valley',
          state: 'AZ',
          zip: p.address?.zip || '85253',
          firstName: p.owner?.names?.[0]?.first || '',
          lastName: p.owner?.names?.[0]?.last || p.owner?.fullName?.split(' ').slice(1).join(' ') || ''
        });
        existingAddrs.add(addr.toLowerCase()); // Prevent duplicates within this run
      }
    }
    
    skip += batchSize;
    await sleep(300); // Be nice to API
  }
  
  console.log(`\n\n✅ Got ${properties.length} NEW properties from BatchData\n`);
  
  if (properties.length === 0) {
    console.log('No new properties to process. All Paradise Valley properties may already be in database.');
    await prisma.$disconnect();
    return;
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2: Tracerfy Skip-Trace (get phone numbers)
  // ══════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 2: TRACERFY SKIP-TRACE (using your $1000 credits)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check Tracerfy balance
  console.log('Checking Tracerfy balance...');
  await sleep(2000);
  
  try {
    const analytics = await new Promise((resolve, reject) => {
      https.get({
        hostname: 'tracerfy.com',
        path: '/v1/api/analytics/',
        headers: { 'Authorization': `Bearer ${TRACERFY_KEY}` }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve(JSON.parse(d)); }
          catch { resolve({}); }
        });
      }).on('error', () => resolve({}));
    });
    console.log(`   Balance: $${analytics.balance || analytics.credits || 'N/A'}\n`);
  } catch { console.log('   Could not check balance\n'); }

  // Create CSV for Tracerfy
  const csvPath = path.join(__dirname, 'final-pipeline.csv');
  const csvContent = [
    'address,city,state,zip,first_name,last_name,mail_address,mail_city,mail_state,mailing_zip',
    ...properties.map(p => [
      `"${p.address}"`, `"${p.city}"`, `"${p.state}"`, `"${p.zip}"`,
      `"${p.firstName}"`, `"${p.lastName}"`,
      `"${p.address}"`, `"${p.city}"`, `"${p.state}"`, `"${p.zip}"`
    ].join(','))
  ].join('\n');
  fs.writeFileSync(csvPath, csvContent);
  
  console.log(`📤 Submitting ${properties.length} properties to Tracerfy...\n`);

  // Submit job
  const formData = new FormData();
  formData.append('csv_file', fs.createReadStream(csvPath), { filename: 'properties.csv', contentType: 'text/csv' });
  ['address','city','state','zip','first_name','last_name','mail_address','mail_city','mail_state','mailing_zip']
    .forEach((col, i) => formData.append(i < 6 ? col + '_column' : col.replace('mail_','mail_').replace('mailing_','mailing_') + '_column', col));
  
  // Fix column names
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

  let queueId;
  try {
    const job = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'tracerfy.com',
        path: '/v1/api/trace/',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TRACERFY_KEY}`, ...formData.getHeaders() }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          fs.unlinkSync(csvPath);
          if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0,200)}`));
          else try { resolve(JSON.parse(d)); } catch { reject(new Error('Invalid response')); }
        });
      });
      req.on('error', reject);
      formData.pipe(req);
    });
    
    queueId = job.queue_id;
    console.log(`✅ Job submitted: queue_id=${queueId}\n`);
  } catch (err) {
    console.error(`❌ Failed to submit to Tracerfy: ${err.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  // Wait for results
  console.log('⏳ Waiting for Tracerfy to process (typically 5-15 minutes)...\n');
  
  let downloadUrl = null;
  let creditsUsed = 0;
  const maxWaitMs = 20 * 60 * 1000; // 20 minutes max
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    await sleep(30000); // 30 second intervals (respect rate limit)
    
    try {
      const queues = await new Promise((resolve, reject) => {
        https.get({
          hostname: 'tracerfy.com',
          path: '/v1/api/queues/',
          headers: { 'Authorization': `Bearer ${TRACERFY_KEY}` }
        }, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            if (res.statusCode === 503) reject(new Error('Rate limited'));
            else try { resolve(JSON.parse(d)); } catch { reject(new Error('Parse error')); }
          });
        }).on('error', reject);
      });
      
      const job = queues.find(q => q.id === queueId);
      if (!job) continue;
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`   [${elapsed}s] pending=${job.pending}, credits=${job.credits_deducted || 0}`);
      
      if (!job.pending && job.download_url) {
        downloadUrl = job.download_url;
        creditsUsed = job.credits_deducted || 0;
        console.log('\n✅ Job completed!\n');
        break;
      }
    } catch (err) {
      if (err.message.includes('Rate limit')) {
        console.log('   Rate limited, waiting longer...');
        await sleep(30000);
      }
    }
  }
  
  if (!downloadUrl) {
    console.error('❌ Tracerfy job timed out');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log(`💰 Tracerfy credits used: ${creditsUsed}`);

  // Download results
  console.log('\n📥 Downloading results...');
  
  const csvData = await new Promise((resolve, reject) => {
    https.get(downloadUrl, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
  
  // Parse CSV
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, ''));
  
  const records = lines.slice(1).map(line => {
    const vals = [];
    let cur = '', inQ = false;
    for (const c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === ',' && !inQ) { vals.push(cur); cur = ''; }
      else cur += c;
    }
    vals.push(cur);
    
    const rec = {};
    headers.forEach((h, i) => rec[h] = (vals[i] || '').replace(/^"+|"+$/g, ''));
    return rec;
  });
  
  console.log(`   Got ${records.length} results\n`);

  // ══════════════════════════════════════════════════════════════
  // STEP 3: Import to Database
  // ══════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 3: DATABASE IMPORT (Arizona phones only)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
  const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });
  
  if (!josh || !clients) {
    console.error('❌ Could not find Josh or Clients users');
    await prisma.$disconnect();
    process.exit(1);
  }

  let imported = 0, noPhone = 0, nonAZ = 0, dupPhone = 0;
  let toJosh = true;
  
  for (const r of records) {
    // Find best Arizona phone
    let azPhone = null;
    const phoneFields = ['primary_phone', 'mobile_1', 'mobile_2', 'mobile_3', 'mobile_4', 'mobile_5', 'landline_1', 'landline_2', 'landline_3'];
    
    for (const f of phoneFields) {
      const phone = r[f];
      if (phone && isAZ(phone)) {
        azPhone = norm(phone);
        break;
      }
    }
    
    if (!azPhone) {
      // Check if they have any phone at all
      const hasAnyPhone = phoneFields.some(f => r[f] && norm(r[f])?.length === 10);
      hasAnyPhone ? nonAZ++ : noPhone++;
      continue;
    }
    
    // Skip duplicate phones
    if (existingPhones.has(azPhone)) {
      dupPhone++;
      continue;
    }
    
    // Import!
    const firstName = r.first_name || 'Homeowner';
    const lastName = r.last_name || '';
    
    try {
      await prisma.people.create({
        data: {
          workspaceId: WORKSPACE_ID,
          mainSellerId: toJosh ? josh.id : clients.id,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`.trim() || 'Unknown',
          phone: azPhone,
          mobilePhone: azPhone,
          email: r.email_1 || r.email_2 || null,
          address: r.address,
          city: r.city || 'Paradise Valley',
          state: 'AZ',
          postalCode: r.zip || '85253',
          country: 'US',
          status: 'LEAD',
          source: 'BatchData+Tracerfy Final'
        }
      });
      
      existingPhones.add(azPhone);
      imported++;
      
      console.log(`   ✅ ${firstName} ${lastName} | ${azPhone} → ${toJosh ? 'Josh' : 'Clients'}`);
      toJosh = !toJosh;
    } catch (err) {
      console.log(`   ⚠️ Could not import: ${err.message}`);
    }
  }

  // Final counts
  const joshFinal = await prisma.people.count({
    where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null }
  });
  const clientsFinal = await prisma.people.count({
    where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null }
  });

  await prisma.$disconnect();

  // Report
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    PIPELINE COMPLETE                         ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Properties searched (BatchData):  ${String(properties.length).padStart(4)}                      ║`);
  console.log(`║  Tracerfy credits used:            ${String(creditsUsed).padStart(4)}                      ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  NEW leads imported:               ${String(imported).padStart(4)}                      ║`);
  console.log(`║  Skipped (no phone found):         ${String(noPhone).padStart(4)}                      ║`);
  console.log(`║  Skipped (non-AZ phone):           ${String(nonAZ).padStart(4)}                      ║`);
  console.log(`║  Skipped (duplicate phone):        ${String(dupPhone).padStart(4)}                      ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Josh final count:                 ${String(joshFinal).padStart(4)}                      ║`);
  console.log(`║  Clients final count:              ${String(clientsFinal).padStart(4)}                      ║`);
  console.log(`║  ════════════════════════════════════════                    ║`);
  console.log(`║  GRAND TOTAL:                      ${String(joshFinal + clientsFinal).padStart(4)}                      ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});












