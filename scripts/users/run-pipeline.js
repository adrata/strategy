#!/usr/bin/env node

/**
 * SIMPLE HYBRID PIPELINE
 * BatchData (property search) + Tracerfy (skip trace)
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

const sleep = ms => new Promise(r => setTimeout(r, ms));
const getAreaCode = phone => {
  if (!phone) return null;
  const d = String(phone).replace(/\D/g, '');
  return d.length === 10 ? d.substring(0,3) : d.length === 11 && d[0] === '1' ? d.substring(1,4) : null;
};
const isAZ = phone => AZ_CODES.includes(getAreaCode(phone));
const normPhone = phone => phone ? String(phone).replace(/\D/g, '').slice(-10) : null;

async function main() {
  console.log('\n🚀 STARTING HYBRID PIPELINE\n');
  
  await prisma.$connect();
  
  // Get existing
  const existing = await prisma.people.findMany({
    where: { workspaceId: WORKSPACE_ID },
    select: { address: true, phone: true }
  });
  const existingAddrs = new Set(existing.map(p => p.address?.toLowerCase()).filter(Boolean));
  const existingPhones = new Set(existing.map(p => normPhone(p.phone)).filter(Boolean));
  console.log(`📊 Existing: ${existingAddrs.size} addresses, ${existingPhones.size} phones`);

  // STEP 1: BatchData - get real properties
  console.log('\n═══ STEP 1: BATCHDATA PROPERTY SEARCH ═══\n');
  
  const properties = [];
  let skip = 0;
  
  while (properties.length < 300) {
    console.log(`Fetching ${skip} to ${skip+50}...`);
    
    const res = await fetch('https://api.batchdata.com/api/v1/property/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BATCHDATA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchCriteria: { query: 'Paradise Valley, AZ' },
        options: { skip, take: 50 }
      })
    });
    
    const data = await res.json();
    console.log(`  Status: ${data.status?.code}, Properties: ${data.results?.properties?.length || 0}`);
    
    if (data.status?.code !== 200) {
      console.log(`  Error: ${data.status?.message}`);
      break;
    }
    
    const props = data.results?.properties || [];
    if (props.length === 0) break;
    
    for (const p of props) {
      const addr = p.address?.street;
      if (addr && !existingAddrs.has(addr.toLowerCase())) {
        properties.push({
          address: addr,
          city: p.address?.city || 'Paradise Valley',
          state: 'AZ',
          zip: p.address?.zip || '85253',
          firstName: p.owner?.names?.[0]?.first || '',
          lastName: p.owner?.names?.[0]?.last || ''
        });
        existingAddrs.add(addr.toLowerCase());
      }
    }
    
    console.log(`  New properties so far: ${properties.length}`);
    skip += 50;
    await sleep(500);
  }
  
  console.log(`\n✅ Got ${properties.length} new real properties from BatchData`);
  
  if (properties.length === 0) {
    console.log('No new properties to process');
    await prisma.$disconnect();
    return;
  }

  // STEP 2: Tracerfy - skip trace
  console.log('\n═══ STEP 2: TRACERFY SKIP TRACE ═══\n');
  
  // Create CSV
  const csvPath = path.join(__dirname, 'pipeline-props.csv');
  const csv = [
    'address,city,state,zip,first_name,last_name,mail_address,mail_city,mail_state,mailing_zip',
    ...properties.map(p => 
      `"${p.address}","${p.city}","${p.state}","${p.zip}","${p.firstName}","${p.lastName}","${p.address}","${p.city}","${p.state}","${p.zip}"`
    )
  ].join('\n');
  fs.writeFileSync(csvPath, csv);
  
  // Submit to Tracerfy
  console.log(`Submitting ${properties.length} properties to Tracerfy...`);
  
  const formData = new FormData();
  formData.append('csv_file', fs.createReadStream(csvPath), { filename: 'props.csv', contentType: 'text/csv' });
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
    const req = https.request({
      hostname: 'tracerfy.com',
      path: '/v1/api/trace/',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.TRACERFY_API_KEY}`, ...formData.getHeaders() }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        fs.unlinkSync(csvPath);
        try { resolve(JSON.parse(d)); }
        catch { reject(new Error(d)); }
      });
    });
    req.on('error', reject);
    formData.pipe(req);
  });
  
  console.log(`Job submitted: queue_id=${job.queue_id}`);
  
  // Wait for completion
  console.log('Waiting for results (5-15 min)...');
  let downloadUrl = null;
  
  for (let i = 0; i < 40; i++) { // Max 40 * 25s = 16 min
    await sleep(25000);
    
    try {
      const queuesRes = await new Promise((resolve, reject) => {
        https.get({
          hostname: 'tracerfy.com',
          path: '/v1/api/queues/',
          headers: { 'Authorization': `Bearer ${process.env.TRACERFY_API_KEY}` }
        }, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try { resolve(JSON.parse(d)); }
            catch { reject(new Error(d)); }
          });
        }).on('error', reject);
      });
      
      const thisJob = queuesRes.find(q => q.id === job.queue_id);
      if (thisJob) {
        console.log(`  Job: pending=${thisJob.pending}, credits=${thisJob.credits_deducted || 0}`);
        if (!thisJob.pending && thisJob.download_url) {
          downloadUrl = thisJob.download_url;
          console.log('✅ Job completed!');
          break;
        }
      }
    } catch (e) {
      console.log(`  Error checking status: ${e.message}`);
    }
  }
  
  if (!downloadUrl) {
    console.log('Job timed out');
    await prisma.$disconnect();
    return;
  }
  
  // Download results
  console.log('\nDownloading results...');
  const csvData = await new Promise((resolve, reject) => {
    https.get(downloadUrl, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
  
  // Parse CSV
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/"/g, '').replace(/[^a-z0-9]/g, '_'));
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
    headers.forEach((h, i) => rec[h] = (vals[i] || '').replace(/"/g, ''));
    return rec;
  });
  
  console.log(`Got ${records.length} results`);

  // STEP 3: Import
  console.log('\n═══ STEP 3: DATABASE IMPORT ═══\n');
  
  const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
  const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });
  
  let imported = 0, noPhone = 0, nonAZ = 0, dupe = 0;
  let toJosh = true;
  
  for (const r of records) {
    // Find AZ phone
    let azPhone = null;
    for (const f of ['primary_phone','mobile_1','mobile_2','mobile_3','landline_1','landline_2']) {
      if (r[f] && isAZ(r[f])) { azPhone = normPhone(r[f]); break; }
    }
    
    if (!azPhone) {
      ['primary_phone','mobile_1','landline_1'].some(f => r[f]) ? nonAZ++ : noPhone++;
      continue;
    }
    
    if (existingPhones.has(azPhone)) { dupe++; continue; }
    
    const fn = r.first_name || 'Homeowner';
    const ln = r.last_name || '';
    
    await prisma.people.create({
      data: {
        workspaceId: WORKSPACE_ID,
        mainSellerId: toJosh ? josh.id : clients.id,
        firstName: fn, lastName: ln, fullName: `${fn} ${ln}`.trim(),
        phone: azPhone, mobilePhone: azPhone,
        address: r.address, city: r.city || 'Paradise Valley', state: 'AZ',
        postalCode: r.zip || '85253', country: 'US', status: 'LEAD',
        source: 'BatchData+Tracerfy'
      }
    });
    
    existingPhones.add(azPhone);
    imported++;
    console.log(`✅ ${fn} ${ln} | ${azPhone} → ${toJosh ? 'Josh' : 'Clients'}`);
    toJosh = !toJosh;
  }
  
  // Final counts
  const jc = await prisma.people.count({ where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null } });
  const cc = await prisma.people.count({ where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null } });
  
  await prisma.$disconnect();
  
  console.log('\n' + '═'.repeat(50));
  console.log('COMPLETE!');
  console.log('═'.repeat(50));
  console.log(`Imported: ${imported}`);
  console.log(`No phone: ${noPhone}`);
  console.log(`Non-AZ: ${nonAZ}`);
  console.log(`Duplicate: ${dupe}`);
  console.log(`\nJosh: ${jc}`);
  console.log(`Clients: ${cc}`);
  console.log(`TOTAL: ${jc + cc}`);
}

main().catch(e => { console.error(e); process.exit(1); });













