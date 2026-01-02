#!/usr/bin/env node

/**
 * EFFICIENT PIPELINE - Maximizes $18.88 BatchData credits
 * 
 * Key optimizations:
 * 1. skipTrace: false in BatchData (saves $0.07/property!)
 * 2. Search Scottsdale + Paradise Valley for more properties
 * 3. Use Tracerfy for skip-trace ($0.009 vs $0.07)
 * 4. Skip duplicates before API calls
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
const getAreaCode = p => { if (!p) return null; const d = String(p).replace(/\D/g, ''); return d.length === 10 ? d.slice(0,3) : d.length === 11 && d[0]==='1' ? d.slice(1,4) : null; };
const isAZ = p => p && AZ_CODES.includes(getAreaCode(p));
const norm = p => p ? String(p).replace(/\D/g, '').slice(-10) : null;

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              EFFICIENT PIPELINE                               ║');
  console.log('║   BatchData: Search only (skipTrace: false)                   ║');
  console.log('║   Tracerfy: Skip-trace ($0.009 vs BatchData $0.07)            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  await prisma.$connect();

  // Get existing to avoid duplicates
  const existing = await prisma.people.findMany({
    where: { workspaceId: WORKSPACE_ID },
    select: { address: true, phone: true }
  });
  const existingAddrs = new Set(existing.map(e => e.address?.toLowerCase()).filter(Boolean));
  const existingPhones = new Set(existing.map(e => norm(e.phone)).filter(Boolean));
  console.log(`📊 Already have: ${existingAddrs.size} addresses, ${existingPhones.size} phones\n`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Get properties from BatchData (NO skip-trace)
  // ═══════════════════════════════════════════════════════════════
  console.log('═══ STEP 1: BATCHDATA PROPERTY SEARCH (skipTrace: false) ═══\n');

  const properties = [];
  const cities = ['Paradise Valley, AZ', 'Scottsdale, AZ'];
  
  for (const city of cities) {
    if (properties.length >= 500) break;
    
    console.log(`\n🏙️  Searching: ${city}`);
    let skip = 0;
    let consecutiveEmpty = 0;
    
    while (properties.length < 500 && consecutiveEmpty < 3) {
      const res = await fetch('https://api.batchdata.com/api/v1/property/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.BATCHDATA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchCriteria: { query: city },
          options: { skip, take: 50, skipTrace: false }
        })
      });

      const data = await res.json();
      
      if (data.status?.code === 403) {
        console.log('   ⚠️ Credits exhausted');
        break;
      }
      
      if (data.status?.code !== 200) {
        console.log(`   Error: ${data.status?.message}`);
        break;
      }

      const props = data.results?.properties || [];
      if (props.length === 0) {
        consecutiveEmpty++;
        skip += 50;
        continue;
      }
      
      let newCount = 0;
      for (const p of props) {
        const addr = p.address?.street;
        if (addr && !existingAddrs.has(addr.toLowerCase())) {
          properties.push({
            address: addr,
            city: p.address?.city || city.split(',')[0],
            state: 'AZ',
            zip: p.address?.zip || '85253',
            firstName: p.owner?.names?.[0]?.first || '',
            lastName: p.owner?.names?.[0]?.last || ''
          });
          existingAddrs.add(addr.toLowerCase());
          newCount++;
        }
      }
      
      console.log(`   Skip ${skip}: got ${props.length}, ${newCount} new (total: ${properties.length})`);
      
      if (newCount === 0) consecutiveEmpty++;
      else consecutiveEmpty = 0;
      
      skip += 50;
      await sleep(200);
    }
  }

  console.log(`\n✅ Got ${properties.length} NEW properties\n`);

  if (properties.length === 0) {
    console.log('No new properties. Credits may be exhausted.');
    await prisma.$disconnect();
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Tracerfy Skip-Trace
  // ═══════════════════════════════════════════════════════════════
  console.log('═══ STEP 2: TRACERFY SKIP-TRACE ═══\n');

  const csvPath = path.join(__dirname, 'efficient-props.csv');
  const csv = [
    'address,city,state,zip,first_name,last_name,mail_address,mail_city,mail_state,mailing_zip',
    ...properties.map(p => 
      `"${p.address}","${p.city}","${p.state}","${p.zip}","${p.firstName}","${p.lastName}","${p.address}","${p.city}","${p.state}","${p.zip}"`
    )
  ].join('\n');
  fs.writeFileSync(csvPath, csv);

  console.log(`📤 Submitting ${properties.length} properties to Tracerfy...`);

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
      hostname: 'tracerfy.com', path: '/v1/api/trace/', method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.TRACERFY_API_KEY}`, ...formData.getHeaders() }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { fs.unlinkSync(csvPath); try { resolve(JSON.parse(d)); } catch { reject(new Error(d)); } });
    });
    req.on('error', reject);
    formData.pipe(req);
  });

  console.log(`✅ Job: queue_id=${job.queue_id}\n`);
  console.log('⏳ Waiting for results (5-15 min)...\n');

  let downloadUrl = null, creditsUsed = 0;
  const start = Date.now();

  while (Date.now() - start < 20 * 60 * 1000) {
    await sleep(30000);
    try {
      const queues = await new Promise((resolve, reject) => {
        https.get({ hostname: 'tracerfy.com', path: '/v1/api/queues/', headers: { 'Authorization': `Bearer ${process.env.TRACERFY_API_KEY}` } }, res => {
          let d = ''; res.on('data', c => d += c);
          res.on('end', () => { try { resolve(JSON.parse(d)); } catch { reject(new Error('parse')); } });
        }).on('error', reject);
      });
      
      const j = queues.find(q => q.id === job.queue_id);
      if (j) {
        console.log(`   pending=${j.pending}, credits=${j.credits_deducted || 0}`);
        if (!j.pending && j.download_url) {
          downloadUrl = j.download_url;
          creditsUsed = j.credits_deducted || 0;
          console.log('\n✅ Complete!\n');
          break;
        }
      }
    } catch {}
  }

  if (!downloadUrl) { console.log('Timeout'); await prisma.$disconnect(); return; }

  // Download
  const csvData = await new Promise((resolve, reject) => {
    https.get(downloadUrl, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); }).on('error', reject);
  });

  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const records = lines.slice(1).map(line => {
    const vals = []; let cur = '', inQ = false;
    for (const c of line) { if (c === '"') inQ = !inQ; else if (c === ',' && !inQ) { vals.push(cur); cur = ''; } else cur += c; }
    vals.push(cur);
    const rec = {}; headers.forEach((h, i) => rec[h] = (vals[i] || '').replace(/"/g, '')); return rec;
  });

  console.log(`📥 Got ${records.length} results\n`);

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Import
  // ═══════════════════════════════════════════════════════════════
  console.log('═══ STEP 3: IMPORT (Arizona phones only) ═══\n');

  const josh = await prisma.users.findFirst({ where: { email: 'finn@runegateco.com' } });
  const clients = await prisma.users.findFirst({ where: { email: 'clients@runegateco.com' } });

  let imported = 0, noPhone = 0, nonAZ = 0, dupe = 0, toJosh = true;

  for (const r of records) {
    let azPhone = null;
    for (const f of ['primary_phone','mobile_1','mobile_2','mobile_3','mobile_4','mobile_5','landline_1','landline_2','landline_3']) {
      if (r[f] && isAZ(r[f])) { azPhone = norm(r[f]); break; }
    }
    
    if (!azPhone) { ['primary_phone','mobile_1','landline_1'].some(f => r[f]) ? nonAZ++ : noPhone++; continue; }
    if (existingPhones.has(azPhone)) { dupe++; continue; }

    const fn = r.first_name || 'Homeowner', ln = r.last_name || '';
    await prisma.people.create({
      data: {
        workspaceId: WORKSPACE_ID, mainSellerId: toJosh ? josh.id : clients.id,
        firstName: fn, lastName: ln, fullName: `${fn} ${ln}`.trim(),
        phone: azPhone, mobilePhone: azPhone, address: r.address,
        city: r.city || 'Paradise Valley', state: 'AZ', postalCode: r.zip || '85253',
        country: 'US', status: 'LEAD', source: 'Efficient Pipeline'
      }
    });

    existingPhones.add(azPhone);
    imported++;
    console.log(`✅ ${fn} ${ln} | ${azPhone} → ${toJosh ? 'Josh' : 'Clients'}`);
    toJosh = !toJosh;
  }

  const jc = await prisma.people.count({ where: { workspaceId: WORKSPACE_ID, mainSellerId: josh.id, deletedAt: null } });
  const cc = await prisma.people.count({ where: { workspaceId: WORKSPACE_ID, mainSellerId: clients.id, deletedAt: null } });

  await prisma.$disconnect();

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                      RESULTS                                  ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Properties searched:      ${String(properties.length).padStart(4)}                             ║`);
  console.log(`║  Tracerfy credits used:    ${String(creditsUsed).padStart(4)}                             ║`);
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  NEW leads imported:       ${String(imported).padStart(4)}                             ║`);
  console.log(`║  Skipped (no phone):       ${String(noPhone).padStart(4)}                             ║`);
  console.log(`║  Skipped (non-AZ):         ${String(nonAZ).padStart(4)}                             ║`);
  console.log(`║  Skipped (duplicate):      ${String(dupe).padStart(4)}                             ║`);
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Josh:                     ${String(jc).padStart(4)}                             ║`);
  console.log(`║  Clients:                  ${String(cc).padStart(4)}                             ║`);
  console.log(`║  TOTAL:                    ${String(jc + cc).padStart(4)}                             ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
}

main().catch(e => { console.error(e); process.exit(1); });












